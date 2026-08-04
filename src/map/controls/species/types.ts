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
}

export type UseSpeciesObservationsResult = {
    data: INatSpeciesCount | null;
    loading: boolean;
    reset: () => void;
}
