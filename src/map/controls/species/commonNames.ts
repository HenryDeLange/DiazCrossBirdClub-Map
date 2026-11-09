import type { INatTaxon } from '../../iNatTypes';
import type { CommonNameLanguage } from './types';

export function getINatCommonName(taxon: INatTaxon, language: CommonNameLanguage): string {
    const englishName = taxon.english_common_name?.trim();
    const localizedName = taxon.preferred_common_name?.trim();

    return language === 'af'
        ? localizedName || englishName || taxon.name
        : englishName || taxon.name;
}
