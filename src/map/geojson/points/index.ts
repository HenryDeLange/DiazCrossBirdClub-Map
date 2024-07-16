import type { FeatureCollection, Geometry } from 'geojson';
import { FeatureProps } from '../types';
import bustards from './bustards.json';
import eagleNest from './eagleNest.json';
import owlNest from './owlNest.json';

export const points: FeatureCollection<Geometry, FeatureProps>[] = [];

points.push(bustards as any);
points.push(owlNest as any);
points.push(eagleNest as any);
