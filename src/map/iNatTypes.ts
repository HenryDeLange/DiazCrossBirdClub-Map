export type INatSpeciesCount = {
    page: number;
    per_page: number;
    total_results: number;
    results: INatCount[];
}

type INatCount = {
    count: number;
    taxon: INatTaxon;
}

type INatTaxon = {
    name: string;
    preferred_common_name: string;
    default_photo: {
        attribution: string;
        license_code: string;
        medium_url: string;
        square_url: string;
    }
}
