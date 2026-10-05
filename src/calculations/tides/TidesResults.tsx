import { memo } from 'react';
import type { Coordinates } from '../components/dateLocationUtils';
import { TideCurrentPanel } from './TideCurrentPanel';
import { TideMoonPanel } from './TideMoonPanel';
import { TideStationPanel } from './TideStationPanel';
import { TideWaveGraphic } from './TideWaveGraphic';
import styles from './TidesPage.module.css';
import type { TidePrediction, WeightedTideExtreme } from './tideData';
import type { CurrentTideStatus } from './tidesTypes';

type TidesResultsProps = {
    currentTide: CurrentTideStatus | null;
    now: Date;
    nowAdjusted: boolean;
    onResetTime: () => void;
    onDateChange: (value: string) => void;
    onTimeChange: (value: Date) => void;
    coordinates: Coordinates;
    predictions: TidePrediction[];
    weightedExtremes: WeightedTideExtreme[];
    selectedDate: Date;
}

export const TidesResults = memo(function TidesResults({ currentTide, now, nowAdjusted, onResetTime, onDateChange, onTimeChange, coordinates, predictions, weightedExtremes, selectedDate }: Readonly<TidesResultsProps>) {
    return (
        <div className={styles.tidesResults}>
            <div className={styles.tidesWaveColumn}>
                {weightedExtremes.length > 0 && <TideWaveGraphic extremes={weightedExtremes} date={selectedDate} now={now} nowAdjusted={nowAdjusted} onDateChange={onDateChange} onTimeChange={onTimeChange} onResetTime={onResetTime} />}
                {currentTide && <TideCurrentPanel currentTide={currentTide} now={now} nowAdjusted={nowAdjusted} />}
                <TideMoonPanel date={selectedDate} coordinates={coordinates} />
                <p className={styles.tidesDisclaimer}>Tide estimates are for planning birdwatching activities, not navigation.</p>
            </div>
            <div className={styles.tidesStationList}>
                {predictions.map((prediction) => <TideStationPanel key={prediction.station.id} prediction={prediction} />)}
            </div>
        </div>
    );
});
