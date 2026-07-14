import type { Feature, Geometry } from 'geojson';
import type { FeatureProps } from '../../geojson/types';
import type { FeatureGroup } from './types';

export function buildFeatureGroups(features: Feature<Geometry, FeatureProps>[]): FeatureGroup[] {
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

export function filterFeatureGroups(groups: FeatureGroup[], query: string): FeatureGroup[] {
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

export function getFeatureLink(feature: Feature<Geometry, FeatureProps>, kind: 'map' | 'document' | 'web') {
    if (kind === 'map') {
        return feature.properties.linkMap ?? feature.properties.pin;
    }

    if (kind === 'document') {
        return feature.properties.linkDocument ?? feature.properties.document;
    }

    return feature.properties.linkWeb;
}
