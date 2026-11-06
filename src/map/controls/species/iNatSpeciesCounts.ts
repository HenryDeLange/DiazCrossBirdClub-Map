import type { INatSpeciesCount } from '../../iNatTypes';
import { throttledFetchWithRetry } from './throttledFetch';

const maximumSpeciesCountsPerPage = 500;

export async function fetchINatSpeciesCounts(apiUrl: string, signal: AbortSignal): Promise<INatSpeciesCount> {
    const firstPage = await fetchSpeciesCountsPage(apiUrl, signal);
    const pageSize = firstPage.per_page || maximumSpeciesCountsPerPage;
    const totalPages = Math.ceil(Math.max(firstPage.total_results, firstPage.results.length) / pageSize);
    const results = [...firstPage.results];

    for (let page = firstPage.page + 1; page <= totalPages; page++) {
        const pageUrl = new URL(apiUrl);
        pageUrl.searchParams.set('page', String(page));
        const nextPage = await fetchSpeciesCountsPage(pageUrl.toString(), signal);
        results.push(...nextPage.results);
    }

    return { ...firstPage, results };
}

async function fetchSpeciesCountsPage(apiUrl: string, signal: AbortSignal): Promise<INatSpeciesCount> {
    const response = await throttledFetchWithRetry(apiUrl, { signal });
    if (!response.ok) {
        throw new Error(`iNaturalist species-count request failed with status ${response.status}`);
    }
    return await response.json() as INatSpeciesCount;
}
