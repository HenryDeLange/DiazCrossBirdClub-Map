import type { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { INatConservationStatus } from '../../iNatTypes';
import { getBufferedMapBounds, getINatObservationRequest } from './iNatObservationUrl';
import { fetchINatSpeciesCounts } from './iNatSpeciesCounts';
import { throttledFetchWithRetry } from './throttledFetch';
import type { GbifSpecies, GbifSpeciesDetails } from './types';

type GbifRequest = {
    apiUrl: string;
}

type GbifFacetResponse = {
    results?: Array<{
        speciesKey?: number;
        species?: string;
        scientificName?: string;
        acceptedScientificName?: string;
        vernacularName?: string;
    }>;
    facets?: Array<{
        field: string;
        counts: Array<{ name: string; count: number }>;
    }>;
}

export function useGbifSpeciesChecklist(map: LeafletMap, isOpen: boolean) {
    const [data, setData] = useState<GbifSpecies[] | null>(null);
    const [error, setError] = useState(false);
    const [namesLoading, setNamesLoading] = useState(false);
    const [namesError, setNamesError] = useState(false);
    const [namesProgress, setNamesProgress] = useState({ completed: 0, total: 0 });
    const activeControllerRef = useRef<AbortController | null>(null);
    const conservationStatusesRef = useRef<Map<string, INatConservationStatus>>(new Map());
    const updateSpeciesDetails = useCallback((speciesKey: number, details: GbifSpeciesDetails) => {
        setData((current) => current?.map((species) => species.speciesKey === speciesKey
            ? {
                ...species,
                ...details,
                conservationStatus: conservationStatusesRef.current.get(normalizeScientificName(details.scientificName))
                    ?? species.conservationStatus
            }
            : species) ?? null);
    }, []);
    const loadMissingSpeciesNames = useCallback(async (species: GbifSpecies[], signal: AbortSignal) => {
        const unresolvedSpecies = species.filter((item) => !item.commonName || !item.scientificName);
        if (unresolvedSpecies.length === 0) {
            setNamesLoading(false);
            setNamesError(false);
            setNamesProgress({ completed: 0, total: 0 });
            return;
        }

        setNamesLoading(true);
        setNamesError(false);
        setNamesProgress({ completed: 0, total: unresolvedSpecies.length });
        let nextSpeciesIndex = 0;
        let hasError = false;
        const resolveNextSpecies = async () => {
            while (!signal.aborted) {
                const speciesIndex = nextSpeciesIndex;
                nextSpeciesIndex += 1;
                const item = unresolvedSpecies[speciesIndex];
                if (!item) {
                    return;
                }

                try {
                    const details = await fetchSpeciesDetails(item.speciesKey, signal);
                    if (signal.aborted) {
                        return;
                    }
                    updateSpeciesDetails(item.speciesKey, details);
                } catch (fetchError: unknown) {
                    if (signal.aborted) {
                        return;
                    }
                    hasError = true;
                    console.error(`Error fetching GBIF species details for ${item.speciesKey}:`, fetchError);
                } finally {
                    if (!signal.aborted) {
                        setNamesProgress((current) => ({ ...current, completed: current.completed + 1 }));
                    }
                }
            }
        };

        await Promise.all(
            Array.from({ length: Math.min(6, unresolvedSpecies.length) }, () => resolveNextSpecies())
        );
        if (!signal.aborted) {
            setNamesLoading(false);
            setNamesError(hasError);
        }
    }, [updateSpeciesDetails]);

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
            activeControllerRef.current = controller;
            setData(null);
            setError(false);
            setNamesLoading(false);
            setNamesError(false);
            setNamesProgress({ completed: 0, total: 0 });
            conservationStatusesRef.current = new Map();

            const inatApiUrl = getINatObservationRequest(map).apiUrl;
            void fetchChecklist(nextRequest.apiUrl, controller.signal)
                .then((species) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    const checklistSpecies = species.map((item) => {
                        const conservationStatus = conservationStatusesRef.current.get(normalizeScientificName(item.scientificName ?? ''));
                        return conservationStatus ? { ...item, conservationStatus } : item;
                    });
                    setData(checklistSpecies);
                    void loadMissingSpeciesNames(checklistSpecies, controller.signal);
                })
                .catch((fetchError: unknown) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    controller.abort();
                    console.error('Error fetching GBIF checklist:', fetchError);
                    setError(true);
                });
            void fetchConservationStatuses(inatApiUrl, controller.signal)
                .then((conservationStatuses) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    conservationStatusesRef.current = conservationStatuses;
                    setData((current) => current?.map((item) => {
                        const conservationStatus = item.scientificName
                            ? conservationStatuses.get(normalizeScientificName(item.scientificName))
                            : undefined;
                        return conservationStatus ? { ...item, conservationStatus } : item;
                    }) ?? null);
                })
                .catch((fetchError: unknown) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    console.error('Error fetching iNaturalist conservation statuses for the GBIF checklist:', fetchError);
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
            if (activeControllerRef.current === activeController) {
                activeControllerRef.current = null;
            }
        };
    }, [isOpen, loadMissingSpeciesNames, map]);

    const retryMissingNames = useCallback(() => {
        const controller = activeControllerRef.current;
        if (!data || !controller || controller.signal.aborted || namesLoading) {
            return;
        }

        void loadMissingSpeciesNames(data, controller.signal);
    }, [data, loadMissingSpeciesNames, namesLoading]);

    const namesReady = Boolean(data
        && !namesLoading
        && !namesError
        && data.every((item) => item.commonName && item.scientificName));

    return {
        data,
        loading: !data && !error,
        error,
        namesLoading,
        namesError,
        namesProgress,
        namesReady,
        retryMissingNames
    };
}

