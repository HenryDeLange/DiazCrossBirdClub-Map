import { ExternalLink, SunMoon } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useMap } from 'react-leaflet';
import { getAstraPathname } from '../../appRouting';
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
                headerAction={!isLocationView && <a className={`drawer-header-action ${styles.headerAction}`} href={getAstraPathname()} target='_blank' rel='noreferrer' aria-label='Open sun and moon guide in a new tab' title='Open sun and moon guide in a new tab'><ExternalLink size={18} /></a>}
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
                maxHeight='calc(100dvh - 1rem)'
            >
                <Suspense fallback={<div className={drawerStyles.empty} role='status'>Loading sun and moon guide...</div>}>
                    <AstraPage key={`${initialCoordinates.latitude}:${initialCoordinates.longitude}`} embedded initialCoordinates={initialCoordinates} locationView={isLocationView} />
                </Suspense>
            </MapDrawer>
        </>
    );
}
