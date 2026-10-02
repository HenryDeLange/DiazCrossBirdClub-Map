import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { LayersControl, TileLayer, useMap } from 'react-leaflet';
import type { FeatureProps } from '../map/geojson/types';
import '../map/map.css';
import type { EditorFeature } from './geojsonValidation';

type EditorMapProps = {
    editable: boolean;
    features: EditorFeature[];
    filePath: string;
    onChange: (features: EditorFeature[]) => void;
    onGeometryModeChange: (active: boolean) => void;
    onSelect: (index: number) => void;
}

type EditorFeatureWithKey = Feature<Geometry, FeatureProps & { __editorKey: string }>;
type SerializableLayer = L.Layer & { feature?: EditorFeatureWithKey; toGeoJSON: (precision?: number | false) => Feature | FeatureCollection };

const subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];

export function EditorMap({ editable, features, filePath, onChange, onGeometryModeChange, onSelect }: Readonly<EditorMapProps>) {
    const map = useMap();
    const previousFilePath = useRef('');
    const featuresRef = useRef(features);
    const onChangeRef = useRef(onChange);
    const onSelectRef = useRef(onSelect);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const handleEditRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        featuresRef.current = features;
        onChangeRef.current = onChange;
        onSelectRef.current = onSelect;
    }, [features, onChange, onSelect]);

    useEffect(() => {
        if (!editable) {
            previousFilePath.current = '';
            onGeometryModeChange(false);
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
        const updateGeometryMode = () => {
            onGeometryModeChange(map.pm.globalEditModeEnabled() || map.pm.globalDragModeEnabled());
        };
        map.on('pm:globaleditmodetoggled', updateGeometryMode);
        map.on('pm:globaldragmodetoggled', updateGeometryMode);

        return () => {
            map.off('pm:globaleditmodetoggled', updateGeometryMode);
            map.off('pm:globaldragmodetoggled', updateGeometryMode);
            if (map.pm.globalEditModeEnabled()) {
                map.pm.disableGlobalEditMode();
            }
            if (map.pm.globalDragModeEnabled()) {
                map.pm.disableGlobalDragMode();
            }
            map.pm.removeControls();
            onGeometryModeChange(false);
        };
    }, [editable, map, onGeometryModeChange]);

    useEffect(() => {
        const geoJsonLayer = L.geoJSON(createFeatureCollection(featuresRef.current), {
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
                layer.on('click', () => onSelectRef.current(index));
            }
        });
        geoJsonLayer.addTo(map);
        geoJsonLayerRef.current = geoJsonLayer;
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
                const original = key === undefined ? undefined : featuresRef.current[Number(key)];
                if (!original) {
                    return;
                }

                const serialized = keyedLayer.toGeoJSON(false);
                const parts = serialized.type === 'FeatureCollection' ? serialized.features : [serialized];
                const geometry = combineGeometry(original.geometry.type, parts);
                if (geometry) {
                    next[Number(key)] = { ...original, geometry } as EditorFeature;
                }
            });

            return next.filter((feature): feature is EditorFeature => feature !== undefined);
        };

        const handleEdit = () => onChangeRef.current(readFeatures());
        handleEditRef.current = handleEdit;
        const handleCreate = (event: L.PM.CreateEventHandler extends (event: infer T) => void ? T : never) => {
            const createdLayer = event.layer as SerializableLayer;
            const serialized = createdLayer.toGeoJSON();
            if (serialized.type !== 'Feature') {
                return;
            }
            const feature = serialized as EditorFeature;
            feature.properties = feature.geometry.type === 'Point' ? { name: '', category: 'spot' } : { name: '' };
            const currentFeatures = featuresRef.current;
            const index = currentFeatures.length;
            geoJsonLayer.addLayer(createdLayer);
            const keyedCreatedLayer = createdLayer as SerializableLayer;
            keyedCreatedLayer.feature = { ...feature, properties: { ...feature.properties, __editorKey: String(index) } };
            createdLayer.on('pm:edit', handleEdit);
            createdLayer.on('pm:dragend', handleEdit);
            createdLayer.on('click', () => onSelectRef.current(index));
            onChangeRef.current([...currentFeatures, feature]);
            onSelectRef.current(index);
        };
        if (editable) {
            geoJsonLayer.eachLayer((layer) => {
                layer.on('pm:edit', handleEdit);
                layer.on('pm:dragend', handleEdit);
            });
            map.on('pm:create', handleCreate);
        }

        return () => {
            if (editable) {
                geoJsonLayer.eachLayer((layer) => {
                    layer.off('pm:edit', handleEdit);
                    layer.off('pm:dragend', handleEdit);
                });
                map.off('pm:create', handleCreate);
            }
            map.removeLayer(geoJsonLayer);
            if (geoJsonLayerRef.current === geoJsonLayer) {
                geoJsonLayerRef.current = null;
            }
            if (handleEditRef.current === handleEdit) {
                handleEditRef.current = null;
            }
        };
    }, [editable, filePath, map]);

    useEffect(() => {
        const geoJsonLayer = geoJsonLayerRef.current;
        if (!geoJsonLayer) {
            return;
        }

        const layersByKey = new Map<string, SerializableLayer>();
        geoJsonLayer.eachLayer((layer) => {
            const keyedLayer = layer as SerializableLayer;
            const key = keyedLayer.feature?.properties.__editorKey;
            if (key !== undefined) {
                layersByKey.set(key, keyedLayer);
            }
        });

        let rebuildLayers = layersByKey.size !== features.length;
        if (!rebuildLayers) {
            rebuildLayers = features.some((feature, index) => {
                const layer = layersByKey.get(String(index));
                if (!layer || layer.feature?.geometry.type !== feature.geometry.type) {
                    return true;
                }
                const serialized = layer.toGeoJSON(false);
                const parts = serialized.type === 'FeatureCollection' ? serialized.features : [serialized];
                const geometry = combineGeometry(feature.geometry.type, parts);
                return !geometry || JSON.stringify(geometry) !== JSON.stringify(feature.geometry);
            });
        }

        if (rebuildLayers) {
            geoJsonLayer.clearLayers();
            geoJsonLayer.addData(createFeatureCollection(features));
            if (editable && handleEditRef.current) {
                geoJsonLayer.eachLayer((layer) => {
                    layer.on('pm:edit', handleEditRef.current!);
                    layer.on('pm:dragend', handleEditRef.current!);
                });
            }
        }

        geoJsonLayer.eachLayer((layer) => {
            const keyedLayer = layer as SerializableLayer;
            const key = keyedLayer.feature?.properties.__editorKey;
            if (key === undefined) {
                return;
            }
            const feature = features[Number(key)];
            if (!feature) {
                return;
            }
            keyedLayer.feature = { ...feature, properties: { ...feature.properties, __editorKey: key } };
            if (keyedLayer instanceof L.Path) {
                keyedLayer.setStyle(getFeatureStyle(feature.properties));
            }
        });
    }, [editable, features, filePath, map]);

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

function createFeatureCollection(features: EditorFeature[]): FeatureCollection<Geometry, FeatureProps & { __editorKey: string }> {
    return {
        type: 'FeatureCollection',
        features: features.map((feature, index) => ({
            ...feature,
            properties: { ...feature.properties, __editorKey: String(index) }
        }))
    };
}