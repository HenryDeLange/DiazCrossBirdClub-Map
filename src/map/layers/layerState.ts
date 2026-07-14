import type { Dispatch, SetStateAction } from 'react';

export type LayerState = {
    baseLayer: string;
    overlays: Record<string, boolean>;
}

export type LayerStateSetter = Dispatch<SetStateAction<LayerState>>;

export const baseLayerNames = ['Google Maps - Street', 'Google Maps - Hybrid', 'Google Maps - Satellite'];

export const defaultLayerState: LayerState = {
    baseLayer: 'Google Maps - Street',
    overlays: {
        'Birding Loops': true,
        'Birding Points of Interest': true,
        'Birding Spots': true,
        'Birding Outings': true
    }
};

export function getInitialLayerState(): LayerState {
    const raw = localStorage.getItem('mapLayerState');

    if (!raw) {
        return defaultLayerState;
    }

    try {
        const parsed = JSON.parse(raw) as Partial<LayerState>;
        return {
            baseLayer: baseLayerNames.includes(String(parsed.baseLayer)) ? String(parsed.baseLayer) : defaultLayerState.baseLayer,
            overlays: {
                ...defaultLayerState.overlays,
                ...(parsed.overlays ?? {})
            }
        };
    }
    catch {
        return defaultLayerState;
    }
}
