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
    return value && isValidDateInput(value) ? value : null;
}

export function isValidDateInput(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function getSelectedDate(value: string): Date {
    const date = value ? new Date(`${value}T12:00:00`) : new Date();
    return isValidDate(date) ? date : new Date();
}

function isValidDate(value: Date): boolean {
    return !Number.isNaN(value.getTime());
}