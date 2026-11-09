import type { INatConservationStatus, INatCount, INatSpeciesCount } from '../../iNatTypes';

export type GbifSpecies = {
    speciesKey: number;
    commonName?: string;
    scientificName?: string;
    occurrenceCount: number;
    conservationStatus?: INatConservationStatus;
}

export type GbifSpeciesDetails = {
    commonName: string;
    scientificName: string;
}

export type CommonNameLanguage = 'en' | 'af';

export type SpeciesImage = {
    id: string;
    source: 'inat' | 'gbif';
    thumbnailUrl: string;
    largeUrl?: string;
    fullUrl: string;
    attribution?: string;
    credits?: SpeciesImageCredits;
    location?: SpeciesImageLocation;
    labels: string[];
}

export type SpeciesImageCredits = {
    creator?: string;
    rightsHolder?: string;
    license?: string;
    source?: string;
}

export type SpeciesImageLocation = {
    country?: string;
    stateProvince?: string;
    region?: string;
}

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
    commonName: string;
    observationsUrl?: string;
}

export type UseSpeciesObservationsResult = {
    data: INatSpeciesCount | null;
    loading: boolean;
    error: boolean;
    localizedNamesLoading: boolean;
    localizedNamesError: boolean;
    inatUrl: string;
    reset: () => void;
    retryLocalizedNames: () => void;
}
