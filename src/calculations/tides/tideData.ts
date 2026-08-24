import { useStation, type Extreme, type Station } from '@neaps/tide-predictor';
import { defaultTideCoordinates } from '../../common/defaultLocation';
import { roundCoordinate, type Coordinates } from '../components/dateLocationUtils';
import defaultTideStations from './defaultTideStations.json';

export type TideStation = Station & {
    distance?: number;
}

export type TideStationResult = {
    stations: TideStation[];
    coordinates: Coordinates;
}

export type TidePrediction = {
    station: TideStation;
    extremes: Extreme[];
    chartExtremes: Extreme[];
    statusExtremes: Extreme[];
    error?: string;
}

export type WeightedTideExtreme = Pick<Extreme, 'high' | 'label' | 'level' | 'time'> & {
    timeZone: string;
}

export type WeightedTideLevel = {
    level: number;
    timeZone: string;
}

const stationApiUrl = 'https://api.openwaters.io/tides/stations';

export const defaultTideStationsData = defaultTideStations as unknown as TideStation[];

const defaultRoundedCoordinates = {
    latitude: roundCoordinate(defaultTideCoordinates.latitude, 1),
    longitude: roundCoordinate(defaultTideCoordinates.longitude, 1)
};

export async function fetchTideStations(coordinates: Coordinates, signal?: AbortSignal): Promise<TideStationResult> {
    const roundedCoordinates = {
        latitude: roundCoordinate(coordinates.latitude, 1),
        longitude: roundCoordinate(coordinates.longitude, 1)
    };
    const params = new URLSearchParams({
        latitude: String(roundedCoordinates.latitude),
        longitude: String(roundedCoordinates.longitude),
        maxResults: '2'
    });

    try {
        const response = await fetch(`${stationApiUrl}?${params.toString()}`, { signal });
        if (!response.ok) {
            throw new Error(`Station request failed (${response.status})`);
        }

        const stations = parseStations(await response.json());
        if (stations.length === 0) {
            throw new Error('No tide stations with harmonic data found for this location');
        }

        return { stations, coordinates: roundedCoordinates };
    }
    catch (error) {
        if (signal?.aborted) {
            throw error;
        }

        if (roundedCoordinates.latitude === defaultRoundedCoordinates.latitude && roundedCoordinates.longitude === defaultRoundedCoordinates.longitude) {
            return {
                stations: defaultTideStationsData,
                coordinates: roundedCoordinates
            };
        }

        throw error instanceof Error ? error : new Error('Could not load tide stations');
    }
}

export function getTidePredictions(stations: TideStation[], date: Date): TidePrediction[] {
    const selectedStart = startOfDay(date);
    const selectedEnd = addDays(selectedStart, 1);
    const calculationStart = addDays(selectedStart, -1);
    const calculationEnd = addDays(selectedStart, 2);

    return stations.slice(0, 2).map((station) => {
        try {
            const prediction = useStation(station, station.distance).getExtremesPrediction({
                start: calculationStart,
                end: calculationEnd,
                units: 'meters'
            });
            const selectedExtremes = prediction.extremes.filter((extreme) => extreme.time >= selectedStart && extreme.time < selectedEnd);
            const previousExtreme = prediction.extremes.filter((extreme) => extreme.time < selectedStart).at(-1);
            const upcomingExtremes = prediction.extremes.filter((extreme) => extreme.time >= selectedEnd).slice(0, 2);
            const chartExtremes = [previousExtreme, ...selectedExtremes, upcomingExtremes[0]].filter((extreme): extreme is Extreme => extreme !== undefined);
            const statusExtremes = [previousExtreme, ...selectedExtremes, ...upcomingExtremes].filter((extreme): extreme is Extreme => extreme !== undefined);

            return { station, extremes: selectedExtremes, chartExtremes, statusExtremes };
        }
        catch (error) {
            return {
                station,
                extremes: [],
                chartExtremes: [],
                statusExtremes: [],
                error: error instanceof Error ? error.message : 'Could not calculate tides'
            };
        }
    });
}

type TideExtremeCollection = 'chartExtremes' | 'statusExtremes';

export function getWeightedTideExtremes(predictions: TidePrediction[], collection: TideExtremeCollection = 'chartExtremes'): WeightedTideExtreme[] {
    const availablePredictions = predictions.filter((prediction) => prediction[collection].length > 0);
    const eventCount = Math.max(0, ...availablePredictions.map((prediction) => prediction[collection].length));

    return Array.from({ length: eventCount }, (_, eventIndex) => {
        const entries = availablePredictions.flatMap((prediction) => {
            const extreme = prediction[collection][eventIndex];
            return extreme ? [{ station: prediction.station, extreme }] : [];
        });

        if (entries.length === 0) {
            return null;
        }

        const weightedValues = entries.reduce((result, entry) => {
            const weight = getDistanceWeight(entry.station.distance);
            return {
                weight: result.weight + weight,
                time: result.time + entry.extreme.time.getTime() * weight,
                level: result.level + entry.extreme.level * weight
            };
        }, { weight: 0, time: 0, level: 0 });
        const sourceExtreme = entries[0].extreme;

        return {
            high: sourceExtreme.high,
            label: sourceExtreme.label,
            time: new Date(weightedValues.time / weightedValues.weight),
            level: weightedValues.level / weightedValues.weight,
            timeZone: entries[0].station.timezone
        };
    }).filter((extreme): extreme is WeightedTideExtreme => extreme !== null);
}

export function getWeightedTideLevel(predictions: TidePrediction[], time: Date): WeightedTideLevel | null {
    const entries = predictions.flatMap(({ station, error }) => {
        if (error) {
            return [];
        }

        try {
            const prediction = useStation(station, station.distance).getWaterLevelAtTime({ time });
            return Number.isFinite(prediction.level) ? [{ station, level: prediction.level }] : [];
        }
        catch {
            return [];
        }
    });

    if (entries.length === 0) {
        return null;
    }

    const weightedValues = entries.reduce((result, entry) => {
        const weight = getDistanceWeight(entry.station.distance);
        return {
            weight: result.weight + weight,
            level: result.level + entry.level * weight
        };
    }, { weight: 0, level: 0 });

    return {
        level: weightedValues.level / weightedValues.weight,
        timeZone: entries[0].station.timezone
    };
}

function parseStations(value: unknown): TideStation[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isTideStation);
}

function isTideStation(value: unknown): value is TideStation {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const station = value as Partial<TideStation>;
    return typeof station.id === 'string'
        && typeof station.name === 'string'
        && typeof station.latitude === 'number'
        && typeof station.longitude === 'number'
        && typeof station.timezone === 'string'
        && Array.isArray(station.harmonic_constituents)
        && station.harmonic_constituents.length > 0
        && typeof station.datums === 'object'
        && station.datums !== null;
}

function getDistanceWeight(distance: number | undefined): number {
    if (typeof distance !== 'number' || !Number.isFinite(distance)) {
        return 1;
    }

    return 1 / Math.max(distance, 0.001);
}

function startOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}