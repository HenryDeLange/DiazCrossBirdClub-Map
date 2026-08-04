import { LocateControl as LocateControlClass } from 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';
import 'leaflet/dist/leaflet.css';
import { Locate, LocateFixed } from 'lucide-react';
import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useMap } from 'react-leaflet';

export function LocateControl() {
    const map = useMap();
    useEffect(() => {
        const layer = new LocateControlClass({
            position: 'bottomright',
            icon: 'leaflet-control-locate-icon',
            iconLoading: 'leaflet-control-locate-icon',
            strings: { title: 'Center on my location' }
        });
        layer.addTo(map);

        const control = map.getContainer().querySelector<HTMLElement>('.leaflet-control-locate');
        const icon = control?.querySelector<HTMLElement>('.leaflet-locate-icon');
        const setIcon = (fixed: boolean) => {
            if (!icon) {
                return;
            }

            icon.innerHTML = renderToStaticMarkup(fixed
                ? <LocateFixed aria-hidden='true' />
                : <Locate aria-hidden='true' />);
        };
        const handleLocationActivate = () => {
            setIcon(true);
        };
        const handleLocationDeactivate = () => {
            setIcon(false);
        };

        setIcon(false);
        map.on('locateactivate', handleLocationActivate);
        map.on('locatedeactivate', handleLocationDeactivate);

        return () => {
            map.off('locateactivate', handleLocationActivate);
            map.off('locatedeactivate', handleLocationDeactivate);
            map.removeControl(layer);
        };
    }, [map]);
    return null;
}
