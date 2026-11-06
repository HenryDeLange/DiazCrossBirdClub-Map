export type INatSpeciesCount = {
    page: number;
    per_page: number;
    total_results: number;
    results: INatCount[];
}

export type INatCount = {
    count: number;
    taxon: INatTaxon;
}

export type INatTaxon = {
    id?: number;
    name: string;
    preferred_common_name?: string;
    default_photo?: INatPhoto;
    taxon_photos?: INatTaxonPhoto[] | null;
    conservation_status?: INatConservationStatus;
}

export type INatTaxonPhoto = {
    id?: number;
    position?: number;
    annotations?: INatPhotoAnnotation[];
    life_stage?: string;
    rank?: string;
    primary?: boolean;
    photo: INatPhoto;
}

export type INatPhotoAnnotation = {
    label?: string;
    value?: string;
    controlled_attribute?: { label?: string };
    controlled_value?: { label?: string };
}

export type INatConservationStatus = {
    authority?: string;
    status?: string;
    status_name?: string;
}

export type INatPhoto = {
    id?: number;
    attribution?: string;
    annotations?: INatPhotoAnnotation[];
    license_code?: string;
    medium_url?: string;
    original_url?: string;
    square_url?: string;
    url?: string;
}
