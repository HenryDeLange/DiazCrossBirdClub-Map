import { Clock3, WavesArrowDown, WavesArrowUp } from 'lucide-react';
import { memo } from 'react';
import styles from './TidesPage.module.css';
import type { CurrentTideStatus } from './tidesTypes';
import { formatLevel, formatTideTime } from './tidesUtils';

type TideCurrentPanelProps = {
    currentTide: CurrentTideStatus;
    now: Date;
}

export const TideCurrentPanel = memo(function TideCurrentPanel({ currentTide, now }: Readonly<TideCurrentPanelProps>) {
    const DirectionIcon = currentTide.incoming ? WavesArrowUp : WavesArrowDown;
    const NextTideIcon = currentTide.nextTide.high ? WavesArrowUp : WavesArrowDown;

    return (
        <section className={styles.tidesCurrentPanel} aria-label='Current and next tide' aria-live='polite'>
            <div className={styles.tidesCurrentRow}>
                <div className={styles.tidesCurrentTime}>
                    <Clock3 aria-hidden='true' />
                    <div className={styles.tidesCurrentDetails}><span>Now</span><strong>{formatTideTime(now, currentTide.timeZone)}</strong></div>
                </div>
                <div className={`${styles.tidesCurrentDirection} ${currentTide.incoming ? styles.tidesCurrentDirectionIncoming : styles.tidesCurrentDirectionOutgoing}`}>
                    <DirectionIcon aria-hidden='true' />
                    <div className={styles.tidesCurrentDetails}><span>{currentTide.incoming ? 'Incoming' : 'Outgoing'}</span><strong>{formatLevel(currentTide.level)} m</strong></div>
                </div>
            </div>
            <div className={styles.tidesNextRow}>
                <div className={styles.tidesCurrentTime}>
                    <Clock3 aria-hidden='true' />
                    <div className={styles.tidesCurrentDetails}><span>Next</span><strong>{formatTideTime(currentTide.nextTide.time, currentTide.nextTide.timeZone)}</strong></div>
                </div>
                <div className={`${styles.tidesNextTide} ${currentTide.nextTide.high ? styles.tidesCurrentDirectionIncoming : styles.tidesCurrentDirectionOutgoing}`}>
                    <NextTideIcon aria-hidden='true' />
                    <div className={styles.tidesCurrentDetails}><span>{currentTide.nextTide.high ? 'High' : 'Low'}</span><strong>{formatLevel(currentTide.nextTide.level)} m</strong></div>
                </div>
            </div>
        </section>
    );
});