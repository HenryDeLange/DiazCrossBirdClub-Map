import { Bird, ChevronLeft, ChevronRight, Clock3, Moon, RotateCcw, Sun, SunMoon } from 'lucide-react';
import { memo, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import MoonriseIcon from '../../assets/astra/moonrise.svg?react';
import MoonsetIcon from '../../assets/astra/moonset.svg?react';
import styles from './AstraPage.module.css';
import { getTimelineSegmentIcon } from './astraEventData';
import type { AstraIcon } from './astraTypes';
import { annularSectorPath, formatCurrentDate, formatMinutes, formatMoonTime, getSolarMidnightMinutes, orderSegmentsForSelection, polarPoint, ringArcPath } from './astraUtils';
import { describeMoonPhase, formatDateInput, formatTime, type AstronomyData, type TimelineSegment } from './sunTimes';

type AstraClockPanelProps = {
    astronomy: AstronomyData;
    now: Date;
    currentMinutes: number;
    onDateChange: (value: string) => void;
    selectedSegment: TimelineSegment | null;
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    isCurrentTimeSelected: boolean;
    isTimeAdjusted: boolean;
    onSelectSegment: (segment: TimelineSegment) => void;
    onSelectMarker: (markerId: string) => void;
    onTimeChange: (minutes: number) => void;
    onResetTime: () => void;
}

export const AstraClockPanel = memo(function AstraClockPanel({ astronomy, now, currentMinutes, onDateChange, selectedSegment, selectedSegmentId, selectedMarkerId, isCurrentTimeSelected, isTimeAdjusted, onSelectSegment, onSelectMarker, onTimeChange, onResetTime }: Readonly<AstraClockPanelProps>) {
    return (
        <div className={styles.astraClockPanel}>
            <ClockCornerEvent markerId='moonrise' label='Moonrise' value={formatMoonTime(astronomy.moonTimes.rise, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown)} icon={MoonriseIcon} position='top-left' tone='moon' selected={selectedMarkerId === 'moonrise'} onSelect={onSelectMarker} />
            <ClockCornerEvent markerId='moonset' label='Moonset' value={formatMoonTime(astronomy.moonTimes.set, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown)} icon={MoonsetIcon} position='top-right' tone='moon' selected={selectedMarkerId === 'moonset'} onSelect={onSelectMarker} />
            <ClockCornerEvent markerId='sunrise' label='Sunrise' value={formatTime(astronomy.sunTimes.sunrise)} icon={Sun} position='bottom-left' tone='sun' selected={selectedMarkerId === 'sunrise'} onSelect={onSelectMarker} />
            <ClockCornerEvent markerId='sunset' label='Sunset' value={formatTime(astronomy.sunTimes.sunset)} icon={Sun} position='bottom-right' tone='sun' selected={selectedMarkerId === 'sunset'} onSelect={onSelectMarker} />
            <div className={styles.astraClockWrap}>
                <TimelineClock
                    astronomy={astronomy}
                    currentMinutes={currentMinutes}
                    onDateChange={onDateChange}
                    selectedSegment={selectedSegment}
                    selectedSegmentId={selectedSegmentId}
                    selectedMarkerId={selectedMarkerId}
                    currentDate={formatCurrentDate(astronomy.date)}
                    currentTime={formatTime(now)}
                    isCurrentTimeSelected={isCurrentTimeSelected}
                    isTimeAdjusted={isTimeAdjusted}
                    onSelectSegment={onSelectSegment}
                    onSelectMarker={onSelectMarker}
                    onTimeChange={onTimeChange}
                    onResetTime={onResetTime}
                />
            </div>
        </div>
    );
});

type TimelineClockProps = {
    astronomy: AstronomyData;
    currentMinutes: number;
    onDateChange: (value: string) => void;
    selectedSegment: TimelineSegment | null;
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    currentDate: string;
    currentTime: string;
    isCurrentTimeSelected: boolean;
    isTimeAdjusted: boolean;
    onSelectSegment: (segment: TimelineSegment) => void;
    onSelectMarker: (markerId: string) => void;
    onTimeChange: (minutes: number) => void;
    onResetTime: () => void;
}

const TimelineClock = memo(function TimelineClock({ astronomy, currentMinutes, onDateChange, selectedSegment, selectedSegmentId, selectedMarkerId, currentDate, currentTime, isCurrentTimeSelected, isTimeAdjusted, onSelectSegment, onSelectMarker, onTimeChange, onResetTime }: Readonly<TimelineClockProps>) {
    const CenterIcon: AstraIcon = selectedSegment ? getTimelineSegmentIcon(selectedSegment, astronomy) : SunMoon;
    const centerIconSize = selectedSegment ? 20 : 24;
    const shiftDate = (amount: number) => {
        const nextDate = new Date(astronomy.date);
        nextDate.setDate(nextDate.getDate() + amount);
        onDateChange(formatDateInput(nextDate));
    };

    return (
        <svg className={styles.astraClock} viewBox='0 0 320 320' role='img' aria-label='Clickable circular timeline of solar light, moonlight and birding periods'>
            <circle className={styles.astraClockFace} cx='160' cy='160' r='148' />
            <circle className={styles.astraSunTrack} cx='160' cy='160' r='126' />
            {orderSegmentsForSelection(astronomy.twilightSegments, selectedSegmentId).map((segment) => <RingSegment key={segment.id} segment={segment} innerRadius={106} outerRadius={146} selected={segment.id === selectedSegmentId} onSelect={onSelectSegment} />)}
            {orderSegmentsForSelection(astronomy.birdingSegments, selectedSegmentId).map((segment) => <BirdingSegment key={segment.id} segment={segment} innerRadius={74} outerRadius={103} selected={segment.id === selectedSegmentId} onSelect={onSelectSegment} />)}
            {astronomy.birdingSegments[0] && <BirdingStartMarker minutes={astronomy.birdingSegments[0].startMinutes} selected={selectedMarkerId === 'birding-times'} onSelect={onSelectMarker} />}
            <MoonPercentageMarker minutes={getSolarMidnightMinutes(astronomy.sunTimes.solarNoon)} fraction={astronomy.moonIllumination.fraction} phaseName={describeMoonPhase(astronomy.moonIllumination.phase)} selected={selectedMarkerId === 'moon-phase'} onSelect={onSelectMarker} />
            {astronomy.moonSegment && <MoonRingSegment segment={astronomy.moonSegment} selected={astronomy.moonSegment.id === selectedSegmentId} onSelect={onSelectSegment} />}
            <circle className={styles.astraClockCenter} cx='160' cy='160' r='60' />
            <circle
                className={styles.astraClockTimeJumpArea}
                cx='160'
                cy='160'
                r='60'
                aria-hidden='true'
                onClick={(event) => {
                    const minutes = getMinutesAtPointer(event.clientX, event.clientY, event.currentTarget.ownerSVGElement);
                    if (minutes !== null) {
                        onTimeChange(minutes);
                    }
                }}
            />
            <g className={styles.astraClockCenterContent} transform='translate(160 160)'>
                <g className={styles.astraClockDateNavigation} role='button' tabIndex={0} aria-label='Previous day' onClick={() => shiftDate(-1)} onKeyDown={(event) => handleKeyboardActivation(event, () => shiftDate(-1))}>
                    <title>Previous day</title>
                    <circle cx='-31.5' cy='-29' r='9' fill='transparent' />
                    <ChevronLeft className={styles.astraClockDateNavigationIcon} x='-39.5' y='-37' width='16' height='16' aria-hidden='true' />
                </g>
                <text className={styles.astraClockCenterDate} x='0' y='-24' textAnchor='middle'>{currentDate}</text>
                <g className={styles.astraClockDateNavigation} role='button' tabIndex={0} aria-label='Next day' onClick={() => shiftDate(1)} onKeyDown={(event) => handleKeyboardActivation(event, () => shiftDate(1))}>
                    <title>Next day</title>
                    <circle cx='31.5' cy='-29' r='9' fill='transparent' />
                    <ChevronRight className={styles.astraClockDateNavigationIcon} x='23.5' y='-37' width='16' height='16' aria-hidden='true' />
                </g>
                {selectedSegment && <>
                    <text className={styles.astraClockCenterSegmentTime} x='-13.5' y='0' textAnchor='end' dominantBaseline='middle' fill={selectedSegment.color}>{formatTime(selectedSegment.start)}</text>
                    <text className={styles.astraClockCenterSegmentTime} x='13.5' y='0' textAnchor='start' dominantBaseline='middle' fill={selectedSegment.color}>{formatTime(selectedSegment.end)}</text>
                </>}
                <CenterIcon className={styles.astraClockCenterIcon} x={-centerIconSize / 2} y={-centerIconSize / 2} width={centerIconSize} height={centerIconSize} style={{ color: selectedSegment?.color ?? 'var(--astra-muted)', width: centerIconSize, height: centerIconSize }} aria-hidden='true' />
                <text className={styles.astraClockCenterTime} x='0' y='29' textAnchor='middle'>{currentTime}</text>
                {isTimeAdjusted && <g className={styles.astraClockCenterResetTime} role='button' tabIndex={0} aria-label='Reset to current time' onClick={onResetTime} onKeyDown={(event) => handleKeyboardActivation(event, onResetTime)}>
                    <title>Reset to current time</title>
                    <circle cx='0' cy='43' r='7' />
                    <RotateCcw x='-5' y='38' width='10' height='10' aria-hidden='true' />
                </g>}
            </g>
            <CurrentTimeMarker minutes={currentMinutes} selected={isCurrentTimeSelected} onSelect={() => onSelectMarker('current-time')} onTimeChange={onTimeChange} />
        </svg>
    );
});

type SegmentProps = {
    segment: TimelineSegment;
    innerRadius: number;
    outerRadius: number;
    selected: boolean;
    onSelect: (segment: TimelineSegment) => void;
}

const RingSegment = memo(function RingSegment({ segment, innerRadius, outerRadius, selected, onSelect }: Readonly<SegmentProps>) {
    return <path className={`${styles.astraClockSolarSegment}${selected ? ` ${styles.astraClockSegmentSelected}` : ''}`} d={annularSectorPath(segment.startMinutes, segment.endMinutes, innerRadius, outerRadius)} fill={segment.color} tabIndex={0} role='button' aria-label={`${segment.label}, ${formatTime(segment.start)} to ${formatTime(segment.end)}`} onClick={() => onSelect(segment)} onKeyDown={(event) => handleKeyboardActivation(event, () => onSelect(segment))} />;
});

const BirdingSegment = memo(function BirdingSegment({ segment, innerRadius, outerRadius, selected, onSelect }: Readonly<SegmentProps>) {
    return <path className={`${styles.astraBirdingSegment}${selected ? ` ${styles.astraClockSegmentSelected}` : ''}`} d={annularSectorPath(segment.startMinutes, segment.endMinutes, innerRadius, outerRadius)} fill={segment.color} tabIndex={0} role='button' aria-label={`${segment.label}, ${formatTime(segment.start)} to ${formatTime(segment.end)}`} onClick={() => onSelect(segment)} onKeyDown={(event) => handleKeyboardActivation(event, () => onSelect(segment))} />;
});

type MarkerProps = {
    selected: boolean;
    onSelect: (markerId: string) => void;
}

const BirdingStartMarker = memo(function BirdingStartMarker({ minutes, selected, onSelect }: Readonly<{ minutes: number } & MarkerProps>) {
    const point = polarPoint(minutes - 30, 88);
    const select = () => onSelect('birding-times');
    return <g className={`${styles.astraBirdingStartMarker}${selected ? ` ${styles.astraBirdingMarkerSelected}` : ''}`} role='button' tabIndex={0} aria-label='Prominent birding times' onClick={select} onKeyDown={(event) => handleKeyboardActivation(event, select)}><circle className={styles.astraBirdingStartMarkerPad} cx={point.x} cy={point.y} r='10' /><Bird x={point.x - 7} y={point.y - 7} width='14' height='14' aria-hidden='true' /></g>;
});

const MoonRingSegment = memo(function MoonRingSegment({ segment, selected, onSelect }: Readonly<{ segment: TimelineSegment; selected: boolean; onSelect: (segment: TimelineSegment) => void }>) {
    const isFullDay = segment.endMinutes - segment.startMinutes >= 1439;
    const className = selected ? `${styles.astraMoonSegment} ${styles.astraClockSegmentSelected}` : styles.astraMoonSegment;

    if (isFullDay) {
        return <circle className={className} cx='160' cy='160' r='153' tabIndex={0} role='button' aria-label='Moonlight, all day' onClick={() => onSelect(segment)} onKeyDown={(event) => handleKeyboardActivation(event, () => onSelect(segment))} />;
    }

    return <path className={className} d={ringArcPath(segment.startMinutes, segment.endMinutes, 153)} tabIndex={0} role='button' aria-label={`${segment.label}, ${formatTime(segment.start)} to ${formatTime(segment.end)}`} onClick={() => onSelect(segment)} onKeyDown={(event) => handleKeyboardActivation(event, () => onSelect(segment))} />;
});

type ClockCornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type ClockCornerTone = 'moon' | 'sun';

const cornerPositionClasses: Record<ClockCornerPosition, string> = {
    'top-left': styles.astraClockCornerTopLeft,
    'top-right': styles.astraClockCornerTopRight,
    'bottom-left': styles.astraClockCornerBottomLeft,
    'bottom-right': styles.astraClockCornerBottomRight
};

const cornerToneClasses: Record<ClockCornerTone, string> = {
    moon: styles.astraClockCornerMoon,
    sun: styles.astraClockCornerSun
};

const ClockCornerEvent = memo(function ClockCornerEvent({ markerId, label, value, icon: Icon, position, tone, selected, onSelect }: Readonly<{ markerId: string; label: string; value: string; icon: AstraIcon; position: ClockCornerPosition; tone: ClockCornerTone; selected: boolean; onSelect: (markerId: string) => void }>) {
    const className = `${styles.astraClockCorner} ${cornerPositionClasses[position]} ${cornerToneClasses[tone]}${selected ? ` ${styles.astraClockCornerSelected}` : ''}`;
    return (
        <button type='button' className={className} aria-label={`${label} ${value}`} aria-pressed={selected} onClick={() => onSelect(markerId)}>
            <Icon aria-hidden='true' />
            <span><small>{label}</small><strong>{value}</strong></span>
        </button>
    );
});

const CurrentTimeMarker = memo(function CurrentTimeMarker({ minutes, selected, onSelect, onTimeChange }: Readonly<{ minutes: number; selected: boolean; onSelect: () => void; onTimeChange: (minutes: number) => void }>) {
    const hasDragged = useRef(false);
    const point = polarPoint(minutes, 60);
    const lineStart = polarPoint(minutes, 72);
    const lineEnd = polarPoint(minutes, 159);
    const label = `Current time ${formatMinutes(minutes)}`;
    const handlePointerDown = (event: PointerEvent<SVGGElement>) => {
        event.preventDefault();
        hasDragged.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent<SVGGElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
        }

        const nextMinutes = getMinutesAtPointer(event.clientX, event.clientY, event.currentTarget.ownerSVGElement);
        if (nextMinutes !== null) {
            hasDragged.current = true;
            onTimeChange(nextMinutes);
        }
    };
    const handlePointerUp = (event: PointerEvent<SVGGElement>) => {
        if (hasDragged.current) {
            const nextMinutes = getMinutesAtPointer(event.clientX, event.clientY, event.currentTarget.ownerSVGElement);
            if (nextMinutes !== null) {
                onTimeChange(nextMinutes);
            }
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };
    const handlePointerCancel = (event: PointerEvent<SVGGElement>) => {
        hasDragged.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };
    const handleClick = () => {
        if (hasDragged.current) {
            hasDragged.current = false;
            return;
        }

        onSelect();
    };
    const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
        const minuteSteps: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 };
        if (event.key in minuteSteps) {
            event.preventDefault();
            onTimeChange(Math.max(0, Math.min(1439, Math.floor(minutes) + minuteSteps[event.key])));
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            onTimeChange(0);
        }
        else if (event.key === 'End') {
            event.preventDefault();
            onTimeChange(1439);
        }
        else {
            handleKeyboardActivation(event, onSelect);
        }
    };

    return (
        <g className={`${styles.astraChartMarker} ${styles.astraCurrentTimeMarker}${selected ? ` ${styles.astraChartMarkerSelected}` : ''}`} role='slider' tabIndex={0} aria-label={label} aria-valuemin={0} aria-valuemax={1439} aria-valuenow={Math.floor(minutes)} aria-valuetext={formatMinutes(minutes)} onClick={handleClick} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}>
            <line className={styles.astraCurrentTimeLine} x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} />
            <circle className={styles.astraCurrentTimeHitArea} cx={point.x} cy={point.y} r='10' />
            <Clock3 className={styles.astraCurrentTimeIcon} x={point.x - 6} y={point.y - 6} width='12' height='12' aria-hidden='true' />
        </g>
    );
});

