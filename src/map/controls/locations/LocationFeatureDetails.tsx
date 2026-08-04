import type { FeatureCollection, Geometry } from 'geojson';
import { MapPinSearch, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import inatLogo from '../../../assets/inat-logo.png';
import type { FeatureProps } from '../../geojson/types';
import { findLocationGroupByName, focusLocationGroup } from '../../locationUtils';
import { LocationAstronomySummary } from './LocationAstronomySummary';
import { buildFeatureGroups, filterFeatureGroups, getFeatureLink } from './locationFeatureUtils';
import { PrimaryCategoryIcon } from './PrimaryCategoryIcon';
import { shareLocation } from './shareLocation';
import type { AstronomyLocation, FeatureDetailsProps } from './types';

export function LocationFeatureDetails({
    geojson,
    searchQuery,
    onClose,
    onOpenInat,
    onLocationSelected,
    initialFocusQuery,
    tabLabel,
    onOpenAstronomy
}: Readonly<FeatureDetailsProps>) {
    const map = useMap();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const hasHandledInitialFocus = useRef(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const openAstronomy = (location: AstronomyLocation) => onOpenAstronomy(location, tabLabel);

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

    const allGroups = geojson.map((geojsonObject: FeatureCollection<Geometry, FeatureProps>) => (
        filterFeatureGroups(buildFeatureGroups(geojsonObject.features), normalizedQuery)
    ));
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
                            const groupKey = `${outingIndex}-${groupIndex}`;
                            const itemsId = `location-group-items-${groupKey}`;
                            const isExpanded = !collapsedGroups[groupKey];

                            return (
                                <div key={`${outingIndex}-${groupIndex}`} className='location-group'>
                                    {hasHeading && heading && (
                                        <div className='location-group-header'>
                                            <div className='location-group-header-row'>
                                                <div className='location-group-header-main'>
                                                    <button
                                                        type='button'
                                                        className='location-category-badge'
                                                        title={`${isExpanded ? 'Collapse' : 'Expand'} ${tabLabel} category`}
                                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${heading.properties.name}`}
                                                        aria-expanded={isExpanded}
                                                        aria-controls={itemsId}
                                                        onClick={() => setCollapsedGroups((current) => ({ ...current, [groupKey]: isExpanded }))}
                                                    >
                                                        <PrimaryCategoryIcon tabLabel={tabLabel} />
                                                    </button>
                                                    <div className='location-group-title'>{heading.properties.name}</div>
                                                </div>
                                                <div className='location-group-header-actions'>
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
                                                        className='location-card-nav location-card-nav-inat'
                                                        onClick={() => {
                                                            onLocationSelected(heading.properties.name);
                                                            map.once('moveend', () => onOpenInat(heading.properties.name));
                                                            focusLocationGroup(map, heading, group.items);
                                                        }}
                                                        aria-label={`Open iNaturalist observations near ${heading.properties.name}`}
                                                        title='Open iNaturalist observations'
                                                    >
                                                        <img className='location-card-nav-image' alt='iNaturalist' src={inatLogo} />
                                                    </button>
                                                    {heading.geometry.type === 'Point' && (
                                                        <LocationAstronomySummary
                                                            location={{
                                                                name: heading.properties.name,
                                                                latitude: heading.geometry.coordinates[1],
                                                                longitude: heading.geometry.coordinates[0]
                                                            }}
                                                            onOpen={openAstronomy}
                                                        />
                                                    )}
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
                                    {isExpanded && group.items.length > 0 && (
                                        <ul id={itemsId} className='location-group-items'>
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
