import * as geojson from 'geojson';
import { Layer } from 'leaflet';
import { FeatureProps } from './geojson/types';

export function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer) {
    if (feature.geometry.type !== 'Point') {
        layer.bindPopup(`
            <div class='text-2xl font-semibold'>${feature.properties.name}</div>
            <p class='text-lg'>${feature.properties.description ?? ''}</p>
            <p>
            ${feature.properties.pin ? `<a class='text-lg' href='${feature.properties.pin}' target='_blank'>Map Pin</a>` : ''}
            ${(feature.properties.pin && feature.properties.document) ? '<span class=\'text-xl\'> | </span>' : ''}
            ${feature.properties.document ? `<a class='text-lg' href='${feature.properties.document}' target='_blank'>Information Document</a>` : ''}
            </P>
        `);
    }
}
