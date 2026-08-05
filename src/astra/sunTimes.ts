import * as SunCalc from 'suncalc';

export type TimelineSegment = {
    id: string;
    label: string;
    description: string;
    start: Date;
    end: Date;
    startMinutes: number;
    endMinutes: number;
    color: string;
}

export type AstronomyData = {
    sunTimes: SunCalc.SunTimes;
    moonTimes: SunCalc.MoonTimes;
    moonIllumination: SunCalc.MoonIllumination;
    twilightSegments: TimelineSegment[];
    birdingSegments: TimelineSegment[];
    moonSegment: TimelineSegment | null;
    date: Date;
    latitude: number;
    longitude: number;
}

const twilightPalette = {
    night: 'var(--astra-night)',
    astronomical: '#38556b',
    nautical: '#4f8799',
    civil: '#6faeaa',
    dawn: '#e8a24b',
    morning: '#f3cf72',
    midday: '#f4e3a1',
    afternoon: '#d9a06b',
    evening: '#d96b4d'
};

const birdingPalette = {
    early: '#809f59',
    midMorning: '#719b61',
    midday: '#63966b',
    afternoon: '#548d75',
    evening: '#447f7f'
};

export function getAstronomyData(date: Date, latitude: number, longitude: number): AstronomyData {
    const sunTimes = SunCalc.getTimes(date, latitude, longitude);
    const moonTimes = getMoonTimesForCurrentRise(date, latitude, longitude);
    const moonIllumination = SunCalc.getMoonIllumination(date);

    return {
        sunTimes,
        moonTimes,
        moonIllumination,
        twilightSegments: buildTwilightSegments(date, sunTimes),
        birdingSegments: buildBirdingSegments(date, sunTimes),
        moonSegment: buildMoonSegment(date, moonTimes),
        date,
        latitude,
        longitude
    };
}

function buildTwilightSegments(date: Date, sunTimes: SunCalc.SunTimes): TimelineSegment[] {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const midnightWindow = getMidnightWindow(dayStart, dayEnd, sunTimes.nadir, sunTimes.nightEnd);
    const middayStart = getDayPercentageBoundary(sunTimes.sunrise, sunTimes.solarNoon, sunTimes.sunset, -0.08);
    const middayEnd = getDayPercentageBoundary(sunTimes.sunrise, sunTimes.solarNoon, sunTimes.sunset, 0.08);
    const boundaries = [
        { id: 'day-start', at: dayStart },
        { id: 'midnight-start', at: midnightWindow?.start ?? null },
        { id: 'midnight-end', at: midnightWindow?.end ?? null },
        { id: 'nightEnd', at: sunTimes.nightEnd },
        { id: 'nauticalDawn', at: sunTimes.nauticalDawn },
        { id: 'dawn', at: sunTimes.dawn },
        { id: 'sunrise', at: sunTimes.sunrise },
        { id: 'goldenHourEnd', at: sunTimes.goldenHourEnd },
        { id: 'midday-start', at: middayStart },
        { id: 'midday-end', at: middayEnd },
        { id: 'goldenHour', at: sunTimes.goldenHour },
        { id: 'sunset', at: sunTimes.sunset },
        { id: 'dusk', at: sunTimes.dusk },
        { id: 'nauticalDusk', at: sunTimes.nauticalDusk },
        { id: 'night', at: sunTimes.night },
        { id: 'day-end', at: dayEnd }
    ]
        .filter((boundary): boundary is { id: string; at: Date } => isValidDate(boundary.at))
        .filter(({ at }) => at >= dayStart && at <= dayEnd)
        .sort((first, second) => first.at.getTime() - second.at.getTime());

    return boundaries.slice(0, -1).flatMap((boundary, index) => {
        const nextBoundary = boundaries[index + 1];
        const definition = getTwilightDefinition(boundary.id);

        if (!nextBoundary || !definition || nextBoundary.at <= boundary.at) {
            return [];
        }

        return [createSegment(
            `${boundary.id}-${index}`,
            definition.label,
            definition.description,
            boundary.at,
            nextBoundary.at,
            definition.color
        )];
    });
}

