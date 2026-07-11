import type { GeoJsonObject } from 'geojson';
import { GeoJSON } from 'react-leaflet';
import { pointToLayerShowText } from './featureAsTextMarker';
import { onEachFeatureShowPopup } from './featurePopup';
import { styleFunction } from './featureStyle';

type Props = {
    layer: GeoJsonObject;
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
