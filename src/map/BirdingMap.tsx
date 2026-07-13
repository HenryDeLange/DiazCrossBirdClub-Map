
import { useEffect, useRef, useState } from 'react';
import { AttributionControl, LayerGroup, LayersControl, MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { GenericGeoJSONLayer } from './GenericGeoJSONLayer';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import { LocateControl } from './LocateControl';
import { LocationsControl } from './LocationsControl';
import { Logo } from './Logo';
import './map.css';
import { MapEvents } from './MapEvents';
import { SpeciesListControl } from './SpeciesListControl';

type OpenDrawer = 'inat' | 'locations' | null;
type TabName = 'Outings' | 'Spots' | 'Paths' | 'Points';

type LayerState = {
    baseLayer: string;
    overlays: Record<string, boolean>;
}

export default function BirdingMap() {
    const [mapHeight, setMapHeight] = useState(window.innerHeight);
    const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [openDrawer, setOpenDrawer] = useState<OpenDrawer>(null);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [locationSearchVersion, setLocationSearchVersion] = useState(0);

    const [layerState, setLayerState] = useState<LayerState>(() => {
        const raw = localStorage.getItem('mapLayerState');
        if (!raw) {
            return defaultLayerState;
        }

        try {
            const parsed = JSON.parse(raw) as Partial<LayerState>;
            return {
                baseLayer: baseLayerNames.includes(String(parsed.baseLayer)) ? String(parsed.baseLayer) : defaultLayerState.baseLayer,
                overlays: {
                    ...defaultLayerState.overlays,
                    ...(parsed.overlays ?? {})
                }
            };
        }
        catch {
            return defaultLayerState;
        }
    });

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

    const center = JSON.parse(localStorage.getItem('mapCenter') ?? JSON.stringify(startPosition));
    const zoom = Number(localStorage.getItem('mapZoom') ?? 11);

    const toggleDrawer = (drawer: OpenDrawer) => {
        setOpenDrawer((current) => {
            if (current === drawer) {
                if (drawer === 'locations') {
                    setLocationSearchQuery('');
                }
                return null;
            }
            return drawer;
        });
    };

    const closeDrawer = () => {
        setOpenDrawer((current) => {
            if (current === 'locations') {
                setLocationSearchQuery('');
            }
            return null;
        });
    };

    const handleTextMarkerClick = (searchText: string, tab: TabName) => {
        setLocationSearchQuery(searchText);
        setLocationSearchVersion((current) => current + 1);
        setOpenDrawer('locations');
        setSelectedLocationsTab(tab);
    };

    const [selectedLocationsTab, setSelectedLocationsTab] = useState<TabName>('Outings');
    const openDrawerRef = useRef<OpenDrawer>(openDrawer);
    const hasDrawerHistoryEntryRef = useRef(false);

    useEffect(() => {
        openDrawerRef.current = openDrawer;
    }, [openDrawer]);

    useEffect(() => {
        localStorage.setItem('mapLayerState', JSON.stringify(layerState));
    }, [layerState]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const onPopState = () => {
            if (openDrawerRef.current !== null) {
                hasDrawerHistoryEntryRef.current = false;
                if (openDrawerRef.current === 'locations') {
                    setLocationSearchQuery('');
                }
                setOpenDrawer(null);
            }
        };

        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('popstate', onPopState);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (openDrawer !== null) {
            if (!hasDrawerHistoryEntryRef.current) {
                window.history.pushState({ mapDrawer: true }, '');
                hasDrawerHistoryEntryRef.current = true;
            }
            return;
        }

        if (hasDrawerHistoryEntryRef.current) {
            hasDrawerHistoryEntryRef.current = false;
            window.history.back();
        }
    }, [openDrawer]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && openDrawerRef.current !== null) {
                setOpenDrawer(null);
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            attributionControl={false}
            zoomControl={false}
            style={{ height: mapHeight }}
        >
            <Logo />
            <SpeciesListControl
                mapHeight={mapHeight}
                isOpen={openDrawer === 'inat'}
                onToggle={() => toggleDrawer('inat')}
                onClose={closeDrawer}
            />
            <LocationsControl
                mapHeight={mapHeight}
                isOpen={openDrawer === 'locations'}
                onToggle={() => toggleDrawer('locations')}
                onClose={closeDrawer}
                initialSearchQuery={locationSearchQuery}
                initialTab={selectedLocationsTab}
                searchVersion={locationSearchVersion}
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

type LayerStateSyncProps = {
    onLayerStateChange: (updater: (current: LayerState) => LayerState) => void;
}

function LayerStateSync({ onLayerStateChange }: Readonly<LayerStateSyncProps>) {
    const map = useMap();

    useEffect(() => {
        const handleBaseLayerChange = (event: { name?: string }) => {
            if (!event.name) {
                return;
            }
            onLayerStateChange((current) => ({
                ...current,
                baseLayer: event.name ?? current.baseLayer
            }));
        };

        const handleOverlayAdd = (event: { name?: string }) => {
            if (!event.name) {
                return;
            }
            const name = event.name;
            onLayerStateChange((current) => ({
                ...current,
                overlays: {
                    ...current.overlays,
                    [name]: true
                }
            }));
        };

        const handleOverlayRemove = (event: { name?: string }) => {
            if (!event.name) {
                return;
            }
            const name = event.name;
            onLayerStateChange((current) => ({
                ...current,
                overlays: {
                    ...current.overlays,
                    [name]: false
                }
            }));
        };

        map.on('baselayerchange', handleBaseLayerChange);
        map.on('overlayadd', handleOverlayAdd);
        map.on('overlayremove', handleOverlayRemove);

        return () => {
            map.off('baselayerchange', handleBaseLayerChange);
            map.off('overlayadd', handleOverlayAdd);
            map.off('overlayremove', handleOverlayRemove);
        };
    }, [map, onLayerStateChange]);

    return null;
}

const startPosition = {
    lat: -33.6,
    lng: 26.73
};

const subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];

const maxZoom = 20;

const baseLayerNames = ['Google Maps - Street', 'Google Maps - Hybrid', 'Google Maps - Satellite'];

const defaultLayerState: LayerState = {
    baseLayer: 'Google Maps - Street',
    overlays: {
        'Birding Loops': true,
        'Birding Points of Interest': true,
        'Birding Spots': true,
        'Birding Outings': true
    }
};
