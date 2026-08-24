import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useState } from 'react';
import type { INatSpeciesCount } from '../../iNatTypes';
import { getINatObservationRequest, type INatObservationRequest } from './iNatObservationUrl';
import type { UseSpeciesObservationsResult } from './types';

export function useSpeciesObservations(map: LeafletMap, isOpen: boolean): UseSpeciesObservationsResult {
    const [data, setData] = useState<INatSpeciesCount | null>(null);
    const [error, setError] = useState(false);
    const [request, setRequest] = useState<INatObservationRequest | null>(null);
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
            setError(false);

            fetch(nextRequest.apiUrl, { signal: controller.signal })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`iNaturalist request failed with status ${response.status}`);
                    }

                    return response.json();
                })
                .then((responseData: INatSpeciesCount) => {
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

    return {
        data,
        loading: !data,
        error,
        inatUrl: request?.webUrl ?? currentRequest.webUrl,
        reset: () => {
            setData(null);
            setError(false);
            setRequest(null);
        }
    };
}
