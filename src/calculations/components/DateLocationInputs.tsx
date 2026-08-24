import { memo } from 'react';
import styles from './DateLocationInputs.module.css';
import { CoordinateInputs } from './CoordinateInputs';
import { DateInput } from './DateInput';
import type { DateLocationInputsProps } from './dateLocationInputTypes';

export const DateLocationInputs = memo(function DateLocationInputs({ dateValue, onDateChange, coordinates, onCoordinatesChange, coordinatePrecision = 5, locationView = false, requestLocationOnMount = false, onInputValidityChange, idPrefix }: Readonly<DateLocationInputsProps>) {
    return (
        <div className={styles.inputs}>
            <DateInput dateValue={dateValue} onDateChange={onDateChange} idPrefix={idPrefix} />
            <CoordinateInputs
                dateValue={dateValue}
                coordinates={coordinates}
                onCoordinatesChange={onCoordinatesChange}
                coordinatePrecision={coordinatePrecision}
                locationView={locationView}
                requestLocationOnMount={requestLocationOnMount}
                onInputValidityChange={onInputValidityChange}
            />
        </div>
    );
});