import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../map/geojson/types';

export type EditorFeature = Feature<Geometry, FeatureProps>;

export type ValidationResult = {
    errors: string[];
    valid: boolean;
}

const allowedProperties = new Set([
    'name', 'description', 'road', 'linkDocument', 'linkMap', 'linkWeb', 'category', 'isCoastal',
    'stroke', 'stroke-width', 'stroke-opacity', 'fill', 'fill-opacity', 'visibility'
]);

const lineTypes = new Set(['LineString', 'MultiLineString']);
const polygonTypes = new Set(['Polygon', 'MultiPolygon']);

export function validateFeatureCollection(value: unknown): ValidationResult {
    const errors: string[] = [];

    if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
        return { valid: false, errors: ['The document must be a GeoJSON FeatureCollection.'] };
    }

    if (value.features.length === 0) {
        errors.push('Add at least one feature.');
    }

    let titleCount = 0;
    let firstFeatureIsTitle = false;
    value.features.forEach((feature, index) => {
        const properties = isRecord(feature) && isRecord(feature.properties) ? feature.properties : null;
        const name = typeof properties?.name === 'string' ? properties.name.trim() : '';
        const label = name ? `Feature "${name}"` : `Feature ${index + 1}`;

        if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.properties)) {
            errors.push(`${label} must be a GeoJSON Feature with a properties object.`);
            return;
        }

        const geometry = feature.geometry;
        if (!isRecord(geometry) || !isValidGeometry(geometry)) {
            errors.push(`${label} has an unsupported or invalid geometry.`);
            return;
        }

        const featureProperties = feature.properties;
        if (typeof featureProperties.name !== 'string' || featureProperties.name.trim() === '') {
            errors.push(`${label} needs a non-empty name.`);
        }

        for (const key of Object.keys(featureProperties)) {
            if (!allowedProperties.has(key)) {
                errors.push(`${label} has unsupported property "${key}".`);
            }
        }

        if (featureProperties.road !== undefined && (!lineTypes.has(geometry.type) || !['access', 'birding', 'drive'].includes(String(featureProperties.road)))) {
            errors.push(`${label}: road is only valid on a line and must be access, birding, or drive.`);
        }

        if (featureProperties.category !== undefined
            && (geometry.type !== 'Point' || !['spot', 'title'].includes(String(featureProperties.category)))) {
            errors.push(`${label}: category is only valid on a point and must be spot or title.`);
        }

        if (featureProperties.isCoastal !== undefined
            && (geometry.type !== 'Point' || featureProperties.category !== 'title' || typeof featureProperties.isCoastal !== 'boolean')) {
            errors.push(`${label}: isCoastal must be a boolean on a title point.`);
        }

        if (geometry.type === 'Point') {
            if (!['spot', 'title'].includes(String(featureProperties.category))) {
                errors.push(`${label}: a point must have category spot or title.`);
            }
            if (featureProperties.category === 'title') {
                titleCount += 1;
                firstFeatureIsTitle ||= index === 0;
            }
        }

        for (const key of ['linkDocument', 'linkMap', 'linkWeb']) {
            if (featureProperties[key] !== undefined && typeof featureProperties[key] !== 'string') {
                errors.push(`${label}: ${key} must be text.`);
            }
        }

        if (featureProperties.visibility !== undefined && (polygonTypes.has(geometry.type) === false || typeof featureProperties.visibility !== 'boolean')) {
            errors.push(`${label}: visibility must be a boolean on a polygon.`);
        }

        for (const key of ['stroke-width', 'stroke-opacity', 'fill-opacity']) {
            const number = featureProperties[key];
            if (number !== undefined && (typeof number !== 'number' || !Number.isFinite(number) || number < 0
                || (key.endsWith('opacity') && number > 1))) {
                errors.push(`${label}: ${key} must be a non-negative number.`);
            }
        }

    });

    if (value.features.length > 1 && (titleCount !== 1 || !firstFeatureIsTitle)) {
        errors.push('A location with multiple features must have exactly one Point with category title as its first feature.');
    }

    return { valid: errors.length === 0, errors };
}

export function isEditorFeatureCollection(value: unknown): value is FeatureCollection<Geometry, FeatureProps> {
    return validateFeatureCollection(value).valid;
}

function isValidGeometry(value: Record<string, unknown>): value is Geometry & Record<string, unknown> {
    switch (value.type) {
        case 'Point':
            return isPosition(value.coordinates);
        case 'LineString':
            return isLine(value.coordinates);
        case 'MultiLineString':
            return Array.isArray(value.coordinates) && value.coordinates.length > 0 && value.coordinates.every(isLine);
        case 'Polygon':
            return isPolygon(value.coordinates);
        case 'MultiPolygon':
            return Array.isArray(value.coordinates) && value.coordinates.length > 0 && value.coordinates.every(isPolygon);
        default:
            return false;
    }
}

function isPosition(value: unknown): value is number[] {
    return Array.isArray(value)
        && value.length >= 2
        && typeof value[0] === 'number'
        && value[0] >= -180
        && value[0] <= 180
        && typeof value[1] === 'number'
        && value[1] >= -90
        && value[1] <= 90
        && value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));
}

function isLine(value: unknown): value is number[][] {
    return Array.isArray(value) && value.length >= 2 && value.every(isPosition);
}

function isPolygon(value: unknown): value is number[][][] {
    return Array.isArray(value)
        && value.length > 0
        && value.every((ring) => Array.isArray(ring)
            && ring.length >= 4
            && ring.every(isPosition)
            && samePosition(ring[0], ring[ring.length - 1]));
}

function samePosition(left: unknown, right: unknown): boolean {
    return Array.isArray(left) && Array.isArray(right)
        && left.length === right.length
        && left.every((coordinate, index) => coordinate === right[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}