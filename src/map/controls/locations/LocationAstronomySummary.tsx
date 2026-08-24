import { SunMoon } from 'lucide-react';
import * as SunCalc from 'suncalc';
import styles from './LocationFeatureDetails.module.css';
import type { AstronomyLocation } from './types';

type LocationAstronomySummaryProps = {
    location: AstronomyLocation;
    onOpen: (location: AstronomyLocation) => void;
}

export function LocationAstronomySummary({ location, onOpen }: Readonly<LocationAstronomySummaryProps>) {
    const sunTimes = SunCalc.getTimes(new Date(), location.latitude, location.longitude);

    return (
        <button
            type='button'
            className={styles.cardNav}
            onClick={() => onOpen(location)}
            aria-label={`Open sunrise and sunset guide for ${location.name}`}
            title={`Open sun and moon guide for ${location.name}. Sunrise ${formatAstronomyTime(sunTimes.sunrise)}, sunset ${formatAstronomyTime(sunTimes.sunset)}`}
        >
            <SunMoon className={styles.cardNavIcon} />
        </button>
    );
}

function formatAstronomyTime(value: Date | null): string {
    if (!value || Number.isNaN(value.getTime())) {
        return 'Not visible';
    }

    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(value);
}
