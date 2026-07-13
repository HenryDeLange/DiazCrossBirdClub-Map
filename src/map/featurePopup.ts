import * as geojson from 'geojson';
import { Layer } from 'leaflet';
import type { FeatureProps } from './geojson/types';

export function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer) {
    if (feature.geometry.type !== 'Point' || (feature.geometry.type === 'Point' && feature.properties.category === 'spot')) {
        const links: string[] = [];

        if (feature.properties.linkWeb) {
            links.push(`<a class='popup-link' href='${feature.properties.linkWeb}' target='_blank' rel='noreferrer'>Website</a>`);
        }

        if (feature.properties.linkMap) {
            links.push(`<a class='popup-link' href='${feature.properties.linkMap}' target='_blank' rel='noreferrer'>Google Maps</a>`);
        }

        if (feature.properties.linkDocument) {
            links.push(`<a class='popup-link' href='${feature.properties.linkDocument}' target='_blank' rel='noreferrer'>DCBC Doc</a>`);
        }

        const linkMarkup = links.length > 0 ? `<div class='popup-links'>${links.join('<span class="popup-separator">•</span>')}</div>` : '';

        layer.bindPopup(`
            <div class='popup-content'>
                <div class='popup-title'>${feature.properties.name}</div>
                <div class='popup-description'>${feature.properties.description ?? ''}</div>
                ${linkMarkup}
            </div>
        `);
    }
}
