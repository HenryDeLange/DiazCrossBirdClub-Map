import { Bird, Clock3, Map, Moon, MoonStar, Sun, SunMoon } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ComponentType, type KeyboardEvent, type ReactNode, type SVGProps } from 'react';
import { getBasePathname } from '../../appRouting';
import { DateLocationControls } from '../components/DateLocationControls';
import { getQueryCoordinates, getQueryDate, isValidDateInput, type Coordinates } from '../components/dateLocationUtils';
import './astra.css';
import { describeMoonPhase, formatDateInput, formatTime, getAstronomyData, type AstronomyData, type TimelineSegment } from './sunTimes';

type AstraPageProps = {
    embedded?: boolean;
    initialCoordinates?: Coordinates;
    locationView?: boolean;
}

type SkyEvent = {
    id: string;
    label: string;
    value: string;
    icon: ReactNode;
    color: string;
    segment: TimelineSegment | null;
    markerId?: string;
    minutes: number;
}

type AstraIcon = ComponentType<SVGProps<SVGSVGElement>>;

const defaultCoordinates: Coordinates = {
    latitude: -33.64013503503463,
    longitude: 26.724985724190617
};

export default function AstraPage({ embedded = false, initialCoordinates, locationView = false }: Readonly<AstraPageProps>) {
    const queryCoordinates = embedded ? null : getQueryCoordinates();
    const queryDate = embedded ? null : getQueryDate();
    const hasExplicitCoordinates = initialCoordinates !== undefined || queryCoordinates !== null;
    const startingCoordinates = initialCoordinates ?? queryCoordinates ?? defaultCoordinates;
    const shouldRequestLocation = !hasExplicitCoordinates && typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
    const [coordinates, setCoordinates] = useState<Coordinates>(startingCoordinates);
    const [dateValue, setDateValue] = useState(queryDate ?? formatDateInput(new Date()));
    const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());
    const [inputFieldsReady, setInputFieldsReady] = useState(true);

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(intervalId);
    }, []);

    const selectedDate = getSelectedDate(dateValue);
    const hasValidCoordinates = Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude);
    const astronomy = inputFieldsReady && selectedDate !== null && hasValidCoordinates
        ? getAstronomyData(selectedDate, coordinates.latitude, coordinates.longitude)
        : null;
    const allSegments = [
        ...(astronomy?.twilightSegments ?? []),
        ...(astronomy?.birdingSegments ?? []),
        ...(astronomy?.moonSegment ? [astronomy.moonSegment] : [])
    ];
    const selectedSegment = selectedSegmentId === null
        ? null
        : allSegments.find((segment) => segment.id === selectedSegmentId) ?? null;
    const currentMinutes = minutesSinceMidnight(now);
    const skyEvents = astronomy ? buildSkyEvents(astronomy) : [];
    const isMoonSelected = selectedSegment?.id === astronomy?.moonSegment?.id;
    const isTodaySelected = selectedDate !== null && formatDateInput(selectedDate) === formatDateInput(now);
    const isCurrentTimeSelected = isTodaySelected && selectedMarkerId === 'current-time';
    const isMoonPhaseSelected = selectedMarkerId === 'moon-phase';
    const isBirdingTimesSelected = selectedMarkerId === 'birding-times';
    const isSolarNoonSelected = selectedMarkerId === 'solar-noon';
    const isMiddaySelected = selectedSegment?.id.startsWith('midday-start') ?? false;
    const isMidnightSelected = selectedSegment?.id.startsWith('midnight-start') ?? false;

    const selectSegment = (segment: TimelineSegment) => {
        setSelectedMarkerId(null);
        setSelectedSegmentId((currentSegmentId) => currentSegmentId === segment.id ? null : segment.id);
    };
    const selectMarker = (markerId: string) => {
        setSelectedSegmentId(null);
        setSelectedMarkerId((currentMarkerId) => currentMarkerId === markerId ? null : markerId);
    };
    const selectSkyEvent = (event: SkyEvent) => {
        if (event.segment) {
            selectSegment(event.segment);
        }
        else if (event.markerId) {
            selectMarker(event.markerId);
        }
    };
    const handleSegmentKeyDown = (event: KeyboardEvent<SVGElement>, segment: TimelineSegment) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectSegment(segment);
        }
    };

    const selectCurrentTime = () => {
        selectMarker('current-time');
    };

    const handleMarkerKeyDown = (event: KeyboardEvent<SVGElement>, onSelect: () => void) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
        }
    };

    return (
        <main className={`astra-page ${embedded ? 'astra-page-embedded' : ''}`}>
            <div className='astra-shell'>
                <header className='astra-header'>
                    <div className='astra-toolbar'>
                        <div className='astra-toolbar-controls'>
                            <DateLocationControls dateValue={dateValue} onDateChange={setDateValue} coordinates={coordinates} onCoordinatesChange={setCoordinates} coordinatePrecision={5} locationView={locationView} requestLocationOnMount={shouldRequestLocation} onInputValidityChange={setInputFieldsReady} idPrefix='astra' />
                        </div>
                        {!embedded && (
                            <a className='astra-map-link' href={getMapPathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>
                        )}
                    </div>
                </header>

                <section className='astra-dashboard'>
                    {!astronomy ? (
                        <p className='astra-message' role='alert'>Enter a date, latitude, and longitude to view the sun and moon chart.</p>
                    ) : <>
                    <div className='astra-clock-panel'>
                        <div className='astra-clock-wrap'>
                            <TimelineClock
                                solarSegments={astronomy.twilightSegments}
                                birdingSegments={astronomy.birdingSegments}
                                moonSegment={astronomy.moonSegment}
                                currentMinutes={currentMinutes}
                                selectedSegmentId={selectedSegmentId ?? undefined}
                                sunTimes={astronomy.sunTimes}
                                moonTimes={astronomy.moonTimes}
                                moonIlluminationFraction={astronomy.moonIllumination.fraction}
                                moonPhaseName={describeMoonPhase(astronomy.moonIllumination.phase)}
                                currentDate={formatCurrentDate(astronomy.date)}
                                currentTime={formatTime(now)}
                                selectedMarkerId={selectedMarkerId}
                                onSelect={selectSegment}
                                onKeyDown={handleSegmentKeyDown}
                                onSelectCurrentTime={selectCurrentTime}
                                onSelectMarker={selectMarker}
                                onMarkerKeyDown={handleMarkerKeyDown}
                                isCurrentTimeSelected={isCurrentTimeSelected}
                                showCurrentTime={isTodaySelected}
                            />
                        </div>
                    </div>

                    <aside className='astra-details-panel'>
                        <div className='astra-detail-heading'><span className='astra-detail-swatch' style={{ backgroundColor: isCurrentTimeSelected ? 'var(--astra-current)' : isMoonPhaseSelected ? 'var(--astra-muted)' : isBirdingTimesSelected ? '#347a72' : isSolarNoonSelected ? '#e6a63f' : selectedSegment?.color }} /><div><h2>{isCurrentTimeSelected ? 'Current time' : isMoonPhaseSelected ? 'Moon phase' : isBirdingTimesSelected ? 'Birding times' : isSolarNoonSelected ? 'Solar noon' : selectedSegment?.label ?? 'No selection'}</h2>{isCurrentTimeSelected ? <p className='astra-detail-meta'>Current time marker</p> : isMoonPhaseSelected ? <p className='astra-detail-meta'>{describeMoonPhase(astronomy.moonIllumination.phase)} · {Math.round(astronomy.moonIllumination.fraction * 100)}% illuminated</p> : isBirdingTimesSelected ? <p className='astra-detail-meta'>Prominent birding times</p> : isSolarNoonSelected ? <p className='astra-detail-meta'>Solar noon marker</p> : selectedSegment && <p className='astra-detail-meta'>{isMiddaySelected ? `Solar noon ${formatTime(astronomy.sunTimes.solarNoon)} · ` : isMidnightSelected ? `Solar midnight ${formatTime(astronomy.sunTimes.nadir)} · ` : ''}{formatDuration(selectedSegment.end.getTime() - selectedSegment.start.getTime())} of the day</p>}</div></div>
                        {isCurrentTimeSelected ? (
                            <>
                                <p className='astra-detail-description'>The clock marker shows the current local time against the solar, moonlight and birding windows.</p>
                                <div className='astra-time-range'><strong>{formatTime(now)}</strong><span>local time</span></div>
                            </>
                        ) : isMoonPhaseSelected ? (
                            <>
                                <p className='astra-detail-description'>The Moon is in its {describeMoonPhase(astronomy.moonIllumination.phase).toLowerCase()} phase and {Math.round(astronomy.moonIllumination.fraction * 100)}% illuminated.</p>
                                <MoonIlluminationDetails fraction={astronomy.moonIllumination.fraction} phase={astronomy.moonIllumination.phase} />
                            </>
                        ) : isBirdingTimesSelected ? (
                            <>
                                <p className='astra-detail-description'>This ring shows prominent birding times, including dawn calls, feeding activity, thermals and evening movement.</p>
                                <div className='astra-time-range'><strong>{astronomy.birdingSegments.length}</strong><span>birding windows</span></div>
                            </>
                        ) : isSolarNoonSelected ? (
                            <>
                                <p className='astra-detail-description'>Solar noon marks the Sun's highest point in the sky at this location.</p>
                                <div className='astra-time-range'><strong>{formatTime(astronomy.sunTimes.solarNoon)}</strong><span>local solar noon</span></div>
                            </>
                        ) : selectedSegment ? (
                            <>
                                <p className='astra-detail-description'>{selectedSegment.description}</p>
                                {isMoonSelected && (
                                    <MoonIlluminationDetails fraction={astronomy.moonIllumination.fraction} phase={astronomy.moonIllumination.phase} />
                                )}
                                <div className='astra-time-range'><strong>{formatTime(selectedSegment.start)}</strong><span>to</span><strong>{formatTime(selectedSegment.end)}</strong></div>
                            </>
                        ) : <p className='astra-detail-description'>Select a sky window on the chart or in the event list.</p>}
                        <div className='astra-event-table-wrap'>
                            <div className='astra-event-table-heading'><h3>Sky events</h3></div>
                            <div className='astra-event-table' role='list'>
                                {skyEvents.map((event) => <SkyEventRow key={event.id} event={event} isSelected={(event.segment !== null && selectedSegment !== null && event.segment.id === selectedSegment.id) || event.markerId === selectedMarkerId} onSelect={selectSkyEvent} />)}
                            </div>
                        </div>
                    </aside>
                    </>}
                </section>

            </div>
        </main>
    );
}

