import * as geojson from 'geojson';
import { DivIcon, LatLng, Layer, Marker } from 'leaflet';
import type { FeatureProps } from '../geojson/types';
import { onEachFeatureShowPopup } from './featurePopup';
import { escapeHtml } from './htmlUtils';

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
    const name = feature.properties.name ?? '';
    const markerName = escapeHtml(name);

    if (feature.properties.category === 'spot') {
        const divIcon = new DivIcon({
            html: markerName,
            className: 'spot-marker',
            iconSize: [350, 8]
        });
        const marker = new Marker(latlng, { icon: divIcon, zIndexOffset: 999 });
        onEachFeatureShowPopup(feature, marker);
        return marker;
    }
    else {
        const divIcon = new DivIcon({
            html: markerName,
            className: 'text-marker'
        });
        const marker = new Marker(latlng, { icon: divIcon, zIndexOffset: 99999 });
        marker.once('add', () => {
            requestAnimationFrame(() => {
                const element = marker.getElement();
                if (!element) {
                    return;
                }

                const width = Math.ceil(element.getBoundingClientRect().width);
                const height = Math.ceil(element.getBoundingClientRect().height);
                marker.setIcon(new DivIcon({
                    html: markerName,
                    className: 'text-marker',
                    iconSize: [width, height],
                    iconAnchor: [width / 2, 0]
                }));
            });
        });
        marker.addEventListener('click', () => {
            if (name) {
                options.onTextMarkerClick?.({ searchText: name });
            }
        });
        return marker;
    }
}
