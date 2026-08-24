import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAstraPathname } from '../../appRouting';
import { defaultCoordinates } from '../../common/defaultLocation';
import { getPageShareUrl, shareUrl as shareAppUrl } from '../../share';
import { getQueryCoordinates, getQueryDate, isValidDateInput, type Coordinates } from '../components/dateLocationUtils';
import { buildSkyEvents } from './astraEventData';
import type { AstraPageProps, SkyEvent } from './astraTypes';
import { getSelectedDate, minutesSinceMidnight } from './astraUtils';
import { formatDateInput, getAstronomyData, type AstronomyData, type TimelineSegment } from './sunTimes';

export type AstraPageState = {
    embedded: boolean;
    locationView: boolean;
    coordinates: Coordinates;
    dateValue: string;
    now: Date;
    astronomy: AstronomyData | null;
    currentMinutes: number;
    shouldRequestLocation: boolean;
    selectedSegment: TimelineSegment | null;
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    skyEvents: SkyEvent[];
    isTodaySelected: boolean;
    isCurrentTimeSelected: boolean;
    onDateChange: (value: string) => void;
    onCoordinatesChange: (value: Coordinates) => void;
    onInputValidityChange: (value: boolean) => void;
    onSelectSegment: (segment: TimelineSegment) => void;
    onSelectMarker: (markerId: string) => void;
    onSelectEvent: (event: SkyEvent) => void;
    onShare: () => void;
}

export function useAstraPage({ embedded = false, initialCoordinates, locationView = false }: Readonly<AstraPageProps>): AstraPageState {
    const queryCoordinates = useMemo(() => embedded ? null : getQueryCoordinates(), [embedded]);
    const queryDate = useMemo(() => embedded ? null : getQueryDate(), [embedded]);
    const hasExplicitCoordinates = initialCoordinates !== undefined || queryCoordinates !== null;
    const startingCoordinates = initialCoordinates ?? queryCoordinates ?? defaultCoordinates;
    const shouldRequestLocation = !hasExplicitCoordinates && typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
    const [coordinates, setCoordinates] = useState<Coordinates>(() => startingCoordinates);
    const [dateValue, setDateValue] = useState(() => queryDate ?? formatDateInput(new Date()));
    const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());
    const [inputFieldsReady, setInputFieldsReady] = useState(true);

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (embedded) {
            return;
        }

        const previousTitle = document.title;
        document.title = 'Sun and Moon Guide | DCBC Birding Map';
        return () => {
            document.title = previousTitle;
        };
    }, [embedded]);

    const selectedDate = useMemo(() => getSelectedDate(dateValue), [dateValue]);
    const hasValidCoordinates = Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude);
    const astronomy = useMemo(() => {
        if (!inputFieldsReady || selectedDate === null || !hasValidCoordinates) {
            return null;
        }

        return getAstronomyData(selectedDate, coordinates.latitude, coordinates.longitude);
    }, [coordinates.latitude, coordinates.longitude, hasValidCoordinates, inputFieldsReady, selectedDate]);
    const allSegments = useMemo(() => astronomy ? [
        ...astronomy.twilightSegments,
        ...astronomy.birdingSegments,
        ...(astronomy.moonSegment ? [astronomy.moonSegment] : [])
    ] : [], [astronomy]);
    const selectedSegment = useMemo(() => selectedSegmentId === null
        ? null
        : allSegments.find((segment) => segment.id === selectedSegmentId) ?? null, [allSegments, selectedSegmentId]);
    const skyEvents = useMemo(() => astronomy ? buildSkyEvents(astronomy) : [], [astronomy]);
    const currentMinutes = minutesSinceMidnight(now);
    const isTodaySelected = selectedDate !== null && formatDateInput(selectedDate) === formatDateInput(now);
    const isCurrentTimeSelected = isTodaySelected && selectedMarkerId === 'current-time';

    const onDateChange = useCallback((value: string) => setDateValue(value), []);
    const onCoordinatesChange = useCallback((value: Coordinates) => setCoordinates(value), []);
    const onInputValidityChange = useCallback((value: boolean) => setInputFieldsReady(value), []);
    const onSelectSegment = useCallback((segment: TimelineSegment) => {
        setSelectedMarkerId(null);
        setSelectedSegmentId((currentSegmentId) => currentSegmentId === segment.id ? null : segment.id);
    }, []);
    const onSelectMarker = useCallback((markerId: string) => {
        setSelectedSegmentId(null);
        setSelectedMarkerId((currentMarkerId) => currentMarkerId === markerId ? null : markerId);
    }, []);
    const onSelectEvent = useCallback((event: SkyEvent) => {
        if (event.segment) {
            onSelectSegment(event.segment);
        }
        else if (event.markerId) {
            onSelectMarker(event.markerId);
        }
    }, [onSelectMarker, onSelectSegment]);
    const onShare = useCallback(() => {
        const url = getPageShareUrl(getAstraPathname(), {
            date: isValidDateInput(dateValue) ? dateValue : undefined,
            lat: coordinates.latitude,
            lng: coordinates.longitude
        });
        void shareAppUrl({
            title: 'Sun and Moon Guide',
            text: 'Sun and moon guide for the Diaz Cross Bird Club area.',
            url
        });
    }, [coordinates.latitude, coordinates.longitude, dateValue]);

    return {
        embedded,
        locationView,
        coordinates,
        dateValue,
        now,
        astronomy,
        currentMinutes,
        shouldRequestLocation,
        selectedSegment,
        selectedSegmentId,
        selectedMarkerId,
        skyEvents,
        isTodaySelected,
        isCurrentTimeSelected,
        onDateChange,
        onCoordinatesChange,
        onInputValidityChange,
        onSelectSegment,
        onSelectMarker,
        onSelectEvent,
        onShare
    };
}