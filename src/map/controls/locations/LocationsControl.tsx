import { Info } from 'lucide-react';
import type { ReactElement } from 'react';
import { MapControlButton } from '../../components/MapControlButton';
import { MapDrawer } from '../../components/MapDrawer';
import { outings } from '../../geojson/outings';
import { paths } from '../../geojson/paths';
import { points } from '../../geojson/points';
import { spots } from '../../geojson/spots';
import { type LocationTabName } from '../../locationUtils';
import { LocationFeatureDetails } from './LocationFeatureDetails';
import { LocationTabs } from './LocationTabs';
import type { LocationsControlProps } from './types';

type LocationTab = {
    label: LocationTabName;
    content: (searchQuery: string) => ReactElement;
}

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
    const tabs: LocationTab[] = [
        {
            label: 'Outings',
            content: (searchQuery: string) => (
                <LocationFeatureDetails
                    geojson={outings}
                    searchQuery={searchQuery}
                    onClose={onClose}
                    onOpenInat={(locationName) => onOpenInat(locationName, 'Outings')}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Outings'
                    onOpenAstronomy={(location) => onOpenAstronomy(location, 'Outings')}
                />
            )
        },
        {
            label: 'Spots',
            content: (searchQuery: string) => (
                <LocationFeatureDetails
                    geojson={spots}
                    searchQuery={searchQuery}
                    onClose={onClose}
                    onOpenInat={(locationName) => onOpenInat(locationName, 'Spots')}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Spots'
                    onOpenAstronomy={(location) => onOpenAstronomy(location, 'Spots')}
                />
            )
        },
        {
            label: 'Paths',
            content: (searchQuery: string) => (
                <LocationFeatureDetails
                    geojson={paths}
                    searchQuery={searchQuery}
                    onClose={onClose}
                    onOpenInat={(locationName) => onOpenInat(locationName, 'Paths')}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Paths'
                    onOpenAstronomy={(location) => onOpenAstronomy(location, 'Paths')}
                />
            )
        },
        {
            label: 'Points',
            content: (searchQuery: string) => (
                <LocationFeatureDetails
                    geojson={points}
                    searchQuery={searchQuery}
                    onClose={onClose}
                    onOpenInat={(locationName) => onOpenInat(locationName, 'Points')}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Points'
                    onOpenAstronomy={(location) => onOpenAstronomy(location, 'Points')}
                />
            )
        }
    ];

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
                    initialSearchQuery={initialSearchQuery}
                    initialTab={initialTab}
                    onSearchCleared={onSearchCleared}
                />
            </MapDrawer>
        </>
    );
}
