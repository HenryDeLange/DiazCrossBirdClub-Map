import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useState } from 'react';
import type { INatSpeciesCount } from '../../iNatTypes';
import type { UseSpeciesObservationsResult } from './types';

export function useSpeciesObservations(map: LeafletMap, isOpen: boolean): UseSpeciesObservationsResult {
    const [data, setData] = useState<INatSpeciesCount | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();

        const query = new URLSearchParams({
            captive: 'false',
            iconic_taxa: 'Aves',
            nelat: String(Number(northEast.lat)),
            nelng: String(Number(northEast.lng)),
            swlat: String(Number(southWest.lat)),
            swlng: String(Number(southWest.lng)),
            verifiable: 'true',
            per_page: '500'
        });

        fetch(`https://api.inaturalist.org/v1/observations/species_counts?${query.toString()}`)
            .then((response) => response.json())
            .then((responseData: INatSpeciesCount) => {
                setData(responseData);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    }, [isOpen, map]);

    return {
        data,
        loading: !data,
        reset: () => setData(null)
    };
}
