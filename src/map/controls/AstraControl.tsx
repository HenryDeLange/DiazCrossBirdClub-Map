import { ExternalLink, SunMoon } from 'lucide-react';
import AstraPage, { type Coordinates } from '../../astra/AstraPage';
import { MapControlButton } from '../components/MapControlButton';
import { MapDrawer } from '../components/MapDrawer';
import { getAstraPathname } from '../locationUtils';

type AstraControlProps = {
    drawerHeight: number;
    onDrawerHeightChange: (height: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onBack?: () => void;
    coordinates: Coordinates | null;
}

export function AstraControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, coordinates }: Readonly<AstraControlProps>) {
    return (
        <>
            <MapControlButton
                groupClassName='astra-group'
                buttonClassName='astra-button'
                onClick={onToggle}
                title='Open sun and moon guide'
            >
                <SunMoon className='button-icon' />
            </MapControlButton>
            <MapDrawer
                isOpen={isOpen}
                onClose={onClose}
                onBack={onBack}
                title='SUN & MOON'
                headerAction={<a className='drawer-header-action' href={getAstraPathname()} target='_blank' rel='noreferrer' aria-label='Open sun and moon guide in a new tab' title='Open sun and moon guide in a new tab'><ExternalLink size={18} /></a>}
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
                maxHeight='calc(100dvh - 1rem)'
            >
                <AstraPage embedded initialCoordinates={coordinates ?? undefined} />
            </MapDrawer>
        </>
    );
}
