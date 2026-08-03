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
    night: '#1f2d3d',
    astronomical: '#38556b',
    nautical: '#4f8799',
    civil: '#72b4aa',
    dawn: '#f0ae64',
    morning: '#f3c96b',
    afternoon: '#d6cf8e',
    evening: '#d8835e'
};

const birdingPalette = {
    early: '#e35d4e',
    midMorning: '#e6963e',
    midday: '#d7be55',
    afternoon: '#6fa77d',
    evening: '#6889ad'
};

export function getAstronomyData(date: Date, latitude: number, longitude: number): AstronomyData {
    const sunTimes = SunCalc.getTimes(date, latitude, longitude);
    const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
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
    const midnightEnd = new Date(dayStart.getTime() + 60 * 60 * 1000);
    const middayStart = isValidDate(sunTimes.solarNoon) ? new Date(sunTimes.solarNoon.getTime() - 60 * 60 * 1000) : null;
    const middayEnd = isValidDate(sunTimes.solarNoon) ? new Date(sunTimes.solarNoon.getTime() + 60 * 60 * 1000) : null;
    const boundaries = [
        { id: 'day-start', at: dayStart },
        { id: 'midnight-end', at: midnightEnd },
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
    const morningForageEnd = daylightPoint(0.28);
    const middayStart = new Date(solarNoon.getTime() - daylightMilliseconds * 0.06);
    const middayEnd = new Date(solarNoon.getTime() + daylightMilliseconds * 0.06);
    const raptorThermalStart = morningForageEnd;
    const raptorThermalEnd = middayStart;
    const afternoonStart = middayEnd;
    const afternoonEnd = daylightPoint(0.84);
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
    let set = moonTimes.alwaysUp ? dayEnd : moonTimes.set;

    if (!isValidDate(rise) || !isValidDate(set)) {
        return null;
    }

    if (set <= rise) {
        set = new Date(set);
        set.setDate(set.getDate() + 1);
    }

    const start = rise < dayStart ? dayStart : rise;
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
        'day-start': { label: 'Midnight', description: 'The biological midnight window, centered on the darkest part of the local night.', color: twilightPalette.night },
        'midnight-end': { label: 'Night', description: 'Darkness before the astronomical dawn.', color: twilightPalette.night },
        nightEnd: { label: 'Astronomical twilight', description: 'The faintest dawn glow; the Sun is 18 to 12 degrees below the horizon.', color: twilightPalette.astronomical },
        nauticalDawn: { label: 'Nautical twilight', description: 'The horizon becomes readable and brighter stars begin to fade.', color: twilightPalette.nautical },
        dawn: { label: 'Civil twilight', description: 'Enough natural light for most outdoor activity before the Sun appears.', color: twilightPalette.civil },
        sunrise: { label: 'Dawn chorus', description: 'Sunrise and the strong early-morning song and feeding period for many birds.', color: twilightPalette.dawn },
        goldenHourEnd: { label: 'Morning light', description: 'Soft, low-angle light after the morning golden hour.', color: twilightPalette.morning },
        'midday-start': { label: 'Midday light', description: 'The bright approach to solar noon, when the Sun is highest in the sky.', color: twilightPalette.morning },
        'midday-end': { label: 'Afternoon light', description: 'The broad afternoon interval after solar noon, when activity gradually shifts toward evening.', color: twilightPalette.afternoon },
        goldenHour: { label: 'Evening golden hour', description: 'Warm, low-angle light before sunset; a useful time for open-country movement.', color: twilightPalette.evening },
        sunset: { label: 'Civil twilight', description: 'The post-sunset glow while the landscape remains naturally lit.', color: twilightPalette.civil },
        dusk: { label: 'Nautical twilight', description: 'The horizon fades and the first stars become prominent.', color: twilightPalette.nautical },
        nauticalDusk: { label: 'Astronomical twilight', description: 'The final fading light before astronomical night.', color: twilightPalette.astronomical },
        night: { label: 'Night', description: 'Astronomical night, with the Sun more than 18 degrees below the horizon.', color: twilightPalette.night }
    };

    return definitions[id] ?? null;
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
