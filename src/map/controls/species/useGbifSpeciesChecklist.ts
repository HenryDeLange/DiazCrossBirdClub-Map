import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useState } from 'react';
import type { INatConservationStatus, INatSpeciesCount } from '../../iNatTypes';
import { getINatObservationRequest, getSmoothedMapBounds } from './iNatObservationUrl';

type GbifSpecies = {
    speciesKey: number;
    commonName: string;
    scientificName: string;
    occurrenceCount: number;
    conservationStatus?: INatConservationStatus;
}

type GbifRequest = {
    apiUrl: string;
}

type GbifFacetResponse = {
    facets?: Array<{
        field: string;
        counts: Array<{ name: string; count: number }>;
    }>;
}

type GbifSpeciesResponse = {
    canonicalName?: string;
    scientificName: string;
    vernacularName?: string;
}

export function useGbifSpeciesChecklist(map: LeafletMap, isOpen: boolean) {
    const [data, setData] = useState<GbifSpecies[] | null>(null);
    const [error, setError] = useState(false);
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let activeController: AbortController | null = null;
        let lastApiUrl = '';

        const loadChecklist = () => {
            const nextRequest = getGbifRequest(map);
            if (nextRequest.apiUrl === lastApiUrl) {
                return;
            }

            lastApiUrl = nextRequest.apiUrl;
            activeController?.abort();
            const controller = new AbortController();
            activeController = controller;
            setData(null);
            setError(false);

            const inatApiUrl = getINatObservationRequest(map).apiUrl;
            void fetchChecklist(nextRequest.apiUrl, inatApiUrl, controller)
                .then(setData)
                .catch((fetchError: unknown) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    controller.abort();
                    console.error('Error fetching GBIF checklist:', fetchError);
                    setError(true);
                });
        };

        loadChecklist();
        const settledFrameId = requestAnimationFrame(loadChecklist);
        map.on('moveend', loadChecklist);
        map.on('zoomend', loadChecklist);

        return () => {
            cancelAnimationFrame(settledFrameId);
            map.off('moveend', loadChecklist);
            map.off('zoomend', loadChecklist);
            activeController?.abort();
        };
    }, [isOpen, map]);

    return {
        data,
        loading: !data && !error,
        error
    };
}

function getGbifRequest(map: LeafletMap): GbifRequest {
    const { west, east, south, north } = getSmoothedMapBounds(map.getBounds());
    const geometry = `POLYGON((${west} ${south},${east} ${south},${east} ${north},${west} ${north},${west} ${south}))`;
    const apiQuery = new URLSearchParams({
        taxonKey: '212',
        hasCoordinate: 'true',
        occurrenceStatus: 'PRESENT',
        geometry,
        facet: 'speciesKey',
        facetLimit: '10000',
        limit: '0'
    });
    return {
        apiUrl: `https://api.gbif.org/v1/occurrence/search?${apiQuery.toString()}`
    };
}

async function fetchChecklist(apiUrl: string, inatApiUrl: string, controller: AbortController): Promise<GbifSpecies[]> {
    const [response, inatData] = await Promise.all([
        fetch(apiUrl, { signal: controller.signal }),
        fetch(inatApiUrl, { signal: controller.signal })
            .then(async (inatResponse) => inatResponse.ok ? await inatResponse.json() as INatSpeciesCount : null)
            .catch((error: unknown) => {
                if (controller.signal.aborted) {
                    throw error;
                }

                return null;
            })
    ]);
    if (!response.ok) {
        throw new Error(`GBIF occurrence request failed with status ${response.status}`);
    }

    const facetData = await response.json() as GbifFacetResponse;
    const conservationStatuses = new Map<string, INatConservationStatus>();
    for (const result of inatData?.results ?? []) {
        if (result.taxon.conservation_status) {
            conservationStatuses.set(normalizeScientificName(result.taxon.name), result.taxon.conservation_status);
        }
    }

    const speciesCounts = facetData.facets?.find((facet) => facet.field === 'SPECIES_KEY')?.counts ?? [];
    const parsedSpeciesCounts = speciesCounts.flatMap((item) => {
        const speciesKey = Number(item.name);
        return Number.isSafeInteger(speciesKey) ? [{ speciesKey, occurrenceCount: item.count }] : [];
    });
    const results: GbifSpecies[] = [];
    let nextIndex = 0;

    const loadSpecies = async () => {
        while (nextIndex < parsedSpeciesCounts.length) {
            const index = nextIndex++;
            const speciesCount = parsedSpeciesCounts[index];
            const speciesResponse = await fetch(`https://api.gbif.org/v1/species/${speciesCount.speciesKey}`, { signal: controller.signal });
            if (!speciesResponse.ok) {
                throw new Error(`GBIF species request failed with status ${speciesResponse.status}`);
            }

            const speciesData = await speciesResponse.json() as GbifSpeciesResponse;
            results.push({
                speciesKey: speciesCount.speciesKey,
                commonName: speciesData.vernacularName || speciesData.canonicalName || speciesData.scientificName,
                scientificName: speciesData.canonicalName || speciesData.scientificName,
                occurrenceCount: speciesCount.occurrenceCount,
                conservationStatus: conservationStatuses.get(normalizeScientificName(speciesData.canonicalName || speciesData.scientificName))
            });
        }
    };

    const workerCount = Math.min(8, parsedSpeciesCounts.length);
    await Promise.all(Array.from({ length: workerCount }, loadSpecies));

    return results.sort((first, second) => first.commonName.localeCompare(second.commonName));
}

function normalizeScientificName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}