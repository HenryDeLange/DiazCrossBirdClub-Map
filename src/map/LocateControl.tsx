import { LocateControl as LocateControlClass } from 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function LocateControl() {
    const map = useMap();
    useEffect(() => {
        const layer = new LocateControlClass({
            position: 'bottomright',
            strings: { title: 'Center on my location' }
        });
        layer.addTo(map);
        return () => { map.removeControl(layer); };
    }, [map]);
    return null;
}
