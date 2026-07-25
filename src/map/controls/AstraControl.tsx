import { SunMoon } from 'lucide-react';
import { MapControlButton } from '../components/MapControlButton';
import { getAstraPathname } from '../locationUtils';

export function AstraControl() {
    return (
        <MapControlButton
            groupClassName='astra-group'
            buttonClassName='astra-button'
            onClick={() => window.location.assign(getAstraPathname())}
            title='Open sun and moon guide'
        >
            <SunMoon className='button-icon' />
        </MapControlButton>
    );
}
