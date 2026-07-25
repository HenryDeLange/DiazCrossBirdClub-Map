import { CalendarDays, Crosshair, Map, Moon, Sun } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent } from 'react';
import './astra.css';
import { describeMoonPhase, formatDateInput, formatTime, getAstronomyData, type TimelineSegment } from './sunTimes';

type Coordinates = {
    latitude: number;
    longitude: number;
}

const defaultCoordinates: Coordinates = {
    latitude: -33.64013503503463,
    longitude: 26.724985724190617
};

export default function AstraPage() {
    const queryCoordinates = getQueryCoordinates();
    const queryDate = getQueryDate();
    const hasExplicitCoordinates = queryCoordinates !== null;
    const [coordinates, setCoordinates] = useState<Coordinates>(queryCoordinates ?? defaultCoordinates);
    const [latitudeInput, setLatitudeInput] = useState(String(queryCoordinates?.latitude ?? defaultCoordinates.latitude));
    const [longitudeInput, setLongitudeInput] = useState(String(queryCoordinates?.longitude ?? defaultCoordinates.longitude));
    const [dateValue, setDateValue] = useState(queryDate ?? formatDateInput(new Date()));
    const [selectedSegmentId, setSelectedSegmentId] = useState('early-morning');

    useEffect(() => {
        if (hasExplicitCoordinates || typeof navigator === 'undefined' || !navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextCoordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setCoordinates(nextCoordinates);
                setLatitudeInput(String(nextCoordinates.latitude));
                setLongitudeInput(String(nextCoordinates.longitude));
            },
        );
    }, [hasExplicitCoordinates]);

    const selectedDate = new Date(`${dateValue}T12:00:00`);
    const astronomy = getAstronomyData(selectedDate, coordinates.latitude, coordinates.longitude);
    const allSegments = [...astronomy.twilightSegments, ...astronomy.birdingSegments];
    const selectedSegment = allSegments.find((segment) => segment.id === selectedSegmentId) ?? astronomy.birdingSegments[0] ?? astronomy.twilightSegments[0];

    const selectSegment = (segment: TimelineSegment) => setSelectedSegmentId(segment.id);
    const handleSegmentKeyDown = (event: KeyboardEvent<SVGPathElement>, segment: TimelineSegment) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectSegment(segment);
        }
    };

    const updateCoordinate = (kind: keyof Coordinates, value: string) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return;
        }

        if (kind === 'latitude' && (numericValue < -90 || numericValue > 90)) {
            return;
        }

        if (kind === 'longitude' && (numericValue < -180 || numericValue > 180)) {
            return;
        }

        setCoordinates((current) => ({ ...current, [kind]: numericValue }));
    };

    const requestCurrentLocation = () => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextCoordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setCoordinates(nextCoordinates);
                setLatitudeInput(String(nextCoordinates.latitude));
                setLongitudeInput(String(nextCoordinates.longitude));
            },
        );
    };

    return (
        <main className='astra-page'>
            <div className='astra-shell'>
                <header className='astra-header'>
                    <div className='astra-toolbar'>
                        <div className='astra-toolbar-controls'>
                            <div className='astra-date-block'>
                                <label htmlFor='astra-date'><CalendarDays size={16} /> Date</label>
                                <input id='astra-date' type='date' value={dateValue} onChange={(event) => setDateValue(event.target.value)} />
                            </div>
                            <div className='astra-coordinate-controls'>
                                <label>Lat <input aria-label='Latitude' inputMode='decimal' value={latitudeInput} onChange={(event) => { setLatitudeInput(event.target.value); updateCoordinate('latitude', event.target.value); }} /></label>
                                <label>Lng <input aria-label='Longitude' inputMode='decimal' value={longitudeInput} onChange={(event) => { setLongitudeInput(event.target.value); updateCoordinate('longitude', event.target.value); }} /></label>
                                <button type='button' className='astra-icon-button' onClick={requestCurrentLocation} title='Use current location' aria-label='Use current location'><Crosshair size={17} /></button>
                            </div>
                        </div>
                        <a className='astra-map-link' href={getMapPathname()} aria-label='Back to birding map' title='Back to birding map'><Map size={18} /></a>
                    </div>
                </header>

                <section className='astra-dashboard'>
                    <div className='astra-clock-panel'>
                        <div className='astra-clock-wrap'>
                            <TimelineClock segments={astronomy.twilightSegments} secondarySegments={astronomy.birdingSegments} selectedSegmentId={selectedSegment?.id} onSelect={selectSegment} onKeyDown={handleSegmentKeyDown} />
                        </div>
                        <div className='astra-clock-key'><span><i className='astra-key-dot astra-key-sky' /> Twilight / solar light</span><span><i className='astra-key-dot astra-key-bird' /> Birding rhythm</span></div>
                    </div>

                    <aside className='astra-details-panel'>
                        <div className='astra-detail-heading'><span className='astra-detail-swatch' style={{ backgroundColor: selectedSegment?.color }} /><div><p className='astra-kicker'>Selected</p><h2>{selectedSegment?.label ?? 'No solar window'}</h2></div></div>
                        {selectedSegment ? (
                            <>
                                <p className='astra-detail-description'>{selectedSegment.description}</p>
                                <div className='astra-time-range'><strong>{formatTime(selectedSegment.start)}</strong><span>to</span><strong>{formatTime(selectedSegment.end)}</strong></div>
                                <p className='astra-detail-meta'>{formatDuration(selectedSegment.end.getTime() - selectedSegment.start.getTime())} of the day</p>
                            </>
                        ) : <p className='astra-detail-description'>SunCalc could not find a visible solar window for this date and location.</p>}
                        <div className='astra-event-list'>
                            <EventRow icon={<Sun size={15} />} label='Sunrise' value={formatTime(astronomy.sunTimes.sunrise)} />
                            <EventRow icon={<Sun size={15} />} label='Solar noon' value={formatTime(astronomy.sunTimes.solarNoon)} />
                            <EventRow icon={<Sun size={15} />} label='Sunset' value={formatTime(astronomy.sunTimes.sunset)} />
                        </div>
                    </aside>
                </section>

                <section className='astra-lower-grid'>
                    <div className='astra-section-block'>
                        <div className='astra-section-heading'><div><p className='astra-kicker'>Outer ring</p><h2>Twilight</h2></div></div>
                        <div className='astra-legend-grid'>{astronomy.twilightSegments.filter(uniqueByLabel).map((segment) => <LegendButton key={segment.id} segment={segment} isSelected={selectedSegment?.label === segment.label} onSelect={selectSegment} />)}</div>
                    </div>
                    <div className='astra-moon-block'>
                        <div className='astra-section-heading'><div><p className='astra-kicker'>Night watch</p><h2><Moon size={19} /> Moon</h2></div><span className='astra-moon-phase'>{getMoonGlyph(astronomy.moonIllumination.phase)}</span></div>
                        <div className='astra-moon-content'>
                            <div className='astra-moon-visual' aria-hidden='true'><Moon size={48} strokeWidth={1.4} /></div>
                            <div><strong>{describeMoonPhase(astronomy.moonIllumination.phase)}</strong><span>{Math.round(astronomy.moonIllumination.fraction * 100)}% illuminated</span></div>
                        </div>
                        <div className='astra-moon-times'><span><small>Moonrise</small><strong>{formatMoonTime(astronomy.moonTimes.rise, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown)}</strong></span><span><small>Moonset</small><strong>{formatMoonTime(astronomy.moonTimes.set, astronomy.moonTimes.alwaysUp, astronomy.moonTimes.alwaysDown)}</strong></span></div>
                    </div>
                </section>

                <footer className='astra-footer'>SunCalc · {Intl.DateTimeFormat().resolvedOptions().timeZone} · {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</footer>
            </div>
        </main>
    );
}

