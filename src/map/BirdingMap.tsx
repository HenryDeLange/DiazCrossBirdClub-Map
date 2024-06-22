import * as geojson from 'geojson';
import { DivIcon, LatLng, Layer, Marker, StyleFunction } from 'leaflet';
import Locate from 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';
import 'leaflet/dist/leaflet.css';
import { useEffect, type ReactElement } from 'react';
import {
    AttributionControl,
    GeoJSON,
    LayerGroup,
    LayersControl,
    MapContainer,
    TileLayer,
    useMap
} from 'react-leaflet';
import boknesLagoon from './geojson/boknesLagoon.json';
import diazDam from './geojson/diazDam.json';
import hopeFarm from './geojson/hopeFarm.json';
import naturesLandingDam from './geojson/naturesLandingDam.json';
import ngciyoPans from './geojson/ngciyoPans.json';
import ottersVlei from './geojson/ottersVlei.json';
import { FeatureProps } from './geojson/types';
import './leafletMap.css';

const position = {
    lat: -33.6,
    lng: 26.73,
};

const spots: any[] = [];
spots.push(boknesLagoon);
spots.push(diazDam);
spots.push(naturesLandingDam);
spots.push(ngciyoPans);
spots.push(ottersVlei);

const outings: any[] = [];
outings.push(hopeFarm);

export default function BirdingMap(): ReactElement {
    return (
        <MapContainer center={position} zoom={11} scrollWheelZoom attributionControl={false}>
            <AttributionControl prefix="MyWild | Leaflet | Google Maps" />
            <LocateControl />
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
                <LayersControl.Overlay name='Birding Spots' checked>
                    <LayerGroup>
                        {spots.map((layer, index) => (
                            <GeoJSON
                                key={index}
                                data={layer}
                                style={styleFunction}
                                onEachFeature={onEachFeatureShowPopup}
                                pointToLayer={pointToLayerShowText}
                            />
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name='Birding Outings' checked>
                    <LayerGroup>
                        {outings.map((layer, index) => (
                            <GeoJSON
                                key={index}
                                data={layer}
                                style={styleFunction}
                                onEachFeature={onEachFeatureShowPopup}
                                pointToLayer={pointToLayerShowText}
                            />
                        ))}
                    </LayerGroup>
                </LayersControl.Overlay>
            </LayersControl>
        </MapContainer>
    );
}

const styleFunction: StyleFunction<FeatureProps> = (feature) => {
    return {
        color: feature?.properties.stroke ?? (feature?.properties.road === 'access' ? '#b77d01' : '#c44040'),
        weight: feature?.properties['stroke-width'] ?? 5,
        opacity: feature?.properties['stroke-opacity'] ?? 0.8,
        fillColor: feature?.properties.fill ?? '#e01f1f',
        fillOpacity: feature?.properties['fill-opacity'] ?? 0.3,
        dashArray: feature?.properties.road === 'access' ? '12, 12' : feature?.properties.road === 'birding' ? '1, 12' : undefined
    };
};

function onEachFeatureShowPopup(feature: geojson.Feature<geojson.Geometry, FeatureProps>, layer: Layer) {
    if (feature.geometry.type !== 'Point') {
        layer.bindPopup(`
            <b><u>${feature.properties.name}</u></b>
            <p>${feature.properties.description ?? ''}</p>
            ${feature.properties.pdf ? `<p><a href='${feature.properties.pdf}' target='_blank'>PDF</a></p>` : ''}
        `);
    }
}

function pointToLayerShowText(feature: geojson.Feature<geojson.Point, FeatureProps>, latlng: LatLng): Layer {
    const divIcon = new DivIcon({
        html: `<b>${feature.properties.name}</b>`,
        className: 'text-marker',
        iconSize: [350, 50]
    });
    const marker = new Marker(latlng, { icon: divIcon });
    marker.addEventListener('click', (event) => event.sourceTarget._map.setView(latlng, 15));
    return marker;
}

function LocateControl() {
    const map = useMap();
    useEffect(() => {
        const layer = new Locate({
            position: 'topleft',
            maxZoom: 19,
            strings: { title: 'Center on my location' },
            onActivate: () => { }
        });
        layer.addTo(map);
        return () => map.removeControl(layer);
    }, [map]);
    return null;
}
