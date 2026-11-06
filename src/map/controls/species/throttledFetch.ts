type RequestPriority = 'high' | 'visible' | 'background';

type PendingRequest = {
    url: string;
    init: RequestInit;
    priority: RequestPriority;
    sequence: number;
    signal?: AbortSignal;
    resolve: (response: Response) => void;
    reject: (error: unknown) => void;
    abortListener?: () => void;
    started: boolean;
}

type RequestPolicy = {
    intervalMs: number;
    burstSize: number;
    burstResetMs: number;
    maxConcurrentRequests: number;
    maxIntervalMs: number;
    adaptive: boolean;
}

type RequestQueue = {
    policy: RequestPolicy;
    activeRequests: number;
    lastStartedAt: number;
    lastCompletedAt: number;
    burstRemaining: number;
    currentIntervalMs: number;
    cooldownUntil: number;
    throttleStreak: number;
    recoverySuccesses: number;
    nextSequence: number;
    pending: PendingRequest[];
    timer: ReturnType<typeof setTimeout> | null;
}

type CachedSpeciesResponse = {
    response: Response;
    cachedAt: number;
}

type WorkboxCacheEntry = {
    timestamp?: unknown;
}

const requestPolicies = new Map<string, RequestPolicy>([
    ['https://api.gbif.org', {
        intervalMs: 100,
        burstSize: 6,
        burstResetMs: 4000,
        maxConcurrentRequests: 6,
        maxIntervalMs: 4000,
        adaptive: true
    }],
    ['https://api.inaturalist.org', {
        intervalMs: 1100,
        burstSize: 3,
        burstResetMs: 4000,
        maxConcurrentRequests: 1,
        maxIntervalMs: 1100,
        adaptive: false
    }]
]);

const queues = new Map<string, RequestQueue>();
const maxRetries = 2;
const gbifSpeciesDetailsCacheName = 'gbif-species-details';
// Keep this aligned with the species-details maxAgeSeconds in vite.config.ts.
const gbifSpeciesDetailsMaxAgeMs = 180 * 24 * 60 * 60 * 1000;
const gbifSpeciesDetailsCache = new Map<string, CachedSpeciesResponse>();
let cacheLookupErrorLogged = false;

export function throttledFetch(
    url: string,
    init: RequestInit = {},
    priority: RequestPriority = 'visible'
): Promise<Response> {
    const origin = new URL(url).origin;
    const policy = requestPolicies.get(origin);
    if (!policy) {
        return fetch(url, init);
    }

    const signal = init.signal ?? undefined;
    if (signal?.aborted) {
        return Promise.reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
    }

    let queue = queues.get(origin);
    if (!queue) {
        queue = {
            policy,
            activeRequests: 0,
            lastStartedAt: 0,
            lastCompletedAt: 0,
            burstRemaining: policy.burstSize,
            currentIntervalMs: policy.intervalMs,
            cooldownUntil: 0,
            throttleStreak: 0,
            recoverySuccesses: 0,
            nextSequence: 0,
            pending: [],
            timer: null
        };
        queues.set(origin, queue);
    }

    return new Promise<Response>((resolve, reject) => {
        const request: PendingRequest = {
            url,
            init,
            priority,
            sequence: queue.nextSequence++,
            signal,
            resolve,
            reject,
            started: false
        };

        if (signal) {
            request.abortListener = () => {
                if (request.started) {
                    return;
                }

                const pendingIndex = queue!.pending.indexOf(request);
                if (pendingIndex !== -1) {
                    queue!.pending.splice(pendingIndex, 1);
                    reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
                    pump(origin, queue!);
                }
            };
            signal.addEventListener('abort', request.abortListener, { once: true });
        }

        queue!.pending.push(request);
        queue!.pending.sort((first, second) => priorityOrder(first.priority) - priorityOrder(second.priority)
            || first.sequence - second.sequence);
        pump(origin, queue!);
    });
}

