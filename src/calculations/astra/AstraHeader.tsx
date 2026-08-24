import { Map, Share2 } from 'lucide-react';
import { memo } from 'react';
import { getBasePathname } from '../../appRouting';
import { DateLocationControls } from '../components/DateLocationControls';
import type { Coordinates } from '../components/dateLocationUtils';
import styles from './AstraPage.module.css';

type AstraHeaderProps = {
    embedded: boolean;
    dateValue: string;
    onDateChange: (value: string) => void;
    coordinates: Coordinates;
    onCoordinatesChange: (value: Coordinates) => void;
    locationView: boolean;
    requestLocationOnMount: boolean;
    onInputValidityChange: (value: boolean) => void;
    onShare: () => void;
}

export const AstraHeader = memo(function AstraHeader({ embedded, dateValue, onDateChange, coordinates, onCoordinatesChange, locationView, requestLocationOnMount, onInputValidityChange, onShare }: Readonly<AstraHeaderProps>) {
    return (
        <header className={styles.astraHeader}>
            <div className={styles.astraToolbar}>
                <div className={styles.astraToolbarControls}>
                    <DateLocationControls dateValue={dateValue} onDateChange={onDateChange} coordinates={coordinates} onCoordinatesChange={onCoordinatesChange} coordinatePrecision={4} locationView={locationView} requestLocationOnMount={requestLocationOnMount} onInputValidityChange={onInputValidityChange} idPrefix='astra' />
                </div>
                {!embedded && (
                    <div className={styles.astraToolbarActions}>
                        <a className={styles.astraMapLink} href={getBasePathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>
                        <button type='button' className={styles.astraMapLink} onClick={onShare} aria-label='Share this sun and moon guide' title='Share this sun and moon guide'><Share2 size={18} /></button>
                    </div>
                )}
            </div>
        </header>
    );
});