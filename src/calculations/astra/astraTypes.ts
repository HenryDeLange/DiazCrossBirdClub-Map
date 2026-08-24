import type { ComponentType, ReactNode, SVGProps } from 'react';
import type { Coordinates } from '../components/dateLocationUtils';
import type { TimelineSegment } from './sunTimes';

export type AstraPageProps = {
    embedded?: boolean;
    initialCoordinates?: Coordinates;
    locationView?: boolean;
}

export type AstraIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type SkyEvent = {
    id: string;
    label: string;
    value: string;
    icon: ReactNode;
    color: string;
    segment: TimelineSegment | null;
    markerId?: string;
    minutes: number;
}