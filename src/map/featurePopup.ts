import * as geojson from 'geojson';
import { Layer } from 'leaflet';
import { FeatureProps } from './geojson/types';

export function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer) {
    if (feature.geometry.type !== 'Point') {
        layer.bindPopup(`
            <b><u>${feature.properties.name}</u></b>
            <p>${feature.properties.description ?? ''}</p>
            <p>
            ${feature.properties.pin ? `<a href='${feature.properties.pin}' target='_blank'>Map Pin</a>` : ''}
            ${(feature.properties.pin && feature.properties.document) ? ' | ' : ''}
            ${feature.properties.document ? `<a href='${feature.properties.document}' target='_blank'>Information Document</a>` : ''}
            </P>
        `);
    }
}
