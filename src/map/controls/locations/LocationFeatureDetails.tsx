import { MapPinSearch, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import inatLogo from '../../../assets/inat-logo.png';
import drawerStyles from '../../components/MapDrawer.module.css';
import { findLocationGroupByName, focusLocationGroup } from '../../locationUtils';
import { LocationAstronomySummary } from './LocationAstronomySummary';
import styles from './LocationFeatureDetails.module.css';
import { buildFeatureGroups, filterFeatureGroups, getFeatureLink } from './locationFeatureUtils';
import { PrimaryCategoryIcon } from './PrimaryCategoryIcon';
import { shareLocation } from './shareLocation';
import type { FeatureDetailsProps, FeatureGroup } from './types';

export function LocationFeatureDetails({
    sources,
    searchQuery,
    onClose,
    onOpenInat,
    onLocationSelected,
    initialFocusQuery,
    onOpenAstronomy
}: Readonly<FeatureDetailsProps>) {
    const map = useMap();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const hasHandledInitialFocus = useRef(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const sourceGeojson = sources.flatMap(({ geojson }) => geojson);

    useEffect(() => {
        if (!initialFocusQuery || hasHandledInitialFocus.current) {
            return;
        }

        const locationGroup = findLocationGroupByName(sourceGeojson, initialFocusQuery);
        hasHandledInitialFocus.current = true;

        if (!locationGroup) {
            console.warn(`No location matched path: ${initialFocusQuery}`);
            return;
        }

        focusLocationGroup(map, locationGroup.heading, locationGroup.items);
    }, [initialFocusQuery, map, sourceGeojson]);

    const allGroups = sources
        .flatMap(({ tab, geojson }) => geojson.flatMap((geojsonObject, collectionIndex) => (
            filterFeatureGroups(buildFeatureGroups(geojsonObject.features), normalizedQuery).map((group, groupIndex) => ({
                id: `${tab}-${collectionIndex}-${groupIndex}`,
                tab,
                group: {
                    ...group,
                    items: [...group.items].sort(compareLocationItems)
                }
            }))
        )))
        .sort((left, right) => compareNames(getGroupName(left.group), getGroupName(right.group)));

    if (allGroups.length === 0) {
        return <div className={drawerStyles.empty}>No locations match your search.</div>;
    }

    return (
        <div className={styles.list}>
            {allGroups.map(({ group, tab, id: groupKey }) => {
                const heading = group.heading;
                            const hasHeading = Boolean(heading?.properties.name);
                            const itemsId = `location-group-items-${groupKey}`;
                            const isExpanded = !collapsedGroups[groupKey];

                            return (
                                <div key={groupKey} className={styles.group}>
                                    {hasHeading && heading && (
                                        <div className={styles.groupHeader}>
                                            <div className={styles.groupHeaderRow}>
                                                <div className={styles.groupHeaderMain}>
                                                    <button
                                                        type='button'
                                                        className={styles.categoryBadge}
                                                        title={`${isExpanded ? 'Collapse' : 'Expand'} ${tab} category`}
                                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${heading.properties.name}`}
                                                        aria-expanded={isExpanded}
                                                        aria-controls={itemsId}
                                                        onClick={() => setCollapsedGroups((current) => ({ ...current, [groupKey]: isExpanded }))}
                                                    >
                                                        <PrimaryCategoryIcon tabLabel={tab} />
                                                    </button>
                                                    <div className={styles.groupTitle}>{heading.properties.name}</div>
                                                </div>
                                                <div className={styles.groupHeaderActions}>
                                                    <button
                                                        type='button'
                                                        className={styles.cardNav}
                                                        onClick={() => {
                                                            onLocationSelected(heading.properties.name);
                                                            void shareLocation(heading.properties.name);
                                                        }}
                                                        aria-label={`Share ${heading.properties.name}`}
                                                        title='Share location'
                                                    >
                                                        <Share2 className={styles.cardNavIcon} />
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className={`${styles.cardNav} ${styles.cardNavInat}`}
                                                        onClick={() => {
                                                            onLocationSelected(heading.properties.name);
                                                            map.once('moveend', () => {
                                                                requestAnimationFrame(() => onOpenInat(heading.properties.name, tab));
                                                            });
                                                            focusLocationGroup(map, heading, group.items);
                                                        }}
                                                        aria-label={`Open iNaturalist observations near ${heading.properties.name}`}
                                                        title='Open iNaturalist observations'
                                                    >
                                                        <img className={styles.cardNavImage} alt='iNaturalist' src={inatLogo} />
                                                    </button>
                                                    {heading.geometry.type === 'Point' && (
                                                        <LocationAstronomySummary
                                                            location={{
                                                                name: heading.properties.name,
                                                                latitude: heading.geometry.coordinates[1],
                                                                longitude: heading.geometry.coordinates[0]
                                                            }}
                                                            onOpen={(location) => onOpenAstronomy(location, tab)}
                                                        />
                                                    )}
                                                    <button
                                                        type='button'
                                                        className={`${styles.cardNav} ${styles.cardNavTitle}`}
                                                        onClick={() => {
                                                            onLocationSelected(heading.properties.name);
                                                            focusLocationGroup(map, heading, group.items);
                                                            onClose();
                                                        }}
                                                        aria-label={`Navigate to ${heading.properties.name}`}
                                                        title={`Navigate to ${heading.properties.name}`}
                                                    >
                                                        <MapPinSearch className={styles.cardNavIcon} />
                                                    </button>
                                                </div>
                                            </div>
                                            {heading.properties.description && (
                                                <div className={styles.groupDescription}>{heading.properties.description}</div>
                                            )}
                                            <div className={styles.cardLinks}>
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
                                        <ul id={itemsId} className={styles.groupItems}>
                                            {group.items.map(({ feature, featureIndex }) => {
                                                if (!feature.properties.name) {
                                                    return null;
                                                }

                                                const linkMap = getFeatureLink(feature, 'map');
                                                const linkDocument = getFeatureLink(feature, 'document');
                                                const linkWeb = getFeatureLink(feature, 'web');

                                                return (
                                                    <li key={`${featureIndex}_${feature.properties.name}_${feature.id ?? 'unknown'}`} className={styles.groupItem}>
                                                        <div className={styles.groupItemMain}>
                                                            <div className={styles.groupItemTitle}>{feature.properties.name}</div>
                                                            {feature.properties.description && (
                                                                <div className={styles.groupItemDescription}>{feature.properties.description}</div>
                                                            )}
                                                            <div className={styles.cardLinks}>
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
                                                                className={styles.cardNav}
                                                                onClick={() => {
                                                                    focusLocationGroup(map, feature, []);
                                                                    onClose();
                                                                }}
                                                                aria-label={`Navigate to ${feature.properties.name}`}
                                                                title={`Navigate to ${feature.properties.name}`}
                                                            >
                                                                <MapPinSearch className={styles.cardNavIcon} />
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
}

function compareLocationItems(left: FeatureGroup['items'][number], right: FeatureGroup['items'][number]): number {
    return compareNames(left.feature.properties.name ?? '', right.feature.properties.name ?? '');
}

function getGroupName(group: FeatureGroup): string {
    return group.heading?.properties.name ?? group.items[0]?.feature.properties.name ?? '';
}

function compareNames(left: string, right: string): number {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}
