import { Clock3, Map, Share2, WavesArrowDown, WavesArrowUp, WavesHorizontal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getBasePathname, getTidesPathname } from '../../appRouting';
import { getPageShareUrl, shareUrl as shareAppUrl } from '../../share';
import { DateLocationControls } from '../components/DateLocationControls';
import { getQueryCoordinates, getQueryDate, type Coordinates } from '../components/dateLocationUtils';
import { fetchTideStations, getTidePredictions, getWeightedTideExtremes, getWeightedTideLevel, type TidePrediction, type TideStation, type WeightedTideExtreme, type WeightedTideLevel } from './tideData';
import './tides.css';

type TidesPageProps = {
    embedded?: boolean;
}

type StationState = {
    status: 'loading' | 'success' | 'error';
    stations: TideStation[];
    message?: string;
}

type CurrentTideStatus = WeightedTideLevel & {
    incoming: boolean;
}

const defaultCoordinates: Coordinates = {
    latitude: -33.64013503503463,
    longitude: 26.724985724190617
};

export default function TidesPage({ embedded = false }: Readonly<TidesPageProps>) {
    const queryCoordinates = embedded ? null : getQueryCoordinates();
    const queryDate = embedded ? null : getQueryDate();
    const hasExplicitCoordinates = queryCoordinates !== null;
    const startingCoordinates = queryCoordinates ?? defaultCoordinates;
    const shouldRequestLocation = !hasExplicitCoordinates && typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
    const [coordinates, setCoordinates] = useState<Coordinates>(startingCoordinates);
    const [dateValue, setDateValue] = useState(queryDate ?? formatDateInput(new Date()));
    const [locationReady, setLocationReady] = useState(hasExplicitCoordinates);
    const [stationState, setStationState] = useState<StationState>(() => {
        if (hasExplicitCoordinates) {
            return { status: 'loading', stations: [], message: 'Loading nearby stations...' };
        }

        return shouldRequestLocation
            ? { status: 'loading', stations: [], message: 'Waiting for GPS location...' }
            : { status: 'error', stations: [], message: 'GPS location is unavailable. Enter coordinates to view tides.' };
    });
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!locationReady) {
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
    }, [coordinates, locationReady]);

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

    const selectedDate = getTideSelectedDate(dateValue);
    const handleCoordinatesChange = useCallback((nextCoordinates: Coordinates) => {
        setLocationReady(true);
        setStationState({ status: 'loading', stations: [], message: 'Loading nearby stations...' });
        setCoordinates(nextCoordinates);
    }, []);
    const handleLocationError = useCallback(() => {
        setLocationReady(false);
        setStationState({ status: 'error', stations: [], message: 'GPS location is unavailable. Allow location access or enter coordinates to view tides.' });
    }, []);
    const handleShare = () => {
        const url = getPageShareUrl(getTidesPathname(), {
            date: dateValue || undefined,
            lat: coordinates.latitude,
            lng: coordinates.longitude
        });
        void shareAppUrl({
            title: 'Tide Guide',
            text: 'Tide predictions for the Diaz Cross Bird Club area.',
            url
        });
    };
    const predictions = stationState.status === 'success' && selectedDate !== null
        ? getTidePredictions(stationState.stations, selectedDate).sort(sortByStationDistance)
        : [];
    const weightedExtremes = getWeightedTideExtremes(predictions);
    const currentTide = getCurrentTideStatus(predictions, weightedExtremes, selectedDate, now);
    const hasTideData = predictions.some(({ chartExtremes }) => chartExtremes.length > 0);
    const allPredictionsFailed = predictions.length > 0 && predictions.every(({ error }) => Boolean(error));

    return (
        <main className={`tides-page ${embedded ? 'tides-page-embedded' : ''}`}>
            <div className='tides-shell'>
                <header className='tides-header'>
                    <div className='tides-toolbar'>
                        <DateLocationControls dateValue={dateValue} onDateChange={setDateValue} coordinates={coordinates} onCoordinatesChange={handleCoordinatesChange} coordinatePrecision={1} requestLocationOnMount={shouldRequestLocation} onLocationError={handleLocationError} idPrefix='tides' />
                        {!embedded && (
                            <div className='tides-toolbar-actions'>
                                <a className='tides-map-link' href={getBasePathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>
                                <button type='button' className='tides-map-link tides-share-link' onClick={handleShare} aria-label='Share these tide predictions' title='Share these tide predictions'><Share2 size={18} /></button>
                            </div>
                        )}
                    </div>
                </header>

                <section className='tides-dashboard'>
                    {!selectedDate && <p className='tides-message' role='alert'>Select a valid date to view tide predictions.</p>}
                    {selectedDate && !locationReady && <p className={`tides-message ${stationState.status === 'error' ? 'tides-message-error' : ''}`} role={stationState.status === 'error' ? 'alert' : 'status'} aria-live='polite'>{stationState.message ?? 'Waiting for GPS location...'}</p>}
                    {selectedDate && locationReady && stationState.status === 'loading' && <p className='tides-message' role='status' aria-live='polite'>{stationState.message ?? 'Loading nearby stations...'}</p>}
                    {selectedDate && locationReady && stationState.status === 'error' && <p className='tides-message tides-message-error' role='alert'>{stationState.message}</p>}
                    {selectedDate && locationReady && stationState.status === 'success' && !hasTideData && <p className='tides-message tides-message-error' role='alert'>{allPredictionsFailed ? 'Tide harmonic data is unavailable for these stations.' : 'No tide predictions are available for this date.'}</p>}
                    {selectedDate && locationReady && stationState.status === 'success' && hasTideData && <div className='tides-results'>
                        <div className='tides-wave-column'>
                            {weightedExtremes.length > 0 && <TideWaveGraphic extremes={weightedExtremes} date={selectedDate} now={now} />}
                            {currentTide && <TideCurrentPanel currentTide={currentTide} now={now} />}
                            <p className='tides-disclaimer'>Tide estimates are for planning birdwatching activities, not navigation.</p>
                        </div>
                        <div className='tides-station-list'>
                            {predictions.map((prediction) => <TideStationPanel key={prediction.station.id} prediction={prediction} />)}
                        </div>
                    </div>}
                </section>
            </div>
        </main>
    );
}

