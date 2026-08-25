import { Info } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import { MapControlButton } from '../../components/MapControlButton';
import { MapDrawer } from '../../components/MapDrawer';
import { locationSources } from '../../locationSources';
import type { LocationTabName } from '../../locationUtils';
import { LocationFeatureDetails } from './LocationFeatureDetails';
import { LocationTabs } from './LocationTabs';
import type { LocationCollectionSource, LocationsControlProps } from './types';

type LocationTab = {
    label: LocationTabName;
    content: (searchQuery: string) => ReactElement;
}

const locationCollectionSources: LocationCollectionSource[] = locationSources.map(({ tab, collections }) => ({
    tab,
    geojson: collections
}));

export function LocationsControl({
    drawerHeight,
    onDrawerHeightChange,
    isOpen,
    onToggle,
    onClose,
    onOpenInat,
    onOpenAstronomy,
    onLocationSelected,
    onSearchCleared,
    initialSearchQuery,
    initialTab,
    initialFocusQuery,
    searchVersion
}: Readonly<LocationsControlProps>) {
    const tabs = useMemo<LocationTab[]>(() => locationCollectionSources.map((source) => ({
        label: source.tab,
        content: (searchQuery) => (
            <LocationFeatureDetails
                sources={[source]}
                searchQuery={searchQuery}
                onClose={onClose}
                onOpenInat={onOpenInat}
                onLocationSelected={onLocationSelected}
                initialFocusQuery={initialFocusQuery}
                onOpenAstronomy={onOpenAstronomy}
            />
        )
    })), [initialFocusQuery, onClose, onLocationSelected, onOpenAstronomy, onOpenInat]);
    const allContent = useMemo(() => (searchQuery: string) => (
        <LocationFeatureDetails
            sources={locationCollectionSources}
            searchQuery={searchQuery}
            onClose={onClose}
            onOpenInat={onOpenInat}
            onLocationSelected={onLocationSelected}
            initialFocusQuery={initialFocusQuery}
            onOpenAstronomy={onOpenAstronomy}
        />
    ), [initialFocusQuery, onClose, onLocationSelected, onOpenAstronomy, onOpenInat]);

    return (
        <>
            <MapControlButton
                groupClassName='locationsGroup'
                onClick={onToggle}
                title='Birding Locations'
            >
                <Info />
            </MapControlButton>
            <MapDrawer
                isOpen={isOpen}
                onClose={onClose}
                title='Birding Locations'
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
                maxHeight='calc(100dvh - 1rem)'
            >
                <LocationTabs
                    key={`locations-tabs-${searchVersion ?? 0}-${initialTab ?? ''}`}
                    tabs={tabs}
                    allContent={allContent}
                    initialSearchQuery={initialSearchQuery}
                    initialTab={initialTab}
                    onSearchCleared={onSearchCleared}
                />
            </MapDrawer>
        </>
    );
}
