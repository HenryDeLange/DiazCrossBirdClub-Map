import type { FeatureCollection, Geometry } from 'geojson';
import boknesLagoon from '../../../assets/geojson/spots/boknesLagoon.json';
import capePadrone from '../../../assets/geojson/spots/capePadrone.json';
import diazDam from '../../../assets/geojson/spots/diazDam.json';
import fishRiverLighthouse from '../../../assets/geojson/spots/fishRiverLighthouse.json';
import fishRiverMouth from '../../../assets/geojson/spots/fishRiverMouth.json';
import ghioPans from '../../../assets/geojson/spots/ghioPans.json';
import kasouga from '../../../assets/geojson/spots/kasouga.json';
import naturesLandingDam from '../../../assets/geojson/spots/naturesLandingDam.json';
import ottersVlei from '../../../assets/geojson/spots/ottersVlei.json';
import type { FeatureProps } from '../types';

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
