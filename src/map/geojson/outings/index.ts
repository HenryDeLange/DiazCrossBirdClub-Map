import type { FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../types';
import assegaaiTrails from './assegaaiTrails.json';
import diepkloof from './diepkloof.json';
import hopeFarm from './hopeFarm.json';
import kapRiver from './kapRiver.json';
import moneysworth from './moneysworth.json';
import wintersettFarm from './wintersettFarm.json';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export const outings: GeoCollection[] = [
	assegaaiTrails as GeoCollection,
	diepkloof as GeoCollection,
	hopeFarm as GeoCollection,
	kapRiver as GeoCollection,
	moneysworth as GeoCollection,
	wintersettFarm as GeoCollection
];
