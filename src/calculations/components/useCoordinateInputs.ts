import { useCallback, useEffect, useState } from 'react';
import { formatCoordinate, isValidDateInput, roundCoordinate, type Coordinates } from './dateLocationUtils';

export type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

type UseCoordinateInputsOptions = {
    dateValue: string;
    coordinates: Coordinates;
    onCoordinatesChange: (coordinates: Coordinates) => void;
    coordinatePrecision: number;
    requestLocationOnMount: boolean;
    onInputValidityChange?: (isValid: boolean) => void;
}

type CoordinateInputsState = {
    latitudeInput: string;
    longitudeInput: string;
    locationStatus: LocationStatus;
    handleCoordinateInput: (kind: keyof Coordinates, value: string) => void;
    normalizeCoordinateInput: (kind: keyof Coordinates) => void;
    requestCurrentLocation: () => void;
}

const decimalInputPattern = /^-?\d*(?:\.\d*)?$/;

export function useCoordinateInputs({ dateValue, coordinates, onCoordinatesChange, coordinatePrecision, requestLocationOnMount, onInputValidityChange }: Readonly<UseCoordinateInputsOptions>): CoordinateInputsState {
    const [latitudeInput, setLatitudeInput] = useState(formatCoordinate(coordinates.latitude, coordinatePrecision));
    const [longitudeInput, setLongitudeInput] = useState(formatCoordinate(coordinates.longitude, coordinatePrecision));
    const [locationStatus, setLocationStatus] = useState<LocationStatus>(requestLocationOnMount ? 'loading' : 'idle');

    const updateLocationInputs = useCallback((nextCoordinates: Coordinates) => {
        onCoordinatesChange(nextCoordinates);
        setLatitudeInput(formatCoordinate(nextCoordinates.latitude, coordinatePrecision));
        setLongitudeInput(formatCoordinate(nextCoordinates.longitude, coordinatePrecision));
    }, [coordinatePrecision, onCoordinatesChange]);

    useEffect(() => {
        if (!requestLocationOnMount) {
            return;
        }

        requestGeolocation(coordinatePrecision,
            (nextCoordinates) => {
                updateLocationInputs(nextCoordinates);
                setLocationStatus('success');
            },
            () => {
                setLocationStatus('error');
            }
        );
    }, [coordinatePrecision, requestLocationOnMount, updateLocationInputs]);

    useEffect(() => {
        if (locationStatus === 'idle' || locationStatus === 'loading') {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setLocationStatus('idle');
        }, locationStatus === 'success' ? 1900 : 2600);

        return () => window.clearTimeout(timeoutId);
    }, [locationStatus]);

    useEffect(() => {
        const hasValidLatitude = isValidCoordinateInput(latitudeInput, 'latitude');
        const hasValidLongitude = isValidCoordinateInput(longitudeInput, 'longitude');
        onInputValidityChange?.(isValidDateInput(dateValue) && hasValidLatitude && hasValidLongitude);
    }, [dateValue, latitudeInput, longitudeInput, onInputValidityChange]);

    const handleCoordinateInput = useCallback((kind: keyof Coordinates, value: string) => {
        if (!decimalInputPattern.test(value)) {
            return;
        }

        if (kind === 'latitude') {
            setLatitudeInput(value);
        }
        else {
            setLongitudeInput(value);
        }

        const nextLatitude = kind === 'latitude' ? value : latitudeInput;
        const nextLongitude = kind === 'longitude' ? value : longitudeInput;
        onInputValidityChange?.(isValidDateInput(dateValue) && isValidCoordinateInput(nextLatitude, 'latitude') && isValidCoordinateInput(nextLongitude, 'longitude'));

        if (isIncompleteCoordinateInput(value)) {
            return;
        }

        const numericValue = Number(value);
        const isInRange = kind === 'latitude'
            ? numericValue >= -90 && numericValue <= 90
            : numericValue >= -180 && numericValue <= 180;

        if (Number.isFinite(numericValue) && isInRange) {
            onCoordinatesChange({ ...coordinates, [kind]: roundCoordinate(numericValue, coordinatePrecision) });
        }
    }, [coordinates, coordinatePrecision, dateValue, latitudeInput, longitudeInput, onCoordinatesChange, onInputValidityChange]);

    const normalizeCoordinateInput = useCallback((kind: keyof Coordinates) => {
        const value = kind === 'latitude' ? latitudeInput : longitudeInput;

        if (isIncompleteCoordinateInput(value)) {
            return;
        }

        const numericValue = Number(value);
        const isInRange = kind === 'latitude'
            ? numericValue >= -90 && numericValue <= 90
            : numericValue >= -180 && numericValue <= 180;

        if (!Number.isFinite(numericValue) || !isInRange) {
            return;
        }

        const roundedValue = roundCoordinate(numericValue, coordinatePrecision);
        onCoordinatesChange({ ...coordinates, [kind]: roundedValue });

        if (kind === 'latitude') {
            setLatitudeInput(formatCoordinate(roundedValue, coordinatePrecision));
        }
        else {
            setLongitudeInput(formatCoordinate(roundedValue, coordinatePrecision));
        }
    }, [coordinates, coordinatePrecision, latitudeInput, longitudeInput, onCoordinatesChange]);

    const requestCurrentLocation = useCallback(() => {
        setLocationStatus('loading');
        requestGeolocation(coordinatePrecision,
            (nextCoordinates) => {
                updateLocationInputs(nextCoordinates);
                setLocationStatus('success');
            },
            () => {
                setLocationStatus('error');
            }
        );
    }, [coordinatePrecision, updateLocationInputs]);

    return {
        latitudeInput,
        longitudeInput,
        locationStatus,
        handleCoordinateInput,
        normalizeCoordinateInput,
        requestCurrentLocation
    };
}

function requestGeolocation(precision: number, onSuccess: (coordinates: Coordinates) => void, onError: () => void): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        onError();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => onSuccess({
            latitude: roundCoordinate(position.coords.latitude, precision),
            longitude: roundCoordinate(position.coords.longitude, precision)
        }),
        onError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
}

function isIncompleteCoordinateInput(value: string): boolean {
    return value === '' || value === '-' || value === '.' || value === '-.';
}

function isValidCoordinateInput(value: string, kind: keyof Coordinates): boolean {
    if (isIncompleteCoordinateInput(value)) {
        return false;
    }

    const numericValue = Number(value);
    const isInRange = kind === 'latitude'
        ? numericValue >= -90 && numericValue <= 90
        : numericValue >= -180 && numericValue <= 180;

    return Number.isFinite(numericValue) && isInRange;
}