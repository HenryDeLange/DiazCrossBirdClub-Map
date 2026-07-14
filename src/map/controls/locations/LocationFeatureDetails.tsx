import type { FeatureCollection, Geometry } from 'geojson';
import { MapPinSearch, Share2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import inatLogo from '../../../assets/inat-logo.png';
import type { FeatureProps } from '../../geojson/types';
import { findLocationGroupByName, focusLocationGroup } from '../../locationUtils';
import { PrimaryCategoryIcon } from './PrimaryCategoryIcon';
import { buildFeatureGroups, filterFeatureGroups, getFeatureLink } from './locationFeatureUtils';
import { shareLocation } from './shareLocation';
import type { FeatureDetailsProps } from './types';

export function LocationFeatureDetails({
    geojson,
    searchQuery,
    onClose,
    onOpenInat,
    onLocationSelected,
    initialFocusQuery,
    tabLabel
}: Readonly<FeatureDetailsProps>) {
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
