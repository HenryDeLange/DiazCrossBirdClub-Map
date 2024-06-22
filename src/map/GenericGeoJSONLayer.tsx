import { pointToLayerShowText } from 'map/featureAsTextMarker';
import { onEachFeatureShowPopup } from 'map/featurePopup';
import { styleFunction } from 'map/featureStyle';
import { GeoJSON } from 'react-leaflet';

type Props = {
    layer: any;
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
