import * as geojson from 'geojson';
import { DivIcon, LatLng, Layer, Marker } from 'leaflet';
import { FeatureProps } from './geojson/types';

export function pointToLayerShowText(feature: geojson.Feature<geojson.Point, FeatureProps>, latlng: LatLng): Layer {
    const divIcon = new DivIcon({
        html: `<b>${feature.properties.name}</b>`,
        className: 'text-marker',
        iconSize: [350, 50]
    });
    const marker = new Marker(latlng, { icon: divIcon });
    marker.addEventListener('click', (event) => event.sourceTarget._map.setView(latlng, 15));
    return marker;
}
