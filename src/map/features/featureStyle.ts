import type { StyleFunction } from 'leaflet';
import type { FeatureProps } from '../geojson/types';

export const styleFunction: StyleFunction<FeatureProps> = (feature) => {
    return {
        color: feature?.properties.stroke ?? (
            feature?.properties.road === 'access' ? '#30a76fc9'
                : feature?.properties.road === 'drive' ? '#5a8d16a6'
                    : '#0f8094'),
        weight: feature?.properties['stroke-width'] ?? 5,
        opacity: feature?.properties['stroke-opacity'] ?? 0.8,
        fillColor: feature?.properties.fill ?? '#00000070',
        fillOpacity: feature?.properties['fill-opacity'] ?? 0.3,
        dashArray: feature?.properties.road === 'access' ? '12, 12'
            : feature?.properties.road === 'birding' ? '1, 12'
                : feature?.properties.road === 'drive' ? '8, 16, 8'
                    : undefined
    };
};
