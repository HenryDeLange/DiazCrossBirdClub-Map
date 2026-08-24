import { memo } from 'react';
import styles from './AstraPage.module.css';
import type { SkyEvent } from './astraTypes';

type SkyEventListProps = {
    events: SkyEvent[];
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    onSelect: (event: SkyEvent) => void;
}

export const SkyEventList = memo(function SkyEventList({ events, selectedSegmentId, selectedMarkerId, onSelect }: Readonly<SkyEventListProps>) {
    return (
        <div className={styles.astraEventTableWrap}>
            <div className={styles.astraEventTableHeading}><h3>Sky events</h3></div>
            <div className={styles.astraEventTable} role='list'>
                {events.map((event) => <SkyEventRow key={event.id} event={event} isSelected={(event.segment?.id === selectedSegmentId) || event.markerId === selectedMarkerId} onSelect={onSelect} />)}
            </div>
        </div>
    );
});

const SkyEventRow = memo(function SkyEventRow({ event, isSelected, onSelect }: Readonly<{ event: SkyEvent; isSelected: boolean; onSelect: (event: SkyEvent) => void }>) {
    const content = <><span className={styles.astraEventIcon} style={{ color: event.color }}>{event.icon}</span><span className={styles.astraEventLabel}>{event.label}</span><strong>{event.value}</strong></>;

    if (!event.segment && !event.markerId) {
        return <div className={`${styles.astraEventRow} ${styles.astraEventRowDisabled}`} role='listitem'>{content}</div>;
    }

    return <button type='button' className={`${styles.astraEventRow}${isSelected ? ` ${styles.astraEventRowSelected}` : ''}`} onClick={() => onSelect(event)} aria-pressed={isSelected}>{content}</button>;
});