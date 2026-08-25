import type { FeatureCollection, Geometry } from 'geojson';
import assegaaiTrails from '../../../assets/geojson/outings/assegaaiTrails.json';
import diepkloof from '../../../assets/geojson/outings/diepkloof.json';
import hopeFarm from '../../../assets/geojson/outings/hopeFarm.json';
import kapRiver from '../../../assets/geojson/outings/kapRiver.json';
import moneysworth from '../../../assets/geojson/outings/moneysworth.json';
import wintersettFarm from '../../../assets/geojson/outings/wintersettFarm.json';
import type { FeatureProps } from '../types';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export const outings: GeoCollection[] = [
	assegaaiTrails as GeoCollection,
	diepkloof as GeoCollection,
	hopeFarm as GeoCollection,
	kapRiver as GeoCollection,
	moneysworth as GeoCollection,
	wintersettFarm as GeoCollection
];