function TideWaveGraphic({ extremes, date, now }: Readonly<{ extremes: WeightedTideExtreme[]; date: Date; now: Date }>) {
    const chartPoints = getWaveChartPoints(extremes, date);
    const visibleChartPoints = chartPoints.filter(({ x }) => x >= 20 && x <= 980);
    const wavePath = createSmoothPath(chartPoints);
    const chartBottom = 218;
    const areaPath = `${wavePath} L ${chartPoints.at(-1)?.x ?? 0} ${chartBottom} L ${chartPoints[0]?.x ?? 0} ${chartBottom} Z`;
    const timeZone = extremes[0]?.timeZone ?? 'UTC';
    const currentTimePoint = getCurrentTimePoint(chartPoints, date, timeZone, now);

    return (
        <section className='tides-wave-panel' aria-labelledby='tides-wave-title'>
            <header className='tides-wave-header'>
                <h2 id='tides-wave-title'><WavesHorizontal aria-hidden='true' /><span>Estimated Tides</span><small>distance weighted</small></h2>
            </header>
            <div className='tides-wave-graphic'>
                <svg viewBox='0 0 1000 286' role='img' aria-label='Distance-weighted average tide heights across 24 hours with 12-hour axis markers'>
                    <defs>
                        <clipPath id='tides-wave-plot-clip'>
                            <rect x='20' y='0' width='960' height='220' />
                        </clipPath>
                    </defs>
                    <g clipPath='url(#tides-wave-plot-clip)'>
                        <path className='tides-wave-area' d={areaPath} />
                        <path className='tides-wave-line' d={wavePath} />
                        {currentTimePoint && <line className='tides-current-time-line' x1={currentTimePoint.x} y1='24' x2={currentTimePoint.x} y2={chartBottom} />}
                    </g>
                    {visibleChartPoints.map(({ x, y, extreme }, index) => (
                        <g key={`${extreme.time.toISOString()}-${index}`} className={`tides-wave-point-group tides-wave-point-group-${extreme.high ? 'high' : 'low'}`}>
                            <circle className='tides-wave-point' cx={x} cy={y} r='8' />
                            <text className='tides-wave-value' x={x} y={Math.max(y - 16, 18)} textAnchor='middle'>{formatLevel(extreme.level)} m</text>
                            <text className='tides-wave-time' x={x} y='246' textAnchor='middle'>{formatTideTime(extreme.time, extreme.timeZone)}</text>
                        </g>
                    ))}
                    {currentTimePoint && <g className='tides-current-time-marker' aria-label={`Current time ${formatTideTime(now, timeZone)}`}>
                        <title>{`Current time ${formatTideTime(now, timeZone)}`}</title>
                        <Clock3 className='tides-current-time-icon' x={currentTimePoint.x - 14} y={-8} width='28' height='28' aria-hidden='true' />
                    </g>}
                    {getWaveChartTicks(date, timeZone).map((tick) => (
                        <g key={tick.label} className='tides-wave-tick'>
                            <line x1={tick.x} y1='220' x2={tick.x} y2='228' />
                            <text x={tick.x} y='274' textAnchor='middle'>{tick.label}</text>
                        </g>
                    ))}
                </svg>
            </div>
        </section>
    );
}

