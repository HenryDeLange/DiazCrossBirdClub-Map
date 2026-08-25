import { MapPinSearch, Share2 } from 'lucide-react';
import { memo } from 'react';
import { useMap } from 'react-leaflet';
import { focusLocationGroup, type LocationTabName } from '../../locationUtils';
import { LocationAstronomySummary } from './LocationAstronomySummary';
import styles from './LocationFeatureDetails.module.css';
import { LocationFeatureItem } from './LocationFeatureItem';
import { getFeatureLink } from './locationFeatureUtils';
import { PrimaryCategoryIcon } from './PrimaryCategoryIcon';
import { shareLocation } from './shareLocation';
import type { AstronomyLocation, FeatureGroup } from './types';

type LocationFeatureGroupProps = {
    group: FeatureGroup;
    groupKey: string;
    tab: LocationTabName;
    isExpanded: boolean;
    onToggle: (groupKey: string, isExpanded: boolean) => void;
    onClose: () => void;
    onOpenInat: (locationName: string, tab: LocationTabName) => void;
    onLocationSelected: (locationName: string) => void;
    onOpenAstronomy: (location: AstronomyLocation, tab: LocationTabName) => void;
}

export const LocationFeatureGroup = memo(function LocationFeatureGroup({
    group,
    groupKey,
    tab,
    isExpanded,
    onToggle,
    onClose,
    onOpenInat,
    onLocationSelected,
    onOpenAstronomy
}: Readonly<LocationFeatureGroupProps>) {
    const map = useMap();
    const heading = group.heading;
    const headingName = heading?.properties.name;
    const itemsId = `location-group-items-${groupKey}`;

    return (
        <div className={styles.group}>
            {headingName && heading && (
                <div className={styles.groupHeader}>
                    <div className={styles.groupHeaderRow}>
                        <div className={styles.groupHeaderMain}>
                            <button
                                type='button'
                                className={styles.categoryBadge}
                                title={`${isExpanded ? 'Collapse' : 'Expand'} ${tab} category`}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${headingName}`}
                                aria-expanded={isExpanded}
                                aria-controls={itemsId}
                                onClick={() => onToggle(groupKey, isExpanded)}
                            >
                                <PrimaryCategoryIcon tabLabel={tab} />
                            </button>
                            <div className={styles.groupTitle}>{headingName}</div>
                        </div>
                        <div className={styles.groupHeaderActions}>
                            <button
                                type='button'
                                className={styles.cardNav}
                                onClick={() => {
                                    onLocationSelected(headingName);
                                    void shareLocation(headingName);
                                }}
                                aria-label={`Share ${headingName}`}
                                title='Share location'
                            >
                                <Share2 className={styles.cardNavIcon} />
                            </button>
                            <button
                                type='button'
                                className={`${styles.cardNav} ${styles.cardNavInat}`}
                                onClick={() => {
                                    onLocationSelected(headingName);
                                    map.once('moveend', () => {
                                        requestAnimationFrame(() => onOpenInat(headingName, tab));
                                    });
                                    focusLocationGroup(map, heading, group.items);
                                }}
                                aria-label={`Open iNaturalist observations near ${headingName}`}
                                title='Open iNaturalist observations'
                            >
                                <span className={styles.cardNavImage} aria-hidden='true' />
                            </button>
                            {heading.geometry.type === 'Point' && (
                                <LocationAstronomySummary
                                    location={{
                                        name: headingName,
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
                                    onLocationSelected(headingName);
                                    focusLocationGroup(map, heading, group.items);
                                    onClose();
                                }}
                                aria-label={`Navigate to ${headingName}`}
                                title={`Navigate to ${headingName}`}
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
                    {group.items.map((item) => (
                        <LocationFeatureItem key={`${item.featureIndex}_${item.feature.properties.name}_${item.feature.id ?? 'unknown'}`} item={item} onClose={onClose} />
                    ))}
                </ul>
            )}
        </div>
    );
});