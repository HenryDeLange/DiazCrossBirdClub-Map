import type { FeatureCollection, Geometry } from 'geojson';
import { GeoJSON } from 'react-leaflet';
import { pointToLayerShowText, pointToLayerSpotLabel } from '../features/featureAsTextMarker';
import { onEachFeatureShowPopup } from '../features/featurePopup';
import { styleFunction } from '../features/featureStyle';
import type { FeatureProps } from '../geojson/types';

type Props = {
    layer: FeatureCollection<Geometry, FeatureProps>;
    onTextMarkerClick?: (searchText: string) => void;
}

export function GenericGeoJSONLayer({ layer, onTextMarkerClick }: Readonly<Props>) {
    return (
        <GeoJSON
            data={layer}
            style={styleFunction}
            onEachFeature={onEachFeatureShowPopup}
            pointToLayer={(feature, latlng) => pointToLayerShowText(feature, latlng, {
                onTextMarkerClick: ({ searchText }) => onTextMarkerClick?.(searchText)
            })}
        />
    );
}

export function SpotNameLabels({ layer }: Readonly<Props>) {
    const hasSpotLabels = layer.features.some((feature) => feature.properties.category === 'spot'
        && (feature.geometry.type === 'Point' || feature.geometry.type === 'MultiPoint'));

    if (!hasSpotLabels) {
        return null;
    }

    return (
        <GeoJSON
            data={layer}
            filter={(feature) => feature.properties.category === 'spot'
                && (feature.geometry.type === 'Point' || feature.geometry.type === 'MultiPoint')}
            onEachFeature={onEachFeatureShowPopup}
            pointToLayer={pointToLayerSpotLabel}
        />
    );
}
