import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

const SPOT_MARKER_MIN_ZOOM = 15;

export function MapEvents() {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();
        container.classList.toggle('show-spot-markers', map.getZoom() >= SPOT_MARKER_MIN_ZOOM);
    }, [map]);

    useMapEvents({
        moveend: (e) => {
            localStorage.setItem('mapCenter', JSON.stringify(e.target.getCenter()));
        },
        zoomend: (e) => {
            localStorage.setItem('mapZoom', JSON.stringify(e.target.getZoom()));
            e.target.getContainer().classList.toggle('show-spot-markers', e.target.getZoom() >= SPOT_MARKER_MIN_ZOOM);
        },
    });
    return null;
}
