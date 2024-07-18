import type { FeatureCollection, Geometry } from 'geojson';
import { FeatureProps } from '../types';
import alexandria from './alexandria.json';
import goldenMile from './goldenMile.json';

export const paths: FeatureCollection<Geometry, FeatureProps>[] = [];

paths.push(alexandria as any);
paths.push(goldenMile as any);
