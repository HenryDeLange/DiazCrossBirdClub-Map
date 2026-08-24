import type { Coordinates } from './dateLocationUtils';

export type DateLocationInputsProps = {
    dateValue: string;
    onDateChange: (value: string) => void;
    coordinates: Coordinates;
    onCoordinatesChange: (coordinates: Coordinates) => void;
    coordinatePrecision?: number;
    locationView?: boolean;
    requestLocationOnMount?: boolean;
    onInputValidityChange?: (isValid: boolean) => void;
    idPrefix: string;
}