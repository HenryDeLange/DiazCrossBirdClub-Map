import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../../geojson/types';
import type { LocationTabName } from '../../locationUtils';

export type LocationsControlProps = {
    mapHeight: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onOpenInat: () => void;
    onLocationSelected: (locationName: string) => void;
    onSearchCleared: () => void;
    initialSearchQuery?: string;
    initialTab?: LocationTabName;
    initialFocusQuery?: string;
    searchVersion?: number;
}

export type FeatureGroup = {
    heading: Feature<Geometry, FeatureProps> | null;
    items: Array<{ feature: Feature<Geometry, FeatureProps>; featureIndex: number }>;
}

export type FeatureDetailsProps = {
    geojson: FeatureCollection<Geometry, FeatureProps>[];
    searchQuery: string;
    onClose: () => void;
    onOpenInat: () => void;
    onLocationSelected: (locationName: string) => void;
    initialFocusQuery?: string;
    tabLabel: LocationTabName;
}
