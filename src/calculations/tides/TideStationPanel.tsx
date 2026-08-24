import { WavesArrowDown, WavesArrowUp } from 'lucide-react';
import { memo } from 'react';
import styles from './TidesPage.module.css';
import type { TidePrediction } from './tideData';
import { formatDistance, formatLevel, formatTideTime } from './tidesUtils';

export const TideStationPanel = memo(function TideStationPanel({ prediction }: Readonly<{ prediction: TidePrediction }>) {
    const { station, extremes, error } = prediction;

    return (
        <article className={styles.tidesStationPanel}>
            <header className={styles.tidesStationHeader}>
                <h2>{station.name}</h2>
                <p className={styles.tidesStationDistance}>{formatDistance(station.distance)}</p>
            </header>
            {error ? <p className={`${styles.tidesMessage} ${styles.tidesMessageError}`}>{error}</p> : extremes.length > 0 ? (
                <ol className={styles.tidesExtremeList}>
                    {extremes.map((extreme) => {
                        const ExtremeIcon = extreme.high ? WavesArrowUp : WavesArrowDown;
                        return (
                            <li key={`${station.id}-${extreme.time.toISOString()}`} className={`${styles.tidesExtreme} ${extreme.high ? styles.tidesExtremeHigh : styles.tidesExtremeLow}`}>
                                <ExtremeIcon aria-hidden='true' />
                                <span className={styles.tidesExtremeSummary}>
                                    <span className={styles.tidesExtremeLabel}>{extreme.label}</span>
                                    <span className={styles.tidesExtremeLevel}>{formatLevel(extreme.level)} m</span>
                                </span>
                                <strong>{formatTideTime(extreme.time, station.timezone)}</strong>
                            </li>
                        );
                    })}
                </ol>
            ) : <p className={styles.tidesMessage}>No high or low tide was predicted for this date.</p>}
        </article>
    );
});