import { ChevronLeft, ChevronRight, Clock3, RotateCcw, WavesHorizontal } from 'lucide-react';
import { memo, type KeyboardEvent, type PointerEvent } from 'react';
import styles from './TidesPage.module.css';
import type { WeightedTideExtreme } from './tideData';
import { createSmoothPath, formatDateInput, formatLevel, formatTideTime, getCurrentTimePoint, getDateAtTimeInTimeZone, getMinutesOfDayInTimeZone, getWaveChartPoints, getWaveChartTicks } from './tidesUtils';

type TideWaveGraphicProps = {
    extremes: WeightedTideExtreme[];
    date: Date;
    now: Date;
    nowAdjusted: boolean;
    onDateChange: (value: string) => void;
    onTimeChange: (value: Date) => void;
    onResetTime: () => void;
}

export const TideWaveGraphic = memo(function TideWaveGraphic({ extremes, date, now, nowAdjusted, onDateChange, onTimeChange, onResetTime }: Readonly<TideWaveGraphicProps>) {
    const chartPoints = getWaveChartPoints(extremes, date);
    const visibleChartPoints = chartPoints.filter(({ x }) => x >= 20 && x <= 980);
    const wavePath = createSmoothPath(chartPoints);
    const chartBottom = 198;
    const areaPath = `${wavePath} L ${chartPoints.at(-1)?.x ?? 0} ${chartBottom} L ${chartPoints[0]?.x ?? 0} ${chartBottom} Z`;
    const timeZone = extremes[0]?.timeZone ?? 'UTC';
    const currentTimePoint = getCurrentTimePoint(chartPoints, timeZone, now);
    const currentTimeLabel = `Selected time ${formatTideTime(now, timeZone)}`;
    const minutesOfDay = getMinutesOfDayInTimeZone(now, timeZone);

    const setTimeFromMinutes = (value: number) => {
        const boundedMinutes = Math.max(0, Math.min(1439, value));
        onTimeChange(getDateAtTimeInTimeZone(date, timeZone, Math.floor(boundedMinutes / 60), boundedMinutes % 60));
    };

    const getMinutesFromPointer = (event: PointerEvent<SVGGElement>) => {
        const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
        if (!bounds?.width) {
            return null;
        }

        const pointerX = ((event.clientX - bounds.left) / bounds.width) * 1000;
        const chartX = Math.max(20, Math.min(980, pointerX));
        return Math.max(0, Math.min(1439, Math.round(((chartX - 20) / 960) * 1440)));
    };

    const handlePointerDown = (event: PointerEvent<SVGGElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const nextMinutes = getMinutesFromPointer(event);
        if (nextMinutes !== null) {
            setTimeFromMinutes(nextMinutes);
        }
    };

    const handlePointerMove = (event: PointerEvent<SVGGElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
        }

        const nextMinutes = getMinutesFromPointer(event);
        if (nextMinutes !== null) {
            setTimeFromMinutes(nextMinutes);
        }
    };

    const handlePointerUp = (event: PointerEvent<SVGGElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
        const minuteSteps: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 };
        if (event.key in minuteSteps) {
            event.preventDefault();
            setTimeFromMinutes(minutesOfDay + minuteSteps[event.key]);
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            setTimeFromMinutes(0);
        }
        else if (event.key === 'End') {
            event.preventDefault();
            setTimeFromMinutes(1439);
        }
    };

    const shiftDate = (amount: number) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + amount);
        onDateChange(formatDateInput(nextDate));
    };

    return (
        <section className={styles.tidesWavePanel} aria-labelledby='tides-wave-title'>
            <header className={styles.tidesWaveHeader}>
                <h2 id='tides-wave-title'>
                    <WavesHorizontal aria-hidden='true' />
                    <span>Estimated Tides</span>
                    {nowAdjusted && <button type='button' className={styles.tidesResetTime} onClick={onResetTime} aria-label='Reset to current time' title='Reset to current time'><RotateCcw aria-hidden='true' /></button>}
                    <span className={styles.tidesWaveNavigation}>
                        <button type='button' className={styles.tidesDayButton} onClick={() => shiftDate(-1)} aria-label='Previous day' title='Previous day'><ChevronLeft aria-hidden='true' /></button>
                        <button type='button' className={styles.tidesDayButton} onClick={() => shiftDate(1)} aria-label='Next day' title='Next day'><ChevronRight aria-hidden='true' /></button>
                    </span>
                </h2>
            </header>
            <div className={styles.tidesWaveGraphic}>
                <svg viewBox='0 -26 1000 312' role='img' aria-label='Estimated tide heights across 24 hours with 12-hour axis markers'>
                    <defs>
                        <clipPath id='tides-wave-plot-clip'>
                            <rect x='20' y='0' width='960' height='230' />
                        </clipPath>
                    </defs>
                    <g clipPath='url(#tides-wave-plot-clip)'>
                        <path className={styles.tidesWaveArea} d={areaPath} />
                        <path className={styles.tidesWaveLine} d={wavePath} />
                        {currentTimePoint && <line className={styles.tidesCurrentTimeLine} x1={currentTimePoint.x} y1='8' x2={currentTimePoint.x} y2='220' />}
                    </g>
                    {visibleChartPoints.map(({ x, y, extreme }, index) => (
                        <g key={`${extreme.time.toISOString()}-${index}`} className={`${styles.tidesWavePointGroup} ${extreme.high ? styles.tidesWavePointGroupHigh : styles.tidesWavePointGroupLow}`}>
                            <line className={styles.tidesWaveTimeGuide} x1={x} y1={y + 8} x2={x} y2='228' />
                            <circle className={styles.tidesWavePoint} cx={x} cy={y} r='8' />
                            <text className={styles.tidesWaveValue} x={x} y={y - 20} textAnchor='middle'>{formatLevel(extreme.level)} m</text>
                            <text className={styles.tidesWaveTime} x={x} y='246' textAnchor='middle'>{formatTideTime(extreme.time, extreme.timeZone)}</text>
                        </g>
                    ))}
                    {currentTimePoint && <g
                        className={styles.tidesCurrentTimeMarker}
                        role='slider'
                        tabIndex={0}
                        aria-label='Selected tide time'
                        aria-valuemin={0}
                        aria-valuemax={1439}
                        aria-valuenow={minutesOfDay}
                        aria-valuetext={formatTideTime(now, timeZone)}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onKeyDown={handleKeyDown}
                    >
                        <title>{currentTimeLabel}. Drag or use the arrow keys to change time.</title>
                        <line className={styles.tidesCurrentTimeHitArea} x1={currentTimePoint.x} y1='8' x2={currentTimePoint.x} y2='220' />
                        <circle className={styles.tidesCurrentTimeCircle} cx={currentTimePoint.x} cy='-8' r='16' />
                        <Clock3 className={styles.tidesCurrentTimeIcon} x={currentTimePoint.x - 11} y={-19} width='22' height='22' aria-hidden='true' />
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