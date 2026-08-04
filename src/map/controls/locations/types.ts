import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../../geojson/types';
import type { LocationTabName } from '../../locationUtils';

export type LocationsControlProps = {
    drawerHeight: number;
    onDrawerHeightChange: (height: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onOpenInat: (locationName: string, tab: LocationTabName) => void;
    onOpenAstronomy: (location: AstronomyLocation, tab: LocationTabName) => void;
    onLocationSelected: (locationName: string) => void;
    onSearchCleared: () => void;
    initialSearchQuery?: string;
    initialTab?: LocationTabName;
    initialFocusQuery?: string;
    searchVersion?: number;
}

export type AstronomyLocation = {
    name: string;
    latitude: number;
    longitude: number;
}

export type FeatureGroup = {
    heading: Feature<Geometry, FeatureProps> | null;
    items: Array<{ feature: Feature<Geometry, FeatureProps>; featureIndex: number }>;
}

export type FeatureDetailsProps = {
    geojson: FeatureCollection<Geometry, FeatureProps>[];
    searchQuery: string;
    onClose: () => void;
    onOpenInat: (locationName: string) => void;
    onLocationSelected: (locationName: string) => void;
    initialFocusQuery?: string;
    tabLabel: LocationTabName;
    onOpenAstronomy: (location: AstronomyLocation, tab: LocationTabName) => void;
}