export async function throttledFetchWithRetry(
    url: string,
    init: RequestInit = {},
    priority: RequestPriority = 'visible'
): Promise<Response> {
    if (init.signal?.aborted) {
        throw init.signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
    }

    if (isGbifSpeciesDetailsUrl(url)) {
        const memoryCachedResponse = getMemoryCachedSpeciesResponse(url);
        if (memoryCachedResponse) {
            return memoryCachedResponse;
        }

        const serviceWorkerCachedResponse = await getServiceWorkerCachedSpeciesResponse(url, init.signal);
        if (serviceWorkerCachedResponse) {
            rememberSpeciesResponse(url, serviceWorkerCachedResponse);
            return serviceWorkerCachedResponse;
        }
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let response: Response;
        try {
            response = await throttledFetch(url, init, priority);
        } catch (error) {
            if (init.signal?.aborted || !(error instanceof TypeError) || attempt === maxRetries) {
                throw error;
            }
            await waitForRetry(getRetryDelay(500 * (2 ** attempt)), init.signal);
            continue;
        }

        if (!isRetryableStatus(response.status) || attempt === maxRetries) {
            if (response.ok && isGbifSpeciesDetailsUrl(url)) {
                rememberSpeciesResponse(url, response);
            }
            return response;
        }

        const retryAfter = response.status === 429 ? getRetryAfterMs(response.headers.get('Retry-After')) : null;
        const retryDelay = getRetryDelay(response.status === 429 ? 3000 * (2 ** attempt) : 500 * (2 ** attempt));
        await waitForRetry(retryAfter ?? retryDelay, init.signal);
    }

    throw new Error('Request failed after retrying.');
}

function getMemoryCachedSpeciesResponse(url: string): Response | null {
    const cached = gbifSpeciesDetailsCache.get(url);
    if (!cached) {
        return null;
    }
    if (Date.now() - cached.cachedAt >= gbifSpeciesDetailsMaxAgeMs) {
        gbifSpeciesDetailsCache.delete(url);
        return null;
    }
    return cached.response.clone();
}

function rememberSpeciesResponse(url: string, response: Response): void {
    gbifSpeciesDetailsCache.delete(url);
    gbifSpeciesDetailsCache.set(url, { response: response.clone(), cachedAt: Date.now() });
    while (gbifSpeciesDetailsCache.size > 1000) {
        const oldestUrl = gbifSpeciesDetailsCache.keys().next().value;
        if (!oldestUrl) {
            return;
        }
        gbifSpeciesDetailsCache.delete(oldestUrl);
    }
}

async function getServiceWorkerCachedSpeciesResponse(
    url: string,
    signal?: AbortSignal | null
): Promise<Response | null> {
    if (typeof caches === 'undefined' || typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
        return null;
    }

    try {
        const availableCaches = await caches.keys();
        if (!availableCaches.includes(gbifSpeciesDetailsCacheName)) {
            return null;
        }

        const cache = await caches.open(gbifSpeciesDetailsCacheName);
        const response = await cache.match(url, { ignoreVary: true });
        if (!response?.ok) {
            return null;
        }

        const cachedAt = await getWorkboxCacheTimestamp(url);
        if (signal?.aborted) {
            throw signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
        }
        if (cachedAt === null || Date.now() - cachedAt >= gbifSpeciesDetailsMaxAgeMs) {
            return null;
        }
        return response;
    } catch (error) {
        if (signal?.aborted) {
            throw error;
        }
        if (!cacheLookupErrorLogged) {
            console.error('Could not inspect the GBIF species cache; using the rate-limited request queue:', error);
            cacheLookupErrorLogged = true;
        }
        return null;
    }
}

// The request queue runs before the service worker, so validate Workbox's cache timestamp here.
async function getWorkboxCacheTimestamp(url: string): Promise<number | null> {
    const databases = await indexedDB.databases();
    if (!databases.some((database) => database.name === 'workbox-expiration')) {
        return null;
    }

    const database = await openWorkboxExpirationDatabase();
    try {
        if (!database.objectStoreNames.contains('cache-entries')) {
            return null;
        }

        const cacheKey = new URL(url);
        cacheKey.hash = '';
        const entryId = `${gbifSpeciesDetailsCacheName}|${cacheKey.href}`;
        return await new Promise<number | null>((resolve, reject) => {
            const transaction = database.transaction('cache-entries', 'readonly');
            const request = transaction.objectStore('cache-entries').get(entryId);
            request.onsuccess = () => {
                const entry = request.result as WorkboxCacheEntry | undefined;
                resolve(typeof entry?.timestamp === 'number' ? entry.timestamp : null);
            };
            request.onerror = () => reject(request.error ?? new Error('Could not read the Workbox cache timestamp.'));
        });
    } finally {
        database.close();
    }
}

function openWorkboxExpirationDatabase(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('workbox-expiration');
        request.onupgradeneeded = () => request.transaction?.abort();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Could not open the Workbox expiration database.'));
        request.onblocked = () => reject(new Error('The Workbox expiration database is blocked.'));
    });
}

