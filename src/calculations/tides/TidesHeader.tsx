import { Map, Share2 } from 'lucide-react';
import { memo } from 'react';
import { getBasePathname } from '../../appRouting';
import { CopyToClipboardButton } from '../components/CopyToClipboardButton';
import { DateLocationInputs } from '../components/DateLocationInputs';
import type { Coordinates } from '../components/dateLocationUtils';
import styles from './TidesPage.module.css';

type TidesHeaderProps = {
    embedded: boolean;
    dateValue: string;
    onDateChange: (value: string) => void;
    coordinates: Coordinates;
    onCoordinatesChange: (value: Coordinates) => void;
    requestLocationOnMount: boolean;
    onShare: () => void;
    copyText: string | null;
}

export const TidesHeader = memo(function TidesHeader({ embedded, dateValue, onDateChange, coordinates, onCoordinatesChange, requestLocationOnMount, onShare, copyText }: Readonly<TidesHeaderProps>) {
    return (
        <header className={styles.tidesHeader}>
            <div className={styles.tidesToolbar}>
                <DateLocationInputs dateValue={dateValue} onDateChange={onDateChange} coordinates={coordinates} onCoordinatesChange={onCoordinatesChange} coordinatePrecision={1} requestLocationOnMount={requestLocationOnMount} idPrefix='tides' />
                {!embedded && (
                    <div className={styles.tidesToolbarActions}>
                        <CopyToClipboardButton text={copyText} className={styles.tidesMapLink} copyLabel='Copy current, next, and following tide details' copiedLabel='Tide details copied' failedLabel='Could not copy tide details' />
                        <a className={styles.tidesMapLink} href={getBasePathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>
                        <button type='button' className={styles.tidesMapLink} onClick={onShare} aria-label='Share these tide predictions' title='Share these tide predictions'><Share2 size={18} /></button>
                    </div>
                )}
            </div>
        </header>
    );
});