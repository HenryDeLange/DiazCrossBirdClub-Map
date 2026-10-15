import { memo } from 'react';
import { AstraClockPanel } from './AstraClock';
import { AstraDetailsPanel } from './AstraDetailsPanel';
import styles from './AstraPage.module.css';
import type { SkyEvent } from './astraTypes';
import type { AstronomyData, TimelineSegment } from './sunTimes';

type AstraDashboardProps = {
    astronomy: AstronomyData | null;
    now: Date;
    currentMinutes: number;
    onDateChange: (value: string) => void;
    selectedSegment: TimelineSegment | null;
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    skyEvents: SkyEvent[];
    isCurrentTimeSelected: boolean;
    isTimeAdjusted: boolean;
    onSelectSegment: (segment: TimelineSegment) => void;
    onSelectMarker: (markerId: string) => void;
    onSelectEvent: (event: SkyEvent) => void;
    onTimeChange: (minutes: number) => void;
    onResetTime: () => void;
}

export const AstraDashboard = memo(function AstraDashboard({ astronomy, now, currentMinutes, onDateChange, selectedSegment, selectedSegmentId, selectedMarkerId, skyEvents, isCurrentTimeSelected, isTimeAdjusted, onSelectSegment, onSelectMarker, onSelectEvent, onTimeChange, onResetTime }: Readonly<AstraDashboardProps>) {
    return (
        <section className={styles.astraDashboard}>
            {!astronomy ? (
                <p className={styles.astraMessage} role='alert'>Enter a date, latitude, and longitude to view the sun and moon chart.</p>
            ) : (
                <>
                    <AstraClockPanel
                        astronomy={astronomy}
                        now={now}
                        currentMinutes={currentMinutes}
                        onDateChange={onDateChange}
                        selectedSegment={selectedSegment}
                        selectedSegmentId={selectedSegmentId}
                        selectedMarkerId={selectedMarkerId}
                        isCurrentTimeSelected={isCurrentTimeSelected}
                        isTimeAdjusted={isTimeAdjusted}
                        onSelectSegment={onSelectSegment}
                        onSelectMarker={onSelectMarker}
                        onTimeChange={onTimeChange}
                        onResetTime={onResetTime}
                    />
                    <AstraDetailsPanel
                        astronomy={astronomy}
                        now={now}
                        selectedSegment={selectedSegment}
                        selectedMarkerId={selectedMarkerId}
                        skyEvents={skyEvents}
                        onSelectEvent={onSelectEvent}
                    />
                </>
            )}
        </section>
    );
});