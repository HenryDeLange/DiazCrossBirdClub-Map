
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, useMap, ZoomControl } from 'react-leaflet';
import { defaultMapCenter } from '../common/defaultLocation';
import { InstallAppButton } from '../pwa/InstallAppButton';
import { PwaCacheDrawer } from '../pwa/PwaCacheDrawer';
import { useTheme } from '../theme/useTheme';
import styles from './BirdingMap.module.css';
import { MapLegendFooter } from './components/MapLegendFooter';
import { AstraControl } from './controls/AstraControl';
import { LocateControl } from './controls/LocateControl';
import { LocationsControl } from './controls/locations/LocationsControl';
import type { AstronomyLocation } from './controls/locations/types';
import { Logo } from './controls/logo/Logo';
import { SpeciesListControl } from './controls/species/SpeciesListControl';
import { TidesControl } from './controls/TidesControl';
import { getInitialLayerState, type LayerState } from './layers/layerState';
import { locationSources } from './locationSources';
import type { LocationTabName } from './locationUtils';
import { clearLocationPath, getInitialLocationKeys, resolveLocationSelection, setLocationPath } from './locationUtils';
import './map.css';
import { MapEvents } from './MapEvents';
import { MapLayers } from './MapLayers';

type OpenDrawer = 'inat' | 'locations' | 'tides' | 'astra' | 'cache' | null;

