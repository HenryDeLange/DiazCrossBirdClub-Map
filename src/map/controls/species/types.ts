import type { INatCount, INatSpeciesCount } from '../../iNatTypes';

export type SpeciesListControlProps = {
    drawerHeight: number;
    onDrawerHeightChange: (height: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onBack?: () => void;
    locationName?: string;
}

export type INatSpeciesCardProps = {
    speciesCount: INatCount;
    observationsUrl?: string;
}

export type UseSpeciesObservationsResult = {
    data: INatSpeciesCount | null;
    loading: boolean;
    error: boolean;
    inatUrl: string;
    reset: () => void;
}
