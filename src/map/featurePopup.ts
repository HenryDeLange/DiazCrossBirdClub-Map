import * as geojson from 'geojson';
import { Layer } from 'leaflet';
import { FeatureProps } from './geojson/types';

export function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer) {
    if (feature.geometry.type !== 'Point' || (feature.geometry.type === 'Point' && feature.properties.category === 'spot')) {
        layer.bindPopup(`
            <div class='text-2xl font-semibold'>${feature.properties.name}</div>
            <p class='text-lg'>${feature.properties.description ?? ''}</p>
            <p>
            ${feature.properties.linkMap ? `<a class='text-lg' href='${feature.properties.linkMap}' target='_blank'>Map Pin</a>` : ''}
            ${(feature.properties.linkMap && feature.properties.linkDocument)
                ? '<span class=\'text-xl\'> | </span>' : ''}
            ${feature.properties.linkDocument ? `<a class='text-lg' href='${feature.properties.linkDocument}' target='_blank'>Document</a>` : ''}
            ${((feature.properties.linkMap && feature.properties.linkWeb) || (feature.properties.linkDocument && feature.properties.linkWeb))
                ? '<span class=\'text-xl\'> | </span>' : ''}
            ${feature.properties.linkWeb ? `<a class='text-lg' href='${feature.properties.linkWeb}' target='_blank'>Website</a>` : ''}
            </P>
        `);
    }
}
