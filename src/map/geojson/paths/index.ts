import type { FeatureCollection, Geometry } from 'geojson';
import alexandria from '../../../assets/geojson/paths/alexandria.json';
import goldenMile from '../../../assets/geojson/paths/goldenMile.json';
import middleBeach from '../../../assets/geojson/paths/middleBeach.json';
import type { FeatureProps } from '../types';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export const paths: GeoCollection[] = [
	alexandria as GeoCollection,
	goldenMile as GeoCollection,
	middleBeach as GeoCollection
];
