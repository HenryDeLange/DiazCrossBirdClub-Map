import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useState } from 'react';
import { roundCoordinate } from '../../../calculations/components/dateLocationUtils';
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
        const northEastLatitude = roundCoordinate(northEast.lat, 2);
        const northEastLongitude = roundCoordinate(northEast.lng, 2);
        const southWestLatitude = roundCoordinate(southWest.lat, 2);
        const southWestLongitude = roundCoordinate(southWest.lng, 2);

        const query = new URLSearchParams({
            captive: 'false',
            iconic_taxa: 'Aves',
            nelat: String(northEastLatitude),
            nelng: String(northEastLongitude),
            swlat: String(southWestLatitude),
            swlng: String(southWestLongitude),
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