export default function BirdingMap() {
    const [initialLocation] = useState(() => {
        const keys = getInitialLocationKeys();
        return {
            keys,
            selection: resolveLocationSelection(keys, locationSources)
        };
    });
    const initialLocationKeys = initialLocation.keys;
    const initialLocationSelection = initialLocation.selection;
    const [mapHeight, setMapHeight] = useState(getViewportHeight);
    const [drawerHeight, setDrawerHeight] = useState(() => getStoredDrawerHeight(getViewportHeight()));
    const [openDrawer, setOpenDrawer] = useState<OpenDrawer>(initialLocationSelection ? 'locations' : null);
    const [astronomyLocation, setAstronomyLocation] = useState<AstronomyLocation | null>(null);
    const [inatLocationName, setInatLocationName] = useState<string | null>(null);
    const [locationSearchQuery, setLocationSearchQuery] = useState(initialLocationSelection?.name ?? '');
    const [locationSearchVersion, setLocationSearchVersion] = useState(0);
    const [initialFocusQuery, setInitialFocusQuery] = useState(initialLocationSelection?.name ?? '');
    const warnedInitialLocationKeyRef = useRef('');

    const [layerState, setLayerState] = useState<LayerState>(getInitialLayerState);
    const [selectedLocationsTab, setSelectedLocationsTab] = useState<LocationTabName | undefined>(initialLocationSelection?.tab);
    const [drawerBackTarget, setDrawerBackTarget] = useState<OpenDrawer>(null);
    const openDrawerRef = useRef<OpenDrawer>(openDrawer);
    const drawerHistoryEntryRef = useRef(false);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const updateDimensions = () => setMapHeight(getViewportHeight());
        const updateAfterLayout = () => window.requestAnimationFrame(updateDimensions);

        window.addEventListener('resize', updateDimensions);
        window.addEventListener('orientationchange', updateDimensions);
        window.addEventListener('pageshow', updateAfterLayout);
        window.visualViewport?.addEventListener('resize', updateDimensions);
        updateAfterLayout();

        return () => {
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('orientationchange', updateDimensions);
            window.removeEventListener('pageshow', updateAfterLayout);
            window.visualViewport?.removeEventListener('resize', updateDimensions);
        };
    }, []);

    const [mapView] = useState(getStoredMapView);
    const clampedDrawerHeight = clampDrawerHeight(drawerHeight, mapHeight);

    const closeLocationsDrawer = useCallback(() => {
        setLocationSearchQuery('');
        setInitialFocusQuery('');
        setSelectedLocationsTab(undefined);
        clearLocationPath();
    }, []);

    const closeOpenDrawerState = useCallback(() => {
        if (openDrawerRef.current === 'locations') {
            closeLocationsDrawer();
        }

        setOpenDrawer(null);
        setDrawerBackTarget(null);
    }, [closeLocationsDrawer]);

    const openNestedDrawer = useCallback((drawer: Exclude<OpenDrawer, null>) => {
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
    }, []);

    const toggleDrawer = useCallback((drawer: OpenDrawer) => {
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
    }, [closeLocationsDrawer]);

    const closeDrawer = useCallback(() => {
        closeOpenDrawerState();

        if (drawerHistoryEntryRef.current && typeof window !== 'undefined') {
            window.history.replaceState({ ...window.history.state, drawer: null }, '', window.location.href);
        }
    }, [closeOpenDrawerState]);

    const handleDrawerBack = useCallback(() => {
        if (drawerBackTarget === null) {
            closeDrawer();
            return;
        }

        setOpenDrawer(drawerBackTarget);
        setDrawerBackTarget(null);
    }, [closeDrawer, drawerBackTarget]);

    const handleLocationSelected = useCallback((locationName: string) => {
        setLocationSearchQuery(locationName);
        setLocationSearchVersion((current) => current + 1);
        setInitialFocusQuery('');
        setLocationPath(locationName);
    }, []);

    const handleLocationSearchCleared = useCallback(() => {
        closeLocationsDrawer();
    }, [closeLocationsDrawer]);

    const handleOpenAstronomy = useCallback((location: AstronomyLocation, tab: LocationTabName) => {
        setInatLocationName(null);
        setSelectedLocationsTab(tab);
        setLocationSearchQuery(location.name);
        setLocationSearchVersion((current) => current + 1);
        setInitialFocusQuery('');
        setLocationPath(location.name);
        setAstronomyLocation(location);
        openNestedDrawer('astra');
    }, [openNestedDrawer]);

    const handleOpenInat = useCallback((locationName: string, tab: LocationTabName) => {
        setAstronomyLocation(null);
        setInatLocationName(locationName);
        setSelectedLocationsTab(tab);
        openNestedDrawer('inat');
    }, [openNestedDrawer]);

    const handleTextMarkerClick = useCallback((searchText: string, tab: LocationTabName) => {
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
    }, []);
    const handleToggleInat = useCallback(() => {
        setInatLocationName(null);
        setAstronomyLocation(null);
        toggleDrawer('inat');
    }, [toggleDrawer]);
    const handleToggleLocations = useCallback(() => toggleDrawer('locations'), [toggleDrawer]);
    const handleToggleTides = useCallback(() => {
        setAstronomyLocation(null);
        setInatLocationName(null);
        toggleDrawer('tides');
    }, [toggleDrawer]);
    const handleToggleAstra = useCallback(() => {
        setAstronomyLocation(null);
        setInatLocationName(null);
        toggleDrawer('astra');
    }, [toggleDrawer]);
    const handleOpenCache = useCallback(() => toggleDrawer('cache'), [toggleDrawer]);

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
        localStorage.setItem('drawerHeight', String(drawerHeight));
    }, [drawerHeight]);

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
            center={mapView.center}
            zoom={mapView.zoom}
            scrollWheelZoom
            attributionControl={false}
            zoomControl={false}
            className={styles.map}
            style={{ height: mapHeight }}
        >
            <DrawerInteractionLock isOpen={openDrawer !== null} />
            <Logo />
            <SpeciesListControl
                drawerHeight={clampedDrawerHeight}
                onDrawerHeightChange={setDrawerHeight}
                isOpen={openDrawer === 'inat'}
                onClose={closeDrawer}
                onBack={openDrawer === 'inat' && drawerBackTarget !== null ? handleDrawerBack : undefined}
                locationName={inatLocationName ?? undefined}
                onToggle={handleToggleInat}
            />
            <LocationsControl
                drawerHeight={clampedDrawerHeight}
                onDrawerHeightChange={setDrawerHeight}
                isOpen={openDrawer === 'locations'}
                onToggle={handleToggleLocations}
                onClose={closeDrawer}
                onOpenInat={handleOpenInat}
                onOpenAstronomy={handleOpenAstronomy}
                onLocationSelected={handleLocationSelected}
                onSearchCleared={handleLocationSearchCleared}
                initialSearchQuery={locationSearchQuery}
                initialTab={selectedLocationsTab}
                initialFocusQuery={initialFocusQuery || undefined}
                searchVersion={locationSearchVersion}
            />
            <TidesControl
                drawerHeight={clampedDrawerHeight}
                onDrawerHeightChange={setDrawerHeight}
                isOpen={openDrawer === 'tides'}
                onClose={closeDrawer}
                onBack={openDrawer === 'tides' && drawerBackTarget !== null ? handleDrawerBack : undefined}
                onToggle={handleToggleTides}
            />
            <AstraControl
                drawerHeight={clampedDrawerHeight}
                onDrawerHeightChange={setDrawerHeight}
                isOpen={openDrawer === 'astra'}
                onClose={closeDrawer}
                onBack={openDrawer === 'astra' && drawerBackTarget !== null ? handleDrawerBack : undefined}
                coordinates={astronomyLocation}
                locationName={astronomyLocation?.name}
                onToggle={handleToggleAstra}
            />
            <InstallAppButton />
            <MapLegendFooter onOpenCache={handleOpenCache} />
            <PwaCacheDrawer
                isOpen={openDrawer === 'cache'}
                onClose={closeDrawer}
                height={clampedDrawerHeight}
                onHeightChange={setDrawerHeight}
            />
            <ZoomControl position='bottomright' />
            <LocateControl />
            <MapLayers
                isDarkMode={isDarkMode}
                layerState={layerState}
                onLayerStateChange={setLayerState}
                onTextMarkerClick={handleTextMarkerClick}
            />
            <MapEvents />
        </MapContainer>
    );
}

