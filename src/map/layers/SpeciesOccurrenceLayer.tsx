import type { TileErrorEvent } from 'leaflet';
import { TileLayer } from 'react-leaflet';

type SpeciesOccurrenceLayerProps = {
    taxonKey: number;
    generation: number;
    onTileError: (generation: number, tileUrl: string) => void;
}

export function SpeciesOccurrenceLayer({ taxonKey, generation, onTileError }: Readonly<SpeciesOccurrenceLayerProps>) {
    const params = new URLSearchParams({
        taxonKey: String(taxonKey),
        srs: 'EPSG:3857',
        style: 'classic-noborder.poly',
        bin: 'hex',
        hexPerTile: '12'
    });

    return (
        <TileLayer
            url={`https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?${params.toString()}`}
            attribution='© <a href="https://www.gbif.org/">GBIF</a>'
            minZoom={1}
            maxZoom={20}
            tileSize={512}
            zoomOffset={-1}
            opacity={0.5}
            zIndex={10}
            eventHandlers={{ tileerror: (event: TileErrorEvent) => onTileError(generation, event.tile.src) }}
        />
    );
}
