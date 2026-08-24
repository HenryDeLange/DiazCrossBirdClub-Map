import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTidesPathname } from '../../appRouting';
import { defaultTideCoordinates } from '../../common/defaultLocation';
import { getPageShareUrl, shareUrl as shareAppUrl } from '../../share';
import { getQueryCoordinates, getQueryDate, isValidDateInput, type Coordinates } from '../components/dateLocationUtils';
import { defaultTideStationsData, fetchTideStations, getTidePredictions, getWeightedTideExtremes } from './tideData';
import type { TidesPageProps, TidesPageState, TideStationState } from './tidesTypes';
import { formatDateInput, getCurrentTideStatus, getTideSelectedDate, sortByStationDistance } from './tidesUtils';

export function useTidesPage({ embedded = false }: Readonly<TidesPageProps>): TidesPageState {
    const queryCoordinates = useMemo(() => embedded ? null : getQueryCoordinates(), [embedded]);
    const queryDate = useMemo(() => embedded ? null : getQueryDate(), [embedded]);
    const hasExplicitCoordinates = queryCoordinates !== null;
    const startingCoordinates = queryCoordinates ?? defaultTideCoordinates;
    const shouldRequestLocation = !hasExplicitCoordinates && typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
    const [coordinates, setCoordinates] = useState<Coordinates>(() => startingCoordinates);
    const [dateValue, setDateValue] = useState(() => queryDate ?? formatDateInput(new Date()));
    const [locationLocked, setLocationLocked] = useState(hasExplicitCoordinates);
    const [stationState, setStationState] = useState<TideStationState>(() => {
        if (hasExplicitCoordinates) {
            return { status: 'loading', stations: [], message: 'Loading nearby stations...' };
        }

        return { status: 'success', stations: defaultTideStationsData };
    });
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!locationLocked) {
            return;
        }

        const controller = new AbortController();

        fetchTideStations(coordinates, controller.signal)
            .then((result) => setStationState({
                status: 'success',
                stations: result.stations
            }))
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setStationState({ status: 'error', stations: [], message: error instanceof Error ? error.message : 'Could not load tide stations' });
                }
            });

        return () => controller.abort();
    }, [coordinates, locationLocked]);

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (embedded) {
            return;
        }

        const previousTitle = document.title;
        document.title = 'Tide Guide | DCBC Birding Map';
        return () => {
            document.title = previousTitle;
        };
    }, [embedded]);

    const selectedDate = useMemo(() => getTideSelectedDate(dateValue), [dateValue]);
    const onDateChange = useCallback((value: string) => setDateValue(value), []);
    const onCoordinatesChange = useCallback((nextCoordinates: Coordinates) => {
        setLocationLocked(true);
        setStationState({ status: 'loading', stations: [], message: 'Loading nearby stations...' });
        setCoordinates(nextCoordinates);
    }, []);
    const onShare = useCallback(() => {
        const url = getPageShareUrl(getTidesPathname(), {
            date: isValidDateInput(dateValue) ? dateValue : undefined,
            lat: coordinates.latitude,
            lng: coordinates.longitude
        });
        void shareAppUrl({
            title: 'Tide Guide',
            text: 'Tide predictions for the Diaz Cross Bird Club area.',
            url
        });
    }, [coordinates.latitude, coordinates.longitude, dateValue]);
    const predictions = useMemo(() => {
        if (stationState.status !== 'success' || selectedDate === null) {
            return [];
        }

        return getTidePredictions(stationState.stations, selectedDate).sort(sortByStationDistance);
    }, [selectedDate, stationState.status, stationState.stations]);
    const weightedExtremes = useMemo(() => getWeightedTideExtremes(predictions), [predictions]);
    const statusExtremes = useMemo(() => getWeightedTideExtremes(predictions, 'statusExtremes'), [predictions]);
    const currentTide = useMemo(() => getCurrentTideStatus(predictions, statusExtremes, selectedDate, now), [now, predictions, selectedDate, statusExtremes]);
    const hasTideData = useMemo(() => predictions.some(({ chartExtremes }) => chartExtremes.length > 0), [predictions]);
    const allPredictionsFailed = useMemo(() => predictions.length > 0 && predictions.every(({ error }) => Boolean(error)), [predictions]);

    return {
        embedded,
        coordinates,
        dateValue,
        now,
        shouldRequestLocation,
        selectedDate,
        stationState,
        predictions,
        weightedExtremes,
        currentTide,
        hasTideData,
        allPredictionsFailed,
        onDateChange,
        onCoordinatesChange,
        onShare
    };
}