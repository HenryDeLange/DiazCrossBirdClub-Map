import { Moon, MoonStar, Sun } from 'lucide-react';
import type { SkyEvent } from './astraTypes';
import { formatMoonTime, isValidDate, minutesOnTimeline, minutesSinceMidnight } from './astraUtils';
import { formatTime, type AstronomyData } from './sunTimes';

export function buildSkyEvents(astronomy: AstronomyData): SkyEvent[] {
    const twilightEvents: SkyEvent[] = astronomy.twilightSegments.map((segment) => ({
        id: `twilight-${segment.id}`,
        label: segment.label,
        value: formatTime(segment.start),
        icon: segment.label === 'Night' || segment.label === 'Midnight' ? <MoonStar size={16} aria-hidden='true' /> : <Sun size={16} aria-hidden='true' />,
        color: segment.color,
        segment,
        minutes: segment.startMinutes
    }));
    const sunEvents: SkyEvent[] = [
        { id: 'sunrise', label: 'Sunrise', value: formatTime(astronomy.sunTimes.sunrise), time: astronomy.sunTimes.sunrise, icon: <Sun size={15} aria-hidden='true' /> },
        { id: 'solar-noon', label: 'Solar noon', value: formatTime(astronomy.sunTimes.solarNoon), time: astronomy.sunTimes.solarNoon, icon: <Sun size={15} aria-hidden='true' /> },
        { id: 'sunset', label: 'Sunset', value: formatTime(astronomy.sunTimes.sunset), time: astronomy.sunTimes.sunset, icon: <Sun size={15} aria-hidden='true' /> }
    ].map((event) => ({
        ...event,
        color: '#e6a63f',
        segment: null,
        markerId: event.id,
        minutes: isValidDate(event.time) ? minutesSinceMidnight(event.time) : 2000
    }));
    const moonEvents: SkyEvent[] = [
        {
            id: 'moonrise',
            label: 'Moonrise',
            value: formatMoonTime(astronomy.moonTimes.rise, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown),
            time: astronomy.moonTimes.rise,
            icon: <Moon size={15} aria-hidden='true' />,
            segment: null,
            markerId: 'moonrise'
        },
        {
            id: 'moonset',
            label: 'Moonset',
            value: formatMoonTime(astronomy.moonTimes.set, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown),
            time: astronomy.moonTimes.set,
            icon: <Moon size={15} aria-hidden='true' />,
            segment: null,
            markerId: 'moonset'
        }
    ].map((event) => ({
        ...event,
        color: '#718aa6',
        minutes: isValidDate(event.time) ? minutesOnTimeline(event.time, astronomy.date) : 2100
    }));

    return [...twilightEvents, ...sunEvents, ...moonEvents].sort((first, second) => first.minutes - second.minutes);
}