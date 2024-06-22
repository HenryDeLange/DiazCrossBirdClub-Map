
import { AttributionControl, LayerGroup, LayersControl, MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { GenericGeoJSONLayer } from './GenericGeoJSONLayer';
import { LocateControl } from './LocateControl';
import { Logo } from './Logo';
import { SpeciesListControl } from './SpeciesListControl';
import { outings } from './geojson/outings';
import { spots } from './geojson/spots';
import './map.css';

export default function BirdingMap() {
    return (
        <MapContainer center={startPosition} zoom={11} scrollWheelZoom attributionControl={false} zoomControl={false}>
            <Logo />
            <SpeciesListControl />
            <AttributionControl
                position='bottomleft'
                prefix='Google Maps | Leaflet | MyWild | Diaz Cross Bird Club'
            />
            <ZoomControl position='bottomright' />
            <LocateControl />
            <LayersControl position='topright'>
                <LayersControl.BaseLayer name='Google Maps - Street' checked={true}>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}'
                        maxZoom={maxZoom}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name='Google Maps - Hybrid'>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}'
                        maxZoom={maxZoom}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name='Google Maps - Satellite'>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}'
                        maxZoom={maxZoom}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.Overlay name='Birding Spots' checked>
                    <LayerGroup>
                        {spots.map((layer, index) => <GenericGeoJSONLayer key={index} layer={layer} />)}
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name='Birding Outings' checked>
                    <LayerGroup>
                        {outings.map((layer, index) => <GenericGeoJSONLayer key={index} layer={layer} />)}
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>
        </MapContainer>
    );
}

const startPosition = {
    lat: -33.6,
    lng: 26.73
};

const subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];

const maxZoom = 20;
