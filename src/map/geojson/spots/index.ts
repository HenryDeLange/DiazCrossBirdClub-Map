import type { FeatureCollection, Geometry } from 'geojson';
import { FeatureProps } from '../types';
import boknesLagoon from './boknesLagoon.json';
import capePadrone from './capePadrone.json';
import diazDam from './diazDam.json';
import fishRiverLighthouse from './fishRiverLighthouse.json';
import fishRiverMouth from './fishRiverMouth.json';
import ghioPans from './ghioPans.json';
import kasouga from './kasouga.json';
import naturesLandingDam from './naturesLandingDam.json';
import ottersVlei from './ottersVlei.json';

export const spots: FeatureCollection<Geometry, FeatureProps>[] = [];

spots.push(boknesLagoon as any);
spots.push(diazDam as any);
spots.push(naturesLandingDam as any);
spots.push(ghioPans as any);
spots.push(fishRiverLighthouse as any);
spots.push(fishRiverMouth as any);
spots.push(ottersVlei as any);
spots.push(capePadrone as any);
spots.push(kasouga as any);