function TideCurrentPanel({ currentTide, now }: Readonly<{ currentTide: CurrentTideStatus; now: Date }>) {
    const DirectionIcon = currentTide.incoming ? WavesArrowUp : WavesArrowDown;

    return (
        <section className='tides-current-panel' aria-label='Current tide' aria-live='polite'>
            <div className='tides-current-time'>
                <Clock3 aria-hidden='true' />
                <div><span>Now</span><strong>{formatTideTime(now, currentTide.timeZone)}</strong></div>
            </div>
            <div className={`tides-current-direction ${currentTide.incoming ? 'tides-current-direction-incoming' : 'tides-current-direction-outgoing'}`}>
                <DirectionIcon aria-hidden='true' />
                <div><span>{currentTide.incoming ? 'Incoming' : 'Outgoing'}</span><strong>{formatLevel(currentTide.level)} m</strong></div>
            </div>
        </section>
    );
}

function TideStationPanel({ prediction }: Readonly<{ prediction: TidePrediction }>) {
    const { station, extremes, error } = prediction;

    return (
        <article className='tides-station-panel'>
            <header className='tides-station-header'>
                <div>
                    <h2>{station.name}</h2>
                </div>
                <p className='tides-station-distance'>{formatDistance(station.distance)}</p>
            </header>
            {error ? <p className='tides-message tides-message-error'>{error}</p> : extremes.length > 0 ? (
                <ol className='tides-extreme-list'>
                    {extremes.map((extreme) => <li key={`${station.id}-${extreme.time.toISOString()}`} className={`tides-extreme tides-extreme-${extreme.high ? 'high' : 'low'}`}>
                        {extreme.high ? <WavesArrowUp aria-hidden='true' /> : <WavesArrowDown aria-hidden='true' />}
                        <span className='tides-extreme-summary'>
                            <span className='tides-extreme-label'>{extreme.label}</span>
                            <span className='tides-extreme-level'>{formatLevel(extreme.level)} m</span>
                        </span>
                        <strong>{formatTideTime(extreme.time, station.timezone)}</strong>
                    </li>)}
                </ol>
            ) : <p className='tides-message'>No high or low tide was predicted for this date.</p>}
        </article>
    );
}

function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTideSelectedDate(value: string): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatTideTime(value: Date, timeZone: string): string {
    return new Intl.DateTimeFormat(undefined, { timeZone, hour: 'numeric', minute: '2-digit' }).format(value);
}

function formatDistance(distance: number | undefined): string {
    if (typeof distance !== 'number' || !Number.isFinite(distance)) {
        return '';
    }

    return distance < 1 ? `${Math.round(distance * 1000)} m away` : `${Math.round(distance)} km away`;
}

function sortByStationDistance(left: TidePrediction, right: TidePrediction): number {
    return getDistanceSortValue(left.station.distance) - getDistanceSortValue(right.station.distance);
}

function getDistanceSortValue(distance: number | undefined): number {
    return typeof distance === 'number' && Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY;
}

