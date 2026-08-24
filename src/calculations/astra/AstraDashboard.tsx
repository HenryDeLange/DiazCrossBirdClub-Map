import { memo } from 'react';
import styles from './AstraPage.module.css';
import { AstraClockPanel } from './AstraClock';
import { AstraDetailsPanel } from './AstraDetailsPanel';
import type { SkyEvent } from './astraTypes';
import type { AstronomyData, TimelineSegment } from './sunTimes';

type AstraDashboardProps = {
    astronomy: AstronomyData | null;
    now: Date;
    currentMinutes: number;
    selectedSegment: TimelineSegment | null;
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    skyEvents: SkyEvent[];
    isTodaySelected: boolean;
    isCurrentTimeSelected: boolean;
    onSelectSegment: (segment: TimelineSegment) => void;
    onSelectMarker: (markerId: string) => void;
    onSelectEvent: (event: SkyEvent) => void;
}

export const AstraDashboard = memo(function AstraDashboard({ astronomy, now, currentMinutes, selectedSegment, selectedSegmentId, selectedMarkerId, skyEvents, isTodaySelected, isCurrentTimeSelected, onSelectSegment, onSelectMarker, onSelectEvent }: Readonly<AstraDashboardProps>) {
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
                        selectedSegmentId={selectedSegmentId}
                        selectedMarkerId={selectedMarkerId}
                        isCurrentTimeSelected={isCurrentTimeSelected}
                        showCurrentTime={isTodaySelected}
                        onSelectSegment={onSelectSegment}
                        onSelectMarker={onSelectMarker}
                    />
                    <AstraDetailsPanel
                        astronomy={astronomy}
                        now={now}
                        selectedSegment={selectedSegment}
                        selectedMarkerId={selectedMarkerId}
                        isTodaySelected={isTodaySelected}
                        skyEvents={skyEvents}
                        onSelectEvent={onSelectEvent}
                    />
                </>
            )}
        </section>
    );
});