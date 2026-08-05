import { useStation, type Extreme, type Station } from '@neaps/tide-predictor';
import { roundCoordinate, type Coordinates } from '../inputfields/dateLocationUtils';

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
    error?: string;
}

export type WeightedTideExtreme = Pick<Extreme, 'high' | 'label' | 'level' | 'time'> & {
    timeZone: string;
}

const stationApiUrl = 'https://api.openwaters.io/tides/stations';

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
            throw new Error('No tide stations found for this location');
        }

        return { stations, coordinates: roundedCoordinates };
    }
    catch (error) {
        if (signal?.aborted) {
            throw error;
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
            const nextExtreme = prediction.extremes.find((extreme) => extreme.time >= selectedEnd);
            const chartExtremes = [previousExtreme, ...selectedExtremes, nextExtreme].filter((extreme): extreme is Extreme => extreme !== undefined);

            return { station, extremes: selectedExtremes, chartExtremes };
        }
        catch (error) {
            return {
                station,
                extremes: [],
                chartExtremes: [],
                error: error instanceof Error ? error.message : 'Could not calculate tides'
            };
        }
    });
}

export function getWeightedTideExtremes(predictions: TidePrediction[]): WeightedTideExtreme[] {
    const availablePredictions = predictions.filter(({ chartExtremes }) => chartExtremes.length > 0);
    const eventCount = Math.max(0, ...availablePredictions.map(({ chartExtremes }) => chartExtremes.length));

    return Array.from({ length: eventCount }, (_, eventIndex) => {
        const entries = availablePredictions.flatMap(({ station, chartExtremes }) => {
            const extreme = chartExtremes[eventIndex];
            return extreme ? [{ station, extreme }] : [];
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