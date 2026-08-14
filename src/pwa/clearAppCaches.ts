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
    estimatedUsageBytes: number | null;
}

export type AppStorageClearResult = {
    deletedCacheCount: number;
    clearedLocalStorageEntries: number;
}

export async function getAppStorageInfo(): Promise<AppStorageInfo> {
    if (typeof window === 'undefined') {
        throw new Error('App storage is not available outside a browser.');
    }

    const [cacheBuckets, estimatedUsageBytes] = await Promise.all([
        'caches' in window ? Promise.all((await window.caches.keys()).map(getCacheBucketInfo)) : Promise.resolve([]),
        getEstimatedUsageBytes()
    ]);

    return {
        cacheBuckets,
        localStorage: getStorageInfo(window.localStorage),
        estimatedUsageBytes
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
    const entryBytes = await Promise.all(requests.map(async (request) => {
        const response = await cache.match(request);
        return response ? getResponseBytes(response) : null;
    }));
    const bytes = entryBytes.reduce<number>((total, entryBytes) => total + (entryBytes ?? 0), 0);

    return {
        name,
        entries: requests.length,
        bytes,
        unknownEntries: entryBytes.filter((value) => value === null).length
    };
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

async function getEstimatedUsageBytes(): Promise<number | null> {
    const storageManager = window.navigator.storage;
    if (typeof storageManager?.estimate !== 'function') {
        return null;
    }

    try {
        const estimate = await storageManager.estimate();
        return typeof estimate.usage === 'number' && Number.isFinite(estimate.usage) ? estimate.usage : null;
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