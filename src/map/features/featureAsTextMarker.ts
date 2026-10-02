import * as geojson from 'geojson';
import { CircleMarker, DivIcon, LatLng, Layer, Marker } from 'leaflet';
import type { FeatureProps } from '../geojson/types';
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
        const point = new CircleMarker(latlng, {
            radius: 5,
            color: '#fff',
            weight: 2,
            fillColor: '#0f8094',
            fillOpacity: 1
        });
        return point;
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

                const width = Math.ceil(element.scrollWidth);
                const height = Math.ceil(element.scrollHeight);
                marker.setIcon(new DivIcon({
                    html: markerName,
                    className: 'text-marker',
                    iconSize: [width, height],
                    iconAnchor: [width / 2, height + 4]
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

export function pointToLayerSpotLabel(
    feature: geojson.Feature<geojson.Point, FeatureProps>,
    latlng: LatLng
): Layer {
    const markerName = escapeHtml(feature.properties.name ?? '');
    const marker = new Marker(latlng, {
        icon: new DivIcon({
            html: markerName,
            className: 'spot-marker',
            iconSize: [350, 8],
            iconAnchor: [175, 28]
        }),
        zIndexOffset: 999
    });
    return marker;
}
