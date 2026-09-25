import { memo, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

const SPOT_MARKER_MIN_ZOOM = 15;

type MapEventsProps = {
    onMapCenterChange: (center: { lat: number; lng: number }) => void;
}

export const MapEvents = memo(function MapEvents({ onMapCenterChange }: Readonly<MapEventsProps>) {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();
        container.classList.toggle('show-spot-markers', map.getZoom() >= SPOT_MARKER_MIN_ZOOM);
    }, [map]);

    useMapEvents({
        moveend: (e) => {
            const center = e.target.getCenter();
            localStorage.setItem('mapCenter', JSON.stringify(center));
            onMapCenterChange({ lat: center.lat, lng: center.lng });
        },
        zoomend: (e) => {
            localStorage.setItem('mapZoom', JSON.stringify(e.target.getZoom()));
            e.target.getContainer().classList.toggle('show-spot-markers', e.target.getZoom() >= SPOT_MARKER_MIN_ZOOM);
        },
    });
    return null;
});
