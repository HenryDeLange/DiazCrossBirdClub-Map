import { ChevronLeft, ChevronRight, Clock3, RotateCcw, WavesHorizontal } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { formatCurrentDate } from '../astra/astraUtils';
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
    const chartPoints = useMemo(() => getWaveChartPoints(extremes, date), [date, extremes]);
    const visibleChartPoints = useMemo(() => chartPoints.filter(({ x }) => x >= 20 && x <= 980), [chartPoints]);
    const wavePath = useMemo(() => createSmoothPath(chartPoints), [chartPoints]);
    const areaPath = useMemo(() => `${wavePath} L ${chartPoints.at(-1)?.x ?? 0} 198 L ${chartPoints[0]?.x ?? 0} 198 Z`, [chartPoints, wavePath]);
    const timeZone = extremes[0]?.timeZone ?? 'UTC';
    const chartTicks = useMemo(() => getWaveChartTicks(date, timeZone), [date, timeZone]);
    const currentTimePoint = getCurrentTimePoint(chartPoints, timeZone, now);
    const currentTimeLabel = `Selected time ${formatTideTime(now, timeZone)}`;
    const minutesOfDay = getMinutesOfDayInTimeZone(now, timeZone);
    const pendingMinutes = useRef<number | null>(null);
    const pendingFrame = useRef<number | null>(null);

    useEffect(() => () => {
        if (pendingFrame.current !== null) {
            cancelAnimationFrame(pendingFrame.current);
        }
    }, []);

    const setTimeFromMinutes = (value: number) => {
        const boundedMinutes = Math.max(0, Math.min(1439, value));
        if (boundedMinutes === minutesOfDay) {
            return;
        }

        onTimeChange(getDateAtTimeInTimeZone(date, timeZone, Math.floor(boundedMinutes / 60), boundedMinutes % 60));
    };

    const getMinutesFromClientX = (clientX: number, svg: SVGSVGElement | null) => {
        const bounds = svg?.getBoundingClientRect();
        if (!bounds?.width) {
            return null;
        }

        const pointerX = ((clientX - bounds.left) / bounds.width) * 1000;
        const chartX = Math.max(20, Math.min(980, pointerX));
        return Math.max(0, Math.min(1439, Math.round(((chartX - 20) / 960) * 1440)));
    };

    const getMinutesFromPointer = (event: PointerEvent<SVGGElement>) => getMinutesFromClientX(event.clientX, event.currentTarget.ownerSVGElement);

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
        if (nextMinutes === null) {
            return;
        }

        pendingMinutes.current = nextMinutes;
        if (pendingFrame.current === null) {
            pendingFrame.current = requestAnimationFrame(() => {
                pendingFrame.current = null;
                const pending = pendingMinutes.current;
                pendingMinutes.current = null;
                if (pending !== null) {
                    setTimeFromMinutes(pending);
                }
            });
        }
    };

    const handlePointerUp = (event: PointerEvent<SVGGElement>) => {
        if (pendingFrame.current !== null) {
            cancelAnimationFrame(pendingFrame.current);
            pendingFrame.current = null;
        }
        pendingMinutes.current = null;
        const nextMinutes = getMinutesFromPointer(event);
        if (nextMinutes !== null) {
            setTimeFromMinutes(nextMinutes);
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleChartClick = (event: MouseEvent<SVGSVGElement>) => {
        const nextMinutes = getMinutesFromClientX(event.clientX, event.currentTarget);
        if (nextMinutes !== null) {
            setTimeFromMinutes(nextMinutes);
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
                        <time className={styles.tidesDayDate} dateTime={formatDateInput(date)}>{formatCurrentDate(date)}</time>
                        <button type='button' className={styles.tidesDayButton} onClick={() => shiftDate(1)} aria-label='Next day' title='Next day'><ChevronRight aria-hidden='true' /></button>
                    </span>
                </h2>
            </header>
            <div className={styles.tidesWaveGraphic}>
                <svg viewBox='0 -26 1000 312' role='img' aria-label='Estimated tide heights across 24 hours. Click or tap the graph to select a time. 12-hour axis markers' onClick={handleChartClick}>
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
                    {chartTicks.map((tick) => (
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