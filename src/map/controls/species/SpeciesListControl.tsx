import { useMemo, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useDebounceValue } from 'usehooks-ts';
import { DrawerSearchField } from '../../components/DrawerSearchField';
import { MapControlButton } from '../../components/MapControlButton';
import mapControlStyles from '../../components/MapControlButton.module.css';
import { MapDrawer } from '../../components/MapDrawer';
import drawerStyles from '../../components/MapDrawer.module.css';
import { INatSpeciesCard } from './INatSpeciesCard';
import styles from './SpeciesListControl.module.css';
import type { SpeciesListControlProps } from './types';
import { useSpeciesObservations } from './useSpeciesObservations';

export function SpeciesListControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, locationName }: Readonly<SpeciesListControlProps>) {
    const map = useMap();
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchInput] = useDebounceValue(searchInput, 300);
    const { data, loading, error, inatUrl, reset } = useSpeciesObservations(map, isOpen);

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

    return (
        <>
            <MapControlButton
                groupClassName='inatGroup'
                onClick={() => {
                    if (!isOpen) {
                        reset();
                        setSearchInput('');
                    }
                    onToggle();
                }}
                title='iNaturalist Species List'
            >
                <span className={mapControlStyles.inatLogo} aria-hidden='true' />
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
                    variant='panel'
                />
                <div className={drawerStyles.content}>
                    <div className={drawerStyles.panelSubtitle}>
                        {data
                            ? `Found ${data.results.length.toLocaleString()} bird species in the visible map area.`
                            : 'Finding bird species in the visible map area.'}
                    </div>
                    <div className={styles.linkRow}>
                        <a
                            className={styles.link}
                            href={inatUrl}
                            target='_blank'
                            rel='noreferrer'
                        >
                            View on iNaturalist
                        </a>
                    </div>
                    {loading && !error && (
                        <div className={drawerStyles.empty}>Loading species...</div>
                    )}
                    {error && (
                        <div className={drawerStyles.empty}>Bird observations could not be loaded right now.</div>
                    )}
                    {!loading && !error && data && filteredResults.length === 0 && (
                        <div className={drawerStyles.empty}>{data.results.length === 0 ? 'No bird observations were found in the visible map area.' : 'No species match your search.'}</div>
                    )}
                    {!loading && data && filteredResults.length > 0 && (
                        <div className={styles.grid}>
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
