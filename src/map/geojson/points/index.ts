import type { FeatureCollection, Geometry } from 'geojson';
import { FeatureProps } from '../types';
import boknesBirdHide from './boknesBirdHide.json';
import bustards from './bustards.json';
import eagleNest from './eagleNest.json';
import ecoEstateBirdHide from './ecoEstateBirdHide.json';
import owlNest from './owlNest.json';

export const points: FeatureCollection<Geometry, FeatureProps>[] = [];

points.push(boknesBirdHide as any);
points.push(bustards as any);
points.push(eagleNest as any);
points.push(ecoEstateBirdHide as any);
points.push(owlNest as any);
