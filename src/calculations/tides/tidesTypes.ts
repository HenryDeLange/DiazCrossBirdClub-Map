import type { Coordinates } from '../components/dateLocationUtils';
import type { TidePrediction, TideStation, WeightedTideExtreme, WeightedTideLevel } from './tideData';

export type TidesPageProps = {
    embedded?: boolean;
}

export type TideStationState = {
    status: 'loading' | 'success' | 'error';
    stations: TideStation[];
    message?: string;
}

export type CurrentTideStatus = WeightedTideLevel & {
    incoming: boolean;
    nextTide: WeightedTideExtreme;
    followingTide: WeightedTideExtreme | null;
}

export type WaveChartPoint = {
    x: number;
    y: number;
    extreme: WeightedTideExtreme;
}

export type WaveChartTick = {
    x: number;
    label: string;
}

export type TidesPageState = {
    embedded: boolean;
    coordinates: Coordinates;
    dateValue: string;
    now: Date;
    shouldRequestLocation: boolean;
    selectedDate: Date | null;
    stationState: TideStationState;
    predictions: TidePrediction[];
    weightedExtremes: WeightedTideExtreme[];
    currentTide: CurrentTideStatus | null;
    hasTideData: boolean;
    allPredictionsFailed: boolean;
    onDateChange: (value: string) => void;
    onCoordinatesChange: (value: Coordinates) => void;
    onShare: () => void;
}