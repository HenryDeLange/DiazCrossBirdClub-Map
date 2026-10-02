import type { LatLngBounds, Map as LeafletMap } from 'leaflet';

const boundsPrecision = 2;
const boundsMultiplier = 10 ** boundsPrecision;

export type INatObservationRequest = {
    apiUrl: string;
    webUrl: string;
}

export type SmoothedMapBounds = {
    north: number;
    east: number;
    south: number;
    west: number;
}

export function getINatObservationRequest(map: LeafletMap): INatObservationRequest {
    const bounds = map.getBounds();
    const boundsQuery = createBoundsQuery(bounds);
    const apiQuery = new URLSearchParams({
        captive: 'false',
        iconic_taxa: 'Aves',
        preferred_place_id: '6986',
        ...Object.fromEntries(boundsQuery),
        verifiable: 'true',
        per_page: '500'
    });
    const webQuery = new URLSearchParams({
        captive: 'false',
        subview: 'map',
        verifiable: 'true',
        view: 'species',
        iconic_taxa: 'Aves',
        ...Object.fromEntries(boundsQuery)
    });

    return {
        apiUrl: `https://api.inaturalist.org/v1/observations/species_counts?${apiQuery.toString()}`,
        webUrl: `https://www.inaturalist.org/observations?${webQuery.toString()}`
    };
}

export function getINatTaxonObservationsUrl(webUrl: string, taxonId: number | undefined): string | undefined {
    if (taxonId === undefined) {
        return undefined;
    }

    const url = new URL(webUrl);
    url.searchParams.delete('view');
    url.searchParams.set('taxon_id', String(taxonId));
    return url.toString();
}

export function getSmoothedMapBounds(bounds: LatLngBounds): SmoothedMapBounds {
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    return {
        north: roundOutward(northEast.lat, 'max'),
        east: roundOutward(northEast.lng, 'max'),
        south: roundOutward(southWest.lat, 'min'),
        west: roundOutward(southWest.lng, 'min')
    };
}

function createBoundsQuery(bounds: LatLngBounds): URLSearchParams {
    const { north, east, south, west } = getSmoothedMapBounds(bounds);
    return new URLSearchParams({
        nelat: String(north),
        nelng: String(east),
        swlat: String(south),
        swlng: String(west)
    });
}

function roundOutward(value: number, direction: 'min' | 'max'): number {
    const rounded = (direction === 'max' ? Math.ceil(value * boundsMultiplier) : Math.floor(value * boundsMultiplier)) / boundsMultiplier;
    return Object.is(rounded, -0) ? 0 : rounded;
}
