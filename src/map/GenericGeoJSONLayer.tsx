import type { GeoJsonObject } from 'geojson';
import { GeoJSON } from 'react-leaflet';
import { pointToLayerShowText } from './featureAsTextMarker';
import { onEachFeatureShowPopup } from './featurePopup';
import { styleFunction } from './featureStyle';

type Props = {
    layer: GeoJsonObject;
}

export function GenericGeoJSONLayer({ layer }: Readonly<Props>) {
    return (
        <GeoJSON
            data={layer}
            style={styleFunction}
            onEachFeature={onEachFeatureShowPopup}
            pointToLayer={pointToLayerShowText}
        />
    );
}
