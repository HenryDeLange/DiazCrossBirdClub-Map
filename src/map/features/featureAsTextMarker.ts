import * as geojson from 'geojson';
import { DivIcon, LatLng, Layer, Marker } from 'leaflet';
import type { FeatureProps } from '../geojson/types';
import { onEachFeatureShowPopup } from './featurePopup';

type TextMarkerClickPayload = {
    searchText: string;
}

type PointToLayerOptions = {
    onTextMarkerClick?: (payload: TextMarkerClickPayload) => void;
}

export function pointToLayerShowText(
    feature: geojson.Feature<geojson.Point, FeatureProps>,
    latlng: LatLng,
    options: PointToLayerOptions = {}
): Layer {
    if (feature.properties.category === 'spot') {
        const divIcon = new DivIcon({
            html: feature.properties.name,
            className: 'spot-marker',
            iconSize: [350, 8]
        });
        const marker = new Marker(latlng, { icon: divIcon, zIndexOffset: 999 });
        onEachFeatureShowPopup(feature, marker);
        return marker;
    }
    else {
        const divIcon = new DivIcon({
            html: feature.properties.name,
            className: 'text-marker',
            iconSize: [350, 8]
        });
        const marker = new Marker(latlng, { icon: divIcon, zIndexOffset: 99999 });
        marker.addEventListener('click', () => {
            if (feature.properties.name) {
                options.onTextMarkerClick?.({ searchText: feature.properties.name });
            }
        });
        return marker;
    }
}