function getGbifRequest(map: LeafletMap): GbifRequest {
    const { west, east, south, north } = getBufferedMapBounds(map);
    const geometry = `POLYGON((${west} ${south},${east} ${south},${east} ${north},${west} ${north},${west} ${south}))`;
    const apiQuery = new URLSearchParams({
        taxonKey: '212',
        hasCoordinate: 'true',
        occurrenceStatus: 'PRESENT',
        geometry,
        facet: 'speciesKey',
        facetLimit: '10000',
        limit: '300'
    });
    return {
        apiUrl: `https://api.gbif.org/v1/occurrence/search?${apiQuery.toString()}`
    };
}

async function fetchChecklist(
    apiUrl: string,
    signal: AbortSignal
): Promise<GbifSpecies[]> {
    const response = await throttledFetchWithRetry(apiUrl, { signal });
    if (!response.ok) {
        throw new Error(`GBIF occurrence request failed with status ${response.status}`);
    }

    const facetData = await response.json() as GbifFacetResponse;
    const occurrenceNames = new Map<number, { commonName: string; scientificName: string }>();
    for (const result of facetData.results ?? []) {
        if (typeof result.speciesKey !== 'number' || !Number.isSafeInteger(result.speciesKey)) {
            continue;
        }

        const scientificName = result.species?.trim()
            || result.acceptedScientificName?.trim()
            || result.scientificName?.trim();
        if (!scientificName) {
            continue;
        }

        const speciesKey = result.speciesKey;
        const currentName = occurrenceNames.get(speciesKey);
        const vernacularName = result.vernacularName?.trim();
        if (!currentName || (vernacularName && currentName.commonName === currentName.scientificName)) {
            occurrenceNames.set(speciesKey, {
                commonName: vernacularName || scientificName,
                scientificName
            });
        }
    }

    const speciesCounts = facetData.facets?.find((facet) => facet.field === 'SPECIES_KEY')?.counts ?? [];
    const parsedSpeciesCounts = speciesCounts.flatMap((item) => {
        const speciesKey = Number(item.name);
        return Number.isSafeInteger(speciesKey) ? [{ speciesKey, occurrenceCount: item.count }] : [];
    });
    return parsedSpeciesCounts.map((speciesCount) => ({
        speciesKey: speciesCount.speciesKey,
        occurrenceCount: speciesCount.occurrenceCount,
        ...occurrenceNames.get(speciesCount.speciesKey)
    })).sort((first, second) => second.occurrenceCount - first.occurrenceCount);
}

async function fetchConservationStatuses(
    apiUrl: string,
    signal: AbortSignal
): Promise<Map<string, INatConservationStatus>> {
    const inatData = await fetchINatSpeciesCounts(apiUrl, signal);
    const conservationStatuses = new Map<string, INatConservationStatus>();
    for (const result of inatData.results) {
        if (result.taxon.conservation_status) {
            conservationStatuses.set(normalizeScientificName(result.taxon.name), result.taxon.conservation_status);
        }
    }
    return conservationStatuses;
}

async function fetchSpeciesDetails(speciesKey: number, signal: AbortSignal): Promise<GbifSpeciesDetails> {
    const requestController = new AbortController();
    const handleAbort = () => requestController.abort(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
    const timeoutId = setTimeout(
        () => requestController.abort(new DOMException('The GBIF species request timed out.', 'TimeoutError')),
        20_000
    );
    if (signal.aborted) {
        handleAbort();
    } else {
        signal.addEventListener('abort', handleAbort, { once: true });
    }

    try {
        const response = await throttledFetchWithRetry(
            `https://api.gbif.org/v1/species/${speciesKey}`,
            { signal: requestController.signal },
            'high'
        );
        if (!response.ok) {
            throw new Error(`GBIF species request failed with status ${response.status}`);
        }

        const speciesData = await response.json() as {
            canonicalName?: string;
            scientificName?: string;
            vernacularName?: string;
        };
        const scientificName = speciesData.canonicalName || speciesData.scientificName;
        if (!scientificName) {
            throw new Error(`GBIF species response did not include a name for ${speciesKey}`);
        }

        return {
            commonName: speciesData.vernacularName || scientificName,
            scientificName
        };
    } finally {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', handleAbort);
    }
}

function normalizeScientificName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}