const drawerMinHeight = 180;
const defaultMapZoom = 11;
const maxMapZoom = 20;

type MapView = {
    center: typeof defaultMapCenter;
    zoom: number;
}

function getStoredMapView(): MapView {
    const center = getStoredMapCenter();
    const storedZoomValue = localStorage.getItem('mapZoom');
    const storedZoom = storedZoomValue === null ? Number.NaN : Number(storedZoomValue);
    const zoom = Number.isFinite(storedZoom) ? Math.min(Math.max(storedZoom, 0), maxMapZoom) : defaultMapZoom;

    return { center, zoom };
}

function getStoredMapCenter(): typeof defaultMapCenter {
    const storedCenter = localStorage.getItem('mapCenter');
    if (!storedCenter) {
        return defaultMapCenter;
    }

    try {
        const parsedCenter: unknown = JSON.parse(storedCenter);
        if (isMapCenter(parsedCenter)) {
            return parsedCenter;
        }
    }
    catch {
        return defaultMapCenter;
    }

    return defaultMapCenter;
}

function isMapCenter(value: unknown): value is typeof defaultMapCenter {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const center = value as { lat?: unknown; lng?: unknown };
    return typeof center.lat === 'number'
        && Number.isFinite(center.lat)
        && typeof center.lng === 'number'
        && Number.isFinite(center.lng);
}

function getDefaultDrawerHeight(viewportHeight: number): number {
    return clampDrawerHeight(Math.min(viewportHeight * (2 / 3), 780), viewportHeight);
}

function getStoredDrawerHeight(viewportHeight: number): number {
    const storedValue = localStorage.getItem('drawerHeight');
    const storedHeight = storedValue === null ? Number.NaN : Number(storedValue);
    return Number.isFinite(storedHeight) ? clampDrawerHeight(storedHeight, viewportHeight) : getDefaultDrawerHeight(viewportHeight);
}

function clampDrawerHeight(height: number, viewportHeight: number): number {
    return Math.min(Math.max(height, drawerMinHeight), Math.max(drawerMinHeight, viewportHeight - 8));
}

function getViewportHeight(): number {
    const visualViewportHeight = window.visualViewport?.height;
    return Math.round(visualViewportHeight && visualViewportHeight > 0
        ? visualViewportHeight
        : document.documentElement.clientHeight || window.innerHeight);
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