const MoonPercentageMarker = memo(function MoonPercentageMarker({ minutes, fraction, phaseName, selected, onSelect }: Readonly<{ minutes: number; fraction: number; phaseName: string; selected: boolean; onSelect: (markerId: string) => void }>) {
    const point = polarPoint(minutes, 105);
    const select = () => onSelect('moon-phase');
    const percentage = Math.round(fraction * 100);

    return (
        <g className={`${styles.astraBirdingPhaseMarker}${selected ? ` ${styles.astraBirdingMarkerSelected}` : ''}`} role='button' tabIndex={0} aria-label={`${phaseName}, ${percentage} percent illuminated`} onClick={select} onKeyDown={(event) => handleKeyboardActivation(event, select)}>
            <circle className={styles.astraBirdingPhaseMarkerPad} cx={point.x} cy={point.y} r='17' />
            <Moon className={styles.astraBirdingPhaseIcon} x={point.x - 7} y={point.y - 13} width='14' height='14' aria-hidden='true' />
            <text x={point.x} y={point.y + 8} textAnchor='middle' dominantBaseline='middle'>{percentage}%</text>
        </g>
    );
});

function handleKeyboardActivation(event: KeyboardEvent<SVGElement>, onSelect: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect();
    }
}

function getMinutesAtPointer(clientX: number, clientY: number, svg: SVGSVGElement | null): number | null {
    const inverseMatrix = svg?.getScreenCTM()?.inverse();
    if (!inverseMatrix) {
        return null;
    }

    const point = new DOMPoint(clientX, clientY).matrixTransform(inverseMatrix);
    const angle = Math.atan2(point.y - 160, point.x - 160) + Math.PI / 2;
    const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
    return Math.round((normalizedAngle / (Math.PI * 2)) * 1440) % 1440;
}