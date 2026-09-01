export type StorageEntryInfo = {
    key: string;
    bytes: number;
}

export type StorageInfo = {
    entries: StorageEntryInfo[];
    bytes: number;
}

export type CacheBucketInfo = {
    name: string;
    entries: number;
    bytes: number;
    unknownEntries: number;
}

export type AppStorageInfo = {
    cacheBuckets: CacheBucketInfo[];
    localStorage: StorageInfo;
}

export type AppStorageClearResult = {
    deletedCacheCount: number;
    clearedLocalStorageEntries: number;
}

const cacheEntryInspectionConcurrency = 8;

export async function getAppStorageInfo(): Promise<AppStorageInfo> {
    if (typeof window === 'undefined') {
        throw new Error('App storage is not available outside a browser.');
    }

    const cacheBuckets = await getCacheBuckets();

    return {
        cacheBuckets,
        localStorage: getStorageInfo(window.localStorage)
    };
}

export async function clearAppCaches(): Promise<AppStorageClearResult> {
    if (typeof window === 'undefined') {
        throw new Error('App storage is not available outside a browser.');
    }

    const cacheNames = 'caches' in window ? await window.caches.keys() : [];
    const deletionResults = await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    const clearedLocalStorageEntries = clearStorage(window.localStorage);

    return {
        deletedCacheCount: deletionResults.filter(Boolean).length,
        clearedLocalStorageEntries
    };
}

async function getCacheBucketInfo(name: string): Promise<CacheBucketInfo> {
    const cache = await window.caches.open(name);
    const requests = await cache.keys();
    const entryBytes = await mapWithConcurrency(requests, (request) => getCacheEntryBytes(cache, request), cacheEntryInspectionConcurrency);
    const bytes = entryBytes.reduce<number>((total, entryBytes) => total + (entryBytes ?? 0), 0);

    return {
        name,
        entries: requests.length,
        bytes,
        unknownEntries: entryBytes.filter((value) => value === null).length
    };
}

async function getCacheBuckets(): Promise<CacheBucketInfo[]> {
    if (!('caches' in window)) {
        return [];
    }

    const cacheNames = (await window.caches.keys()).sort();
    return Promise.all(cacheNames.map(getCacheBucketInfo));
}

async function getCacheEntryBytes(cache: Cache, request: Request): Promise<number | null> {
    try {
        const response = await cache.match(request);
        return response ? getResponseBytes(response) : null;
    }
    catch {
        return null;
    }
}

async function mapWithConcurrency<T, R>(items: readonly T[], mapper: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;

    async function processItems() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await mapper(items[currentIndex]);
        }
    }

    const workerCount = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: workerCount }, processItems));
    return results;
}

async function getResponseBytes(response: Response): Promise<number | null> {
    const contentLength = response.headers.get('content-length');
    if (contentLength !== null) {
        const bytes = Number(contentLength);
        if (Number.isInteger(bytes) && bytes >= 0) {
            return bytes;
        }
    }

    if (response.type === 'opaque') {
        return null;
    }

    try {
        return (await response.clone().arrayBuffer()).byteLength;
    }
    catch {
        return null;
    }
}

function getStorageInfo(storage: Storage): StorageInfo {
    const entries: StorageEntryInfo[] = [];

    for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key === null) {
            continue;
        }

        const value = storage.getItem(key) ?? '';
        entries.push({
            key,
            bytes: new Blob([key, value]).size
        });
    }

    return {
        entries,
        bytes: entries.reduce((total, entry) => total + entry.bytes, 0)
    };
}

function clearStorage(storage: Storage): number {
    const entryCount = storage.length;
    storage.clear();
    return entryCount;
}