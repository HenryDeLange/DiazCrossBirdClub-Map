import { MapPinPlus, MapPinX } from 'lucide-react';
import { SpeciesMetadataIndicators } from './SpeciesMetadataIndicators';
import styles from './SpeciesListControl.module.css';
import type { ActiveSpeciesLayer, SpeciesLayerSelection } from './types';

type SpeciesCardActionsProps = {
    attribution?: string;
    species: SpeciesLayerSelection;
    onShowSpeciesLayer: (selection: SpeciesLayerSelection) => void;
    activeSpeciesLayer: ActiveSpeciesLayer | null;
    onClearSpeciesLayer: () => void;
}

export function SpeciesCardActions({ attribution, species, onShowSpeciesLayer, activeSpeciesLayer, onClearSpeciesLayer }: Readonly<SpeciesCardActionsProps>) {
    const label = species.displayName || species.scientificName;
    const isActive = activeSpeciesLayer !== null && (
        species.gbifTaxonKey === activeSpeciesLayer.taxonKey
        || normalizeScientificName(species.scientificName) === normalizeScientificName(activeSpeciesLayer.scientificName)
    );

    return (
        <div className={styles.cardActions}>
            <SpeciesMetadataIndicators attribution={attribution} />
            <button
                type='button'
                className={styles.showMapLayerButton}
                onClick={() => isActive ? onClearSpeciesLayer() : onShowSpeciesLayer(species)}
                title={isActive ? `Clear ${label} map layer` : `Show ${label} on the map`}
                aria-label={isActive ? `Clear ${label} occurrence layer on the map` : `Show ${label} occurrence layer on the map`}
            >
                {isActive ? <MapPinX aria-hidden='true' /> : <MapPinPlus aria-hidden='true' />}
            </button>
        </div>
    );
}

function normalizeScientificName(name: string) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
