import { ExternalLink, WavesHorizontal } from 'lucide-react';
import { getTidesPathname } from '../../appRouting';
import type { Coordinates } from '../../calculations/components/dateLocationUtils';
import TidesPage from '../../calculations/tides/TidesPage';
import { MapControlButton } from '../components/MapControlButton';
import { MapDrawer } from '../components/MapDrawer';
import styles from './TidesControl.module.css';

type TidesControlProps = {
    drawerHeight: number;
    onDrawerHeightChange: (height: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onBack?: () => void;
    coordinates: Coordinates | null;
    locationName?: string;
    mapCenter: { lat: number; lng: number };
}

export function TidesControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, coordinates, locationName, mapCenter }: Readonly<TidesControlProps>) {
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
                <TidesPage key={`${initialCoordinates.latitude}:${initialCoordinates.longitude}`} embedded initialCoordinates={initialCoordinates} />
            </MapDrawer>
        </>
    );
}