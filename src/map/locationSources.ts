import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import type { LocationSource } from './locationUtils';

export const locationSources: LocationSource[] = [
    { tab: 'Outings', collections: outings },
    { tab: 'Spots', collections: spots },
    { tab: 'Paths', collections: paths },
    { tab: 'Points', collections: points }
];
