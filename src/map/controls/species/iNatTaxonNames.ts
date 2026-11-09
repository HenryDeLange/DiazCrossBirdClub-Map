import type { INatTaxon } from '../../iNatTypes';
import { throttledFetchWithRetry } from './throttledFetch';

const maximumTaxaPerPage = 200;
const localizedCommonNameCache = new Map<number, string>();

export async function fetchINatLocalizedTaxonNames(taxonIds: readonly number[], signal: AbortSignal): Promise<Map<number, string>> {
    const uniqueTaxonIds = [...new Set(taxonIds)];
    const missingTaxonIds = uniqueTaxonIds.filter((taxonId) => !localizedCommonNameCache.has(taxonId));

    await Promise.all(chunk(missingTaxonIds, maximumTaxaPerPage).map(async (taxonIdChunk) => {
        const query = new URLSearchParams({
            id: taxonIdChunk.join(','),
            locale: 'af',
            per_page: String(maximumTaxaPerPage)
        });
        const response = await throttledFetchWithRetry(`https://api.inaturalist.org/v1/taxa?${query.toString()}`, { signal });
        if (!response.ok) {
            throw new Error(`iNaturalist localized taxon-name request failed with status ${response.status}`);
        }

        const taxonResponse = await response.json() as { results: Pick<INatTaxon, 'id' | 'preferred_common_name'>[] };
        for (const taxon of taxonResponse.results) {
            const commonName = taxon.preferred_common_name?.trim();
            if (taxon.id !== undefined && commonName) {
                localizedCommonNameCache.set(taxon.id, commonName);
            }
        }
    }));

    return new Map(uniqueTaxonIds.flatMap((taxonId) => {
        const commonName = localizedCommonNameCache.get(taxonId);
        return commonName ? [[taxonId, commonName] as const] : [];
    }));
}

function chunk<T>(items: readonly T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}