function formatLevel(level: number): string {
    return level.toFixed(2);
}

function getCurrentTideStatus(predictions: TidePrediction[], extremes: WeightedTideExtreme[], selectedDate: Date | null, now: Date): CurrentTideStatus | null {
    const timeZone = extremes[0]?.timeZone ?? predictions[0]?.station.timezone;
    if (!selectedDate || !timeZone || formatDateInput(selectedDate) !== formatDateInTimeZone(now, timeZone)) {
        return null;
    }

    const currentLevel = getWeightedTideLevel(predictions, now);
    const nextExtreme = extremes.find((extreme) => extreme.time.getTime() > now.getTime());
    if (!currentLevel || !nextExtreme) {
        return null;
    }

    return {
        ...currentLevel,
        incoming: nextExtreme.high
    };
}

type WaveChartPoint = {
    x: number;
    y: number;
    extreme: WeightedTideExtreme;
}

function getWaveChartPoints(extremes: WeightedTideExtreme[], date: Date): WaveChartPoint[] {
    const levels = extremes.map((extreme) => extreme.level);
    const minimumLevel = Math.min(...levels);
    const maximumLevel = Math.max(...levels);
    const levelPadding = Math.max((maximumLevel - minimumLevel) * 0.16, 0.1);
    const chartMinimum = minimumLevel - levelPadding;
    const chartMaximum = maximumLevel + levelPadding;
    const chartStart = new Date(date);
    chartStart.setHours(0, 0, 0, 0);
    const chartEnd = new Date(chartStart);
    chartEnd.setDate(chartEnd.getDate() + 1);
    const firstTime = chartStart.getTime();
    const lastTime = chartEnd.getTime();
    const timeRange = Math.max(lastTime - firstTime, 1);

    return extremes.map((extreme) => ({
        x: 20 + ((extreme.time.getTime() - firstTime) / timeRange) * 960,
        y: 24 + ((chartMaximum - extreme.level) / (chartMaximum - chartMinimum)) * 194,
        extreme
    }));
}

type WaveChartTick = {
    x: number;
    label: string;
}

function getWaveChartTicks(date: Date, timeZone: string): WaveChartTick[] {
    const chartStart = new Date(date);
    chartStart.setHours(0, 0, 0, 0);

    return [0, 12, 24].map((hours) => {
        const tickDate = new Date(chartStart);
        tickDate.setHours(tickDate.getHours() + hours);
        return {
            x: 20 + (hours / 24) * 960,
            label: hours === 24 ? '24:00' : formatAxisTime(tickDate, timeZone)
        };
    });
}

function formatAxisTime(value: Date, timeZone: string): string {
    return new Intl.DateTimeFormat(undefined, { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(value);
}

function getCurrentTimePoint(points: WaveChartPoint[], selectedDate: Date, timeZone: string, now: Date): { x: number; y: number } | null {
    if (formatDateInput(selectedDate) !== formatDateInTimeZone(now, timeZone)) {
        return null;
    }

    const timeParts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const hours = Number(timeParts.find((part) => part.type === 'hour')?.value ?? 0);
    const minutes = Number(timeParts.find((part) => part.type === 'minute')?.value ?? 0);
    const x = 20 + ((hours * 60 + minutes) / (24 * 60)) * 960;
    const nextIndex = points.findIndex((point) => point.x >= x);
    const previous = points[Math.max(nextIndex - 1, 0)];
    const next = points[nextIndex] ?? points.at(-1);

    if (!previous || !next || previous.x === next.x) {
        return { x, y: previous?.y ?? next?.y ?? 24 };
    }

    const progress = (x - previous.x) / (next.x - previous.x);
    return { x, y: previous.y + (next.y - previous.y) * progress };
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    return `${year}-${month}-${day}`;
}

function createSmoothPath(points: WaveChartPoint[]): string {
    return points.reduce((path, point, index) => {
        if (index === 0) {
            return `M ${point.x} ${point.y}`;
        }

        const previousPoint = points[index - 1];
        const controlX = (previousPoint.x + point.x) / 2;
        return `${path} C ${controlX} ${previousPoint.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
}