type TimelineClockProps = {
    solarSegments: TimelineSegment[];
    birdingSegments: TimelineSegment[];
    moonSegment: TimelineSegment | null;
    currentMinutes: number;
    selectedSegmentId?: string;
    sunTimes: AstronomyData['sunTimes'];
    moonTimes: AstronomyData['moonTimes'];
    moonIlluminationFraction: number;
    moonPhaseName: string;
    currentDate: string;
    currentTime: string;
    selectedMarkerId: string | null;
    onSelect: (segment: TimelineSegment) => void;
    onKeyDown: (event: KeyboardEvent<SVGElement>, segment: TimelineSegment) => void;
    onSelectCurrentTime: () => void;
    onSelectMarker: (markerId: string) => void;
    onMarkerKeyDown: (event: KeyboardEvent<SVGElement>, onSelect: () => void) => void;
    isCurrentTimeSelected: boolean;
    showCurrentTime: boolean;
}

function TimelineClock({ solarSegments, birdingSegments, moonSegment, currentMinutes, selectedSegmentId, sunTimes, moonTimes, moonIlluminationFraction, moonPhaseName, currentDate, currentTime, selectedMarkerId, onSelect, onKeyDown, onSelectCurrentTime, onSelectMarker, onMarkerKeyDown, isCurrentTimeSelected, showCurrentTime }: Readonly<TimelineClockProps>) {
    return (
        <svg className='astra-clock' viewBox='0 0 320 320' role='img' aria-label='Clickable circular timeline of solar light, moonlight and birding periods'>
            <circle className='astra-clock-face' cx='160' cy='160' r='148' />
            <circle className='astra-sun-track' cx='160' cy='160' r='126' />
            {orderSegmentsForSelection(solarSegments, selectedSegmentId).map((segment) => <RingSegment key={segment.id} segment={segment} innerRadius={106} outerRadius={146} selected={segment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />)}
            {orderSegmentsForSelection(birdingSegments, selectedSegmentId).map((segment) => <BirdingSegment key={segment.id} segment={segment} innerRadius={74} outerRadius={103} selected={segment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />)}
            {birdingSegments[0] && <BirdingStartMarker minutes={birdingSegments[0].startMinutes} selected={selectedMarkerId === 'birding-times'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />}
            <MoonPercentageMarker minutes={getSolarMidnightMinutes(sunTimes.solarNoon)} fraction={moonIlluminationFraction} phaseName={moonPhaseName} selected={selectedMarkerId === 'moon-phase'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />
            {moonSegment && <MoonRingSegment segment={moonSegment} selected={moonSegment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />}
            <circle className='astra-clock-center' cx='160' cy='160' r='60' />
            <g className='astra-clock-center-content' transform='translate(160 160)'>
                <text className='astra-clock-center-date' x='0' y='-36' textAnchor='middle'>{currentDate}</text>
                <CenterEventGroup rise={sunTimes.sunrise} set={sunTimes.sunset} icon={Sun} side='left' color={solarSegments.find((segment) => segment.id.startsWith('midday-start'))?.color ?? 'var(--astra-muted)'} />
                <SunMoon className='astra-clock-center-icon' x='-12' y='-12' width='24' height='24' aria-hidden='true' />
                <CenterEventGroup rise={moonTimes.rise} set={moonTimes.set} icon={Moon} side='right' color={moonSegment?.color ?? 'var(--astra-muted)'} />
                {showCurrentTime && <text className='astra-clock-center-time' x='0' y='44' textAnchor='middle'>{currentTime}</text>}
            </g>
            {showCurrentTime && <CurrentTimeMarker minutes={currentMinutes} selected={isCurrentTimeSelected} onSelect={onSelectCurrentTime} onKeyDown={onMarkerKeyDown} />}
        </svg>
    );
}

function RingSegment({ segment, innerRadius, outerRadius, selected, onSelect, onKeyDown }: Readonly<{ segment: TimelineSegment; innerRadius: number; outerRadius: number; selected: boolean; onSelect: (segment: TimelineSegment) => void; onKeyDown: (event: KeyboardEvent<SVGElement>, segment: TimelineSegment) => void }>) {
    return <path className={`astra-clock-solar-segment ${selected ? 'astra-clock-segment-selected' : ''}`} d={annularSectorPath(segment.startMinutes, segment.endMinutes, innerRadius, outerRadius)} fill={segment.color} tabIndex={0} role='button' aria-label={`${segment.label}, ${formatTime(segment.start)} to ${formatTime(segment.end)}`} onClick={() => onSelect(segment)} onKeyDown={(event) => onKeyDown(event, segment)} />;
}

function BirdingSegment({ segment, innerRadius, outerRadius, selected, onSelect, onKeyDown }: Readonly<{ segment: TimelineSegment; innerRadius: number; outerRadius: number; selected: boolean; onSelect: (segment: TimelineSegment) => void; onKeyDown: (event: KeyboardEvent<SVGElement>, segment: TimelineSegment) => void }>) {
    return <path className={`astra-birding-segment ${selected ? 'astra-clock-segment-selected' : ''}`} d={annularSectorPath(segment.startMinutes, segment.endMinutes, innerRadius, outerRadius)} fill={segment.color} tabIndex={0} role='button' aria-label={`${segment.label}, ${formatTime(segment.start)} to ${formatTime(segment.end)}`} onClick={() => onSelect(segment)} onKeyDown={(event) => onKeyDown(event, segment)} />;
}

function BirdingStartMarker({ minutes, selected, onSelect, onKeyDown }: Readonly<{ minutes: number; selected: boolean; onSelect: (markerId: string) => void; onKeyDown: (event: KeyboardEvent<SVGElement>, onSelect: () => void) => void }>) {
    const point = polarPoint(minutes - 30, 88);
    const select = () => onSelect('birding-times');
    return <g className={`astra-birding-start-marker ${selected ? 'astra-birding-marker-selected' : ''}`} role='button' tabIndex={0} aria-label='Prominent birding times' onClick={select} onKeyDown={(event) => onKeyDown(event, select)}><circle className='astra-birding-start-marker-pad' cx={point.x} cy={point.y} r='10' /><Bird x={point.x - 7} y={point.y - 7} width='14' height='14' aria-hidden='true' /></g>;
}

function MoonRingSegment({ segment, selected, onSelect, onKeyDown }: Readonly<{ segment: TimelineSegment; selected: boolean; onSelect: (segment: TimelineSegment) => void; onKeyDown: (event: KeyboardEvent<SVGElement>, segment: TimelineSegment) => void }>) {
    const isFullDay = segment.endMinutes - segment.startMinutes >= 1439;
    const className = `astra-moon-segment ${selected ? 'astra-clock-segment-selected' : ''}`;

    if (isFullDay) {
        return <circle className={className} cx='160' cy='160' r='153' tabIndex={0} role='button' aria-label='Moonlight, all day' onClick={() => onSelect(segment)} onKeyDown={(event) => onKeyDown(event, segment)} />;
    }

    return <path className={className} d={ringArcPath(segment.startMinutes, segment.endMinutes, 153)} tabIndex={0} role='button' aria-label={`${segment.label}, ${formatTime(segment.start)} to ${formatTime(segment.end)}`} onClick={() => onSelect(segment)} onKeyDown={(event) => onKeyDown(event, segment)} />;
}

type EventMarkerLayout = {
    contentPoint: { x: number; y: number };
}

function CenterEventGroup({ rise, set, icon: Icon, side, color }: Readonly<{ rise: Date | null | undefined; set: Date | null | undefined; icon: AstraIcon; side: 'left' | 'right'; color: string }>) {
    const x = side === 'left' ? -31 : 31;

    return (
        <g className='astra-clock-center-event-group' style={{ color }}>
            <Icon x={x - 5.5} y='-20' width='11' height='11' aria-hidden='true' />
            <text x={x} y='4' textAnchor='middle'>{formatTime(rise)}</text>
            <text x={x} y='17' textAnchor='middle'>{formatTime(set)}</text>
        </g>
    );
}

function CurrentTimeMarker({ minutes, selected, onSelect, onKeyDown }: Readonly<{ minutes: number; selected: boolean; onSelect: () => void; onKeyDown: (event: KeyboardEvent<SVGElement>, onSelect: () => void) => void }>) {
    const point = polarPoint(minutes, 60);
    const lineStart = polarPoint(minutes, 60);
    const lineEnd = polarPoint(minutes, 159);
    const label = `Current time ${formatMinutes(minutes)}`;

    return (
        <g className={`astra-chart-marker astra-current-time-marker ${selected ? 'astra-chart-marker-selected' : ''}`} role='button' tabIndex={0} aria-label={label} onClick={onSelect} onKeyDown={(event) => onKeyDown(event, onSelect)}>
            <line className='astra-current-time-line' x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} />
            <circle className='astra-current-time-hit-area' cx={point.x} cy={point.y} r='10' />
            <Clock3 className='astra-current-time-icon' x={point.x - 6} y={point.y - 6} width='12' height='12' aria-hidden='true' />
        </g>
    );
}

function SkyEventRow({ event, isSelected, onSelect }: Readonly<{ event: SkyEvent; isSelected: boolean; onSelect: (event: SkyEvent) => void }>) {
    const content = <><span className='astra-event-icon' style={{ color: event.color }}>{event.icon}</span><span className='astra-event-label'>{event.label}</span><strong>{event.value}</strong></>;
    const segment = event.segment;

    if (!segment && !event.markerId) {
        return <div className='astra-event-row astra-event-row-disabled' role='listitem'>{content}</div>;
    }

    return <button type='button' className={`astra-event-row ${isSelected ? 'astra-event-row-selected' : ''}`} onClick={() => onSelect(event)} aria-pressed={isSelected}>{content}</button>;
}

function buildSkyEvents(astronomy: AstronomyData): SkyEvent[] {
    const solarSegments = astronomy.twilightSegments;
    const twilightEvents = solarSegments.map((segment) => ({
        id: `twilight-${segment.id}`,
        label: segment.label,
        value: formatTime(segment.start),
        icon: segment.label === 'Night' || segment.label === 'Midnight' ? <MoonStar size={16} aria-hidden='true' /> : <Sun size={16} aria-hidden='true' />,
        color: segment.color,
        segment,
        minutes: segment.startMinutes
    }));
    const sunEvents = [
        { id: 'sunrise', label: 'Sunrise', value: formatTime(astronomy.sunTimes.sunrise), time: astronomy.sunTimes.sunrise, icon: <Sun size={15} aria-hidden='true' /> },
        { id: 'solar-noon', label: 'Solar noon', value: formatTime(astronomy.sunTimes.solarNoon), time: astronomy.sunTimes.solarNoon, icon: <Sun size={15} aria-hidden='true' /> },
        { id: 'sunset', label: 'Sunset', value: formatTime(astronomy.sunTimes.sunset), time: astronomy.sunTimes.sunset, icon: <Sun size={15} aria-hidden='true' /> }
    ].map((event) => ({
        ...event,
        color: '#e6a63f',
        segment: null,
        markerId: event.id,
        minutes: isValidDate(event.time) ? minutesSinceMidnight(event.time) : 2000
    }));
    const moonEvents = [
        {
            id: 'moonrise',
            label: 'Moonrise',
            value: formatMoonTime(astronomy.moonTimes.rise, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown),
            time: astronomy.moonTimes.rise,
            icon: <Moon size={15} aria-hidden='true' />,
            segment: null,
            markerId: 'moonrise'
        },
        {
            id: 'moonset',
            label: 'Moonset',
            value: formatMoonTime(astronomy.moonTimes.set, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown),
            time: astronomy.moonTimes.set,
            icon: <Moon size={15} aria-hidden='true' />,
            segment: null,
            markerId: 'moonset'
        }
    ].map((event) => ({
        ...event,
        color: '#718aa6',
        minutes: isValidDate(event.time) ? minutesOnTimeline(event.time, astronomy.date) : 2100
    }));

    return [...twilightEvents, ...sunEvents, ...moonEvents].sort((first, second) => first.minutes - second.minutes);
}

function annularSectorPath(startMinutes: number, endMinutes: number, innerRadius: number, outerRadius: number): string {
    const startOuter = polarPoint(startMinutes, outerRadius);
    const endOuter = polarPoint(endMinutes, outerRadius);
    const endInner = polarPoint(endMinutes, innerRadius);
    const startInner = polarPoint(startMinutes, innerRadius);
    const largeArc = endMinutes - startMinutes > 720 ? 1 : 0;
    return `M ${startOuter.x} ${startOuter.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} L ${endInner.x} ${endInner.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y} Z`;
}

function ringArcPath(startMinutes: number, endMinutes: number, radius: number): string {
    const start = polarPoint(startMinutes, radius);
    const end = polarPoint(endMinutes, radius);
    const largeArc = endMinutes - startMinutes > 720 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function polarPoint(minutes: number, radius: number): { x: number; y: number } {
    const angle = (minutes / 1440) * Math.PI * 2 - Math.PI / 2;
    return { x: 160 + Math.cos(angle) * radius, y: 160 + Math.sin(angle) * radius };
}

function minutesSinceMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const remainingMinutes = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
}

function formatDuration(milliseconds: number): string {
    const minutes = Math.round(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`;
}

function formatMoonTime(value: Date | undefined, alwaysUp?: boolean, alwaysDown?: boolean): string {
    if (alwaysUp) return 'Always above';
    if (alwaysDown) return 'Below horizon';
    return formatTime(value);
}

function isValidDate(value: Date | null | undefined): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

function getMapPathname(): string {
    return getBasePathname();
}

function MoonPercentageMarker({ minutes, fraction, phaseName, selected, onSelect, onKeyDown }: Readonly<{ minutes: number; fraction: number; phaseName: string; selected: boolean; onSelect: (markerId: string) => void; onKeyDown: (event: KeyboardEvent<SVGElement>, onSelect: () => void) => void }>) {
    const point = polarPoint(minutes, 105);
    const select = () => onSelect('moon-phase');

    return (
        <g className={`astra-birding-phase-marker ${selected ? 'astra-birding-marker-selected' : ''}`} role='button' tabIndex={0} aria-label={`${phaseName}, ${Math.round(fraction * 100)} percent illuminated`} onClick={select} onKeyDown={(event) => onKeyDown(event, select)}>
            <circle className='astra-birding-phase-marker-pad' cx={point.x} cy={point.y} r='17' />
            <Moon className='astra-birding-phase-icon' x={point.x - 7} y={point.y - 13} width='14' height='14' aria-hidden='true' />
            <text x={point.x} y={point.y + 8} textAnchor='middle' dominantBaseline='middle'>{Math.round(fraction * 100)}%</text>
        </g>
    );
}

function MoonIlluminationDetails({ fraction, phase }: Readonly<{ fraction: number; phase: number }>) {
    const percentage = Math.round(fraction * 100);

    return (
        <ul className='astra-moon-selected'>
            <li className='astra-moon-phase-name'><Moon size={18} aria-hidden='true' /><strong>{describeMoonPhase(phase)}</strong></li>
            <li className='astra-illumination'><span className='astra-moon-pie' style={{ '--moon-illumination': `${percentage}%` } as CSSProperties} aria-label={`${percentage} percent illuminated`} /><strong>{percentage}%</strong><span>illuminated</span></li>
        </ul>
    );
}

function oppositeMinutes(minutes: number): number {
    return (minutes + 720) % 1440;
}

function getSolarMidnightMinutes(solarNoon: Date | null | undefined): number {
    return isValidDate(solarNoon) ? oppositeMinutes(minutesSinceMidnight(solarNoon)) : 0;
}

function orderSegmentsForSelection(segments: TimelineSegment[], selectedSegmentId?: string | null): TimelineSegment[] {
    return [...segments].sort((first, second) => Number(first.id === selectedSegmentId) - Number(second.id === selectedSegmentId));
}

function formatCurrentDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function getSelectedDate(value: string): Date | null {
    if (!isValidDateInput(value)) {
        return null;
    }

    const date = new Date(`${value}T12:00:00`);
    return isValidDate(date) ? date : null;
}

function minutesOnTimeline(date: Date, timelineStart: Date): number {
    const startDay = Date.UTC(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());
    const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOffset = Math.round((dateDay - startDay) / 86400000);
    return minutesSinceMidnight(date) + dayOffset * 1440;
}
