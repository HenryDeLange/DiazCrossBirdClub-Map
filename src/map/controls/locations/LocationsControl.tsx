import { Info } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { MapControlButton } from '../../components/MapControlButton';
import { MapDrawer } from '../../components/MapDrawer';
import { outings } from '../../geojson/outings';
import { paths } from '../../geojson/paths';
import { points } from '../../geojson/points';
import { spots } from '../../geojson/spots';
import { getAstraPathname, type LocationTabName } from '../../locationUtils';
import { LocationFeatureDetails } from './LocationFeatureDetails';
import { LocationTabs } from './LocationTabs';
import type { AstronomyLocation, LocationsControlProps } from './types';

type LocationTab = {
    label: LocationTabName;
    content: (searchQuery: string) => ReactElement;
}

export function LocationsControl({
    mapHeight,
    isOpen,
    onToggle,
    onClose,
    onOpenInat,
    onLocationSelected,
    onSearchCleared,
    initialSearchQuery,
    initialTab,
    initialFocusQuery,
    searchVersion
}: Readonly<LocationsControlProps>) {
    const map = useMap();
    const [astronomyLocation, setAstronomyLocation] = useState<AstronomyLocation | null>(null);

    useEffect(() => {
        if (isOpen) {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();
        }
        else {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
        }
    }, [isOpen, map]);

    const drawerHeight = Math.min(mapHeight * 0.82, 780);

    const tabs: LocationTab[] = [
        {
            label: 'Outings',
            content: (searchQuery: string) => (
                <LocationFeatureDetails
                    geojson={outings}
                    searchQuery={searchQuery}
                    onClose={onClose}
                    onOpenInat={onOpenInat}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Outings'
                    onOpenAstronomy={setAstronomyLocation}
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
                    onOpenInat={onOpenInat}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Spots'
                    onOpenAstronomy={setAstronomyLocation}
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
                    onOpenInat={onOpenInat}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Paths'
                    onOpenAstronomy={setAstronomyLocation}
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
                    onOpenInat={onOpenInat}
                    onLocationSelected={onLocationSelected}
                    initialFocusQuery={initialFocusQuery}
                    tabLabel='Points'
                    onOpenAstronomy={setAstronomyLocation}
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
                maxHeight='calc(100dvh - 1rem)'
            >
                <LocationTabs
                    key={`locations-tabs-${searchVersion ?? 0}`}
                    height={drawerHeight - 104}
                    tabs={tabs}
                    initialSearchQuery={initialSearchQuery}
                    initialTab={initialTab}
                    onSearchCleared={onSearchCleared}
                />
            </MapDrawer>
            <MapDrawer
                isOpen={astronomyLocation !== null}
                onClose={() => setAstronomyLocation(null)}
                label='Sun & moon'
                title={astronomyLocation?.name ?? 'Astronomy'}
                height={Math.min(mapHeight * 0.9, 900)}
                maxHeight='calc(100dvh - 1rem)'
            >
                {astronomyLocation && (
                    <iframe
                        className='astronomy-iframe'
                        src={getAstronomyUrl(astronomyLocation)}
                        title={`Sun and moon guide for ${astronomyLocation.name}`}
                    />
                )}
            </MapDrawer>
        </>
    );
}

function getAstronomyUrl(location: AstronomyLocation): string {
    const url = new URL(`${window.location.origin}${getAstraPathname()}`);
    url.searchParams.set('lat', location.latitude.toString());
    url.searchParams.set('lng', location.longitude.toString());
    return url.toString();
}
