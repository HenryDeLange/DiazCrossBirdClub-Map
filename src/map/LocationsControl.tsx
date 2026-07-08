import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { LatLngBounds, type LatLngExpression } from 'leaflet';
import { Info, MapPinSearch, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import { useDebounceValue } from 'usehooks-ts';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import type { FeatureProps } from './geojson/types';

type Props = {
    mapHeight: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function LocationsControl({ mapHeight, isOpen, onToggle, onClose }: Readonly<Props>) {
    const map = useMap();
    const [isMounted, setIsMounted] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            setIsClosing(false);
        }
        else if (isMounted) {
            setIsClosing(true);
            const timeout = window.setTimeout(() => {
                setIsMounted(false);
                setIsClosing(false);
            }, 240);
            return () => window.clearTimeout(timeout);
        }
    }, [isOpen, isMounted]);

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
    const showDrawer = isMounted || isOpen;

    const tabs = [
        { label: 'Outings', content: (searchQuery: string) => <FeatureDetails geojson={outings} searchQuery={searchQuery} onClose={onClose} /> },
        { label: 'Spots', content: (searchQuery: string) => <FeatureDetails geojson={spots} searchQuery={searchQuery} onClose={onClose} /> },
        { label: 'Paths', content: (searchQuery: string) => <FeatureDetails geojson={paths} searchQuery={searchQuery} onClose={onClose} /> },
        { label: 'Points', content: (searchQuery: string) => <FeatureDetails geojson={points} searchQuery={searchQuery} onClose={onClose} /> }
    ];

    return (
        <>
            <div className='control-group locations-group'>
                <button
                    className='control-button locations-button'
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggle();
                    }}
                    title='Birding Locations'
                    type='button'
                >
                    <Info className='button-icon' />
                </button>
            </div>
            {showDrawer && (
                <div className={`drawer-backdrop ${isOpen ? 'drawer-backdrop-open' : 'drawer-backdrop-closing'}`} onClick={onClose}>
                    <div
                        className={`drawer-panel ${isOpen ? 'drawer-open' : 'drawer-closed'} ${isClosing ? 'drawer-closing' : ''}`}
                        onClick={(event) => event.stopPropagation()}
                        style={{ height: drawerHeight, maxHeight: 'calc(100dvh - 1rem)' }}
                    >
                        <div className='drawer-header'>
                            <div>
                                <div className='drawer-label'>Map Locations</div>
                                <div className='drawer-title'>Birding Location Details</div>
                            </div>
                            <button type='button' className='drawer-close drawer-close-large' onClick={onClose} aria-label='Close drawer'>
                                <X className='drawer-close-icon' />
                            </button>
                        </div>
                        <Tabs height={drawerHeight - 104} tabs={tabs} />
                    </div>
                </div>
            )}
        </>
    );
}

type TabProps = {
    tabs: {
        label: string;
        content: (searchQuery: string) => ReactNode;
    }[];
    height: number;
}

