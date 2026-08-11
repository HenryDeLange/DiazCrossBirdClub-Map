import { Info } from 'lucide-react';
import type { ReactElement } from 'react';
import { MapControlButton } from '../../components/MapControlButton';
import { MapDrawer } from '../../components/MapDrawer';
import { outings } from '../../geojson/outings';
import { paths } from '../../geojson/paths';
import { points } from '../../geojson/points';
import { spots } from '../../geojson/spots';
import type { LocationTabName } from '../../locationUtils';
import { LocationFeatureDetails } from './LocationFeatureDetails';
import { LocationTabs } from './LocationTabs';
import type { LocationCollectionSource, LocationsControlProps } from './types';

type LocationTab = {
    label: LocationTabName;
    content: (searchQuery: string) => ReactElement;
}

const locationSources: LocationCollectionSource[] = [
    { tab: 'Outings', geojson: outings },
    { tab: 'Spots', geojson: spots },
    { tab: 'Paths', geojson: paths },
    { tab: 'Points', geojson: points }
];

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
    const renderLocationDetails = (sources: LocationCollectionSource[]) => (searchQuery: string) => (
        <LocationFeatureDetails
            sources={sources}
            searchQuery={searchQuery}
            onClose={onClose}
            onOpenInat={onOpenInat}
            onLocationSelected={onLocationSelected}
            initialFocusQuery={initialFocusQuery}
            onOpenAstronomy={onOpenAstronomy}
        />
    );
    const tabs: LocationTab[] = locationSources.map((source) => ({
        label: source.tab,
        content: renderLocationDetails([source])
    }));

    return (
        <>
            <MapControlButton
                groupClassName='locations-group'
                buttonClassName='locations-button'
                onClick={onToggle}
                title='Birding Locations'
            >
                <Info className='button-icon' />
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
                    allContent={renderLocationDetails(locationSources)}
                    initialSearchQuery={initialSearchQuery}
                    initialTab={initialTab}
                    onSearchCleared={onSearchCleared}
                />
            </MapDrawer>
        </>
    );
}
