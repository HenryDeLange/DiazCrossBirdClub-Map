import { Binoculars, Footprints, MapPin, Route, Telescope, type LucideIcon } from 'lucide-react';
import type { LocationTabName } from '../../locationUtils';

type PrimaryCategoryIconProps = {
    tabLabel: LocationTabName;
}

export function PrimaryCategoryIcon({ tabLabel }: Readonly<PrimaryCategoryIconProps>) {
    const iconByTab: Record<LocationTabName, LucideIcon> = {
        Outings: Footprints,
        Spots: Binoculars,
        Paths: Route,
        Points: Telescope
    };

    const Icon = iconByTab[tabLabel] ?? MapPin;

    return <Icon className='location-card-nav-icon' aria-hidden='true' />;
}
