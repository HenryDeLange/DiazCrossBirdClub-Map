import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { LatLngBounds, type LatLngExpression, type Map as LeafletMap } from 'leaflet';
import type { FeatureProps } from './geojson/types';

export type LocationTabName = 'Outings' | 'Spots' | 'Paths' | 'Points';

export type LocationSource = {
    tab: LocationTabName;
    collections: FeatureCollection<Geometry, FeatureProps>[];
};

export type LocationSelection = {
    tab: LocationTabName;
    name: string;
};

type FeatureGroupItem = {
    feature: Feature<Geometry, FeatureProps>;
};

export function slugifyLocationName(locationName: string): string {
    return locationName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function getBasePathname(): string {
    const basePath = import.meta.env.BASE_URL || '/';

    if (basePath === '/') {
        return '/';
    }

    return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

export function getLocationPathname(locationName: string): string {
    return joinPath(getBasePathname(), slugifyLocationName(locationName));
}

export function getLocationUrl(locationName: string): string {
    if (typeof window === 'undefined') {
        return getLocationPathname(locationName);
    }

    const url = new URL(window.location.href);
    url.pathname = getLocationPathname(locationName);
    url.search = '';
    return url.toString();
}

export function setLocationPath(locationName: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.history.replaceState({}, '', getLocationUrl(locationName));
}

export function clearLocationPath(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const url = new URL(window.location.href);
    url.pathname = getBasePathname();
    url.search = '';
    window.history.replaceState({}, '', url.toString());
}

export function getInitialLocationKeys(): string[] {
    if (typeof window === 'undefined') {
        return [];
    }

    const url = new URL(window.location.href);
    const pathSlug = getLocationSlugFromPathname(url.pathname);
    const queryValue = url.searchParams.get('location')?.trim() ?? '';

    return [pathSlug, queryValue].filter((value): value is string => Boolean(value));
}

export function getLocationSlugFromPathname(pathname: string): string {
    const basePath = getBasePathname();
    const normalizedPath = pathname.replace(/\/+/g, '/');

    if (basePath !== '/' && normalizedPath.startsWith(basePath)) {
        return normalizedPath.slice(basePath.length).split('/').filter(Boolean)[0] ?? '';
    }

    return normalizedPath.split('/').filter(Boolean)[0] ?? '';
}

export function resolveLocationSelection(locationKeys: string[], sources: LocationSource[]): LocationSelection | null {
    const normalizedKeys = locationKeys
        .map((key) => slugifyLocationName(key))
        .filter((key) => Boolean(key));

    if (normalizedKeys.length === 0) {
        return null;
    }

    for (const key of normalizedKeys) {
        for (const source of sources) {
            for (const collection of source.collections) {
                for (const feature of collection.features) {
                    if (feature.geometry.type !== 'Point') {
                        continue;
                    }

                    const featureName = feature.properties?.name;
                    if (featureName && slugifyLocationName(featureName) === key) {
                        return {
                            tab: source.tab,
                            name: featureName
                        };
                    }
                }
            }
        }
    }

    return null;
}

export function findHeadingFeatureByName(geojson: FeatureCollection<Geometry, FeatureProps>[], locationKey: string): Feature<Geometry, FeatureProps> | null {
    const normalizedKey = slugifyLocationName(locationKey);

    if (!normalizedKey) {
        return null;
    }

    for (const collection of geojson) {
        for (const feature of collection.features) {
            if (feature.geometry.type === 'Point' && feature.properties?.name && slugifyLocationName(feature.properties.name) === normalizedKey) {
                return feature;
            }
        }
    }

    return null;
}

export function findLocationGroupByName(
    geojson: FeatureCollection<Geometry, FeatureProps>[],
    locationKey: string
): { heading: Feature<Geometry, FeatureProps>; items: FeatureGroupItem[] } | null {
    const normalizedKey = slugifyLocationName(locationKey);

    if (!normalizedKey) {
        return null;
    }

    for (const collection of geojson) {
        const namedFeatures = collection.features.filter((feature) => feature.properties?.name);
        const headingIndex = namedFeatures.findIndex((feature) => feature.geometry.type === 'Point' && feature.properties?.name && slugifyLocationName(feature.properties.name) === normalizedKey);

        if (headingIndex < 0) {
            continue;
        }

        const heading = namedFeatures[headingIndex];
        const items = namedFeatures
            .filter((_, index) => index !== headingIndex)
            .map((feature) => ({ feature }));

        return { heading, items };
    }

    return null;
}

export function focusLocationGroup(
    map: LeafletMap,
    heading: Feature<Geometry, FeatureProps>,
    items: FeatureGroupItem[]
): void {
    const features = [heading, ...items.map((item) => item.feature).filter((feature) => !isAccessRoadFeature(feature))];

    if (features.length === 1 && heading.geometry.type === 'Point') {
        const [lng, lat] = heading.geometry.coordinates;
        map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
        return;
    }

    const bounds = getFeatureGroupBounds(features);
    if (bounds) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
    }
}

export function getFeatureGroupBounds(features: Feature<Geometry, FeatureProps>[]): LatLngBounds | null {
    const points: LatLngExpression[] = [];

    for (const feature of features) {
        if (isAccessRoadFeature(feature)) {
            continue;
        }

        collectGeometryCoordinates(feature.geometry, points);
    }

    if (points.length === 0) {
        return null;
    }

    const bounds = new LatLngBounds([]);
    points.forEach((point) => bounds.extend(point));
    return bounds;
}

function isAccessRoadFeature(feature: Feature<Geometry, FeatureProps>): boolean {
    return feature.properties.road === 'access';
}

function collectGeometryCoordinates(geometry: Geometry, points: LatLngExpression[]): void {
    if (geometry.type === 'Point') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'MultiPoint') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'LineString') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'MultiLineString') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'Polygon') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'MultiPolygon') {
        collectCoordinates(geometry.coordinates, points);
    }
}

function collectCoordinates(value: unknown, points: LatLngExpression[]): void {
    if (!Array.isArray(value)) {
        return;
    }

    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
        points.push([value[1], value[0]] as LatLngExpression);
        return;
    }

    value.forEach((child) => collectCoordinates(child, points));
}

function joinPath(basePath: string, segment: string): string {
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;

    if (!segment) {
        return normalizedBase;
    }

    return `${normalizedBase}${segment}`;
}
