import { Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import { useDebounceValue } from 'usehooks-ts';
import gbifLogo from '../../../assets/gbif/gbif-mark-green-logo.svg';
import inatLogo from '../../../assets/inat/inat-logo.png';
import { DrawerSearchField } from '../../components/DrawerSearchField';
import { MapControlButton } from '../../components/MapControlButton';
import mapControlStyles from '../../components/MapControlButton.module.css';
import { MapDrawer } from '../../components/MapDrawer';
import drawerStyles from '../../components/MapDrawer.module.css';
import { getINatTaxonObservationsUrl } from './iNatObservationUrl';
import { INatSpeciesCard } from './INatSpeciesCard';
import styles from './SpeciesListControl.module.css';
import type { SpeciesListControlProps } from './types';
import { useGbifSpeciesChecklist } from './useGbifSpeciesChecklist';
import { useSpeciesObservations } from './useSpeciesObservations';

export function SpeciesListControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, locationName }: Readonly<SpeciesListControlProps>) {
    const map = useMap();
    const [source, setSource] = useState<'inat' | 'gbif'>('inat');
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchInput] = useDebounceValue(searchInput, 300);
    const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);
    const inat = useSpeciesObservations(map, isOpen && source === 'inat');
    const gbif = useGbifSpeciesChecklist(map, isOpen && source === 'gbif');
    const isINat = source === 'inat';
    const inatData = inat.data;
    const gbifData = gbif.data;
    const currentCount = isINat ? inatData?.results.length : gbifData?.length;
    const loading = isINat ? inat.loading : gbif.loading;
    const error = isINat ? inat.error : gbif.error;
    const title = isINat ? 'iNaturalist Species' : 'GBIF Species';
    const mobileTitle = isINat ? 'iNaturalist' : 'GBIF';
    const checklistTitle = isINat ? 'iNaturalist Species Checklist' : 'GBIF Checklist';

    const normalizedSearch = debouncedSearchInput.trim().toLowerCase();

    const filteredINatResults = useMemo(() => {
        if (!inatData) {
            return [];
        }

        if (!normalizedSearch) {
            return inatData.results;
        }

        return inatData.results.filter((speciesCount) => {
            const commonName = speciesCount.taxon.preferred_common_name?.toLowerCase() ?? '';
            const scientificName = speciesCount.taxon.name.toLowerCase();
            return commonName.includes(normalizedSearch) || scientificName.includes(normalizedSearch);
        });
    }, [inatData, normalizedSearch]);

    const filteredGbifResults = useMemo(() => {
        if (!gbifData) {
            return [];
        }

        if (!normalizedSearch) {
            return gbifData;
        }

        return gbifData.filter((species) => species.commonName.toLowerCase().includes(normalizedSearch)
            || species.scientificName.toLowerCase().includes(normalizedSearch));
    }, [gbifData, normalizedSearch]);

    const printableSpecies = useMemo(() => (isINat
        ? (inatData?.results ?? []).map((species) => ({
            commonName: species.taxon.preferred_common_name || species.taxon.name,
            scientificName: species.taxon.name
        }))
        : (gbifData ?? []).map((species) => ({
            commonName: species.commonName,
            scientificName: species.scientificName
        }))).sort((first, second) => first.commonName.localeCompare(second.commonName)), [gbifData, inatData, isINat]);

    useEffect(() => {
        if (!isPrintViewOpen) {
            return;
        }

        const handleAfterPrint = () => setIsPrintViewOpen(false);
        window.addEventListener('afterprint', handleAfterPrint);
        let printFrame: number | undefined;
        const renderFrame = window.requestAnimationFrame(() => {
            printFrame = window.requestAnimationFrame(() => window.print());
        });
        return () => {
            window.cancelAnimationFrame(renderFrame);
            if (printFrame !== undefined) {
                window.cancelAnimationFrame(printFrame);
            }
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [isPrintViewOpen]);

    return (
        <>
            <MapControlButton
                groupClassName='inatGroup'
                onClick={() => {
                    if (!isOpen) {
                        inat.reset();
                        setSearchInput('');
                        setSource('inat');
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
                title={(
                    <div className={styles.drawerTitle}>
                        <span className={styles.desktopTitle}>{title}</span>
                        <span className={styles.mobileTitle}>{mobileTitle}</span>
                        {currentCount !== undefined && (
                            <span
                                className={styles.speciesCount}
                                aria-label={`${currentCount.toLocaleString()} ${currentCount === 1 ? 'bird' : 'birds'}`}
                            >
                                {currentCount.toLocaleString()}
                                <span className={styles.countUnit}>{currentCount === 1 ? ' bird' : ' birds'}</span>
                            </span>
                        )}
                    </div>
                )}
                headerAction={(
                    <div className={styles.headerActions}>
                        {isINat && (
                            <a
                                className={styles.link}
                                href={inat.inatUrl}
                                target='_blank'
                                rel='noreferrer'
                                aria-label='View on iNaturalist'
                            >
                                View on iNaturalist
                            </a>
                        )}
                        <button
                            type='button'
                            className={`drawer-header-action ${styles.printButton}`}
                            onClick={() => setIsPrintViewOpen(true)}
                            disabled={printableSpecies.length === 0}
                            title='Print species checklist'
                            aria-label='Print species checklist'
                        >
                            <Printer size={17} aria-hidden='true' />
                        </button>
                    </div>
                )}
                height={drawerHeight}
                onHeightChange={onDrawerHeightChange}
            >
                <div className={styles.toolbar}>
                    <div className={styles.sourceSearchRow}>
                        <div className={styles.searchField}>
                            <DrawerSearchField
                                ariaLabel='Search species by common or scientific name'
                                onChange={setSearchInput}
                                placeholder='common / scientific name'
                                value={searchInput}
                                variant='panel'
                            />
                        </div>
                        <div className={styles.sourceToggle} role='group' aria-label='Species data source'>
                            <button
                                type='button'
                                className={styles.sourceButton}
                                aria-label='iNaturalist species'
                                aria-pressed={isINat}
                                onClick={() => setSource('inat')}
                                title='iNaturalist'
                            >
                                <img src={inatLogo} alt='' aria-hidden='true' />
                            </button>
                            <button
                                type='button'
                                className={styles.sourceButton}
                                aria-label='GBIF species'
                                aria-pressed={!isINat}
                                onClick={() => setSource('gbif')}
                                title='GBIF'
                            >
                                <img src={gbifLogo} alt='' aria-hidden='true' />
                            </button>
                        </div>
                    </div>
                </div>
                <div className={drawerStyles.content}>
                    {loading && !error && (
                        <div className={drawerStyles.empty}>{isINat ? 'Loading species...' : 'Loading GBIF checklist...'}</div>
                    )}
                    {error && (
                        <div className={drawerStyles.empty}>{isINat ? 'Bird observations could not be loaded right now.' : 'The GBIF checklist could not be loaded right now.'}</div>
                    )}
                    {!loading && !error && (isINat ? inatData : gbifData) && (isINat ? filteredINatResults.length : filteredGbifResults.length) === 0 && (
                        <div className={drawerStyles.empty}>{currentCount === 0 ? 'No bird species were found in the visible map area.' : 'No species match your search.'}</div>
                    )}
                    {!loading && !error && (isINat ? filteredINatResults.length : filteredGbifResults.length) > 0 && (
                        <div className={styles.grid}>
                            {isINat
                                ? filteredINatResults.map((speciesCount, index) => (
                                    <INatSpeciesCard
                                        key={`${index}_${speciesCount.taxon.name}`}
                                        speciesCount={speciesCount}
                                        observationsUrl={getINatTaxonObservationsUrl(inat.inatUrl, speciesCount.taxon.id)}
                                    />
                                ))
                                : filteredGbifResults.map((species) => (
                                    <a className={styles.gbifCard} key={species.speciesKey} href={`https://www.gbif.org/species/${species.speciesKey}`} target='_blank' rel='noreferrer'>
                                        <span className={styles.gbifCommonName}>{species.commonName}</span>
                                        <i className={styles.gbifScientificName}>{species.scientificName}</i>
                                        {species.conservationStatus?.status_name && (
                                            <span
                                                className={styles.conservationStatus}
                                                title={`${species.conservationStatus.authority ? `${species.conservationStatus.authority}: ` : ''}${species.conservationStatus.status_name}`}
                                            >
                                                {species.conservationStatus.status_name.charAt(0).toUpperCase() + species.conservationStatus.status_name.slice(1)}
                                            </span>
                                        )}
                                    </a>
                                ))}
                        </div>
                    )}
                </div>
            </MapDrawer>
            {isPrintViewOpen && createPortal(
                <main className={styles.printChecklist}>
                    <h1>{checklistTitle}</h1>
                    <p>{printableSpecies.length.toLocaleString()} birds</p>
                    <div className={styles.printList}>
                        {printableSpecies.map((species) => (
                            <div className={styles.printRow} key={`${species.scientificName}_${species.commonName}`}>
                                <span className={styles.printCheckbox} aria-hidden='true' />
                                <span>
                                    <strong>{species.commonName}</strong>
                                    <i className={styles.printScientificName}>{species.scientificName}</i>
                                </span>
                            </div>
                        ))}
                    </div>
                </main>,
                document.body
            )}
        </>
    );
}
