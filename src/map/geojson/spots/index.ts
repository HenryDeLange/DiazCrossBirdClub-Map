import type { FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../types';
import boknesLagoon from './boknesLagoon.json';
import capePadrone from './capePadrone.json';
import diazDam from './diazDam.json';
import fishRiverLighthouse from './fishRiverLighthouse.json';
import fishRiverMouth from './fishRiverMouth.json';
import ghioPans from './ghioPans.json';
import kasouga from './kasouga.json';
import naturesLandingDam from './naturesLandingDam.json';
import ottersVlei from './ottersVlei.json';

type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export const spots: GeoCollection[] = [
	boknesLagoon as GeoCollection,
	capePadrone as GeoCollection,
	diazDam as GeoCollection,
	fishRiverLighthouse as GeoCollection,
	fishRiverMouth as GeoCollection,
	ghioPans as GeoCollection,
	kasouga as GeoCollection,
	naturesLandingDam as GeoCollection,
	ottersVlei as GeoCollection
];
