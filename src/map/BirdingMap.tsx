
import { useEffect, useState } from 'react';
import { AttributionControl, LayerGroup, LayersControl, MapContainer, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet';
import { version } from '../../package.json';
import { GenericGeoJSONLayer } from './GenericGeoJSONLayer';
import { LocateControl } from './LocateControl';
import { LocationsControl } from './LocationsControl';
import { Logo } from './Logo';
import { SpeciesListControl } from './SpeciesListControl';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import './map.css';

export default function BirdingMap() {
    // Fix height
    const [mapHeight, setMapHeight] = useState(window.innerHeight);
    useEffect(() => {
        const updateDimensions = () => {
            setMapHeight(window.innerHeight);
        };
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);
    // Remember map position
    const center = JSON.parse(localStorage.getItem('mapCenter') ?? JSON.stringify(startPosition));
    const zoom = Number(localStorage.getItem('mapZoom') ?? 11);
    const MapEvents = () => {
        useMapEvents({
            moveend: (e) => {
                localStorage.setItem('mapCenter', JSON.stringify(e.target.getCenter()));
                console.log('set center', e.target.getCenter())
            },
            zoomend: (e) => {
                console.log('set zoom', e.target.getZoom())
                localStorage.setItem('mapZoom', JSON.stringify(e.target.getZoom()));
            },
        });
        return null;
    };
    // RENDER
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            attributionControl={false}
            zoomControl={false}
            style={{ height: mapHeight }}
        >
            <Logo />
            <SpeciesListControl mapHeight={mapHeight} />
            <LocationsControl mapHeight={mapHeight} />
            <AttributionControl
                position='bottomleft'
                prefix={`<a href='https://github.com/HenryDeLange/DiazCrossBirdClub-Map' target='_blank'>v${version}</a> | Google Maps | Leaflet | MyWild | Diaz Cross Bird Club`}
            />
            <LocateControl />
            <ZoomControl position='bottomright' />

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
                <LayersControl.Overlay name='Birding Loops' checked>
                    <LayerGroup>
                        {paths.map((layer, index) => <GenericGeoJSONLayer key={index} layer={layer} />)}
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name='Birding Points of Interest' checked>
                    <LayerGroup>
                        {points.map((layer, index) => <GenericGeoJSONLayer key={index} layer={layer} />)}
                    </LayerGroup>
                </LayersControl.Overlay>
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
            <MapEvents />
        </MapContainer>
    );
}

const startPosition = {
    lat: -33.6,
    lng: 26.73
};

const subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];

const maxZoom = 20;
