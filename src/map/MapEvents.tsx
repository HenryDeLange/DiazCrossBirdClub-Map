import { memo } from 'react';
import { useMapEvents } from 'react-leaflet';

export const MapEvents = memo(function MapEvents() {
    useMapEvents({
        moveend: (e) => {
            const center = e.target.getCenter();
            localStorage.setItem('mapCenter', JSON.stringify(center));
        },
        zoomend: (e) => {
            localStorage.setItem('mapZoom', JSON.stringify(e.target.getZoom()));
        },
    });
    return null;
});
