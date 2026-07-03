import { useMapEvents } from 'react-leaflet';

export function MapEvents() {
    useMapEvents({
        moveend: (e) => {
            localStorage.setItem('mapCenter', JSON.stringify(e.target.getCenter()));
        },
        zoomend: (e) => {
            localStorage.setItem('mapZoom', JSON.stringify(e.target.getZoom()));
        },
    });
    return null;
}
