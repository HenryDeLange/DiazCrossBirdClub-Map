import { Bird, CalendarDays, Clock3, Locate, LocateFixed, Map, MapPin, Moon, MoonStar, Sun, SunMoon, Sunrise, Sunset } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ComponentType, type KeyboardEvent, type ReactNode, type SVGProps } from 'react';
import MoonriseIcon from '../assets/astra/moonrise.svg?react';
import MoonsetIcon from '../assets/astra/moonset.svg?react';
import { getBasePathname } from '../map/locationUtils';
import './astra.css';
import { describeMoonPhase, formatDateInput, formatTime, getAstronomyData, type AstronomyData, type TimelineSegment } from './sunTimes';

export type Coordinates = {
    latitude: number;
    longitude: number;
}

type AstraPageProps = {
    embedded?: boolean;
    initialCoordinates?: Coordinates;
    locationView?: boolean;
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

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

type ChartIcon = ComponentType<SVGProps<SVGSVGElement>>;

const defaultCoordinates: Coordinates = {
    latitude: -33.64013503503463,
    longitude: 26.724985724190617
};

const decimalInputPattern = /^-?\d*(?:\.\d*)?$/;

export default function AstraPage({ embedded = false, initialCoordinates, locationView = false }: Readonly<AstraPageProps>) {
    const queryCoordinates = embedded ? null : getQueryCoordinates();
    const queryDate = embedded ? null : getQueryDate();
    const hasExplicitCoordinates = initialCoordinates !== undefined || queryCoordinates !== null;
    const startingCoordinates = initialCoordinates ?? queryCoordinates ?? defaultCoordinates;
    const shouldRequestLocation = !hasExplicitCoordinates && typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
    const [coordinates, setCoordinates] = useState<Coordinates>(startingCoordinates);
    const [latitudeInput, setLatitudeInput] = useState(formatCoordinate(startingCoordinates.latitude));
    const [longitudeInput, setLongitudeInput] = useState(formatCoordinate(startingCoordinates.longitude));
    const [dateValue, setDateValue] = useState(queryDate ?? formatDateInput(new Date()));
    const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [locationStatus, setLocationStatus] = useState<LocationStatus>(shouldRequestLocation ? 'loading' : 'idle');
    const [locationStatusMessage, setLocationStatusMessage] = useState(shouldRequestLocation ? 'Locating...' : '');
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!shouldRequestLocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextCoordinates = getCoordinatesFromPosition(position);
                setCoordinates(nextCoordinates);
                setLatitudeInput(formatCoordinate(nextCoordinates.latitude));
                setLongitudeInput(formatCoordinate(nextCoordinates.longitude));
                setLocationStatus('success');
                setLocationStatusMessage('GPS point loaded');
            },
            () => {
                setLocationStatus('error');
                setLocationStatusMessage('Could not load GPS point');
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    }, [shouldRequestLocation]);

    useEffect(() => {
        if (locationStatus === 'idle' || locationStatus === 'loading') {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setLocationStatus('idle');
            setLocationStatusMessage('');
        }, locationStatus === 'success' ? 1900 : 2600);

        return () => window.clearTimeout(timeoutId);
    }, [locationStatus]);

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(new Date()), 60000);
        return () => window.clearInterval(intervalId);
    }, []);

    const selectedDate = getSelectedDate(dateValue);
    const astronomy = getAstronomyData(selectedDate, coordinates.latitude, coordinates.longitude);
    const allSegments = [
        ...astronomy.twilightSegments,
        ...astronomy.birdingSegments,
        ...(astronomy.moonSegment ? [astronomy.moonSegment] : [])
    ];
    const selectedSegment = selectedSegmentId === null
        ? null
        : allSegments.find((segment) => segment.id === selectedSegmentId) ?? null;
    const currentMinutes = minutesSinceMidnight(now);
    const skyEvents = buildSkyEvents(astronomy);
    const isMoonSelected = selectedSegment?.id === astronomy.moonSegment?.id;
    const isCurrentTimeSelected = selectedMarkerId === 'current-time';
    const isMoonPhaseSelected = selectedMarkerId === 'moon-phase';
    const isBirdingTimesSelected = selectedMarkerId === 'birding-times';
    const isSolarNoonSelected = selectedMarkerId === 'solar-noon';

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

    const handleCoordinateInput = (kind: keyof Coordinates, value: string) => {
        if (!decimalInputPattern.test(value)) {
            return;
        }

        if (kind === 'latitude') {
            setLatitudeInput(value);
        }
        else {
            setLongitudeInput(value);
        }

        if (value === '' || value === '-' || value === '.' || value === '-.') {
            return;
        }

        const numericValue = Number(value);
        const isInRange = kind === 'latitude'
            ? numericValue >= -90 && numericValue <= 90
            : numericValue >= -180 && numericValue <= 180;

        if (Number.isFinite(numericValue) && isInRange) {
            setCoordinates((current) => ({ ...current, [kind]: roundCoordinate(numericValue) }));
        }
    };

    const normalizeCoordinateInput = (kind: keyof Coordinates) => {
        const value = kind === 'latitude' ? latitudeInput : longitudeInput;
        const numericValue = Number(value);
        const isInRange = kind === 'latitude'
            ? numericValue >= -90 && numericValue <= 90
            : numericValue >= -180 && numericValue <= 180;

        if (!Number.isFinite(numericValue) || !isInRange) {
            return;
        }

        const roundedValue = roundCoordinate(numericValue);
        setCoordinates((current) => ({ ...current, [kind]: roundedValue }));

        if (kind === 'latitude') {
            setLatitudeInput(formatCoordinate(roundedValue));
        }
        else {
            setLongitudeInput(formatCoordinate(roundedValue));
        }
    };

    const requestCurrentLocation = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setLocationStatus('error');
            setLocationStatusMessage('GPS is not available');
            return;
        }

        setLocationStatus('loading');
        setLocationStatusMessage('Locating...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextCoordinates = getCoordinatesFromPosition(position);
                setCoordinates(nextCoordinates);
                setLatitudeInput(String(nextCoordinates.latitude));
                setLongitudeInput(String(nextCoordinates.longitude));
                setLocationStatus('success');
                setLocationStatusMessage('GPS point loaded');
            },
            () => {
                setLocationStatus('error');
                setLocationStatusMessage('Could not load GPS point');
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    };

    return (
        <main className={`astra-page ${embedded ? 'astra-page-embedded' : ''}`}>
            <div className='astra-shell'>
                <header className='astra-header'>
                    <div className='astra-toolbar'>
                        <div className='astra-toolbar-controls'>
                            <div className='astra-field-section astra-date-block'>
                                <div className='astra-section-label astra-date-label' title='Date'>
                                    <CalendarDays size={18} aria-hidden='true' />
                                    <span className='astra-visually-hidden'>Date</span>
                                </div>
                                <input id='astra-date' type='date' aria-label='Date' value={dateValue} onChange={(event) => setDateValue(event.target.value)} />
                            </div>
                            <div className='astra-field-section astra-location-block'>
                                <div className='astra-section-label' title='Location'><MapPin size={18} aria-hidden='true' /><span className='astra-visually-hidden'>Location</span></div>
                                <div className={`astra-coordinate-controls ${locationView ? 'astra-coordinate-controls-readonly' : ''}`}>
                                    <label><span className='astra-coordinate-label-full'>Latitude</span><span className='astra-coordinate-label-short'>Lat.</span><input aria-label='Latitude' inputMode='decimal' pattern='-?[0-9]*[.]?[0-9]*' value={latitudeInput} readOnly={locationView} onChange={(event) => handleCoordinateInput('latitude', event.target.value)} onBlur={() => normalizeCoordinateInput('latitude')} onKeyDown={handleDecimalKeyDown} /></label>
                                    <label><span className='astra-coordinate-label-full'>Longitude</span><span className='astra-coordinate-label-short'>Long.</span><input aria-label='Longitude' inputMode='decimal' pattern='-?[0-9]*[.]?[0-9]*' value={longitudeInput} readOnly={locationView} onChange={(event) => handleCoordinateInput('longitude', event.target.value)} onBlur={() => normalizeCoordinateInput('longitude')} onKeyDown={handleDecimalKeyDown} /></label>
                                    {!locationView && <button type='button' className={`astra-ghost-button ${locationStatus === 'loading' ? 'astra-location-loading' : ''} ${locationStatus === 'success' ? 'astra-location-success' : ''}`} onClick={requestCurrentLocation} title='Use current location' aria-label='Use current location' aria-busy={locationStatus === 'loading'}>{locationStatus === 'success' ? <LocateFixed size={18} /> : <Locate size={18} />}</button>}
                                </div>
                                {locationStatus === 'error' && <span className='astra-location-status astra-location-status-error' role='status' aria-live='polite'>{locationStatusMessage}</span>}
                            </div>
                        </div>
                        {!embedded && (
                            <a className='astra-map-link' href={getMapPathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>
                        )}
                    </div>
                </header>

                <section className='astra-dashboard'>
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
                                currentDate={formatCurrentDate(selectedDate)}
                                currentTime={formatTime(now)}
                                selectedMarkerId={selectedMarkerId}
                                onSelect={selectSegment}
                                onKeyDown={handleSegmentKeyDown}
                                onSelectCurrentTime={selectCurrentTime}
                                onSelectMarker={selectMarker}
                                onMarkerKeyDown={handleMarkerKeyDown}
                                isCurrentTimeSelected={isCurrentTimeSelected}
                            />
                        </div>
                    </div>

                    <aside className='astra-details-panel'>
                        <div className='astra-detail-heading'><span className='astra-detail-swatch' style={{ backgroundColor: isCurrentTimeSelected ? 'var(--astra-current)' : isMoonPhaseSelected ? 'var(--astra-muted)' : isBirdingTimesSelected ? '#347a72' : isSolarNoonSelected ? '#e6a63f' : selectedSegment?.color }} /><div><h2>{isCurrentTimeSelected ? 'Current time' : isMoonPhaseSelected ? 'Moon phase' : isBirdingTimesSelected ? 'Birding times' : isSolarNoonSelected ? 'Solar noon' : selectedSegment?.label ?? 'No selection'}</h2>{isCurrentTimeSelected ? <p className='astra-detail-meta'>Current time marker</p> : isMoonPhaseSelected ? <p className='astra-detail-meta'>{describeMoonPhase(astronomy.moonIllumination.phase)} · {Math.round(astronomy.moonIllumination.fraction * 100)}% illuminated</p> : isBirdingTimesSelected ? <p className='astra-detail-meta'>Prominent birding times</p> : isSolarNoonSelected ? <p className='astra-detail-meta'>Solar noon marker</p> : selectedSegment && <p className='astra-detail-meta'>{formatDuration(selectedSegment.end.getTime() - selectedSegment.start.getTime())} of the day</p>}</div></div>
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
}

function TimelineClock({ solarSegments, birdingSegments, moonSegment, currentMinutes, selectedSegmentId, sunTimes, moonTimes, moonIlluminationFraction, moonPhaseName, currentDate, currentTime, selectedMarkerId, onSelect, onKeyDown, onSelectCurrentTime, onSelectMarker, onMarkerKeyDown, isCurrentTimeSelected }: Readonly<TimelineClockProps>) {
    const eventMarkerLayouts = getEventMarkerLayouts([
        { id: 'sunrise', time: sunTimes.sunrise, iconSize: 12 },
        { id: 'solar-noon', time: sunTimes.solarNoon, iconSize: 12 },
        { id: 'sunset', time: sunTimes.sunset, iconSize: 12 },
        { id: 'moonrise', time: moonTimes.rise, iconSize: 16 },
        { id: 'moonset', time: moonTimes.set, iconSize: 16 }
    ]);

    return (
        <svg className='astra-clock' viewBox='-42 -42 404 404' role='img' aria-label='Clickable circular timeline of solar light, moonlight and birding periods'>
            <circle className='astra-clock-face' cx='160' cy='160' r='148' />
            <circle className='astra-sun-track' cx='160' cy='160' r='126' />
            {orderSegmentsForSelection(solarSegments, selectedSegmentId).map((segment) => <RingSegment key={segment.id} segment={segment} innerRadius={106} outerRadius={146} selected={segment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />)}
            {orderSegmentsForSelection(birdingSegments, selectedSegmentId).map((segment) => <BirdingSegment key={segment.id} segment={segment} innerRadius={74} outerRadius={103} selected={segment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />)}
            {birdingSegments[0] && <BirdingStartMarker minutes={birdingSegments[0].startMinutes} selected={selectedMarkerId === 'birding-times'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />}
            <MoonPercentageMarker minutes={oppositeMinutes(minutesSinceMidnight(sunTimes.solarNoon))} fraction={moonIlluminationFraction} phaseName={moonPhaseName} selected={selectedMarkerId === 'moon-phase'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />
            {moonSegment && <MoonRingSegment segment={moonSegment} selected={moonSegment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />}
            <circle className='astra-clock-center' cx='160' cy='160' r='52' />
            <g className='astra-clock-center-content' transform='translate(160 160)'>
                <text className='astra-clock-center-date' x='0' y='-18' textAnchor='middle'>{currentDate}</text>
                <SunMoon className='astra-clock-center-icon' x='-10' y='-10' width='20' height='20' aria-hidden='true' />
                <text className='astra-clock-center-time' x='0' y='20' textAnchor='middle'>{currentTime}</text>
            </g>
            <EventMarker time={sunTimes.sunrise} label='Sunrise' icon={Sunrise} layout={eventMarkerLayouts.sunrise} markerId='sunrise' selected={selectedMarkerId === 'sunrise'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />
            <EventMarker time={sunTimes.solarNoon} label='Solar noon' icon={Sun} layout={eventMarkerLayouts['solar-noon']} markerId='solar-noon' selected={selectedMarkerId === 'solar-noon'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />
            <EventMarker time={sunTimes.sunset} label='Sunset' icon={Sunset} layout={eventMarkerLayouts.sunset} markerId='sunset' selected={selectedMarkerId === 'sunset'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />
            <EventMarker time={moonTimes.rise} label='Moonrise' icon={MoonriseIcon} iconSize={16} layout={eventMarkerLayouts.moonrise} markerId='moonrise' selected={selectedMarkerId === 'moonrise'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />
            <EventMarker time={moonTimes.set} label='Moonset' icon={MoonsetIcon} iconSize={16} layout={eventMarkerLayouts.moonset} markerId='moonset' selected={selectedMarkerId === 'moonset'} onSelect={onSelectMarker} onKeyDown={onMarkerKeyDown} />
            <CurrentTimeMarker minutes={currentMinutes} selected={isCurrentTimeSelected} onSelect={onSelectCurrentTime} onKeyDown={onMarkerKeyDown} />
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
    return <g className={`astra-birding-start-marker ${selected ? 'astra-birding-marker-selected' : ''}`} role='button' tabIndex={0} aria-label='Prominent birding times' onClick={select} onKeyDown={(event) => onKeyDown(event, select)}><circle className='astra-birding-start-marker-pad' cx={point.x} cy={point.y} r='10' /><Bird x={point.x - 5} y={point.y - 5} width='10' height='10' aria-hidden='true' /></g>;
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
    lineStart: { x: number; y: number };
    lineEnd: { x: number; y: number };
    textPoint: { x: number; y: number };
    iconPoint: { x: number; y: number };
    textAnchor: 'start' | 'middle' | 'end';
}

function EventMarker({ time, icon: Icon, iconSize = 12, layout, label, markerId, selected, onSelect, onKeyDown }: Readonly<{ time: Date | null | undefined; label: string; icon: ChartIcon; iconSize?: number; layout: EventMarkerLayout | null; markerId: string; selected: boolean; onSelect: (markerId: string) => void; onKeyDown: (event: KeyboardEvent<SVGElement>, onSelect: () => void) => void }>) {
    if (!isValidDate(time) || !layout) {
        return null;
    }

    const select = () => onSelect(markerId);

    return (
        <g className={`astra-event-marker ${selected ? 'astra-event-marker-selected' : ''}`} role='button' tabIndex={0} aria-label={`${label} ${formatTime(time)}`} onClick={select} onKeyDown={(event) => onKeyDown(event, select)}>
            <circle className='astra-event-marker-hit-area' cx={layout.iconPoint.x} cy={layout.iconPoint.y} r='10' />
            <line x1={layout.lineStart.x} y1={layout.lineStart.y} x2={layout.lineEnd.x} y2={layout.lineEnd.y} />
            <Icon className='astra-event-marker-icon' x={layout.iconPoint.x - iconSize / 2} y={layout.iconPoint.y - iconSize / 2} width={iconSize} height={iconSize} aria-hidden='true' />
            <text x={layout.textPoint.x} y={layout.textPoint.y} textAnchor={layout.textAnchor} dominantBaseline='middle'>{formatTime(time)}</text>
        </g>
    );
}

function CurrentTimeMarker({ minutes, selected, onSelect, onKeyDown }: Readonly<{ minutes: number; selected: boolean; onSelect: () => void; onKeyDown: (event: KeyboardEvent<SVGElement>, onSelect: () => void) => void }>) {
    const point = polarPoint(minutes, 52);
    const label = `Current time ${formatMinutes(minutes)}`;

    return (
        <g className={`astra-chart-marker astra-current-time-marker ${selected ? 'astra-chart-marker-selected' : ''}`} role='button' tabIndex={0} aria-label={label} onClick={onSelect} onKeyDown={(event) => onKeyDown(event, onSelect)}>
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

function getCoordinatesFromPosition(position: GeolocationPosition): Coordinates {
    return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };
}

function handleDecimalKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length > 1) {
        return;
    }

    const input = event.currentTarget;
    const nextValue = `${input.value.slice(0, input.selectionStart ?? input.value.length)}${event.key}${input.value.slice(input.selectionEnd ?? input.value.length)}`;
    if (!decimalInputPattern.test(nextValue)) {
        event.preventDefault();
    }
}

function isValidDate(value: Date | null | undefined): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

function getQueryCoordinates(): Coordinates | null {
    const params = new URLSearchParams(window.location.search);
    const latitudeValue = params.get('lat');
    const longitudeValue = params.get('lng');

    if (latitudeValue === null || longitudeValue === null) {
        return null;
    }

    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? { latitude, longitude } : null;
}

function getMapPathname(): string {
    return getBasePathname();
}

function getQueryDate(): string | null {
    const value = new URLSearchParams(window.location.search).get('date');
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) ? value : null;
}

function MoonPercentageMarker({ minutes, fraction, phaseName, selected, onSelect, onKeyDown }: Readonly<{ minutes: number; fraction: number; phaseName: string; selected: boolean; onSelect: (markerId: string) => void; onKeyDown: (event: KeyboardEvent<SVGElement>, onSelect: () => void) => void }>) {
    const point = polarPoint(minutes, 88);
    const select = () => onSelect('moon-phase');

    return (
        <g className={`astra-birding-phase-marker ${selected ? 'astra-birding-marker-selected' : ''}`} role='button' tabIndex={0} aria-label={`${phaseName}, ${Math.round(fraction * 100)} percent illuminated`} onClick={select} onKeyDown={(event) => onKeyDown(event, select)}>
            <circle className='astra-birding-phase-marker-pad' cx={point.x} cy={point.y} r='17' />
            <Moon className='astra-birding-phase-icon' x={point.x - 5} y={point.y - 9} width='10' height='10' aria-hidden='true' />
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

type EventMarkerDefinition = {
    id: string;
    time: Date | null | undefined;
    iconSize: number;
}

type ChartBounds = {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

function getEventMarkerLayouts(definitions: EventMarkerDefinition[]): Record<string, EventMarkerLayout | null> {
    const layouts: Record<string, EventMarkerLayout | null> = {};
    const placedBounds: ChartBounds[] = [];
    const displayOffsets = [0, -24, 24, -36, 36, -48, 48, -72, 72, -108, 108];

    for (const definition of definitions) {
        if (!isValidDate(definition.time)) {
            layouts[definition.id] = null;
            continue;
        }

        const eventMinutes = minutesSinceMidnight(definition.time);
        let chosenLayout: EventMarkerLayout | null = null;
        let chosenBounds: ChartBounds | null = null;

        for (const displayOffset of displayOffsets) {
            const layout = getEventMarkerLayout(eventMinutes, definition.iconSize, eventMinutes + displayOffset);
            const bounds = getEventMarkerBounds(layout, definition.iconSize);
            if (!placedBounds.some((placed) => boundsOverlap(bounds, placed, 4))) {
                chosenLayout = layout;
                chosenBounds = bounds;
                break;
            }
        }

        chosenLayout ??= getEventMarkerLayout(eventMinutes, definition.iconSize, eventMinutes + displayOffsets[displayOffsets.length - 1]);
        chosenBounds ??= getEventMarkerBounds(chosenLayout, definition.iconSize);
        layouts[definition.id] = chosenLayout;
        placedBounds.push(chosenBounds);
    }

    return layouts;
}

function getEventMarkerLayout(eventMinutes: number, iconSize: number, displayMinutes: number): EventMarkerLayout {
    const labelRadius = 171;
    const labelHeight = 10;
    const labelGap = 4;
    const iconTextCenterGap = iconSize / 2 + labelGap + labelHeight / 2;
    const angle = (displayMinutes / 1440) * Math.PI * 2 - Math.PI / 2;
    const labelPoint = polarPoint(displayMinutes, labelRadius);
    const isSideMarker = Math.abs(Math.cos(angle)) >= 0.75;
    const textAnchor = isSideMarker ? (Math.cos(angle) > 0 ? 'start' : 'end') : 'middle';
    const iconPoint = isSideMarker
        ? {
            x: labelPoint.x + (Math.cos(angle) > 0 ? iconSize / 2 : -iconSize / 2),
            y: labelPoint.y - iconTextCenterGap
        }
        : polarPoint(displayMinutes, labelRadius + iconTextCenterGap);

    return {
        lineStart: polarPoint(eventMinutes, 146),
        lineEnd: polarPoint(eventMinutes, 160),
        textPoint: labelPoint,
        iconPoint,
        textAnchor
    };
}

function getEventMarkerBounds(layout: EventMarkerLayout, iconSize: number): ChartBounds {
    const textHalfWidth = 26;
    const textHalfHeight = 5;
    const iconHalfSize = iconSize / 2 + 2;
    const textLeft = layout.textAnchor === 'start' ? layout.textPoint.x : layout.textAnchor === 'end' ? layout.textPoint.x - textHalfWidth : layout.textPoint.x - textHalfWidth;
    const textRight = layout.textAnchor === 'start' ? layout.textPoint.x + textHalfWidth : layout.textAnchor === 'end' ? layout.textPoint.x : layout.textPoint.x + textHalfWidth;

    return {
        left: Math.min(textLeft, layout.iconPoint.x - iconHalfSize),
        right: Math.max(textRight, layout.iconPoint.x + iconHalfSize),
        top: Math.min(layout.textPoint.y - textHalfHeight, layout.iconPoint.y - iconHalfSize),
        bottom: Math.max(layout.textPoint.y + textHalfHeight, layout.iconPoint.y + iconHalfSize)
    };
}

function boundsOverlap(first: ChartBounds, second: ChartBounds, padding: number): boolean {
    return first.left < second.right + padding && first.right + padding > second.left && first.top < second.bottom + padding && first.bottom + padding > second.top;
}

function orderSegmentsForSelection(segments: TimelineSegment[], selectedSegmentId?: string | null): TimelineSegment[] {
    return [...segments].sort((first, second) => Number(first.id === selectedSegmentId) - Number(second.id === selectedSegmentId));
}

function formatCurrentDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function getSelectedDate(value: string): Date {
    const date = value ? new Date(`${value}T12:00:00`) : new Date();
    return isValidDate(date) ? date : new Date();
}

function roundCoordinate(value: number): number {
    return Math.round(value * 100000) / 100000;
}

function formatCoordinate(value: number): string {
    return roundCoordinate(value).toFixed(5);
}

function minutesOnTimeline(date: Date, timelineStart: Date): number {
    const startDay = Date.UTC(timelineStart.getFullYear(), timelineStart.getMonth(), timelineStart.getDate());
    const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOffset = Math.round((dateDay - startDay) / 86400000);
    return minutesSinceMidnight(date) + dayOffset * 1440;
}