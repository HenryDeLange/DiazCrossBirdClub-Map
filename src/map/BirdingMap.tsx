
import { useCallback, useEffect, useRef, useState } from 'react';
import { AttributionControl, LayerGroup, LayersControl, MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { AstraControl } from './controls/AstraControl';
import { LocateControl } from './controls/LocateControl';
import { LocationsControl } from './controls/locations/LocationsControl';
import type { AstronomyLocation } from './controls/locations/types';
import { Logo } from './controls/logo/Logo';
import { SpeciesListControl } from './controls/species/SpeciesListControl';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import { GenericGeoJSONLayer } from './layers/GenericGeoJSONLayer';
import { getInitialLayerState, type LayerState } from './layers/layerState';
import { LayerStateSync } from './layers/LayerStateSync';
import type { LocationSource, LocationTabName } from './locationUtils';
import { clearLocationPath, getInitialLocationKeys, resolveLocationSelection, setLocationPath } from './locationUtils';
import './map.css';
import { MapEvents } from './MapEvents';

type OpenDrawer = 'inat' | 'locations' | 'astra' | null;

const locationSources: LocationSource[] = [
    { tab: 'Outings', collections: outings },
    { tab: 'Spots', collections: spots },
    { tab: 'Paths', collections: paths },
    { tab: 'Points', collections: points }
];

export default function BirdingMap() {
    const initialLocationKeys = getInitialLocationKeys();
    const initialLocationSelection = resolveLocationSelection(initialLocationKeys, locationSources);
    const [mapHeight, setMapHeight] = useState(window.innerHeight);
    const [drawerHeight, setDrawerHeight] = useState(() => getDefaultDrawerHeight(window.innerHeight));
    const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [openDrawer, setOpenDrawer] = useState<OpenDrawer>(initialLocationSelection ? 'locations' : null);
    const [astronomyLocation, setAstronomyLocation] = useState<AstronomyLocation | null>(null);
    const [locationSearchQuery, setLocationSearchQuery] = useState(initialLocationSelection?.name ?? '');
    const [locationSearchVersion, setLocationSearchVersion] = useState(0);
    const [initialFocusQuery, setInitialFocusQuery] = useState(initialLocationSelection?.name ?? '');
    const warnedInitialLocationKeyRef = useRef('');

    const [layerState, setLayerState] = useState<LayerState>(getInitialLayerState);
    const [selectedLocationsTab, setSelectedLocationsTab] = useState<LocationTabName>(initialLocationSelection?.tab ?? 'Outings');
    const [drawerBackTarget, setDrawerBackTarget] = useState<OpenDrawer>(null);
    const openDrawerRef = useRef<OpenDrawer>(openDrawer);
    const drawerHistoryEntryRef = useRef(false);

    useEffect(() => {
        const updateDimensions = () => setMapHeight(window.innerHeight);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleColorSchemeChange = (event: MediaQueryListEvent) => {
            setIsDarkMode(event.matches);
        };

        window.addEventListener('resize', updateDimensions);
        mediaQuery.addEventListener('change', handleColorSchemeChange);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            mediaQuery.removeEventListener('change', handleColorSchemeChange);
        };
    }, []);

    useEffect(() => {
        setDrawerHeight((currentHeight) => clampDrawerHeight(currentHeight, mapHeight));
    }, [mapHeight]);

    const center = JSON.parse(localStorage.getItem('mapCenter') ?? JSON.stringify(startPosition));
    const zoom = Number(localStorage.getItem('mapZoom') ?? 11);

    const closeLocationsDrawer = useCallback(() => {
        setLocationSearchQuery('');
        setInitialFocusQuery('');
        clearLocationPath();
    }, []);

    const closeOpenDrawerState = useCallback(() => {
        if (openDrawerRef.current === 'locations') {
            closeLocationsDrawer();
        }

        setOpenDrawer(null);
        setDrawerBackTarget(null);
    }, [closeLocationsDrawer]);

    const openNestedDrawer = (drawer: Exclude<OpenDrawer, null>) => {
        const current = openDrawerRef.current;

        if (current === 'locations') {
            setDrawerBackTarget('locations');
        }
        else {
            setDrawerBackTarget(null);
        }

        if (current === null && typeof window !== 'undefined') {
            window.history.pushState({ ...window.history.state, drawer }, '', window.location.href);
            drawerHistoryEntryRef.current = true;
        }

        setOpenDrawer(drawer);
    };

    const toggleDrawer = (drawer: OpenDrawer) => {
        const current = openDrawerRef.current;

        if (current === drawer) {
            if (drawer === 'locations') {
                closeLocationsDrawer();
            }
            setOpenDrawer(null);
            setDrawerBackTarget(null);
            return;
        }

        if (current === 'locations') {
            closeLocationsDrawer();
        }

        if (current === null && typeof window !== 'undefined') {
            window.history.pushState({ ...window.history.state, drawer }, '', window.location.href);
            drawerHistoryEntryRef.current = true;
        }

        setOpenDrawer(drawer);
        setDrawerBackTarget(null);
    };

    const closeDrawer = useCallback(() => {
        closeOpenDrawerState();

        if (drawerHistoryEntryRef.current && typeof window !== 'undefined') {
            window.history.replaceState({ ...window.history.state, drawer: null }, '', window.location.href);
        }
    }, [closeOpenDrawerState]);

    const handleDrawerBack = () => {
        if (drawerBackTarget === null) {
            closeDrawer();
            return;
        }

        setOpenDrawer(drawerBackTarget);
        setDrawerBackTarget(null);
    };

    const handleLocationSelected = (locationName: string) => {
        setLocationSearchQuery(locationName);
        setLocationSearchVersion((current) => current + 1);
        setInitialFocusQuery('');
        setLocationPath(locationName);
    };

    const handleLocationSearchCleared = () => {
        closeLocationsDrawer();
    };

    const handleOpenAstronomy = (location: AstronomyLocation, tab: LocationTabName) => {
        setSelectedLocationsTab(tab);
        setLocationSearchQuery(location.name);
        setLocationSearchVersion((current) => current + 1);
        setInitialFocusQuery('');
        setLocationPath(location.name);
        setAstronomyLocation(location);
        openNestedDrawer('astra');
    };

    const handleTextMarkerClick = (searchText: string, tab: LocationTabName) => {
        setLocationSearchQuery(searchText);
        setLocationSearchVersion((current) => current + 1);
        setInitialFocusQuery('');
        setLocationPath(searchText);
        if (openDrawerRef.current === null && typeof window !== 'undefined') {
            window.history.pushState({ ...window.history.state, drawer: 'locations' }, '', window.location.href);
            drawerHistoryEntryRef.current = true;
        }
        setOpenDrawer('locations');
        setSelectedLocationsTab(tab);
    };

    useEffect(() => {
        openDrawerRef.current = openDrawer;
    }, [openDrawer]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const onPopState = () => {
            drawerHistoryEntryRef.current = false;

            if (openDrawerRef.current !== null) {
                closeOpenDrawerState();
            }
        };

        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('popstate', onPopState);
        };
    }, [closeOpenDrawerState]);

    useEffect(() => {
        localStorage.setItem('mapLayerState', JSON.stringify(layerState));
    }, [layerState]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && openDrawerRef.current !== null) {
                closeDrawer();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [closeDrawer]);

    useEffect(() => {
        const initialLocationKey = initialLocationKeys[0] ?? '';

        if (!initialLocationKey || initialLocationSelection || warnedInitialLocationKeyRef.current === initialLocationKey) {
            return;
        }

        warnedInitialLocationKeyRef.current = initialLocationKey;
        console.warn(`No location matched path: ${initialLocationKey}`);
    }, [initialLocationKeys, initialLocationSelection]);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            attributionControl={false}
            zoomControl={false}
            style={{ height: mapHeight }}
        >
            <DrawerInteractionLock isOpen={openDrawer !== null} />
            <Logo />
            <SpeciesListControl
                drawerHeight={drawerHeight}
                onDrawerHeightChange={setDrawerHeight}
                isOpen={openDrawer === 'inat'}
                onToggle={() => toggleDrawer('inat')}
                onClose={closeDrawer}
                onBack={openDrawer === 'inat' && drawerBackTarget !== null ? handleDrawerBack : undefined}
            />
            <LocationsControl
                drawerHeight={drawerHeight}
                onDrawerHeightChange={setDrawerHeight}
                isOpen={openDrawer === 'locations'}
                onToggle={() => toggleDrawer('locations')}
                onClose={closeDrawer}
                onOpenInat={(tab) => {
                    setSelectedLocationsTab(tab);
                    openNestedDrawer('inat');
                }}
                onOpenAstronomy={handleOpenAstronomy}
                onLocationSelected={handleLocationSelected}
                onSearchCleared={handleLocationSearchCleared}
                initialSearchQuery={locationSearchQuery}
                initialTab={selectedLocationsTab}
                initialFocusQuery={initialFocusQuery || undefined}
                searchVersion={locationSearchVersion}
            />
            <AstraControl
                drawerHeight={drawerHeight}
                onDrawerHeightChange={setDrawerHeight}
                isOpen={openDrawer === 'astra'}
                onToggle={() => toggleDrawer('astra')}
                onClose={closeDrawer}
                onBack={openDrawer === 'astra' && drawerBackTarget !== null ? handleDrawerBack : undefined}
                coordinates={astronomyLocation}
            />
            <AttributionControl
                position='bottomleft'
                prefix={`<a href='https://github.com/HenryDeLange/DiazCrossBirdClub-Map' target='_blank' rel='noreferrer'>v${VITE_APP_VERSION}</a> | <a href='https://www.mywild.co.za' target='_blank' rel='noreferrer'>MyWild</a> | <a href='https://www.diazcrossbirdclub.co.za' target='_blank' rel='noreferrer'>DCBC</a> | Google Maps | Leaflet`}
            />
            <ZoomControl position='bottomright' />
            <LocateControl />
            <LayersControl position='topright'>
                <LayersControl.BaseLayer name='Google Maps - Street' checked={layerState.baseLayer === 'Google Maps - Street'}>
                    <TileLayer
                        url={isDarkMode
                            ? 'https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}' // TODO: Need to use Google Maps API key for dark layer
                            : 'https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}'}
                        maxZoom={maxZoom}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name='Google Maps - Hybrid' checked={layerState.baseLayer === 'Google Maps - Hybrid'}>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}'
                        maxZoom={maxZoom}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name='Google Maps - Satellite' checked={layerState.baseLayer === 'Google Maps - Satellite'}>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}'
                        maxZoom={maxZoom}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.Overlay name='Birding Loops' checked={layerState.overlays['Birding Loops']}>
                    <LayerGroup>
                        {paths.map((layer, index) => (
                            <GenericGeoJSONLayer
                                key={index}
                                layer={layer}
                                onTextMarkerClick={(searchText) => handleTextMarkerClick(searchText, 'Paths')}
                            />
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name='Birding Points of Interest' checked={layerState.overlays['Birding Points of Interest']}>
                    <LayerGroup>
                        {points.map((layer, index) => (
                            <GenericGeoJSONLayer
                                key={index}
                                layer={layer}
                                onTextMarkerClick={(searchText) => handleTextMarkerClick(searchText, 'Points')}
                            />
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name='Birding Spots' checked={layerState.overlays['Birding Spots']}>
                    <LayerGroup>
                        {spots.map((layer, index) => (
                            <GenericGeoJSONLayer
                                key={index}
                                layer={layer}
                                onTextMarkerClick={(searchText) => handleTextMarkerClick(searchText, 'Spots')}
                            />
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name='Birding Outings' checked={layerState.overlays['Birding Outings']}>
                    <LayerGroup>
                        {outings.map((layer, index) => (
                            <GenericGeoJSONLayer
                                key={index}
                                layer={layer}
                                onTextMarkerClick={(searchText) => handleTextMarkerClick(searchText, 'Outings')}
                            />
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>
            <LayerStateSync onLayerStateChange={setLayerState} />
            <MapEvents />
        </MapContainer>
    );
}

const startPosition = {
    lat: -33.6,
    lng: 26.73
};

const subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];

const maxZoom = 20;

const drawerMinHeight = 180;

function getDefaultDrawerHeight(viewportHeight: number): number {
    return clampDrawerHeight(Math.min(viewportHeight * 0.82, 780), viewportHeight);
}

function clampDrawerHeight(height: number, viewportHeight: number): number {
    return Math.min(Math.max(height, drawerMinHeight), Math.max(drawerMinHeight, viewportHeight - 8));
}

function DrawerInteractionLock({ isOpen }: Readonly<{ isOpen: boolean }>) {
    const map = useMap();

    useEffect(() => {
        const interactionMethods = [
            map.dragging,
            map.scrollWheelZoom,
            map.doubleClickZoom,
            map.touchZoom,
            map.boxZoom,
            map.keyboard
        ];

        interactionMethods.forEach((handler) => {
            if (isOpen) {
                handler.disable();
            }
            else {
                handler.enable();
            }
        });
    }, [isOpen, map]);

    return null;
}


