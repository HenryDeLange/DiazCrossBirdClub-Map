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
}

export type INatPhoto = {
    attribution?: string;
    license_code?: string;
    medium_url?: string;
    square_url?: string;
    url?: string;
}
