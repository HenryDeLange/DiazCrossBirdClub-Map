import { memo } from 'react';
import type { Coordinates } from '../components/dateLocationUtils';
import type { TidePrediction, WeightedTideExtreme } from './tideData';
import styles from './TidesPage.module.css';
import { TidesResults } from './TidesResults';
import type { CurrentTideStatus, TideStationState } from './tidesTypes';

type TidesDashboardProps = {
    selectedDate: Date | null;
    coordinates: Coordinates;
    stationState: TideStationState;
    now: Date;
    nowAdjusted: boolean;
    onDateChange: (value: string) => void;
    onTimeChange: (value: Date) => void;
    onResetTime: () => void;
    predictions: TidePrediction[];
    weightedExtremes: WeightedTideExtreme[];
    currentTide: CurrentTideStatus | null;
    hasTideData: boolean;
    allPredictionsFailed: boolean;
}

export const TidesDashboard = memo(function TidesDashboard({ selectedDate, coordinates, stationState, now, nowAdjusted, onDateChange, onTimeChange, onResetTime, predictions, weightedExtremes, currentTide, hasTideData, allPredictionsFailed }: Readonly<TidesDashboardProps>) {
    return (
        <section className={styles.tidesDashboard}>
            {!selectedDate ? (
                <p className={styles.tidesMessage} role='alert'>Select a valid date to view tide predictions.</p>
            ) : stationState.status === 'loading' ? (
                <p className={styles.tidesMessage} role='status' aria-live='polite'>{stationState.message ?? 'Loading nearby stations...'}</p>
            ) : stationState.status === 'error' ? (
                <p className={`${styles.tidesMessage} ${styles.tidesMessageError}`} role='alert'>{stationState.message}</p>
            ) : (
                <>
                    {stationState.message && <p className={styles.tidesMessage} role='status'>{stationState.message}</p>}
                    {hasTideData ? (
                        <TidesResults
                            currentTide={currentTide}
                            now={now}
                            nowAdjusted={nowAdjusted}
                            onResetTime={onResetTime}
                            onDateChange={onDateChange}
                            onTimeChange={onTimeChange}
                            coordinates={coordinates}
                            predictions={predictions}
                            weightedExtremes={weightedExtremes}
                            selectedDate={selectedDate}
                        />
                    ) : (
                        <p className={`${styles.tidesMessage} ${styles.tidesMessageError}`} role='alert'>{allPredictionsFailed ? 'Tide harmonic data is unavailable for these stations.' : 'No tide predictions are available for this date.'}</p>
                    )}
                </>
            )}
        </section>
    );
});