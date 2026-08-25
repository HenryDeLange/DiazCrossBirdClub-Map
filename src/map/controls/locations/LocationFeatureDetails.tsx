import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import drawerStyles from '../../components/MapDrawer.module.css';
import { findLocationGroupByName, focusLocationGroup } from '../../locationUtils';
import styles from './LocationFeatureDetails.module.css';
import { LocationFeatureGroup } from './LocationFeatureGroup';
import { buildFeatureGroups, filterFeatureGroups } from './locationFeatureUtils';
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
    const sourceGeojson = useMemo(() => sources.flatMap(({ geojson }) => geojson), [sources]);
    const handleGroupToggle = useCallback((groupKey: string, isExpanded: boolean) => {
        setCollapsedGroups((current) => ({ ...current, [groupKey]: isExpanded }));
    }, []);

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

    const allGroups = useMemo(() => sources
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
        .sort((left, right) => compareNames(getGroupName(left.group), getGroupName(right.group))), [normalizedQuery, sources]);

    if (allGroups.length === 0) {
        return <div className={drawerStyles.empty}>No locations match your search.</div>;
    }

    return (
        <div className={styles.list}>
            {allGroups.map(({ group, tab, id: groupKey }) => {
                return (
                    <LocationFeatureGroup
                        key={groupKey}
                        group={group}
                        groupKey={groupKey}
                        tab={tab}
                        isExpanded={!collapsedGroups[groupKey]}
                        onToggle={handleGroupToggle}
                        onClose={onClose}
                        onOpenInat={onOpenInat}
                        onLocationSelected={onLocationSelected}
                        onOpenAstronomy={onOpenAstronomy}
                    />
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