type TimelineClockProps = {
    segments: TimelineSegment[];
    secondarySegments: TimelineSegment[];
    selectedSegmentId?: string;
    onSelect: (segment: TimelineSegment) => void;
    onKeyDown: (event: KeyboardEvent<SVGPathElement>, segment: TimelineSegment) => void;
}

function TimelineClock({ segments, secondarySegments, selectedSegmentId, onSelect, onKeyDown }: Readonly<TimelineClockProps>) {
    return (
        <svg className='astra-clock' viewBox='0 0 320 320' role='img' aria-label='Clickable circular timeline of twilight and birding periods'>
            <circle className='astra-clock-face' cx='160' cy='160' r='142' />
            <circle className='astra-clock-track' cx='160' cy='160' r='123' />
            {segments.map((segment) => <ClockSegment key={segment.id} segment={segment} radius={123} width={42} selected={segment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />)}
            <circle className='astra-clock-track astra-clock-inner-track' cx='160' cy='160' r='91' />
            {secondarySegments.map((segment) => <ClockSegment key={segment.id} segment={segment} radius={91} width={27} selected={segment.id === selectedSegmentId} onSelect={onSelect} onKeyDown={onKeyDown} />)}
            <circle className='astra-clock-center' cx='160' cy='160' r='63' />
            <text className='astra-clock-center-label' x='160' y='151' textAnchor='middle'>LOCAL SKY</text>
            <text className='astra-clock-center-time' x='160' y='174' textAnchor='middle'>24 HOURS</text>
            {[0, 6, 12, 18].map((hour) => { const point = polarPoint(hour * 60, 145); return <text key={hour} className='astra-clock-hour' x={point.x} y={point.y} textAnchor='middle'>{hour.toString().padStart(2, '0')}</text>; })}
        </svg>
    );
}

type ClockSegmentProps = {
    segment: TimelineSegment;
    radius: number;
    width: number;
    selected: boolean;
    onSelect: (segment: TimelineSegment) => void;
    onKeyDown: (event: KeyboardEvent<SVGPathElement>, segment: TimelineSegment) => void;
}

function ClockSegment({ segment, radius, width, selected, onSelect, onKeyDown }: Readonly<ClockSegmentProps>) {
    const path = arcPath(segment.startMinutes, segment.endMinutes, radius);

    return <path className={`astra-clock-segment ${selected ? 'astra-clock-segment-selected' : ''}`} d={path} stroke={segment.color} strokeWidth={width} tabIndex={0} role='button' aria-label={`${segment.label}, ${formatTime(segment.start)} to ${formatTime(segment.end)}`} onClick={() => onSelect(segment)} onKeyDown={(event) => onKeyDown(event, segment)} />;
}

function LegendButton({ segment, isSelected, onSelect }: Readonly<{ segment: TimelineSegment; isSelected: boolean; onSelect: (segment: TimelineSegment) => void }>) {
    return <button type='button' className={`astra-legend-button ${isSelected ? 'astra-legend-button-selected' : ''}`} onClick={() => onSelect(segment)}><i style={{ backgroundColor: segment.color }} /> <span>{segment.label}</span><time>{formatTime(segment.start)}</time></button>;
}

function EventRow({ icon, label, value }: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
    return <div className='astra-event-row'>{icon}<span>{label}</span><strong>{value}</strong></div>;
}

function arcPath(startMinutes: number, endMinutes: number, radius: number): string {
    const start = polarPoint(startMinutes, radius);
    const end = polarPoint(endMinutes, radius);
    const largeArc = endMinutes - startMinutes > 720 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function polarPoint(minutes: number, radius: number): { x: number; y: number } {
    const angle = (minutes / 1440) * Math.PI * 2 - Math.PI / 2;
    return { x: 160 + Math.cos(angle) * radius, y: 160 + Math.sin(angle) * radius };
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
    const basePath = import.meta.env.BASE_URL || '/';
    return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

function getQueryDate(): string | null {
    const value = new URLSearchParams(window.location.search).get('date');
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) ? value : null;
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

function getMoonGlyph(phase: number): string {
    if (phase < 0.25) return '◔';
    if (phase < 0.5) return '◑';
    if (phase < 0.75) return '◕';
    return '◒';
}

function uniqueByLabel(segment: TimelineSegment, index: number, segments: TimelineSegment[]): boolean {
    return segments.findIndex((candidate) => candidate.label === segment.label) === index;
}
