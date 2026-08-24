import { ExternalLink, WavesHorizontal } from 'lucide-react';
import { getTidesPathname } from '../../appRouting';
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
}

export function TidesControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack }: Readonly<TidesControlProps>) {
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
                title='TIDES'
                headerAction={<a className={`drawer-header-action ${styles.headerAction}`} href={getTidesPathname()} target='_blank' rel='noreferrer' aria-label='Open tide guide in a new tab' title='Open tide guide in a new tab'><ExternalLink size={18} /></a>}
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
                maxHeight='calc(100dvh - 1rem)'
            >
                <TidesPage embedded />
            </MapDrawer>
        </>
    );
}