function Tabs({ tabs, height }: TabProps) {
    const [activeTab, setActiveTab] = useState(tabs[0].label);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounceValue(searchQuery, 180);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(max-width: 820px)').matches : false);
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(max-width: 820px)');
        const updateLayout = () => setIsMobile(mediaQuery.matches);

        updateLayout();

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', updateLayout);
            return () => mediaQuery.removeEventListener('change', updateLayout);
        }

        mediaQuery.addListener(updateLayout);
        return () => mediaQuery.removeListener(updateLayout);
    }, []);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeTab, debouncedSearchQuery]);

    return (
        <>
            <div className='drawer-search-row'>
                <Search className='drawer-search-icon' />
                <input
                    aria-label='Search locations'
                    className='drawer-search-input'
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder='Search locations'
                    type='search'
                    value={searchQuery}
                />
            </div>
            {isMobile ? (
                <div className='drawer-tab-select-row'>
                    <select
                        aria-label='Choose location type'
                        className='drawer-tab-select'
                        onChange={(event) => setActiveTab(event.target.value)}
                        value={activeTab}
                    >
                        {tabs.map((tab) => (
                            <option key={tab.label} value={tab.label}>
                                {tab.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className='drawer-tabs'>
                    {tabs.map((tab) => (
                        <button
                            key={tab.label}
                            type='button'
                            className={`drawer-tab ${activeTab === tab.label ? 'drawer-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.label)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
            <div className='drawer-content' ref={contentRef} style={{ height }}>
                {tabs.map((tab) => activeTab === tab.label && (
                    <div key={tab.label}>{tab.content(debouncedSearchQuery)}</div>
                ))}
            </div>
        </>
    );
};

type FeatureDetailsProps = {
    geojson: FeatureCollection<Geometry, FeatureProps>[];
    searchQuery: string;
    onClose: () => void;
}

type FeatureGroup = {
    heading: Feature<Geometry, FeatureProps> | null;
    items: Array<{ feature: Feature<Geometry, FeatureProps>; featureIndex: number }>;
}

function FeatureDetails({ geojson, searchQuery, onClose }: FeatureDetailsProps) {
    const map = useMap();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const focusFeature = (feature: Feature<Geometry, FeatureProps>) => {
        if (feature.geometry.type === 'Point') {
            const [lng, lat] = feature.geometry.coordinates;
            map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
            return;
        }

        const bounds = getFeatureBounds(feature.geometry);

        if (bounds) {
            map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
        }
    };

    return (
        <>
            {geojson.map((geojsonObject, outingIndex) => {
                const groups = filterFeatureGroups(buildFeatureGroups(geojsonObject.features), normalizedQuery);

                if (groups.length === 0) {
                    return null;
                }

                return (
                    <div key={outingIndex} className='location-list'>
                        {groups.map((group, groupIndex) => {
                            const heading = group.heading;
                            const hasHeading = Boolean(heading?.properties.name);

                            return (
                                <div key={`${outingIndex}-${groupIndex}`} className='location-group'>
                                    {hasHeading && heading && (
                                        <div className='location-group-header'>
                                            <div className='location-group-header-row'>
                                                <div className='location-group-title'>{heading.properties.name}</div>
                                                <button
                                                    type='button'
                                                    className='location-card-nav'
                                                    onClick={() => {
                                                        focusFeature(heading);
                                                        onClose();
                                                    }}
                                                    aria-label={`Navigate to ${heading.properties.name}`}
                                                    title={`Navigate to ${heading.properties.name}`}
                                                >
                                                    <MapPinSearch className='location-card-nav-icon' />
                                                </button>
                                            </div>
                                            {heading.properties.description && (
                                                <div className='location-group-description'>{heading.properties.description}</div>
                                            )}
                                            <div className='location-card-links'>
                                                {getFeatureLink(heading, 'map') && (
                                                    <a href={getFeatureLink(heading, 'map')} target='_blank' rel='noreferrer'>Map pin</a>
                                                )}
                                                {getFeatureLink(heading, 'document') && (
                                                    <a href={getFeatureLink(heading, 'document')} target='_blank' rel='noreferrer'>Document</a>
                                                )}
                                                {getFeatureLink(heading, 'web') && (
                                                    <a href={getFeatureLink(heading, 'web')} target='_blank' rel='noreferrer'>Website</a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {group.items.length > 0 && (
                                        <ul className='location-group-items'>
                                            {group.items.map(({ feature, featureIndex }) => {
                                                if (!feature.properties.name) {
                                                    return null;
                                                }

                                                const linkMap = getFeatureLink(feature, 'map');
                                                const linkDocument = getFeatureLink(feature, 'document');
                                                const linkWeb = getFeatureLink(feature, 'web');

                                                return (
                                                    <li key={`${featureIndex}_${feature.properties.name}_${feature.id ?? 'unknown'}`} className='location-group-item'>
                                                        <div className='location-group-item-main'>
                                                            <div className='location-group-item-title'>{feature.properties.name}</div>
                                                            {feature.properties.description && (
                                                                <div className='location-group-item-description'>{feature.properties.description}</div>
                                                            )}
                                                            <div className='location-card-links'>
                                                                {linkMap && (
                                                                    <a href={linkMap} target='_blank' rel='noreferrer'>Map pin</a>
                                                                )}
                                                                {linkDocument && (
                                                                    <a href={linkDocument} target='_blank' rel='noreferrer'>Document</a>
                                                                )}
                                                                {linkWeb && (
                                                                    <a href={linkWeb} target='_blank' rel='noreferrer'>Website</a>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type='button'
                                                            className='location-card-nav'
                                                            onClick={() => {
                                                                focusFeature(feature);
                                                                onClose();
                                                            }}
                                                            aria-label={`Navigate to ${feature.properties.name}`}
                                                            title={`Navigate to ${feature.properties.name}`}
                                                        >
                                                            <MapPinSearch className='location-card-nav-icon' />
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
}

function buildFeatureGroups(features: Feature<Geometry, FeatureProps>[]): FeatureGroup[] {
    const namedFeatures = features.filter((feature) => feature.properties?.name);
    const headingIndex = namedFeatures.findIndex((feature) => feature.geometry.type === 'Point');

    if (headingIndex >= 0) {
        const heading = namedFeatures[headingIndex];
        const items = namedFeatures
            .filter((_, index) => index !== headingIndex)
            .map((feature) => ({ feature, featureIndex: features.indexOf(feature) }));
        return [{ heading, items }];
    }

    const groups: FeatureGroup[] = [];
    namedFeatures.forEach((feature) => {
        if (feature.geometry.type === 'Point') {
            groups.push({ heading: feature, items: [] });
            return;
        }

        const currentGroup = groups[groups.length - 1];
        if (currentGroup) {
            currentGroup.items.push({ feature, featureIndex: features.indexOf(feature) });
            return;
        }

        groups.push({ heading: null, items: [{ feature, featureIndex: features.indexOf(feature) }] });
    });

    return groups;
}

function filterFeatureGroups(groups: FeatureGroup[], query: string): FeatureGroup[] {
    if (!query) {
        return groups;
    }

    return groups
        .map((group) => {
            const headingMatches = matchesQuery(group.heading, query);
            const filteredItems = group.items.filter(({ feature }) => matchesQuery(feature, query));

            if (headingMatches || filteredItems.length > 0) {
                return {
                    ...group,
                    items: filteredItems,
                };
            }

            return null;
        })
        .filter((group): group is FeatureGroup => Boolean(group));
}

function matchesQuery(feature: Feature<Geometry, FeatureProps> | null, query: string): boolean {
    if (!feature) {
        return false;
    }

    const searchableText = [
        feature.properties.name,
        feature.properties.description,
        feature.properties.linkMap,
        feature.properties.linkDocument,
        feature.properties.linkWeb,
        feature.properties.document,
        feature.properties.pin,
    ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();

    return searchableText.includes(query);
}

function getFeatureBounds(geometry: Geometry): LatLngBounds | null {
    const points: LatLngExpression[] = [];
    if (geometry.type === 'Point') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'MultiPoint') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'LineString') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'MultiLineString') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'Polygon') {
        collectCoordinates(geometry.coordinates, points);
    }
    else if (geometry.type === 'MultiPolygon') {
        collectCoordinates(geometry.coordinates, points);
    }

    if (points.length === 0) {
        return null;
    }

    const bounds = new LatLngBounds([]);
    points.forEach((point) => bounds.extend(point));
    return bounds;
}

function collectCoordinates(value: unknown, points: LatLngExpression[]): void {
    if (!Array.isArray(value)) {
        return;
    }

    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
        points.push([value[1], value[0]] as LatLngExpression);
        return;
    }

    value.forEach((child) => collectCoordinates(child, points));
}

function getFeatureLink(feature: Feature<Geometry, FeatureProps>, kind: 'map' | 'document' | 'web') {
    if (kind === 'map') {
        return feature.properties.linkMap ?? feature.properties.pin;
    }

    if (kind === 'document') {
        return feature.properties.linkDocument ?? feature.properties.document;
    }

    return feature.properties.linkWeb;
}