function isGbifSpeciesDetailsUrl(url: string): boolean {
    const parsedUrl = new URL(url);
    return parsedUrl.origin === 'https://api.gbif.org' && /^\/v1\/species\/\d+$/.test(parsedUrl.pathname);
}

function pump(origin: string, queue: RequestQueue): void {
    if (
        queue.timer !== null
        || queue.activeRequests >= queue.policy.maxConcurrentRequests
        || queue.pending.length === 0
    ) {
        return;
    }

    const now = Date.now();
    if (
        queue.lastCompletedAt > 0
        && now - queue.lastCompletedAt >= queue.policy.burstResetMs
        && queue.throttleStreak === 0
    ) {
        queue.burstRemaining = queue.policy.burstSize;
    }

    const pacingDelay = queue.burstRemaining > 0
        ? 0
        : Math.max(0, queue.currentIntervalMs - (now - queue.lastStartedAt));
    const delay = Math.max(pacingDelay, queue.cooldownUntil - now);
    if (delay > 0) {
        queue.timer = setTimeout(() => {
            queue.timer = null;
            pump(origin, queue);
        }, delay);
        return;
    }

    const request = queue.pending.shift();
    if (!request) {
        return;
    }

    if (request.signal?.aborted) {
        if (request.abortListener) {
            request.signal.removeEventListener('abort', request.abortListener);
        }
        request.reject(request.signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
        pump(origin, queue);
        return;
    }

    request.started = true;
    if (request.abortListener && request.signal) {
        request.signal.removeEventListener('abort', request.abortListener);
    }
    queue.activeRequests += 1;
    queue.lastStartedAt = Date.now();
    queue.burstRemaining = Math.max(0, queue.burstRemaining - 1);

    void fetch(request.url, request.init)
        .then((response) => {
            updateQueueFromResponse(queue, response);
            request.resolve(response);
        }, request.reject)
        .finally(() => {
            queue.activeRequests -= 1;
            queue.lastCompletedAt = Date.now();
            pump(origin, queue);
        });
    pump(origin, queue);
}

function updateQueueFromResponse(queue: RequestQueue, response: Response): void {
    if (!queue.policy.adaptive) {
        return;
    }

    if (isRetryableStatus(response.status)) {
        queue.throttleStreak += 1;
        queue.recoverySuccesses = 0;
        queue.currentIntervalMs = Math.min(
            queue.policy.maxIntervalMs,
            Math.max(queue.policy.intervalMs, queue.currentIntervalMs * 2)
        );
        const retryAfter = getRetryAfterMs(response.headers.get('Retry-After')) ?? 0;
        const baseCooldown = response.status === 429 ? 1000 : 500;
        const exponentialCooldown = Math.min(60_000, baseCooldown * (2 ** Math.min(queue.throttleStreak - 1, 6)));
        queue.cooldownUntil = Math.max(queue.cooldownUntil, Date.now() + Math.max(retryAfter, exponentialCooldown));
        queue.burstRemaining = 0;
        return;
    }

    if (response.ok && queue.currentIntervalMs > queue.policy.intervalMs) {
        queue.recoverySuccesses += 1;
        if (queue.recoverySuccesses >= 5) {
            queue.throttleStreak = 0;
            queue.recoverySuccesses = 0;
            queue.currentIntervalMs = Math.max(queue.policy.intervalMs, Math.ceil(queue.currentIntervalMs * 0.75));
        }
    }
}

function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
}

function getRetryAfterMs(value: string | null): number | null {
    if (!value) {
        return null;
    }

    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
        return Math.max(0, seconds * 1000);
    }

    const retryAt = Date.parse(value);
    return Number.isNaN(retryAt) ? null : Math.max(0, retryAt - Date.now());
}

function getRetryDelay(baseDelayMs: number): number {
    return Math.round(baseDelayMs * (0.8 + Math.random() * 0.4));
}

function waitForRetry(delayMs: number, signal?: AbortSignal | null): Promise<void> {
    if (signal?.aborted) {
        return Promise.reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
    }

    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            signal?.removeEventListener('abort', handleAbort);
            resolve();
        }, Math.min(delayMs, 2_147_483_647));
        const handleAbort = () => {
            clearTimeout(timeout);
            signal?.removeEventListener('abort', handleAbort);
            reject(signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
        };
        signal?.addEventListener('abort', handleAbort, { once: true });
    });
}

function priorityOrder(priority: RequestPriority): number {
    if (priority === 'high') {
        return 0;
    }
    return priority === 'visible' ? 1 : 2;
}
