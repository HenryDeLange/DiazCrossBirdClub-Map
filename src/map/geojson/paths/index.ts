import type { FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../types';
import alexandria from './alexandria.json';
import goldenMile from './goldenMile.json';
import middleBeach from './middleBeach.json';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export const paths: GeoCollection[] = [
	alexandria as GeoCollection,
	goldenMile as GeoCollection,
	middleBeach as GeoCollection
];
