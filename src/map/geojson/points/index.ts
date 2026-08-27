import type { FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../types';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

const geojsonModules = import.meta.glob<GeoCollection>('../../../assets/geojson/points/*.json', {
	eager: true,
	import: 'default'
});

export const points: GeoCollection[] = Object.entries(geojsonModules)
	.sort(([left], [right]) => left.localeCompare(right))
	.map(([, collection]) => collection);
