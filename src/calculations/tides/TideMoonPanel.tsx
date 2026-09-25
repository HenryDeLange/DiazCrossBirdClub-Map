import { Moon } from 'lucide-react';
import { memo } from 'react';
import * as SunCalc from 'suncalc';
import type { Coordinates } from '../components/dateLocationUtils';
import styles from './TidesPage.module.css';

type TideMoonPanelProps = {
    date: Date;
    coordinates: Coordinates;
}

export const TideMoonPanel = memo(function TideMoonPanel({ date, coordinates }: Readonly<TideMoonPanelProps>) {
    const illumination = SunCalc.getMoonIllumination(date);
    const moonPosition = SunCalc.getMoonPosition(date, coordinates.latitude, coordinates.longitude);

    return (
        <section className={`${styles.tidesCurrentPanel} ${styles.tidesMoonPanel}`} aria-label='Moon phase and distance'>
            <div className={styles.tidesMoonPhaseGroup}>
                <Moon className={styles.tidesMoonIcon} aria-hidden='true' />
                <div className={styles.tidesMoonMetric}>
                    <span>Moon phase</span>
                    <strong>{getMoonPhaseName(illumination.phase)}</strong>
                </div>
            </div>
            <div className={`${styles.tidesMoonMetric} ${styles.tidesMoonMetricCentered}`}>
                <span>Illumination</span>
                <strong>{Math.round(illumination.fraction * 100)}%</strong>
            </div>
            <div className={`${styles.tidesMoonMetric} ${styles.tidesMoonMetricRight}`}>
                <span>Moon distance</span>
                <strong>{Math.round(moonPosition.distance).toLocaleString('en-US').replaceAll(',', ' ')} km</strong>
            </div>
        </section>
    );
});

function getMoonPhaseName(phase: number): string {
    if (phase < 0.03 || phase >= 0.97) return 'New moon';
    if (phase < 0.22) return 'Waxing crescent';
    if (phase < 0.28) return 'First quarter';
    if (phase < 0.47) return 'Waxing gibbous';
    if (phase < 0.53) return 'Full moon';
    if (phase < 0.72) return 'Waning gibbous';
    if (phase < 0.78) return 'Last quarter';
    return 'Waning crescent';
}