function buildBirdingSegments(date: Date, sunTimes: SunCalc.SunTimes): TimelineSegment[] {
    const sunrise = sunTimes.sunrise;
    const solarNoon = sunTimes.solarNoon;
    const sunset = sunTimes.sunset;

    if (!isValidDate(sunrise) || !isValidDate(solarNoon) || !isValidDate(sunset)) {
        return [];
    }

    const daylightMilliseconds = Math.max(sunset.getTime() - sunrise.getTime(), 60 * 60 * 1000);
    const daylightPoint = (fraction: number) => new Date(sunrise.getTime() + daylightMilliseconds * fraction);
    const morningCallStart = isValidDate(sunTimes.dawn) ? sunTimes.dawn : sunrise;
    const morningCallEnd = daylightPoint(0.12);
    const morningForageStart = morningCallEnd;
    const morningForageEnd = daylightPoint(0.22);
    const middayStart = new Date(solarNoon.getTime() - daylightMilliseconds * 0.06);
    const middayEnd = new Date(solarNoon.getTime() + daylightMilliseconds * 0.06);
    const raptorThermalStart = daylightPoint(0.30);
    const raptorThermalEnd = middayStart;
    const afternoonStart = new Date(solarNoon.getTime() + daylightMilliseconds * 0.16);
    const afternoonEnd = daylightPoint(0.94);
    const eveningDustStart = sunset;
    const eveningDustEnd = isValidDate(sunTimes.dusk) ? sunTimes.dusk : new Date(sunset.getTime() + daylightMilliseconds * 0.08);
    const definitions = [
        {
            id: 'morning-call', label: 'Morning bird call', description: 'The dawn chorus and first feeding burst, often the most active period for songbirds.', start: morningCallStart, end: morningCallEnd, color: birdingPalette.early
        },
        {
            id: 'morning-forage', label: 'Morning forage', description: 'A focused feeding window as birds move between cover and food before the heat builds.', start: morningForageStart, end: morningForageEnd, color: birdingPalette.midMorning
        },
        {
            id: 'raptor-thermals', label: 'Raptor thermals', description: 'Late-morning warming creates thermals that raptors use to begin soaring and searching for prey.', start: raptorThermalStart, end: raptorThermalEnd, color: birdingPalette.midday
        },
        {
            id: 'midday-bath', label: 'Midday bird bath', description: 'The warmer, quieter interval around solar noon when water, shade and bathing spots can be more productive.', start: middayStart, end: middayEnd, color: birdingPalette.midday
        },
        {
            id: 'afternoon-movement', label: 'Late-day movement', description: 'Activity builds again as temperatures ease and birds move toward evening feeding and roosting areas.', start: afternoonStart, end: afternoonEnd, color: birdingPalette.afternoon
        },
        {
            id: 'evening-dust', label: 'Evening dust', description: 'The dusk transition, when the last daylight movement overlaps with the first activity of owls.', start: eveningDustStart, end: eveningDustEnd, color: birdingPalette.evening
        }
    ];

    return definitions
        .filter(({ start, end }) => end > start && end > new Date(date.getFullYear(), date.getMonth(), date.getDate()) && start < new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))
        .map(({ id, label, description, start, end, color }) => createSegment(id, label, description, start, end, color));
}

function buildMoonSegment(date: Date, moonTimes: SunCalc.MoonTimes): TimelineSegment | null {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    if (moonTimes.alwaysDown) {
        return null;
    }

    const rise = moonTimes.alwaysUp ? dayStart : moonTimes.rise;
    const set = moonTimes.alwaysUp ? dayEnd : moonTimes.set;

    if (!isValidDate(rise) || !isValidDate(set)) {
        return null;
    }

    const start = rise;
    const end = set;

    if (end <= start) {
        return null;
    }

    return createSegment(
        'moonlight',
        'Moonlight',
        'The Moon is above the horizon during this interval; nocturnal species may be easier to hear or observe.',
        start,
        end,
        '#8997a8'
    );
}

function getTwilightDefinition(id: string): { label: string; description: string; color: string } | null {
    const definitions: Record<string, { label: string; description: string; color: string }> = {
        'day-start': { label: 'Night', description: 'Night before the solar-midnight division.', color: twilightPalette.night },
        'midnight-start': { label: 'Midnight', description: 'A central night window around local solar midnight, sized in proportion to the night.', color: twilightPalette.night },
        'midnight-end': { label: 'Night', description: 'The darkest part of the night after the solar-midnight division.', color: twilightPalette.night },
        nightEnd: { label: 'Astronomical twilight', description: 'The faintest dawn glow; the Sun is 18 to 12 degrees below the horizon.', color: twilightPalette.astronomical },
        nauticalDawn: { label: 'Nautical twilight', description: 'The horizon becomes readable and brighter stars begin to fade.', color: twilightPalette.nautical },
        dawn: { label: 'Civil twilight', description: 'The Sun is between 6 degrees below the horizon and sunrise.', color: twilightPalette.civil },
        sunrise: { label: 'Morning golden hour', description: 'Low-angle light from sunrise until the Sun reaches 6 degrees above the horizon; duration varies with latitude and season.', color: twilightPalette.dawn },
        goldenHourEnd: { label: 'Morning daylight', description: 'Daylight after the morning golden hour and before the proportional midday window.', color: twilightPalette.morning },
        'midday-start': { label: 'Midday', description: 'The central daylight window around solar noon, sized as a proportion of the day length.', color: twilightPalette.midday },
        'midday-end': { label: 'Afternoon daylight', description: 'Daylight after the proportional midday window and before the evening golden hour.', color: twilightPalette.afternoon },
        goldenHour: { label: 'Evening golden hour', description: 'Low-angle light from the Sun reaching 6 degrees above the horizon until sunset; duration varies with latitude and season.', color: twilightPalette.evening },
        sunset: { label: 'Civil twilight', description: 'The post-sunset interval while the Sun is between sunset and 6 degrees below the horizon.', color: twilightPalette.civil },
        dusk: { label: 'Nautical twilight', description: 'The horizon fades and the first stars become prominent.', color: twilightPalette.nautical },
        nauticalDusk: { label: 'Astronomical twilight', description: 'The final fading light before astronomical night.', color: twilightPalette.astronomical },
        night: { label: 'Night', description: 'Astronomical night, with the Sun more than 18 degrees below the horizon.', color: twilightPalette.night }
    };

    return definitions[id] ?? null;
}

