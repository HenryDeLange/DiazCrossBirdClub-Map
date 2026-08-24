import { ArrowBigDownDash } from 'lucide-react';
import { MapControlButton } from '../map/components/MapControlButton';
import { usePwaInstall } from './usePwaInstall';

export function InstallAppButton() {
    const { canInstall, install } = usePwaInstall();

    if (!canInstall) {
        return null;
    }

    return (
        <MapControlButton
            groupClassName='installGroup'
            onClick={() => void install()}
            title='Install DCBC Birding Map'
        >
            <ArrowBigDownDash aria-hidden='true' />
        </MapControlButton>
    );
}