import { useMemo, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useDebounceValue } from 'usehooks-ts';
import inatLogo from '../../../assets/inat-logo.png';
import { roundCoordinate } from '../../../calculations/components/dateLocationUtils';
import { DrawerSearchField } from '../../components/DrawerSearchField';
import { MapControlButton } from '../../components/MapControlButton';
import { MapDrawer } from '../../components/MapDrawer';
import { INatSpeciesCard } from './INatSpeciesCard';
import type { SpeciesListControlProps } from './types';
import { useSpeciesObservations } from './useSpeciesObservations';

export function SpeciesListControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, locationName }: Readonly<SpeciesListControlProps>) {
    const map = useMap();
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchInput] = useDebounceValue(searchInput, 300);
    const { data, loading, reset } = useSpeciesObservations(map, isOpen);

    const normalizedSearch = debouncedSearchInput.trim().toLowerCase();

    const filteredResults = useMemo(() => {
        if (!data) {
            return [];
        }

        if (!normalizedSearch) {
            return data.results;
        }

        return data.results.filter((speciesCount) => {
            const commonName = speciesCount.taxon.preferred_common_name?.toLowerCase() ?? '';
            const scientificName = speciesCount.taxon.name.toLowerCase();
            return commonName.includes(normalizedSearch) || scientificName.includes(normalizedSearch);
        });
    }, [data, normalizedSearch]);

    const bounds = map.getBounds();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const inatUrl = `https://www.inaturalist.org/observations?captive=false&subview=map&view=species&iconic_taxa=Aves&nelat=${roundCoordinate(northEast.lat, 2)}&nelng=${roundCoordinate(northEast.lng, 2)}&swlat=${roundCoordinate(southWest.lat, 2)}&swlng=${roundCoordinate(southWest.lng, 2)}`;

    return (
        <>
            <MapControlButton
                groupClassName='inat-group'
                buttonClassName='inat-button'
                onClick={() => {
                    if (!isOpen) {
                        reset();
                        setSearchInput('');
                    }
                    onToggle();
                }}
                title='iNaturalist Species List'
            >
                <img className='button-icon inat-icon' alt='iNaturalist' src={inatLogo} />
            </MapControlButton>
            <MapDrawer
                isOpen={isOpen}
                onClose={onClose}
                onBack={onBack}
                backLabel={locationName}
                title='iNaturalist Observations'
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
            >
                <DrawerSearchField
                    ariaLabel='Search species by common or scientific name'
                    onChange={setSearchInput}
                    placeholder='Search common or scientific name'
                    value={searchInput}
                />
                <div className='drawer-content'>
                    <div className='drawer-panel-subtitle'>
                        {data
                            ? `Found ${data.results.length.toLocaleString()} bird species in the visible map area.`
                            : 'Finding bird species in the visible map area.'}
                    </div>
                    <div className='drawer-link-row'>
                        <a
                            className='drawer-link'
                            href={inatUrl}
                            target='_blank'
                            rel='noreferrer'
                        >
                            View on iNaturalist
                        </a>
                    </div>
                    {loading && (
                        <div className='drawer-empty'>Loading species...</div>
                    )}
                    {!loading && data && filteredResults.length === 0 && (
                        <div className='drawer-empty'>No species match your search.</div>
                    )}
                    {!loading && data && filteredResults.length > 0 && (
                        <div className='inat-grid'>
                            {filteredResults.map((speciesCount, index) => (
                                <INatSpeciesCard key={`${index}_${speciesCount.taxon.name}`} speciesCount={speciesCount} />
                            ))}
                        </div>
                    )}
                </div>
            </MapDrawer>
        </>
    );
}
