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
    bytes: number | null;
}

export type AppStorageInfo = {
    cacheBuckets: CacheBucketInfo[];
    localStorage: StorageInfo;
}

export type AppStorageClearResult = {
    deletedCacheCount: number;
    clearedLocalStorageEntries: number;
}

export async function getAppStorageInfo(): Promise<AppStorageInfo> {
    if (typeof window === 'undefined') {
        throw new Error('App storage is not available outside a browser.');
    }

    const cacheBuckets = 'caches' in window ? await Promise.all((await window.caches.keys()).map(getCacheBucketInfo)) : [];

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
    const contentLengths = await Promise.all(requests.map(async (request) => {
        const response = await cache.match(request);
        const contentLength = response?.headers.get('content-length');
        return contentLength ? Number(contentLength) : null;
    }));

    return {
        name,
        entries: requests.length,
        bytes: contentLengths.every((value) => value !== null) ? contentLengths.reduce((total, value) => total + (value ?? 0), 0) : null
    };
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