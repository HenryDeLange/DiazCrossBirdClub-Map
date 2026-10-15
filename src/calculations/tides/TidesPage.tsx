import { useEffect, useLayoutEffect } from 'react';
import { TidesDashboard } from './TidesDashboard';
import { TidesHeader } from './TidesHeader';
import styles from './TidesPage.module.css';
import type { TidesPageProps } from './tidesTypes';
import { formatCurrentTideSummary } from './tidesUtils';
import { useTidesPage } from './useTidesPage';

export default function TidesPage({ embedded = false, initialCoordinates, onCopyTextChange }: Readonly<TidesPageProps>) {
    const page = useTidesPage({ embedded, initialCoordinates });
    const copyText = page.currentTide ? formatCurrentTideSummary(page.currentTide, page.now, page.dateValue, page.coordinates) : null;

    useLayoutEffect(() => {
        onCopyTextChange?.(copyText);
    }, [copyText, onCopyTextChange]);

    useEffect(() => () => onCopyTextChange?.(null), [onCopyTextChange]);

    return (
        <main className={`${styles.tidesPage}${page.embedded ? ` ${styles.tidesPageEmbedded}` : ''}`}>
            <div className={styles.tidesShell}>
                <TidesHeader
                    embedded={page.embedded}
                    dateValue={page.dateValue}
                    onDateChange={page.onDateChange}
                    coordinates={page.coordinates}
                    onCoordinatesChange={page.onCoordinatesChange}
                    requestLocationOnMount={page.shouldRequestLocation}
                    onShare={page.onShare}
                    copyText={copyText}
                />
                <TidesDashboard
                    selectedDate={page.selectedDate}
                    coordinates={page.coordinates}
                    stationState={page.stationState}
                    now={page.now}
                    nowAdjusted={page.nowAdjusted}
                    onTimeChange={page.onTimeChange}
                    onResetTime={page.onResetTime}
                    onDateChange={page.onDateChange}
                    predictions={page.predictions}
                    weightedExtremes={page.weightedExtremes}
                    currentTide={page.currentTide}
                    hasTideData={page.hasTideData}
                    allPredictionsFailed={page.allPredictionsFailed}
                />
            </div>
        </main>
    );
}

