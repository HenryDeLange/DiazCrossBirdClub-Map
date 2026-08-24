import { Clock3, WavesHorizontal } from 'lucide-react';
import { memo } from 'react';
import styles from './TidesPage.module.css';
import type { WeightedTideExtreme } from './tideData';
import { createSmoothPath, formatLevel, formatTideTime, getCurrentTimePoint, getWaveChartPoints, getWaveChartTicks } from './tidesUtils';

type TideWaveGraphicProps = {
    extremes: WeightedTideExtreme[];
    date: Date;
    now: Date;
}

export const TideWaveGraphic = memo(function TideWaveGraphic({ extremes, date, now }: Readonly<TideWaveGraphicProps>) {
    const chartPoints = getWaveChartPoints(extremes, date);
    const visibleChartPoints = chartPoints.filter(({ x }) => x >= 20 && x <= 980);
    const wavePath = createSmoothPath(chartPoints);
    const chartBottom = 218;
    const areaPath = `${wavePath} L ${chartPoints.at(-1)?.x ?? 0} ${chartBottom} L ${chartPoints[0]?.x ?? 0} ${chartBottom} Z`;
    const timeZone = extremes[0]?.timeZone ?? 'UTC';
    const currentTimePoint = getCurrentTimePoint(chartPoints, date, timeZone, now);
    const currentTimeLabel = `Current time ${formatTideTime(now, timeZone)}`;

    return (
        <section className={styles.tidesWavePanel} aria-labelledby='tides-wave-title'>
            <header className={styles.tidesWaveHeader}>
                <h2 id='tides-wave-title'><WavesHorizontal aria-hidden='true' /><span>Estimated Tides</span><small>distance weighted</small></h2>
            </header>
            <div className={styles.tidesWaveGraphic}>
                <svg viewBox='0 0 1000 286' role='img' aria-label='Distance-weighted average tide heights across 24 hours with 12-hour axis markers'>
                    <defs>
                        <clipPath id='tides-wave-plot-clip'>
                            <rect x='20' y='0' width='960' height='220' />
                        </clipPath>
                    </defs>
                    <g clipPath='url(#tides-wave-plot-clip)'>
                        <path className={styles.tidesWaveArea} d={areaPath} />
                        <path className={styles.tidesWaveLine} d={wavePath} />
                        {currentTimePoint && <line className={styles.tidesCurrentTimeLine} x1={currentTimePoint.x} y1='24' x2={currentTimePoint.x} y2={chartBottom} />}
                    </g>
                    {visibleChartPoints.map(({ x, y, extreme }, index) => (
                        <g key={`${extreme.time.toISOString()}-${index}`} className={`${styles.tidesWavePointGroup} ${extreme.high ? styles.tidesWavePointGroupHigh : styles.tidesWavePointGroupLow}`}>
                            <circle className={styles.tidesWavePoint} cx={x} cy={y} r='8' />
                            <text className={styles.tidesWaveValue} x={x} y={Math.max(y - 16, 18)} textAnchor='middle'>{formatLevel(extreme.level)} m</text>
                            <text className={styles.tidesWaveTime} x={x} y='246' textAnchor='middle'>{formatTideTime(extreme.time, extreme.timeZone)}</text>
                        </g>
                    ))}
                    {currentTimePoint && <g className={styles.tidesCurrentTimeMarker} aria-label={currentTimeLabel}>
                        <title>{currentTimeLabel}</title>
                        <Clock3 className={styles.tidesCurrentTimeIcon} x={currentTimePoint.x - 14} y={-8} width='28' height='28' aria-hidden='true' />
                    </g>}
                    {getWaveChartTicks(date, timeZone).map((tick) => (
                        <g key={tick.label} className={styles.tidesWaveTick}>
                            <line x1={tick.x} y1='220' x2={tick.x} y2='228' />
                            <text x={tick.x} y='274' textAnchor='middle'>{tick.label}</text>
                        </g>
                    ))}
                </svg>
            </div>
        </section>
    );
});