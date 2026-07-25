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
    date: Date;
    latitude: number;
    longitude: number;
}

const twilightPalette = {
    night: '#152331',
    astronomical: '#304a62',
    nautical: '#44778d',
    civil: '#73a9a4',
    dawn: '#e9a85f',
    morning: '#efc36e',
    afternoon: '#e8d494',
    evening: '#d9895e'
};

const birdingPalette = {
    early: '#d96b4d',
    midMorning: '#e5a34f',
    midday: '#f0d478',
    afternoon: '#91b878',
    evening: '#6d8faa'
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
        date,
        latitude,
        longitude
    };
}

function buildTwilightSegments(date: Date, sunTimes: SunCalc.SunTimes): TimelineSegment[] {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const boundaries = [
        { id: 'day-start', at: dayStart },
        { id: 'nightEnd', at: sunTimes.nightEnd },
        { id: 'nauticalDawn', at: sunTimes.nauticalDawn },
        { id: 'dawn', at: sunTimes.dawn },
        { id: 'sunrise', at: sunTimes.sunrise },
        { id: 'goldenHourEnd', at: sunTimes.goldenHourEnd },
        { id: 'solarNoon', at: sunTimes.solarNoon },
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

    const earlyMorningEnd = new Date(sunrise.getTime() + 2 * 60 * 60 * 1000);
    const middayStart = new Date(solarNoon.getTime() - 30 * 60 * 1000);
    const middayEnd = new Date(solarNoon.getTime() + 30 * 60 * 1000);
    const eveningStart = isValidDate(sunTimes.goldenHour) ? sunTimes.goldenHour : new Date(sunset.getTime() - 60 * 60 * 1000);
    const definitions = [
        {
            id: 'early-morning', label: 'Early morning', description: 'Dawn chorus and the first feeding burst, often the most active period for songbirds.', start: sunrise, end: earlyMorningEnd, color: birdingPalette.early
        },
        {
            id: 'mid-morning', label: 'Mid-morning', description: 'A productive search window as birds move between feeding and cover before the heat builds.', start: earlyMorningEnd, end: new Date(middayStart), color: birdingPalette.midMorning
        },
        {
            id: 'midday', label: 'Midday', description: 'Solar noon and the quieter roosting interval; watch water, shade and soaring species.', start: middayStart, end: middayEnd, color: birdingPalette.midday
        },
        {
            id: 'afternoon', label: 'Afternoon', description: 'Activity gradually returns as temperatures ease and birds begin moving toward evening roosts.', start: middayEnd, end: eveningStart, color: birdingPalette.afternoon
        },
        {
            id: 'evening', label: 'Evening', description: 'The last feeding movement and evening song before sunset and the return to cover.', start: eveningStart, end: sunset, color: birdingPalette.evening
        }
    ];

    return definitions
        .filter(({ start, end }) => end > start && end > new Date(date.getFullYear(), date.getMonth(), date.getDate()) && start < new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))
        .map(({ id, label, description, start, end, color }) => createSegment(id, label, description, start, end, color));
}

function getTwilightDefinition(id: string): { label: string; description: string; color: string } | null {
    const definitions: Record<string, { label: string; description: string; color: string }> = {
        'day-start': { label: 'Night', description: 'Darkness before the astronomical dawn.', color: twilightPalette.night },
        nightEnd: { label: 'Astronomical twilight', description: 'The faintest dawn glow; the Sun is 18 to 12 degrees below the horizon.', color: twilightPalette.astronomical },
        nauticalDawn: { label: 'Nautical twilight', description: 'The horizon becomes readable and brighter stars begin to fade.', color: twilightPalette.nautical },
        dawn: { label: 'Civil twilight', description: 'Enough natural light for most outdoor activity before the Sun appears.', color: twilightPalette.civil },
        sunrise: { label: 'Dawn chorus', description: 'Sunrise and the strong early-morning song and feeding period for many birds.', color: twilightPalette.dawn },
        goldenHourEnd: { label: 'Morning light', description: 'Soft, low-angle light after the morning golden hour.', color: twilightPalette.morning },
        solarNoon: { label: 'Afternoon light', description: 'The broad afternoon interval after solar noon, when activity gradually shifts toward evening.', color: twilightPalette.afternoon },
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
        endMinutes: minutesSinceMidnight(end),
        color
    };
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
    if (phase < 0.0625 || phase >= 0.9375) return 'New Moon';
    if (phase < 0.1875) return 'Waxing Crescent';
    if (phase < 0.3125) return 'First Quarter';
    if (phase < 0.4375) return 'Waxing Gibbous';
    if (phase < 0.5625) return 'Full Moon';
    if (phase < 0.6875) return 'Waning Gibbous';
    if (phase < 0.8125) return 'Last Quarter';
    return 'Waning Crescent';
}
