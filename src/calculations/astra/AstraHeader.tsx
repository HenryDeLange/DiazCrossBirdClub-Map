import { Map, Share2 } from 'lucide-react';
import { memo } from 'react';
import { getBasePathname } from '../../appRouting';
import { CopyToClipboardButton } from '../components/CopyToClipboardButton';
import { DateLocationInputs } from '../components/DateLocationInputs';
import type { Coordinates } from '../components/dateLocationUtils';
import styles from './AstraPage.module.css';
import type { AstraCopyTexts } from './astraTypes';

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
    copyTexts: AstraCopyTexts | null;
}

export const AstraHeader = memo(function AstraHeader({ embedded, dateValue, onDateChange, coordinates, onCoordinatesChange, locationView, requestLocationOnMount, onInputValidityChange, onShare, copyTexts }: Readonly<AstraHeaderProps>) {
    return (
        <header className={styles.astraHeader}>
            <div className={styles.astraToolbar}>
                <div className={styles.astraToolbarControls}>
                    <DateLocationInputs dateValue={dateValue} onDateChange={onDateChange} coordinates={coordinates} onCoordinatesChange={onCoordinatesChange} coordinatePrecision={4} locationView={locationView} requestLocationOnMount={requestLocationOnMount} onInputValidityChange={onInputValidityChange} idPrefix='astra' />
                </div>
                {!embedded && (
                    <div className={styles.astraToolbarActions}>
                        <CopyToClipboardButton text={copyTexts?.summary ?? null} className={styles.astraMapLink} copyLabel='Copy sunrise, sunset, and birding times' copiedLabel='Birding times copied' failedLabel='Could not copy birding times' />
                        <CopyToClipboardButton text={copyTexts?.fullEvents ?? null} idleIcon='list' className={styles.astraMapLink} copyLabel='Copy full sky event list' copiedLabel='Sky event list copied' failedLabel='Could not copy sky event list' />
                        <a className={styles.astraMapLink} href={getBasePathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>
                        <button type='button' className={styles.astraMapLink} onClick={onShare} aria-label='Share this sun and moon guide' title='Share this sun and moon guide'><Share2 size={18} /></button>
                    </div>
                )}
            </div>
        </header>
    );
});