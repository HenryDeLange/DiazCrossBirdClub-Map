import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LayerStateSetter } from './layerState';

type LayerStateSyncProps = {
    onLayerStateChange: LayerStateSetter;
}

export function LayerStateSync({ onLayerStateChange }: Readonly<LayerStateSyncProps>) {
    const map = useMap();

    useEffect(() => {
        const handleBaseLayerChange = (event: { name?: string }) => {
            if (!event.name) {
                return;
            }

            onLayerStateChange((current) => ({
                ...current,
                baseLayer: event.name ?? current.baseLayer
            }));
        };

        const handleOverlayAdd = (event: { name?: string }) => {
            if (!event.name) {
                return;
            }
            const name = event.name;

            onLayerStateChange((current) => ({
                ...current,
                overlays: {
                    ...current.overlays,
                    [name]: true
                }
            }));
        };

        const handleOverlayRemove = (event: { name?: string }) => {
            if (!event.name) {
                return;
            }
            const name = event.name;

            onLayerStateChange((current) => ({
                ...current,
                overlays: {
                    ...current.overlays,
                    [name]: false
                }
            }));
        };

        map.on('baselayerchange', handleBaseLayerChange);
        map.on('overlayadd', handleOverlayAdd);
        map.on('overlayremove', handleOverlayRemove);

        return () => {
            map.off('baselayerchange', handleBaseLayerChange);
            map.off('overlayadd', handleOverlayAdd);
            map.off('overlayremove', handleOverlayRemove);
        };
    }, [map, onLayerStateChange]);

    return null;
}
