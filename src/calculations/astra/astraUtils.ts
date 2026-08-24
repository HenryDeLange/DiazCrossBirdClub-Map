import { isValidDateInput } from '../components/dateLocationUtils';
import { formatTime, type TimelineSegment } from './sunTimes';

const MINUTES_PER_DAY = 1440;
const MILLISECONDS_PER_DAY = 86400000;

export function annularSectorPath(startMinutes: number, endMinutes: number, innerRadius: number, outerRadius: number): string {
    const startOuter = polarPoint(startMinutes, outerRadius);
    const endOuter = polarPoint(endMinutes, outerRadius);
    const endInner = polarPoint(endMinutes, innerRadius);
    const startInner = polarPoint(startMinutes, innerRadius);
    const largeArc = endMinutes - startMinutes > 720 ? 1 : 0;
    return `M ${startOuter.x} ${startOuter.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} L ${endInner.x} ${endInner.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y} Z`;
}

export function ringArcPath(startMinutes: number, endMinutes: number, radius: number): string {
    const start = polarPoint(startMinutes, radius);
    const end = polarPoint(endMinutes, radius);
    const largeArc = endMinutes - startMinutes > 720 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function polarPoint(minutes: number, radius: number): { x: number; y: number } {
    const angle = (minutes / MINUTES_PER_DAY) * Math.PI * 2 - Math.PI / 2;
    return { x: 160 + Math.cos(angle) * radius, y: 160 + Math.sin(angle) * radius };
}

export function minutesSinceMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const remainingMinutes = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
}

export function formatDuration(milliseconds: number): string {
    const minutes = Math.round(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`;
}

export function formatMoonTime(value: Date | undefined, alwaysUp?: boolean, alwaysDown?: boolean): string {
    if (alwaysUp) return 'Always above';
    if (alwaysDown) return 'Below horizon';
    return formatTime(value);
}

export function isValidDate(value: Date | null | undefined): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

export function getSolarMidnightMinutes(solarNoon: Date | null | undefined): number {
    return isValidDate(solarNoon) ? (minutesSinceMidnight(solarNoon) + 720) % MINUTES_PER_DAY : 0;
}

export function orderSegmentsForSelection(segments: TimelineSegment[], selectedSegmentId?: string | null): TimelineSegment[] {
    return [...segments].sort((first, second) => Number(first.id === selectedSegmentId) - Number(second.id === selectedSegmentId));
}

export function formatCurrentDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export function getSelectedDate(value: string): Date | null {
    if (!isValidDateInput(value)) {
        return null;
    }

    const date = new Date(`${value}T12:00:00`);
    return isValidDate(date) ? date : null;
}

export function minutesOnTimeline(date: Date, timelineStart: Date): number {
    const startDay = Date.UTC(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());
    const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOffset = Math.round((dateDay - startDay) / MILLISECONDS_PER_DAY);
    return minutesSinceMidnight(date) + dayOffset * MINUTES_PER_DAY;
}