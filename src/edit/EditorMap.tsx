import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { LayersControl, TileLayer, useMap } from 'react-leaflet';
import type { FeatureProps } from '../map/geojson/types';
import type { EditorFeature } from './geojsonValidation';

type EditorMapProps = {
    editable: boolean;
    features: EditorFeature[];
    filePath: string;
    onChange: (features: EditorFeature[]) => void;
    onSelect: (index: number) => void;
}

type EditorFeatureWithKey = Feature<Geometry, FeatureProps & { __editorKey: string }>;
type SerializableLayer = L.Layer & { feature?: EditorFeatureWithKey; toGeoJSON: () => Feature | FeatureCollection };

const subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];

export function EditorMap({ editable, features, filePath, onChange, onSelect }: Readonly<EditorMapProps>) {
    const map = useMap();
    const previousFilePath = useRef('');

    useEffect(() => {
        if (!editable) {
            previousFilePath.current = '';
            return;
        }
        map.pm.addControls({
            position: 'topleft',
            drawMarker: true,
            drawPolyline: true,
            drawPolygon: true,
            drawCircle: false,
            drawCircleMarker: false,
            drawRectangle: false,
            drawText: false,
            editMode: true,
            dragMode: true,
            removalMode: false,
            cutPolygon: false,
            rotateMode: false
        });

        return () => map.pm.removeControls();
    }, [editable, map]);

    useEffect(() => {
        if (!editable) {
            return;
        }
        const keyedFeatures = features.map((feature, index) => ({
            ...feature,
            properties: { ...feature.properties, __editorKey: String(index) }
        }));
        const sources = new Map(keyedFeatures.map((feature, index) => [String(index), feature]));
        const collection: FeatureCollection<Geometry, FeatureProps & { __editorKey: string }> = { type: 'FeatureCollection', features: keyedFeatures };
        const geoJsonLayer = L.geoJSON(collection, {
            style: (feature) => getFeatureStyle(feature?.properties),
            pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
                radius: 7,
                color: '#f5c542',
                fillColor: '#f5c542',
                fillOpacity: 0.9,
                weight: 2
            }),
            onEachFeature: (feature, layer) => {
                const index = Number((feature.properties as FeatureProps & { __editorKey: string }).__editorKey);
                layer.on('click', () => onSelect(index));
            }
        });
        geoJsonLayer.addTo(map);
        if (filePath && previousFilePath.current !== filePath) {
            const bounds = geoJsonLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
            }
            previousFilePath.current = filePath;
        }

        const readFeatures = (): EditorFeature[] => {
            const next: EditorFeature[] = [];
            geoJsonLayer.eachLayer((layer) => {
                const keyedLayer = layer as SerializableLayer;
                const key = keyedLayer.feature?.properties.__editorKey;
                const original = key === undefined ? undefined : sources.get(key);
                if (!original) {
                    return;
                }

                const serialized = keyedLayer.toGeoJSON();
                const parts = serialized.type === 'FeatureCollection' ? serialized.features : [serialized];
                const properties = { ...original.properties } as FeatureProps & { __editorKey?: string };
                delete properties.__editorKey;
                const geometry = combineGeometry(original.geometry.type, parts);
                if (geometry) {
                    next[Number(key)] = { ...original, properties, geometry } as EditorFeature;
                }
            });

            return next.filter((feature): feature is EditorFeature => feature !== undefined);
        };

        const handleEdit = () => onChange(readFeatures());
        const handleCreate = (event: L.PM.CreateEventHandler extends (event: infer T) => void ? T : never) => {
            const createdLayer = event.layer as SerializableLayer;
            const serialized = createdLayer.toGeoJSON();
            if (serialized.type !== 'Feature') {
                return;
            }
            const feature = serialized as EditorFeature;
            feature.properties = feature.geometry.type === 'Point' ? { name: '', category: 'spot' } : { name: '' };
            geoJsonLayer.addLayer(createdLayer);
            const keyedCreatedLayer = createdLayer as SerializableLayer & { feature: EditorFeatureWithKey };
            keyedCreatedLayer.feature = { ...feature, properties: { ...feature.properties, __editorKey: String(features.length) } };
            createdLayer.on('click', () => onSelect(features.length));
            onChange([...features, feature]);
            onSelect(features.length);
        };
        map.on('pm:edit', handleEdit);
        map.on('pm:create', handleCreate);

        return () => {
            map.off('pm:edit', handleEdit);
            map.off('pm:create', handleCreate);
            map.removeLayer(geoJsonLayer);
        };
    }, [editable, features, filePath, map, onChange, onSelect]);

    return (
        <>
            <LayersControl position='topright'>
                <LayersControl.BaseLayer name='Google Maps - Street'>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}'
                        maxZoom={20}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name='Google Maps - Hybrid'>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}'
                        maxZoom={20}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name='Google Maps - Satellite' checked>
                    <TileLayer
                        url='https://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}'
                        maxZoom={20}
                        subdomains={subdomains}
                    />
                </LayersControl.BaseLayer>
            </LayersControl>
            <InvalidateMapSizeOnResize />
            <FitLocation mapKey={filePath} />
        </>
    );
}

function InvalidateMapSizeOnResize() {
    const map = useMap();

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            map.invalidateSize({ pan: false, animate: false });
        });
        observer.observe(map.getContainer());
        return () => observer.disconnect();
    }, [map]);

    return null;
}

function FitLocation({ mapKey }: Readonly<{ mapKey: string }>) {
    const map = useMap();
    useEffect(() => {
        map.whenReady(() => map.invalidateSize());
    }, [map, mapKey]);
    return null;
}

function getFeatureStyle(properties?: FeatureProps): L.PathOptions {
    return {
        color: properties?.stroke ?? '#32b5c4',
        weight: properties?.['stroke-width'] ?? 3,
        opacity: properties?.['stroke-opacity'] ?? 1,
        fillColor: properties?.fill ?? '#32b5c4',
        fillOpacity: properties?.['fill-opacity'] ?? 0.22
    };
}

function combineGeometry(type: Geometry['type'], parts: Feature<Geometry>[]): Geometry | null {
    const geometries = parts.map((feature) => feature.geometry).filter((geometry): geometry is Geometry => geometry !== null);

    if (type === 'MultiLineString') {
        const coordinates = geometries.flatMap((geometry) => geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'MultiLineString' ? geometry.coordinates : []);
        return coordinates.length ? { type, coordinates } : null;
    }
    if (type === 'MultiPolygon') {
        const coordinates = geometries.flatMap((geometry) => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []);
        return coordinates.length ? { type, coordinates } : null;
    }
    return geometries[0] ?? null;
}