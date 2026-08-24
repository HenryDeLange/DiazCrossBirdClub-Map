import { AstraDashboard } from './AstraDashboard';
import { AstraHeader } from './AstraHeader';
import styles from './AstraPage.module.css';
import type { AstraPageProps } from './astraTypes';
import { useAstraPage } from './useAstraPage';

export default function AstraPage({ embedded = false, initialCoordinates, locationView = false }: Readonly<AstraPageProps>) {
    const page = useAstraPage({ embedded, initialCoordinates, locationView });

    return (
        <main className={`${styles.astraPage}${page.embedded ? ` ${styles.astraPageEmbedded}` : ''}`}>
            <div className={styles.astraShell}>
                <AstraHeader
                    embedded={page.embedded}
                    dateValue={page.dateValue}
                    onDateChange={page.onDateChange}
                    coordinates={page.coordinates}
                    onCoordinatesChange={page.onCoordinatesChange}
                    locationView={page.locationView}
                    requestLocationOnMount={page.shouldRequestLocation}
                    onInputValidityChange={page.onInputValidityChange}
                    onShare={page.onShare}
                />
                <AstraDashboard
                    astronomy={page.astronomy}
                    now={page.now}
                    currentMinutes={page.currentMinutes}
                    selectedSegment={page.selectedSegment}
                    selectedSegmentId={page.selectedSegmentId}
                    selectedMarkerId={page.selectedMarkerId}
                    skyEvents={page.skyEvents}
                    isTodaySelected={page.isTodaySelected}
                    isCurrentTimeSelected={page.isCurrentTimeSelected}
                    onSelectSegment={page.onSelectSegment}
                    onSelectMarker={page.onSelectMarker}
                    onSelectEvent={page.onSelectEvent}
                />
            </div>
        </main>
    );
}
