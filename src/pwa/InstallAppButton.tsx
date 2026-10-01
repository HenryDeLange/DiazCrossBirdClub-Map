import { ArrowBigDownDash, RefreshCw } from 'lucide-react';
import { MapControlButton } from '../map/components/MapControlButton';
import { usePwaUpdate } from './pwaUpdate';
import { usePwaInstall } from './usePwaInstall';

export function InstallAppButton() {
    const { canInstall, install } = usePwaInstall();
    const { isUpdateAvailable, reloadWithUpdate } = usePwaUpdate();

    if (!canInstall && !isUpdateAvailable) {
        return null;
    }

    return (
        <MapControlButton
            groupClassName='installGroup'
            onClick={() => void (isUpdateAvailable ? reloadWithUpdate() : install())}
            title={isUpdateAvailable ? 'Reload DCBC Birding Map' : 'Install DCBC Birding Map'}
        >
            {isUpdateAvailable
                ? <RefreshCw aria-hidden='true' />
                : <ArrowBigDownDash aria-hidden='true' />}
        </MapControlButton>
    );
}