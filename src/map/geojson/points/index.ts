import type { FeatureCollection, Geometry } from 'geojson';
import boknesBirdHide from '../../../assets/geojson/points/boknesBirdHide.json';
import bustards from '../../../assets/geojson/points/bustards.json';
import eagleNest from '../../../assets/geojson/points/eagleNest.json';
import ecoEstateBirdHide from '../../../assets/geojson/points/ecoEstateBirdHide.json';
import owlNest from '../../../assets/geojson/points/owlNest.json';
import type { FeatureProps } from '../types';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export const points: GeoCollection[] = [
	boknesBirdHide as GeoCollection,
	bustards as GeoCollection,
	eagleNest as GeoCollection,
	ecoEstateBirdHide as GeoCollection,
	owlNest as GeoCollection
];
