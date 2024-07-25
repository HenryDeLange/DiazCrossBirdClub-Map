import { StyleFunction } from 'leaflet';
import { FeatureProps } from './geojson/types';

export const styleFunction: StyleFunction<FeatureProps> = (feature) => {
    return {
        color: feature?.properties.stroke ?? (
            feature?.properties.road === 'access' ? '#b77d01'
                : feature?.properties.road === 'drive' ? '#377da1'
                    : '#c44040'),
        weight: feature?.properties['stroke-width'] ?? 5,
        opacity: feature?.properties['stroke-opacity'] ?? 0.8,
        fillColor: feature?.properties.fill ?? '#e01f1f',
        fillOpacity: feature?.properties['fill-opacity'] ?? 0.3,
        dashArray: feature?.properties.road === 'access' ? '12, 12'
            : feature?.properties.road === 'birding' ? '1, 12'
                : feature?.properties.road === 'drive' ? '8, 16, 8'
                    : undefined
    };
};
