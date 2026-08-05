import { Clock3, Map, WavesArrowDown, WavesArrowUp, WavesHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateLocationControls } from '../inputfields/DateLocationControls';
import { getQueryCoordinates, getQueryDate, getSelectedDate, type Coordinates } from '../inputfields/dateLocationUtils';
import { getBasePathname } from '../map/locationUtils';
import { fetchTideStations, getTidePredictions, getWeightedTideExtremes, type TidePrediction, type TideStation, type WeightedTideExtreme } from './tideData';
import './tides.css';

type TidesPageProps = {
    embedded?: boolean;
}

type StationState = {
    status: 'loading' | 'success' | 'error';
    stations: TideStation[];
    message?: string;
}

const defaultCoordinates: Coordinates = {
    latitude: -33.64013503503463,
    longitude: 26.724985724190617
};

export default function TidesPage({ embedded = false }: Readonly<TidesPageProps>) {
    const queryCoordinates = embedded ? null : getQueryCoordinates();
    const queryDate = embedded ? null : getQueryDate();
    const startingCoordinates = queryCoordinates ?? defaultCoordinates;
    const shouldRequestLocation = queryCoordinates === null && typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
    const [coordinates, setCoordinates] = useState<Coordinates>(startingCoordinates);
    const [dateValue, setDateValue] = useState(queryDate ?? formatDateInput(new Date()));
    const [stationState, setStationState] = useState<StationState>({ status: 'loading', stations: [] });
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const controller = new AbortController();
        setStationState({ status: 'loading', stations: [] });

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
    }, [coordinates]);

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(intervalId);
    }, []);

    const selectedDate = getSelectedDate(dateValue);
    const predictions = stationState.status === 'success'
        ? getTidePredictions(stationState.stations, selectedDate).sort(sortByStationDistance)
        : [];
    const weightedExtremes = getWeightedTideExtremes(predictions);

    return (
        <main className={`tides-page ${embedded ? 'tides-page-embedded' : ''}`}>
            <div className='tides-shell'>
                <header className='tides-header'>
                    <div className='tides-toolbar'>
                        <DateLocationControls dateValue={dateValue} onDateChange={setDateValue} coordinates={coordinates} onCoordinatesChange={setCoordinates} coordinatePrecision={1} requestLocationOnMount={shouldRequestLocation} idPrefix='tides' />
                        {!embedded && <a className='tides-map-link' href={getBasePathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>}
                    </div>
                </header>

                <section className='tides-dashboard'>
                    {stationState.status === 'loading' && <p className='tides-message' role='status' aria-live='polite'>Loading nearby stations...</p>}
                    {stationState.status === 'error' && <p className='tides-message tides-message-error' role='alert'>{stationState.message}</p>}
                    {stationState.status === 'success' && <div className='tides-results'>
                        <div className='tides-wave-column'>
                            {weightedExtremes.length > 0 && <TideWaveGraphic extremes={weightedExtremes} date={selectedDate} now={now} />}
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
                        <Clock3 className='tides-current-time-icon' x={currentTimePoint.x - 8} y={Math.max(currentTimePoint.y - 26, 2)} width='16' height='16' aria-hidden='true' />
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