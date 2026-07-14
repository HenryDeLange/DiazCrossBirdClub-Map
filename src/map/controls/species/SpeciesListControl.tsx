import { useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-leaflet';
import inatLogo from '../../../assets/inat-logo.png';
import { DrawerSearchField } from '../../components/DrawerSearchField';
import { MapControlButton } from '../../components/MapControlButton';
import { MapDrawer } from '../../components/MapDrawer';
import { INatSpeciesCard } from './INatSpeciesCard';
import type { SpeciesListControlProps } from './types';
import { useSpeciesObservations } from './useSpeciesObservations';

export function SpeciesListControl({ mapHeight, isOpen, onToggle, onClose }: Readonly<SpeciesListControlProps>) {
    const map = useMap();
    const [searchInput, setSearchInput] = useState('');
    const { data, loading, reset } = useSpeciesObservations(map, isOpen);

    useEffect(() => {
        if (isOpen) {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();
        }
        else {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
        }
    }, [isOpen, map]);

    const drawerHeight = Math.min(mapHeight * 0.82, 780);
    const normalizedSearch = searchInput.trim().toLowerCase();

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
    const inatUrl = `https://www.inaturalist.org/observations?captive=false&subview=map&view=species&iconic_taxa=Aves&nelat=${Number(northEast.lat)}&nelng=${Number(northEast.lng)}&swlat=${Number(southWest.lat)}&swlng=${Number(southWest.lng)}`;

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
                label='Species List'
                title='iNaturalist Observations'
                height={drawerHeight}
            >
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
                    <DrawerSearchField
                        ariaLabel='Search species by common or scientific name'
                        onChange={setSearchInput}
                        placeholder='Search common or scientific name'
                        value={searchInput}
                    />
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
