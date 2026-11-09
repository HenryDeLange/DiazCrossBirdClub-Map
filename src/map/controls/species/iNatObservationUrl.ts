import type { Map as LeafletMap } from 'leaflet';

const boundsBufferPixels = 64;
const boundsBucketPixels = boundsBufferPixels * 2;
const boundsPrecision = 6;
const boundsMultiplier = 10 ** boundsPrecision;

export type INatObservationRequest = {
    apiUrl: string;
    webUrl: string;
}

export type BufferedMapBounds = {
    north: number;
    east: number;
    south: number;
    west: number;
}

export function getINatObservationRequest(map: LeafletMap): INatObservationRequest {
    const boundsQuery = createBoundsQuery(getBufferedMapBounds(map));
    const apiQuery = new URLSearchParams({
        captive: 'false',
        iconic_taxa: 'Aves',
        locale: 'af',
        // Keep the regional preference for taxon metadata; Afrikaans names are fetched separately.
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

export function getBufferedMapBounds(map: LeafletMap): BufferedMapBounds {
    const zoom = map.getZoom();
    const center = map.project(map.getCenter(), zoom);
    const size = map.getSize();
    const snappedCenterX = Math.round(center.x / boundsBucketPixels) * boundsBucketPixels;
    const snappedCenterY = Math.round(center.y / boundsBucketPixels) * boundsBucketPixels;
    const halfWidth = size.x / 2 + boundsBufferPixels;
    const halfHeight = size.y / 2 + boundsBufferPixels;
    const northWest = map.unproject([snappedCenterX - halfWidth, snappedCenterY - halfHeight], zoom);
    const southEast = map.unproject([snappedCenterX + halfWidth, snappedCenterY + halfHeight], zoom);

    return {
        north: roundOutward(northWest.lat, 'max'),
        east: roundOutward(southEast.lng, 'max'),
        south: roundOutward(southEast.lat, 'min'),
        west: roundOutward(northWest.lng, 'min')
    };
}

function createBoundsQuery(bounds: BufferedMapBounds): URLSearchParams {
    const { north, east, south, west } = bounds;
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
