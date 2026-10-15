import { useEffect, useLayoutEffect, useMemo } from 'react';
import { AstraDashboard } from './AstraDashboard';
import { AstraHeader } from './AstraHeader';
import styles from './AstraPage.module.css';
import type { AstraPageProps } from './astraTypes';
import { formatAstraBirdingSummaryForClipboard, formatSkyEventsForClipboard } from './astraUtils';
import { useAstraPage } from './useAstraPage';

export default function AstraPage({ embedded = false, initialCoordinates, locationView = false, onCopyTextChange }: Readonly<AstraPageProps>) {
    const page = useAstraPage({ embedded, initialCoordinates, locationView });
    const copyTexts = useMemo(() => page.astronomy ? {
        summary: formatAstraBirdingSummaryForClipboard(page.dateValue, page.coordinates, page.astronomy),
        fullEvents: formatSkyEventsForClipboard(page.dateValue, page.coordinates, page.skyEvents)
    } : null, [page.astronomy, page.coordinates, page.dateValue, page.skyEvents]);

    useLayoutEffect(() => {
        onCopyTextChange?.(copyTexts);
    }, [copyTexts, onCopyTextChange]);

    useEffect(() => () => onCopyTextChange?.(null), [onCopyTextChange]);

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
                    copyTexts={copyTexts}
                />
                <AstraDashboard
                    astronomy={page.astronomy}
                    now={page.now}
                    currentMinutes={page.currentMinutes}
                    onDateChange={page.onDateChange}
                    selectedSegment={page.selectedSegment}
                    selectedSegmentId={page.selectedSegmentId}
                    selectedMarkerId={page.selectedMarkerId}
                    skyEvents={page.skyEvents}
                    isCurrentTimeSelected={page.isCurrentTimeSelected}
                    onSelectSegment={page.onSelectSegment}
                    onSelectMarker={page.onSelectMarker}
                    onSelectEvent={page.onSelectEvent}
                />
            </div>
        </main>
    );
}
