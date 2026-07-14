import type { INatCount, INatSpeciesCount } from '../../iNatTypes';

export type SpeciesListControlProps = {
    mapHeight: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export type INatSpeciesCardProps = {
    speciesCount: INatCount;
}

export type UseSpeciesObservationsResult = {
    data: INatSpeciesCount | null;
    loading: boolean;
    reset: () => void;
}
