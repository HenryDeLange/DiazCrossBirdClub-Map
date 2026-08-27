import * as geojson from 'geojson';
import { Layer } from 'leaflet';
import type { FeatureProps } from '../geojson/types';
import styles from './featurePopup.module.css';
import { escapeHtml, getSafeExternalUrl } from './htmlUtils';

export function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer, allowPointPopup = false) {
    if (feature.geometry.type === 'Point' && feature.properties.category !== 'spot' && !allowPointPopup) {
        return;
    }

    const links = [
        createExternalLink('Website', feature.properties.linkWeb),
        createExternalLink('Google Maps', feature.properties.linkMap),
        createExternalLink('DCBC Doc', feature.properties.linkDocument)
    ].filter((link): link is string => link !== null);
    const linkMarkup = links.length > 0 ? `<div class='${styles.links}'>${links.join(`<span class="${styles.separator}">•</span>`)}</div>` : '';

    layer.bindPopup(`
        <div class='${styles.content}'>
            <div class='${styles.title}'>${escapeHtml(feature.properties.name ?? '')}</div>
            <div class='${styles.description}'>${escapeHtml(feature.properties.description ?? '')}</div>
            ${linkMarkup}
        </div>
    `);
}

function createExternalLink(label: string, value: string | undefined): string | null {
    if (!value) {
        return null;
    }

    const safeUrl = getSafeExternalUrl(value);
    return safeUrl
        ? `<a class='${styles.link}' href='${escapeHtml(safeUrl)}' target='_blank' rel='noreferrer'>${label}</a>`
        : null;
}
