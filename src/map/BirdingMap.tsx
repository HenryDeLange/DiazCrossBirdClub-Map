import type { GeoJsonObject } from 'geojson';
import { StyleFunction } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type ReactElement } from 'react';
import {
    AttributionControl,
    GeoJSON,
    LayersControl,
    MapContainer,
    TileLayer
} from 'react-leaflet';
import diazDam from './geojson/diazDam.json';
import naturesLandingDam from './geojson/naturesLandingDam.json';
import { FeatureStyle } from './geojson/types';
import './leafletMap.css';

const position = {
    lat: -33.68,
    lng: 26.65,
};

const styleFunction: StyleFunction<FeatureStyle> = (feature) => {
    return {
        color: feature?.properties.stroke ?? (feature?.properties.road === 'access' ? '#b77d01' : '#c44040'),
        weight: feature?.properties['stroke-width'] ?? 5,
        opacity: feature?.properties['stroke-opacity'] ?? 0.8,
        fillColor: feature?.properties.fill ?? '#e01f1f',
        fillOpacity: feature?.properties['fill-opacity'] ?? 0.3,
        dashArray: feature?.properties.road === 'access' ? '12, 12' : feature?.properties.road === 'birding' ? '1, 12' : undefined
    };
};

export default function BirdingMap(): ReactElement {
    return (
        <MapContainer center={position} zoom={14} scrollWheelZoom attributionControl={false}>
            <AttributionControl prefix="MyWild | Leaflet | Google Maps" />
            <LayersControl position="topright">
                <LayersControl.BaseLayer name="Google Maps (Street)" checked={true}>
                    <TileLayer
                        url="https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}"
                        maxZoom={20}
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Google Maps (Hybrid)">
                    <TileLayer
                        url="https://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}"
                        maxZoom={20}
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Google Maps (Satellite)">
                    <TileLayer
                        url="https://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}"
                        maxZoom={20}
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Google Maps (Terrain)">
                    <TileLayer
                        url="https://{s}.google.com/vt?lyrs=p&x={x}&y={y}&z={z}"
                        maxZoom={20}
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />
                </LayersControl.BaseLayer>
            </LayersControl>
            <GeoJSON
                data={naturesLandingDam as GeoJsonObject}
                style={styleFunction}
                onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                        <b><u>${feature.properties.name}</u></b>
                        <div>${feature.properties.description ?? ''}</div>
                        `);
                }}
            />
            <GeoJSON
                data={diazDam as GeoJsonObject}
                style={styleFunction}
                onEachFeature={(feature, layer) => {
                    layer.bindPopup(`
                        <b><u>${feature.properties.name}</u></b>
                        <div>${feature.properties.description ?? ''}</div>
                        `);
                }}
            />
        </MapContainer>
    );
}
