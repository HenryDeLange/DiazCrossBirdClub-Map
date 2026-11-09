import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import type { INatSpeciesCount } from '../../iNatTypes';
import { getINatObservationRequest, type INatObservationRequest } from './iNatObservationUrl';
import { fetchINatSpeciesCounts } from './iNatSpeciesCounts';
import { fetchINatLocalizedTaxonNames } from './iNatTaxonNames';
import type { CommonNameLanguage, UseSpeciesObservationsResult } from './types';

export function useSpeciesObservations(
    map: LeafletMap,
    isOpen: boolean,
    commonNameLanguage: CommonNameLanguage
): UseSpeciesObservationsResult {
    const [data, setData] = useState<INatSpeciesCount | null>(null);
    const [error, setError] = useState(false);
    const [request, setRequest] = useState<INatObservationRequest | null>(null);
    const [localizedNames, setLocalizedNames] = useState<Map<number, string> | null>(null);
    const [localizedNamesError, setLocalizedNamesError] = useState(false);
    const [localizedNamesRetry, setLocalizedNamesRetry] = useState(0);
    const currentRequest = getINatObservationRequest(map);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let activeController: AbortController | null = null;
        let lastApiUrl = '';

        const loadObservations = () => {
            const nextRequest = getINatObservationRequest(map);
            if (nextRequest.apiUrl === lastApiUrl) {
                return;
            }

            lastApiUrl = nextRequest.apiUrl;
            activeController?.abort();
            const controller = new AbortController();
            activeController = controller;
            setRequest(nextRequest);
            setData(null);
            setLocalizedNames(null);
            setLocalizedNamesError(false);
            setError(false);

            fetchINatSpeciesCounts(nextRequest.apiUrl, controller.signal)
                .then((responseData) => {
                    setData(responseData);
                })
                .catch((error) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    console.error('Error fetching data:', error);
                    setError(true);
                });
        };

        loadObservations();
        const settledFrameId = requestAnimationFrame(loadObservations);
        map.on('moveend', loadObservations);
        map.on('zoomend', loadObservations);

        return () => {
            cancelAnimationFrame(settledFrameId);
            map.off('moveend', loadObservations);
            map.off('zoomend', loadObservations);
            activeController?.abort();
        };
    }, [isOpen, map]);

    useEffect(() => {
        if (!isOpen || commonNameLanguage !== 'af' || !data || localizedNames || localizedNamesError) {
            return;
        }

        const controller = new AbortController();
        const taxonIds = data.results
            .map(({ taxon }) => taxon.id)
            .filter((taxonId): taxonId is number => taxonId !== undefined);
        fetchINatLocalizedTaxonNames(taxonIds, controller.signal)
            .then((names) => {
                if (!controller.signal.aborted) {
                    setLocalizedNames(names);
                }
            })
            .catch((localizedNameError: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                console.error('Error fetching localized iNaturalist common names:', localizedNameError);
                setLocalizedNamesError(true);
            });

        return () => controller.abort();
    }, [commonNameLanguage, data, isOpen, localizedNames, localizedNamesError, localizedNamesRetry]);

    const displayedData = useMemo(() => {
        if (!data || commonNameLanguage !== 'af' || !localizedNames) {
            return data;
        }

        return {
            ...data,
            results: data.results.map((speciesCount) => {
                const localizedName = speciesCount.taxon.id === undefined
                    ? undefined
                    : localizedNames.get(speciesCount.taxon.id);
                return localizedName
                    ? { ...speciesCount, taxon: { ...speciesCount.taxon, preferred_common_name: localizedName } }
                    : speciesCount;
            })
        };
    }, [commonNameLanguage, data, localizedNames]);

    return {
        data: displayedData,
        loading: !data && !error,
        error,
        localizedNamesLoading: isOpen
            && commonNameLanguage === 'af'
            && Boolean(data)
            && !localizedNames
            && !localizedNamesError,
        localizedNamesError,
        inatUrl: request?.webUrl ?? currentRequest.webUrl,
        reset: () => {
            setData(null);
            setLocalizedNames(null);
            setLocalizedNamesError(false);
            setError(false);
            setRequest(null);
        },
        retryLocalizedNames: () => {
            setLocalizedNamesError(false);
            setLocalizedNames(null);
            setLocalizedNamesRetry((retry) => retry + 1);
        }
    };
}