function getMoonTimesForCurrentRise(date: Date, latitude: number, longitude: number): SunCalc.MoonTimes {
    const currentTimes = SunCalc.getMoonTimes(date, latitude, longitude);

    if (currentTimes.alwaysUp || currentTimes.alwaysDown) {
        return currentTimes;
    }

    const rise = isDateOnSelectedDay(currentTimes.rise, date) ? currentTimes.rise : undefined;
    if (!rise) {
        return { rise: undefined, set: undefined };
    }

    let set = isValidDate(currentTimes.set) && currentTimes.set > rise ? currentTimes.set : undefined;
    if (!set) {
        const followingDate = new Date(date);
        followingDate.setDate(followingDate.getDate() + 1);
        const followingTimes = SunCalc.getMoonTimes(followingDate, latitude, longitude);
        set = isValidDate(followingTimes.set) && followingTimes.set > rise ? followingTimes.set : undefined;
    }

    return { rise, set };
}

function isDateOnSelectedDay(value: Date | undefined, selectedDate: Date): value is Date {
    return isValidDate(value)
        && value.getFullYear() === selectedDate.getFullYear()
        && value.getMonth() === selectedDate.getMonth()
        && value.getDate() === selectedDate.getDate();
}

function getMidnightWindow(dayStart: Date, dayEnd: Date, nadir: Date | null | undefined, nightEnd: Date | null | undefined): { start: Date; end: Date } | null {
    const center = isValidDate(nadir) && nadir >= dayStart && nadir <= dayEnd ? nadir : dayStart;
    const halfWindow = isValidDate(nightEnd) && nightEnd > center
        ? (nightEnd.getTime() - center.getTime()) * 0.15
        : 60 * 60 * 1000;
    const start = new Date(Math.max(dayStart.getTime(), center.getTime() - halfWindow));
    const end = new Date(Math.min(dayEnd.getTime(), center.getTime() + halfWindow));

    return end > start ? { start, end } : null;
}

function getDayPercentageBoundary(sunrise: Date | null | undefined, solarNoon: Date | null | undefined, sunset: Date | null | undefined, fractionFromNoon: number): Date | null {
    if (!isValidDate(sunrise) || !isValidDate(solarNoon) || !isValidDate(sunset)) {
        return null;
    }

    return new Date(solarNoon.getTime() + (sunset.getTime() - sunrise.getTime()) * fractionFromNoon);
}

function createSegment(id: string, label: string, description: string, start: Date, end: Date, color: string): TimelineSegment {
    return {
        id,
        label,
        description,
        start,
        end,
        startMinutes: minutesSinceMidnight(start),
        endMinutes: minutesOnTimeline(end, start),
        color
    };
}

function minutesOnTimeline(date: Date, timelineStart: Date): number {
    const startDay = Date.UTC(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());
    const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOffset = Math.round((dateDay - startDay) / 86400000);
    return minutesSinceMidnight(date) + dayOffset * 1440;
}

function minutesSinceMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function isValidDate(value: Date | null | undefined): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

export function formatTime(value: Date | null | undefined): string {
    if (!isValidDate(value)) {
        return 'Not visible';
    }

    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(value);
}

export function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function describeMoonPhase(phase: number): string {
    if (phase < 0.0625 || phase >= 0.9375) return 'New moon';
    if (phase < 0.1875) return 'Waxing crescent';
    if (phase < 0.3125) return 'First quarter';
    if (phase < 0.4375) return 'Waxing gibbous';
    if (phase < 0.5625) return 'Full moon';
    if (phase < 0.6875) return 'Waning gibbous';
    if (phase < 0.8125) return 'Last quarter';
    return 'Waning crescent';
}
