import { Moon } from 'lucide-react';
import { memo, type CSSProperties } from 'react';
import styles from './AstraPage.module.css';
import { SkyEventList } from './astraEvents';
import type { SkyEvent } from './astraTypes';
import { formatDuration } from './astraUtils';
import { describeMoonPhase, formatTime, type AstronomyData, type TimelineSegment } from './sunTimes';

type AstraDetailsPanelProps = {
    astronomy: AstronomyData;
    now: Date;
    selectedSegment: TimelineSegment | null;
    selectedMarkerId: string | null;
    isTodaySelected: boolean;
    skyEvents: SkyEvent[];
    onSelectEvent: (event: SkyEvent) => void;
}

type DetailHeadingData = {
    title: string;
    meta?: string;
    color?: string;
}

export const AstraDetailsPanel = memo(function AstraDetailsPanel({ astronomy, now, selectedSegment, selectedMarkerId, isTodaySelected, skyEvents, onSelectEvent }: Readonly<AstraDetailsPanelProps>) {
    const isCurrentTimeSelected = isTodaySelected && selectedMarkerId === 'current-time';
    const heading = getDetailHeading(astronomy, selectedSegment, selectedMarkerId, isCurrentTimeSelected);

    return (
        <aside className={styles.astraDetailsPanel}>
            <DetailHeading {...heading} />
            <DetailContent astronomy={astronomy} now={now} selectedSegment={selectedSegment} selectedMarkerId={selectedMarkerId} isCurrentTimeSelected={isCurrentTimeSelected} />
            <SkyEventList events={skyEvents} selectedSegmentId={selectedSegment?.id ?? null} selectedMarkerId={selectedMarkerId} onSelect={onSelectEvent} />
        </aside>
    );
});

const DetailHeading = memo(function DetailHeading({ title, meta, color }: Readonly<DetailHeadingData>) {
    return (
        <div className={styles.astraDetailHeading}>
            <span className={styles.astraDetailSwatch} style={{ backgroundColor: color }} />
            <div>
                <h2>{title}</h2>
                {meta && <p className={styles.astraDetailMeta}>{meta}</p>}
            </div>
        </div>
    );
});

function getDetailHeading(astronomy: AstronomyData, selectedSegment: TimelineSegment | null, selectedMarkerId: string | null, isCurrentTimeSelected: boolean): DetailHeadingData {
    if (isCurrentTimeSelected) {
        return { title: 'Current time', meta: 'Current time marker', color: 'var(--astra-current)' };
    }

    if (selectedMarkerId === 'moon-phase') {
        return { title: 'Moon phase', meta: `${describeMoonPhase(astronomy.moonIllumination.phase)} \u00b7 ${Math.round(astronomy.moonIllumination.fraction * 100)}% illuminated`, color: 'var(--astra-muted)' };
    }

    if (selectedMarkerId === 'birding-times') {
        return { title: 'Birding times', meta: 'Prominent birding times', color: '#347a72' };
    }

    if (selectedMarkerId === 'solar-noon') {
        return { title: 'Solar noon', meta: 'Solar noon marker', color: '#e6a63f' };
    }

    if (selectedSegment) {
        const isMiddaySelected = selectedSegment.id.startsWith('midday-start');
        const isMidnightSelected = selectedSegment.id.startsWith('midnight-start');
        const solarMarker = isMiddaySelected ? `Solar noon ${formatTime(astronomy.sunTimes.solarNoon)} \u00b7 ` : isMidnightSelected ? `Solar midnight ${formatTime(astronomy.sunTimes.nadir)} \u00b7 ` : '';
        return {
            title: selectedSegment.label,
            meta: `${solarMarker}${formatDuration(selectedSegment.end.getTime() - selectedSegment.start.getTime())} of the day`,
            color: selectedSegment.color
        };
    }

    return { title: 'No selection' };
}

function DetailContent({ astronomy, now, selectedSegment, selectedMarkerId, isCurrentTimeSelected }: Readonly<{ astronomy: AstronomyData; now: Date; selectedSegment: TimelineSegment | null; selectedMarkerId: string | null; isCurrentTimeSelected: boolean }>) {
    if (isCurrentTimeSelected) {
        return (
            <>
                <p className={styles.astraDetailDescription}>The clock marker shows the current local time against the solar, moonlight and birding windows.</p>
                <div className={styles.astraTimeRange}><strong>{formatTime(now)}</strong><span>local time</span></div>
            </>
        );
    }

    if (selectedMarkerId === 'moon-phase') {
        const phaseName = describeMoonPhase(astronomy.moonIllumination.phase);
        const percentage = Math.round(astronomy.moonIllumination.fraction * 100);
        return (
            <>
                <p className={styles.astraDetailDescription}>The Moon is in its {phaseName.toLowerCase()} phase and {percentage}% illuminated.</p>
                <MoonIlluminationDetails fraction={astronomy.moonIllumination.fraction} phase={astronomy.moonIllumination.phase} />
            </>
        );
    }

    if (selectedMarkerId === 'birding-times') {
        return (
            <>
                <p className={styles.astraDetailDescription}>This ring shows prominent birding times, including dawn calls, feeding activity, thermals and evening owl activity.</p>
                <div className={styles.astraTimeRange}><strong>{astronomy.birdingSegments.length}</strong><span>birding windows</span></div>
            </>
        );
    }

    if (selectedMarkerId === 'solar-noon') {
        return (
            <>
                <p className={styles.astraDetailDescription}>Solar noon marks the Sun's highest point in the sky at this location.</p>
                <div className={styles.astraTimeRange}><strong>{formatTime(astronomy.sunTimes.solarNoon)}</strong><span>local solar noon</span></div>
            </>
        );
    }

    if (selectedSegment) {
        const isMoonSelected = selectedSegment.id === astronomy.moonSegment?.id;
        return (
            <>
                <p className={styles.astraDetailDescription}>{selectedSegment.description}</p>
                {isMoonSelected && <MoonIlluminationDetails fraction={astronomy.moonIllumination.fraction} phase={astronomy.moonIllumination.phase} />}
                <div className={styles.astraTimeRange}><strong>{formatTime(selectedSegment.start)}</strong><span>to</span><strong>{formatTime(selectedSegment.end)}</strong></div>
            </>
        );
    }

    return <p className={styles.astraDetailDescription}>Select a sky window on the chart or in the event list.</p>;
}

function MoonIlluminationDetails({ fraction, phase }: Readonly<{ fraction: number; phase: number }>) {
    const percentage = Math.round(fraction * 100);

    return (
        <ul className={styles.astraMoonSelected}>
            <li className={styles.astraMoonPhaseName}><Moon size={18} aria-hidden='true' /><strong>{describeMoonPhase(phase)}</strong></li>
            <li className={styles.astraIllumination}><span className={styles.astraMoonPie} style={{ '--moon-illumination': `${percentage}%` } as CSSProperties} aria-label={`${percentage} percent illuminated`} /><strong>{percentage}%</strong><span>illuminated</span></li>
        </ul>
    );
}