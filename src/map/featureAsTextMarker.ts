import * as geojson from 'geojson';
import { DivIcon, LatLng, Layer, Marker } from 'leaflet';
import { FeatureProps } from './geojson/types';

export function pointToLayerShowText(feature: geojson.Feature<geojson.Point, FeatureProps>, latlng: LatLng): Layer {
    const divIcon = new DivIcon({
        html: feature.properties.name,
        className: 'text-marker',
        iconSize: [350, 8]
    });
    const marker = new Marker(latlng, { icon: divIcon });
    marker.addEventListener('click', (event) => event.sourceTarget._map.setView([latlng.lat - 0.0025, latlng.lng], 16));
    return marker;
}
