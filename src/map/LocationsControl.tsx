import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Binoculars, Footprints, Info, MapPin, MapPinSearch, Route, Share2, Telescope, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import { useDebounceValue } from 'usehooks-ts';
import inatLogo from '../assets/inat-logo.png';
import { DrawerSearchField } from './DrawerSearchField';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import type { FeatureProps } from './geojson/types';
import { findLocationGroupByName, focusLocationGroup, getLocationUrl } from './locationUtils';

type Props = {
    mapHeight: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onOpenInat: () => void;
    onLocationSelected: (locationName: string) => void;
    onSearchCleared: () => void;
    initialSearchQuery?: string;
    initialTab?: string;
    initialFocusQuery?: string;
    searchVersion?: number;
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
}: Readonly<Props>) {
    const map = useMap();

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

    const tabs = [
        { label: 'Outings', content: (searchQuery: string) => <FeatureDetails geojson={outings} searchQuery={searchQuery} onClose={onClose} onOpenInat={onOpenInat} onLocationSelected={onLocationSelected} initialFocusQuery={initialFocusQuery} tabLabel='Outings' /> },
        { label: 'Spots', content: (searchQuery: string) => <FeatureDetails geojson={spots} searchQuery={searchQuery} onClose={onClose} onOpenInat={onOpenInat} onLocationSelected={onLocationSelected} initialFocusQuery={initialFocusQuery} tabLabel='Spots' /> },
        { label: 'Paths', content: (searchQuery: string) => <FeatureDetails geojson={paths} searchQuery={searchQuery} onClose={onClose} onOpenInat={onOpenInat} onLocationSelected={onLocationSelected} initialFocusQuery={initialFocusQuery} tabLabel='Paths' /> },
        { label: 'Points', content: (searchQuery: string) => <FeatureDetails geojson={points} searchQuery={searchQuery} onClose={onClose} onOpenInat={onOpenInat} onLocationSelected={onLocationSelected} initialFocusQuery={initialFocusQuery} tabLabel='Points' /> }
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
            {isOpen && (
                <div className={`drawer-backdrop ${isOpen ? 'drawer-backdrop-open' : 'drawer-backdrop-closing'}`} onClick={onClose}>
                    <div
                        className={`drawer-panel ${isOpen ? 'drawer-open' : 'drawer-closed'}`}
                        onClick={(event) => event.stopPropagation()}
                        style={{ height: drawerHeight, maxHeight: 'calc(100dvh - 1rem)' }}
                    >
                        <div className='drawer-header'>
                            <div>
                                <div className='drawer-title'>Birding Locations</div>
                            </div>
                            <button type='button' className='drawer-close drawer-close-large' onClick={onClose} aria-label='Close drawer'>
                                <X className='drawer-close-icon' />
                            </button>
                        </div>
                        <Tabs
                            key={`locations-tabs-${searchVersion ?? 0}`}
                            height={drawerHeight - 104}
                            tabs={tabs}
                            initialSearchQuery={initialSearchQuery}
                            initialTab={initialTab}
                            onSearchCleared={onSearchCleared}
                        />
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
    initialSearchQuery?: string;
    initialTab?: string;
    onSearchCleared: () => void;
}

function Tabs({ tabs, height, initialSearchQuery, initialTab, onSearchCleared }: TabProps) {
    const [activeTab, setActiveTab] = useState(
        initialTab && locationTabNames.includes(initialTab) ? initialTab : tabs[0].label
    );
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
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

    const previousSearchQueryRef = useRef(searchQuery);

    useEffect(() => {
        if (previousSearchQueryRef.current.trim() && !searchQuery.trim()) {
            onSearchCleared();
        }

        previousSearchQueryRef.current = searchQuery;
    }, [onSearchCleared, searchQuery]);

    return (
        <>
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
            <DrawerSearchField
                ariaLabel='Search locations'
                onChange={setSearchQuery}
                placeholder='Search locations'
                value={searchQuery}
            />
            <div className='drawer-content' ref={contentRef} style={{ height }}>
                {tabs.map((tab) => activeTab === tab.label && (
                    <div key={tab.label}>{tab.content(debouncedSearchQuery)}</div>
                ))}
            </div>
        </>
    );
};

const locationTabNames = ['Outings', 'Spots', 'Paths', 'Points'];

type FeatureDetailsProps = {
    geojson: FeatureCollection<Geometry, FeatureProps>[];
    searchQuery: string;
    onClose: () => void;
    onOpenInat: () => void;
    onLocationSelected: (locationName: string) => void;
    initialFocusQuery?: string;
    tabLabel: string;
}

type FeatureGroup = {
    heading: Feature<Geometry, FeatureProps> | null;
    items: Array<{ feature: Feature<Geometry, FeatureProps>; featureIndex: number }>;
}

function FeatureDetails({ geojson, searchQuery, onClose, onOpenInat, onLocationSelected, initialFocusQuery, tabLabel }: FeatureDetailsProps) {
    const map = useMap();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const hasHandledInitialFocus = useRef(false);

    useEffect(() => {
        if (!initialFocusQuery || hasHandledInitialFocus.current) {
            return;
        }

        const locationGroup = findLocationGroupByName(geojson, initialFocusQuery);
        hasHandledInitialFocus.current = true;

        if (!locationGroup) {
            console.warn(`No location matched path: ${initialFocusQuery}`);
            return;
        }

        focusLocationGroup(map, locationGroup.heading, locationGroup.items);
    }, [geojson, initialFocusQuery, map]);

    const allGroups = geojson.map((geojsonObject) => filterFeatureGroups(buildFeatureGroups(geojsonObject.features), normalizedQuery));
    const hasAnyResults = allGroups.some((groups) => groups.length > 0);

    if (!hasAnyResults) {
        return <div className='drawer-empty'>No locations match your search.</div>;
    }

    return (
        <>
            {geojson.map((_geojsonObject, outingIndex) => {
                const groups = allGroups[outingIndex];

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
                                                <div className='location-group-header-main'>
                                                    <span className='location-category-badge' title={`${tabLabel} category`}>
                                                        <PrimaryCategoryIcon tabLabel={tabLabel} />
                                                    </span>
                                                    <div className='location-group-title'>{heading.properties.name}</div>
                                                </div>
                                                <div className='location-group-header-actions'>
                                                    <button
                                                        type='button'
                                                        className='location-card-nav location-card-nav-inat'
                                                        onClick={() => {
                                                            onLocationSelected(heading.properties.name);
                                                            map.once('moveend', () => onOpenInat());
                                                            focusLocationGroup(map, heading, group.items);
                                                        }}
                                                        aria-label={`Open iNaturalist observations near ${heading.properties.name}`}
                                                        title='Open iNaturalist observations'
                                                    >
                                                        <img className='location-card-nav-image' alt='iNaturalist' src={inatLogo} />
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className='location-card-nav'
                                                        onClick={() => {
                                                            onLocationSelected(heading.properties.name);
                                                            void shareLocation(heading.properties.name);
                                                        }}
                                                        aria-label={`Share ${heading.properties.name}`}
                                                        title='Share location'
                                                    >
                                                        <Share2 className='location-card-nav-icon' />
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className='location-card-nav location-card-nav-title'
                                                        onClick={() => {
                                                            onLocationSelected(heading.properties.name);
                                                            focusLocationGroup(map, heading, group.items);
                                                            onClose();
                                                        }}
                                                        aria-label={`Navigate to ${heading.properties.name}`}
                                                        title={`Navigate to ${heading.properties.name}`}
                                                    >
                                                        <MapPinSearch className='location-card-nav-icon' />
                                                    </button>
                                                </div>
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
                                                                {linkWeb && (
                                                                    <a href={linkWeb} target='_blank' rel='noreferrer'>Website</a>
                                                                )}
                                                                {linkMap && (
                                                                    <a href={linkMap} target='_blank' rel='noreferrer'>Google Maps</a>
                                                                )}
                                                                {linkDocument && (
                                                                    <a href={linkDocument} target='_blank' rel='noreferrer'>DCBC Doc</a>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <button
                                                                type='button'
                                                                className='location-card-nav'
                                                                onClick={() => {
                                                                        focusLocationGroup(map, feature, []);
                                                                    onClose();
                                                                }}
                                                                aria-label={`Navigate to ${feature.properties.name}`}
                                                                title={`Navigate to ${feature.properties.name}`}
                                                            >
                                                                <MapPinSearch className='location-card-nav-icon' />
                                                            </button>
                                                        </div>
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

function PrimaryCategoryIcon({ tabLabel }: { tabLabel: string }) {
    const iconByTab: Record<string, LucideIcon> = {
        Outings: Footprints,
        Spots: Binoculars,
        Paths: Route,
        Points: Telescope
    };

    const Icon = iconByTab[tabLabel] ?? MapPin;

    return <Icon className='location-card-nav-icon' aria-hidden='true' />;
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

function getFeatureLink(feature: Feature<Geometry, FeatureProps>, kind: 'map' | 'document' | 'web') {
    if (kind === 'map') {
        return feature.properties.linkMap ?? feature.properties.pin;
    }

    if (kind === 'document') {
        return feature.properties.linkDocument ?? feature.properties.document;
    }

    return feature.properties.linkWeb;
}

function shareLocation(locationName: string) {
    const shareUrl = getLocationUrl(locationName);

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(shareUrl).catch(() => undefined);
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
        const canShare = typeof navigator.canShare !== 'function' || navigator.canShare({ url: shareUrl });

        if (canShare) {
            return navigator.share({
                title: locationName,
                text: `Birding location: ${locationName}`,
                url: shareUrl
            }).catch(() => undefined);
        }
    }

    if (typeof window !== 'undefined') {
        window.prompt('Copy location link', shareUrl);
    }

    return Promise.resolve();
}
