export async function clearAppCaches(): Promise<number> {
    if (typeof window === 'undefined' || !('caches' in window)) {
        throw new Error('Cache storage is not available in this browser.');
    }

    const cacheNames = await window.caches.keys();
    const deletionResults = await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    return deletionResults.filter(Boolean).length;
}