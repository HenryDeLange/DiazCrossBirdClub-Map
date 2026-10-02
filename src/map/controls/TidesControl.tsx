import { ExternalLink, WavesHorizontal } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useMap } from 'react-leaflet';
import { getTidesPathname } from '../../appRouting';
import type { Coordinates } from '../../calculations/components/dateLocationUtils';
import { MapControlButton } from '../components/MapControlButton';
import { MapDrawer } from '../components/MapDrawer';
import drawerStyles from '../components/MapDrawer.module.css';
import styles from './TidesControl.module.css';

const TidesPage = lazy(() => import('../../calculations/tides/TidesPage'));

type TidesControlProps = {
    drawerHeight: number;
    onDrawerHeightChange: (height: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onBack?: () => void;
    coordinates: Coordinates | null;
    locationName?: string;
}

export function TidesControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, coordinates, locationName }: Readonly<TidesControlProps>) {
    const mapCenter = useMap().getCenter();
    const initialCoordinates = coordinates ?? { latitude: mapCenter.lat, longitude: mapCenter.lng };
    const isLocationView = coordinates !== null;

    return (
        <>
            <MapControlButton
                groupClassName='tidesGroup'
                onClick={onToggle}
                title='Open tide guide'
            >
                <WavesHorizontal />
            </MapControlButton>
            <MapDrawer
                isOpen={isOpen}
                onClose={onClose}
                onBack={onBack}
                backLabel={locationName}
                title='TIDES'
                headerAction={!isLocationView && <a className={`drawer-header-action ${styles.headerAction}`} href={getTidesPathname()} target='_blank' rel='noreferrer' aria-label='Open tide guide in a new tab' title='Open tide guide in a new tab'><ExternalLink size={18} /></a>}
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
                maxHeight='calc(100dvh - 1rem)'
            >
                <Suspense fallback={<div className={drawerStyles.empty} role='status'>Loading tide guide...</div>}>
                    <TidesPage key={`${initialCoordinates.latitude}:${initialCoordinates.longitude}`} embedded initialCoordinates={initialCoordinates} />
                </Suspense>
            </MapDrawer>
        </>
    );
}