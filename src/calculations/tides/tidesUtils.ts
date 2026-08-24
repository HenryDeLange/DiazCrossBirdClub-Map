import { isValidDateInput } from '../components/dateLocationUtils';
import { getWeightedTideLevel, type TidePrediction, type WeightedTideExtreme } from './tideData';
import type { CurrentTideStatus, WaveChartPoint, WaveChartTick } from './tidesTypes';

const CHART_LEFT = 20;
const CHART_WIDTH = 960;
const CHART_HEIGHT = 194;
const CHART_TOP = 24;
const MINUTES_PER_DAY = 24 * 60;

export function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getTideSelectedDate(value: string): Date | null {
    if (!isValidDateInput(value)) {
        return null;
    }

    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTideTime(value: Date, timeZone: string): string {
    return new Intl.DateTimeFormat(undefined, { timeZone, hour: 'numeric', minute: '2-digit' }).format(value);
}

export function formatDistance(distance: number | undefined): string {
    if (typeof distance !== 'number' || !Number.isFinite(distance)) {
        return '';
    }

    return distance < 1 ? `${Math.round(distance * 1000)} m away` : `${Math.round(distance)} km away`;
}

export function sortByStationDistance(left: TidePrediction, right: TidePrediction): number {
    return getDistanceSortValue(left.station.distance) - getDistanceSortValue(right.station.distance);
}

export function formatLevel(level: number): string {
    return level.toFixed(2);
}

export function getCurrentTideStatus(predictions: TidePrediction[], extremes: WeightedTideExtreme[], selectedDate: Date | null, now: Date): CurrentTideStatus | null {
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
        incoming: nextExtreme.high,
        nextTide: nextExtreme
    };
}

export function getWaveChartPoints(extremes: WeightedTideExtreme[], date: Date): WaveChartPoint[] {
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
        x: CHART_LEFT + ((extreme.time.getTime() - firstTime) / timeRange) * CHART_WIDTH,
        y: CHART_TOP + ((chartMaximum - extreme.level) / (chartMaximum - chartMinimum)) * CHART_HEIGHT,
        extreme
    }));
}

export function getWaveChartTicks(date: Date, timeZone: string): WaveChartTick[] {
    const chartStart = new Date(date);
    chartStart.setHours(0, 0, 0, 0);

    return [0, 12, 24].map((hours) => {
        const tickDate = new Date(chartStart);
        tickDate.setHours(tickDate.getHours() + hours);
        return {
            x: CHART_LEFT + (hours / 24) * CHART_WIDTH,
            label: hours === 24 ? '24:00' : formatAxisTime(tickDate, timeZone)
        };
    });
}

export function getCurrentTimePoint(points: WaveChartPoint[], selectedDate: Date, timeZone: string, now: Date): { x: number; y: number } | null {
    if (formatDateInput(selectedDate) !== formatDateInTimeZone(now, timeZone)) {
        return null;
    }

    const timeParts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const hours = Number(timeParts.find((part) => part.type === 'hour')?.value ?? 0);
    const minutes = Number(timeParts.find((part) => part.type === 'minute')?.value ?? 0);
    const x = CHART_LEFT + ((hours * 60 + minutes) / MINUTES_PER_DAY) * CHART_WIDTH;
    const nextIndex = points.findIndex((point) => point.x >= x);
    const previous = points[Math.max(nextIndex - 1, 0)];
    const next = points[nextIndex] ?? points.at(-1);

    if (!previous || !next || previous.x === next.x) {
        return { x, y: previous?.y ?? next?.y ?? CHART_TOP };
    }

    const progress = (x - previous.x) / (next.x - previous.x);
    return { x, y: previous.y + (next.y - previous.y) * progress };
}

export function createSmoothPath(points: WaveChartPoint[]): string {
    return points.reduce((path, point, index) => {
        if (index === 0) {
            return `M ${point.x} ${point.y}`;
        }

        const previousPoint = points[index - 1];
        const controlX = (previousPoint.x + point.x) / 2;
        return `${path} C ${controlX} ${previousPoint.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
}

function getDistanceSortValue(distance: number | undefined): number {
    return typeof distance === 'number' && Number.isFinite(distance) ? distance : Number.POSITIVE_INFINITY;
}

function formatAxisTime(value: Date, timeZone: string): string {
    return new Intl.DateTimeFormat(undefined, { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(value);
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    return `${year}-${month}-${day}`;
}