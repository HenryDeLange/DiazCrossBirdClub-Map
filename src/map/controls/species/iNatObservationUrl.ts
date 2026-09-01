import type { LatLngBounds, Map as LeafletMap } from 'leaflet';

const boundsPrecision = 2;
const boundsMultiplier = 10 ** boundsPrecision;

export type INatObservationRequest = {
    apiUrl: string;
    webUrl: string;
}

export function getINatObservationRequest(map: LeafletMap): INatObservationRequest {
    const bounds = map.getBounds();
    const boundsQuery = createBoundsQuery(bounds);
    const apiQuery = new URLSearchParams({
        captive: 'false',
        iconic_taxa: 'Aves',
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

function createBoundsQuery(bounds: LatLngBounds): URLSearchParams {
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    return new URLSearchParams({
        nelat: String(roundOutward(northEast.lat, 'max')),
        nelng: String(roundOutward(northEast.lng, 'max')),
        swlat: String(roundOutward(southWest.lat, 'min')),
        swlng: String(roundOutward(southWest.lng, 'min'))
    });
}

function roundOutward(value: number, direction: 'min' | 'max'): number {
    const rounded = (direction === 'max' ? Math.ceil(value * boundsMultiplier) : Math.floor(value * boundsMultiplier)) / boundsMultiplier;
    return Object.is(rounded, -0) ? 0 : rounded;
}
