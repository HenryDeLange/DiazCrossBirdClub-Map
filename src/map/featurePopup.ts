import * as geojson from 'geojson';
import { Layer } from 'leaflet';
import { FeatureProps } from './geojson/types';

export function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer) {
    if (feature.geometry.type !== 'Point') {
        layer.bindPopup(`
            <b><u>${feature.properties.name}</u></b>
            <p>${feature.properties.description ?? ''}</p>
            ${feature.properties.pdf ? `<p><a href='${feature.properties.pdf}' target='_blank'>PDF</a></p>` : ''}
        `);
    }
}
