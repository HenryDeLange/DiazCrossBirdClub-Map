import { CalendarDays, Locate, LocateFixed, MapPin } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent } from 'react';
import './dateLocationControls.css';
import { formatCoordinate, roundCoordinate, type Coordinates } from './dateLocationUtils';

type DateLocationControlsProps = {
    dateValue: string;
    onDateChange: (value: string) => void;
    coordinates: Coordinates;
    onCoordinatesChange: (coordinates: Coordinates) => void;
    coordinatePrecision?: number;
    locationView?: boolean;
    requestLocationOnMount?: boolean;
    onLocationError?: () => void;
    idPrefix: string;
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

const decimalInputPattern = /^-?\d*(?:\.\d*)?$/;

export function DateLocationControls({ dateValue, onDateChange, coordinates, onCoordinatesChange, coordinatePrecision = 5, locationView = false, requestLocationOnMount = false, onLocationError, idPrefix }: Readonly<DateLocationControlsProps>) {
    const [latitudeInput, setLatitudeInput] = useState(formatCoordinate(coordinates.latitude, coordinatePrecision));
    const [longitudeInput, setLongitudeInput] = useState(formatCoordinate(coordinates.longitude, coordinatePrecision));
    const [locationStatus, setLocationStatus] = useState<LocationStatus>(requestLocationOnMount ? 'loading' : 'idle');
    const [locationStatusMessage, setLocationStatusMessage] = useState(requestLocationOnMount ? 'Locating...' : '');

    useEffect(() => {
        if (!requestLocationOnMount) {
            return;
        }

        requestGeolocation(coordinatePrecision,
            (nextCoordinates) => {
                onCoordinatesChange(nextCoordinates);
                setLatitudeInput(formatCoordinate(nextCoordinates.latitude, coordinatePrecision));
                setLongitudeInput(formatCoordinate(nextCoordinates.longitude, coordinatePrecision));
                setLocationStatus('success');
                setLocationStatusMessage('GPS point loaded');
            },
            () => {
                setLocationStatus('error');
                setLocationStatusMessage('Could not load GPS point');
                onLocationError?.();
            }
        );
    }, [coordinatePrecision, onCoordinatesChange, onLocationError, requestLocationOnMount]);

    useEffect(() => {
        if (locationStatus === 'idle' || locationStatus === 'loading') {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setLocationStatus('idle');
            setLocationStatusMessage('');
        }, locationStatus === 'success' ? 1900 : 2600);

        return () => window.clearTimeout(timeoutId);
    }, [locationStatus]);

    const handleCoordinateInput = (kind: keyof Coordinates, value: string) => {
        if (!decimalInputPattern.test(value)) {
            return;
        }

        if (kind === 'latitude') {
            setLatitudeInput(value);
        }
        else {
            setLongitudeInput(value);
        }

        if (value === '' || value === '-' || value === '.' || value === '-.') {
            return;
        }

        const numericValue = Number(value);
        const isInRange = kind === 'latitude'
            ? numericValue >= -90 && numericValue <= 90
            : numericValue >= -180 && numericValue <= 180;

        if (Number.isFinite(numericValue) && isInRange) {
            onCoordinatesChange({ ...coordinates, [kind]: roundCoordinate(numericValue, coordinatePrecision) });
        }
    };

    const normalizeCoordinateInput = (kind: keyof Coordinates) => {
        const value = kind === 'latitude' ? latitudeInput : longitudeInput;
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
    };

    const requestCurrentLocation = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setLocationStatus('error');
            setLocationStatusMessage('GPS is not available');
            onLocationError?.();
            return;
        }

        setLocationStatus('loading');
        setLocationStatusMessage('Locating...');
        requestGeolocation(coordinatePrecision,
            (nextCoordinates) => {
                onCoordinatesChange(nextCoordinates);
                setLatitudeInput(formatCoordinate(nextCoordinates.latitude, coordinatePrecision));
                setLongitudeInput(formatCoordinate(nextCoordinates.longitude, coordinatePrecision));
                setLocationStatus('success');
                setLocationStatusMessage('GPS point loaded');
            },
            () => {
                setLocationStatus('error');
                setLocationStatusMessage('Could not load GPS point');
                onLocationError?.();
            }
        );
    };

    return (
        <div className='date-location-controls'>
            <div className='date-location-field-section date-location-date-block'>
                <div className='date-location-section-label date-location-date-label' title='Date'>
                    <CalendarDays size={18} aria-hidden='true' />
                    <span className='date-location-visually-hidden'>Date</span>
                </div>
                <input id={`${idPrefix}-date`} type='date' aria-label='Date' value={dateValue} onChange={(event) => onDateChange(event.target.value)} />
            </div>
            <div className='date-location-field-section date-location-location-block'>
                <div className='date-location-section-label' title='Location'>
                    <MapPin size={18} aria-hidden='true' />
                    <span className='date-location-visually-hidden'>Location</span>
                </div>
                <div className={`date-location-coordinate-controls ${locationView ? 'date-location-coordinate-controls-readonly' : ''}`}>
                    <label>
                        <span className='date-location-coordinate-label-full'>Latitude</span>
                        <span className='date-location-coordinate-label-short'>Lat</span>
                        <input className='date-location-coordinate-input' aria-label='Latitude' inputMode='decimal' pattern='-?[0-9]*[.]?[0-9]*' value={latitudeInput} readOnly={locationView} onChange={(event) => handleCoordinateInput('latitude', event.target.value)} onBlur={() => normalizeCoordinateInput('latitude')} onKeyDown={handleDecimalKeyDown} />
                    </label>
                    <label>
                        <span className='date-location-coordinate-label-full'>Longitude</span>
                        <span className='date-location-coordinate-label-short'>Lng</span>
                        <input className='date-location-coordinate-input' aria-label='Longitude' inputMode='decimal' pattern='-?[0-9]*[.]?[0-9]*' value={longitudeInput} readOnly={locationView} onChange={(event) => handleCoordinateInput('longitude', event.target.value)} onBlur={() => normalizeCoordinateInput('longitude')} onKeyDown={handleDecimalKeyDown} />
                    </label>
                    {!locationView && <button type='button' className={`date-location-ghost-button ${locationStatus === 'loading' ? 'date-location-loading' : ''} ${locationStatus === 'success' ? 'date-location-success' : ''}`} onClick={requestCurrentLocation} title='Use current location' aria-label='Use current location' aria-busy={locationStatus === 'loading'}>{locationStatus === 'success' ? <LocateFixed size={18} /> : <Locate size={18} />}</button>}
                </div>
                {locationStatus === 'error' && <span className='date-location-status date-location-status-error' role='status' aria-live='polite'>{locationStatusMessage}</span>}
            </div>
        </div>
    );
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

function handleDecimalKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length > 1) {
        return;
    }

    const input = event.currentTarget;
    const nextValue = `${input.value.slice(0, input.selectionStart ?? input.value.length)}${event.key}${input.value.slice(input.selectionEnd ?? input.value.length)}`;
    if (!decimalInputPattern.test(nextValue)) {
        event.preventDefault();
    }
}