import type { FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../types';
import boknesBirdHide from './boknesBirdHide.json';
import bustards from './bustards.json';
import eagleNest from './eagleNest.json';
import ecoEstateBirdHide from './ecoEstateBirdHide.json';
import owlNest from './owlNest.json';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export const points: GeoCollection[] = [
	boknesBirdHide as GeoCollection,
	bustards as GeoCollection,
	eagleNest as GeoCollection,
	ecoEstateBirdHide as GeoCollection,
	owlNest as GeoCollection
];
