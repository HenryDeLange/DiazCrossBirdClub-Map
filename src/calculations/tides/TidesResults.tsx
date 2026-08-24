import { memo } from 'react';
import { TideCurrentPanel } from './TideCurrentPanel';
import { TideStationPanel } from './TideStationPanel';
import { TideWaveGraphic } from './TideWaveGraphic';
import styles from './TidesPage.module.css';
import type { TidePrediction, WeightedTideExtreme } from './tideData';
import type { CurrentTideStatus } from './tidesTypes';

type TidesResultsProps = {
    currentTide: CurrentTideStatus | null;
    now: Date;
    predictions: TidePrediction[];
    weightedExtremes: WeightedTideExtreme[];
    selectedDate: Date;
}

export const TidesResults = memo(function TidesResults({ currentTide, now, predictions, weightedExtremes, selectedDate }: Readonly<TidesResultsProps>) {
    return (
        <div className={styles.tidesResults}>
            <div className={styles.tidesWaveColumn}>
                {currentTide && <TideCurrentPanel currentTide={currentTide} now={now} />}
                {weightedExtremes.length > 0 && <TideWaveGraphic extremes={weightedExtremes} date={selectedDate} now={now} />}
                <p className={styles.tidesDisclaimer}>Tide estimates are for planning birdwatching activities, not navigation.</p>
            </div>
            <div className={styles.tidesStationList}>
                {predictions.map((prediction) => <TideStationPanel key={prediction.station.id} prediction={prediction} />)}
            </div>
        </div>
    );
});