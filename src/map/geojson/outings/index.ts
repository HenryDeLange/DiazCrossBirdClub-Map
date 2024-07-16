import type { FeatureCollection, Geometry } from 'geojson';
import { FeatureProps } from '../types';
import assegaaiTrails from './assegaaiTrails.json';
import diepkloof from './diepkloof.json';
import hopeFarm from './hopeFarm.json';
import kapRiver from './kapRiver.json';

export const outings: FeatureCollection<Geometry, FeatureProps>[] = [];

outings.push(hopeFarm as any);
outings.push(assegaaiTrails as any);
outings.push(diepkloof as any);
outings.push(kapRiver as any);
