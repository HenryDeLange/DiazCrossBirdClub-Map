import { Bird, Clock3, Moon, Sun, SunMoon } from 'lucide-react';
import { memo, type KeyboardEvent } from 'react';
import MoonriseIcon from '../../assets/astra/moonrise.svg?react';
import MoonsetIcon from '../../assets/astra/moonset.svg?react';
import styles from './AstraPage.module.css';
import type { AstraIcon } from './astraTypes';
import { annularSectorPath, formatCurrentDate, formatMinutes, formatMoonTime, getSolarMidnightMinutes, orderSegmentsForSelection, polarPoint, ringArcPath } from './astraUtils';
import { describeMoonPhase, formatTime, type AstronomyData, type TimelineSegment } from './sunTimes';

type AstraClockPanelProps = {
    astronomy: AstronomyData;
    now: Date;
    currentMinutes: number;
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    isCurrentTimeSelected: boolean;
    showCurrentTime: boolean;
    onSelectSegment: (segment: TimelineSegment) => void;
    onSelectMarker: (markerId: string) => void;
}

export const AstraClockPanel = memo(function AstraClockPanel({ astronomy, now, currentMinutes, selectedSegmentId, selectedMarkerId, isCurrentTimeSelected, showCurrentTime, onSelectSegment, onSelectMarker }: Readonly<AstraClockPanelProps>) {
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
                    selectedSegmentId={selectedSegmentId}
                    selectedMarkerId={selectedMarkerId}
                    currentDate={formatCurrentDate(astronomy.date)}
                    currentTime={formatTime(now)}
                    isCurrentTimeSelected={isCurrentTimeSelected}
                    showCurrentTime={showCurrentTime}
                    onSelectSegment={onSelectSegment}
                    onSelectMarker={onSelectMarker}
                />
            </div>
        </div>
    );
});

type TimelineClockProps = {
    astronomy: AstronomyData;
    currentMinutes: number;
    selectedSegmentId: string | null;
    selectedMarkerId: string | null;
    currentDate: string;
    currentTime: string;
    isCurrentTimeSelected: boolean;
    showCurrentTime: boolean;
    onSelectSegment: (segment: TimelineSegment) => void;
    onSelectMarker: (markerId: string) => void;
}

const TimelineClock = memo(function TimelineClock({ astronomy, currentMinutes, selectedSegmentId, selectedMarkerId, currentDate, currentTime, isCurrentTimeSelected, showCurrentTime, onSelectSegment, onSelectMarker }: Readonly<TimelineClockProps>) {
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
            <g className={styles.astraClockCenterContent} transform='translate(160 160)'>
                <text className={styles.astraClockCenterDate} x='0' y='-32' textAnchor='middle'>{currentDate}</text>
                <SunMoon className={styles.astraClockCenterIcon} x='-12' y='-12' width='24' height='24' aria-hidden='true' />
                {showCurrentTime && <text className={styles.astraClockCenterTime} x='0' y='38' textAnchor='middle'>{currentTime}</text>}
            </g>
            {showCurrentTime && <CurrentTimeMarker minutes={currentMinutes} selected={isCurrentTimeSelected} onSelect={() => onSelectMarker('current-time')} />}
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

const CurrentTimeMarker = memo(function CurrentTimeMarker({ minutes, selected, onSelect }: Readonly<{ minutes: number; selected: boolean; onSelect: () => void }>) {
    const point = polarPoint(minutes, 60);
    const lineEnd = polarPoint(minutes, 159);
    const label = `Current time ${formatMinutes(minutes)}`;

    return (
        <g className={`${styles.astraChartMarker} ${styles.astraCurrentTimeMarker}${selected ? ` ${styles.astraChartMarkerSelected}` : ''}`} role='button' tabIndex={0} aria-label={label} onClick={onSelect} onKeyDown={(event) => handleKeyboardActivation(event, onSelect)}>
            <line className={styles.astraCurrentTimeLine} x1={point.x} y1={point.y} x2={lineEnd.x} y2={lineEnd.y} />
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