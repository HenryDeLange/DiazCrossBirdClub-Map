import { ExternalLink, SunMoon } from 'lucide-react';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { getAstraPathname } from '../../appRouting';
import type { AstraCopyTexts } from '../../calculations/astra/astraTypes';
import { CopyToClipboardButton } from '../../calculations/components/CopyToClipboardButton';
import type { Coordinates } from '../../calculations/components/dateLocationUtils';
import { MapControlButton } from '../components/MapControlButton';
import { MapDrawer } from '../components/MapDrawer';
import drawerStyles from '../components/MapDrawer.module.css';
import styles from './AstraControl.module.css';

const AstraPage = lazy(() => import('../../calculations/astra/AstraPage'));

type AstraControlProps = {
    drawerHeight: number;
    onDrawerHeightChange: (height: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onBack?: () => void;
    coordinates: Coordinates | null;
    locationName?: string;
}

export function AstraControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, coordinates, locationName }: Readonly<AstraControlProps>) {
    const copySummaryTextRef = useRef<string | null>(null);
    const copyFullEventsTextRef = useRef<string | null>(null);
    const copyTextAvailableRef = useRef(false);
    const [hasCopyText, setHasCopyText] = useState(false);
    const handleCopyTextChange = useCallback((texts: AstraCopyTexts | null) => {
        copySummaryTextRef.current = texts?.summary ?? null;
        copyFullEventsTextRef.current = texts?.fullEvents ?? null;
        const isAvailable = texts !== null;
        if (copyTextAvailableRef.current !== isAvailable) {
            copyTextAvailableRef.current = isAvailable;
            setHasCopyText(isAvailable);
        }
    }, []);
    const mapCenter = useMap().getCenter();
    const initialCoordinates = coordinates ?? { latitude: mapCenter.lat, longitude: mapCenter.lng };
    const isLocationView = coordinates !== null;

    return (
        <>
            <MapControlButton
                groupClassName='astraGroup'
                onClick={onToggle}
                title='Open sun and moon guide'
            >
                <SunMoon />
            </MapControlButton>
            <MapDrawer
                isOpen={isOpen}
                onClose={onClose}
                onBack={onBack}
                backLabel={locationName}
                title='SUN & MOON'
                headerAction={(
                    <div className={styles.headerActions}>
                        <CopyToClipboardButton text={null} textRef={copySummaryTextRef} enabled={hasCopyText} className={`drawer-header-action ${styles.headerAction}`} copyLabel='Copy sunrise, sunset, and birding times' copiedLabel='Birding times copied' failedLabel='Could not copy birding times' />
                        <CopyToClipboardButton text={null} textRef={copyFullEventsTextRef} enabled={hasCopyText} idleIcon='list' className={`drawer-header-action ${styles.headerAction}`} copyLabel='Copy full sky event list' copiedLabel='Sky event list copied' failedLabel='Could not copy sky event list' />
                        {!isLocationView && <a className={`drawer-header-action ${styles.headerAction}`} href={getAstraPathname()} target='_blank' rel='noreferrer' aria-label='Open sun and moon guide in a new tab' title='Open sun and moon guide in a new tab'><ExternalLink size={18} /></a>}
                    </div>
                )}
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
                maxHeight='calc(100dvh - 1rem)'
            >
                <Suspense fallback={<div className={drawerStyles.empty} role='status'>Loading sun and moon guide...</div>}>
                    <AstraPage key={`${initialCoordinates.latitude}:${initialCoordinates.longitude}`} embedded initialCoordinates={initialCoordinates} locationView={isLocationView} onCopyTextChange={handleCopyTextChange} />
                </Suspense>
            </MapDrawer>
        </>
    );
}
