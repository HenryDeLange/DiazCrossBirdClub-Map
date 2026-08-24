import * as geojson from 'geojson';
import { Layer } from 'leaflet';
import type { FeatureProps } from '../geojson/types';
import styles from './featurePopup.module.css';

export function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer) {
    if (feature.geometry.type !== 'Point' || (feature.geometry.type === 'Point' && feature.properties.category === 'spot')) {
        const links: string[] = [];

        if (feature.properties.linkWeb) {
            links.push(`<a class='${styles.link}' href='${feature.properties.linkWeb}' target='_blank' rel='noreferrer'>Website</a>`);
        }

        if (feature.properties.linkMap) {
            links.push(`<a class='${styles.link}' href='${feature.properties.linkMap}' target='_blank' rel='noreferrer'>Google Maps</a>`);
        }

        if (feature.properties.linkDocument) {
            links.push(`<a class='${styles.link}' href='${feature.properties.linkDocument}' target='_blank' rel='noreferrer'>DCBC Doc</a>`);
        }

        const linkMarkup = links.length > 0 ? `<div class='${styles.links}'>${links.join(`<span class="${styles.separator}">•</span>`)}</div>` : '';

        layer.bindPopup(`
            <div class='${styles.content}'>
                <div class='${styles.title}'>${feature.properties.name}</div>
                <div class='${styles.description}'>${feature.properties.description ?? ''}</div>
                ${linkMarkup}
            </div>
        `);
    }
}
