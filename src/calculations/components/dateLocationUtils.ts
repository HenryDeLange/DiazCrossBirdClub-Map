export type Coordinates = {
    latitude: number;
    longitude: number;
}

export function roundCoordinate(value: number, precision: number): number {
    const multiplier = 10 ** precision;
    return Math.round(value * multiplier) / multiplier;
}

export function formatCoordinate(value: number, precision: number): string {
    return roundCoordinate(value, precision).toFixed(precision);
}

export function getQueryCoordinates(): Coordinates | null {
    const params = new URLSearchParams(window.location.search);
    const latitudeValue = params.get('lat');
    const longitudeValue = params.get('lng');

    if (latitudeValue === null || longitudeValue === null) {
        return null;
    }

    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? { latitude, longitude } : null;
}

export function getQueryDate(): string | null {
    const value = new URLSearchParams(window.location.search).get('date');
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) ? value : null;
}

export function getSelectedDate(value: string): Date {
    const date = value ? new Date(`${value}T12:00:00`) : new Date();
    return isValidDate(date) ? date : new Date();
}

function isValidDate(value: Date): boolean {
    return !Number.isNaN(value.getTime());
}