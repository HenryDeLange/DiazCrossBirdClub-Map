import { Locate, LocateFixed, MapPin } from 'lucide-react';
import { memo, type KeyboardEvent } from 'react';
import styles from './DateLocationInputs.module.css';
import type { DateLocationInputsProps } from './dateLocationInputTypes';
import { useCoordinateInputs } from './useCoordinateInputs';

type CoordinateInputsProps = Pick<DateLocationInputsProps, 'dateValue' | 'coordinates' | 'onCoordinatesChange' | 'locationView' | 'requestLocationOnMount' | 'onInputValidityChange'> & {
    coordinatePrecision: number;
}

export const CoordinateInputs = memo(function CoordinateInputs({ dateValue, coordinates, onCoordinatesChange, coordinatePrecision, locationView = false, requestLocationOnMount = false, onInputValidityChange }: Readonly<CoordinateInputsProps>) {
    const { latitudeInput, longitudeInput, locationStatus, handleCoordinateInput, normalizeCoordinateInput, requestCurrentLocation } = useCoordinateInputs({
        dateValue,
        coordinates,
        onCoordinatesChange,
        coordinatePrecision,
        requestLocationOnMount,
        onInputValidityChange
    });

    return (
        <div className={`${styles.fieldSection} ${styles.locationBlock}`}>
            <div className={styles.sectionLabel} title='Location'>
                <MapPin size={18} aria-hidden='true' />
                <span className={styles.visuallyHidden}>Location</span>
            </div>
            <div className={`${styles.coordinateControls} ${locationView ? styles.coordinateControlsReadonly : ''}`}>
                <label>
                    <span className={styles.coordinateLabelFull}>Latitude</span>
                    <span className={styles.coordinateLabelShort}>Lat</span>
                    <input className={styles.coordinateInput} aria-label='Latitude' inputMode='decimal' pattern='-?[0-9]*[.]?[0-9]*' value={latitudeInput} readOnly={locationView} onChange={(event) => handleCoordinateInput('latitude', event.target.value)} onBlur={() => normalizeCoordinateInput('latitude')} onKeyDown={handleDecimalKeyDown} />
                </label>
                <label>
                    <span className={styles.coordinateLabelFull}>Longitude</span>
                    <span className={styles.coordinateLabelShort}>Lng</span>
                    <input className={styles.coordinateInput} aria-label='Longitude' inputMode='decimal' pattern='-?[0-9]*[.]?[0-9]*' value={longitudeInput} readOnly={locationView} onChange={(event) => handleCoordinateInput('longitude', event.target.value)} onBlur={() => normalizeCoordinateInput('longitude')} onKeyDown={handleDecimalKeyDown} />
                </label>
                {!locationView && <button type='button' className={`${styles.ghostButton} ${locationStatus === 'loading' ? styles.loading : ''} ${locationStatus === 'success' ? styles.success : ''} ${locationStatus === 'error' ? styles.error : ''}`} onClick={requestCurrentLocation} title='Use current location' aria-label='Use current location' aria-busy={locationStatus === 'loading'}>{locationStatus === 'success' ? <LocateFixed size={18} /> : <Locate size={18} />}</button>}
            </div>
        </div>
    );
});

function handleDecimalKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length > 1) {
        return;
    }

    const input = event.currentTarget;
    const nextValue = `${input.value.slice(0, input.selectionStart ?? input.value.length)}${event.key}${input.value.slice(input.selectionEnd ?? input.value.length)}`;
    if (!/^-?\d*(?:\.\d*)?$/.test(nextValue)) {
        event.preventDefault();
    }
}