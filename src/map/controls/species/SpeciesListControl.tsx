import { ExternalLink, Printer } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import { useDebounceValue } from 'usehooks-ts';
import gbifLogo from '../../../assets/gbif/gbif-mark-green-logo.svg';
import inatLogo from '../../../assets/inat/inat-logo.png';
import { CopyToClipboardButton } from '../../../calculations/components/CopyToClipboardButton';
import { DrawerSearchField } from '../../components/DrawerSearchField';
import { MapControlButton } from '../../components/MapControlButton';
import mapControlStyles from '../../components/MapControlButton.module.css';
import { MapDrawer } from '../../components/MapDrawer';
import drawerStyles from '../../components/MapDrawer.module.css';
import { GBIFSpeciesCard } from './GBIFSpeciesCard';
import { getBufferedMapBounds, getINatTaxonObservationsUrl } from './iNatObservationUrl';
import { INatSpeciesCard } from './INatSpeciesCard';
import styles from './SpeciesListControl.module.css';
import { VirtualizedGrid } from './VirtualizedGrid';
import type { GbifSpecies, SpeciesListControlProps } from './types';
import { useGbifSpeciesChecklist } from './useGbifSpeciesChecklist';
import { useSpeciesObservations } from './useSpeciesObservations';

export function SpeciesListControl({ drawerHeight, onDrawerHeightChange, isOpen, onToggle, onClose, onBack, locationName }: Readonly<SpeciesListControlProps>) {
    const map = useMap();
    const gbifMediaBounds = getBufferedMapBounds(map);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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

    useLayoutEffect(() => {
        scrollContainerRef.current?.scrollTo(0, 0);
    }, [normalizedSearch]);

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

        const matchingSpecies = gbifData.filter((species) => (species.commonName ?? '').toLowerCase().includes(normalizedSearch)
            || (species.scientificName ?? '').toLowerCase().includes(normalizedSearch)
            || String(species.speciesKey).includes(normalizedSearch));
        if (matchingSpecies.length > 0) {
            const unresolvedSpecies = gbifData.filter((species) => !species.commonName || !species.scientificName).slice(0, 8);
            return [...matchingSpecies, ...unresolvedSpecies.filter((species) => !matchingSpecies.includes(species))];
        }

        return gbifData.filter((species) => !species.commonName || !species.scientificName).slice(0, 8);
    }, [gbifData, normalizedSearch]);

    const printableSpecies = useMemo(() => (isINat
        ? (inatData?.results ?? []).map((species) => ({
            commonName: species.taxon.preferred_common_name || species.taxon.name,
            scientificName: species.taxon.name
        }))
        : (gbifData ?? []).map((species) => ({
            commonName: species.commonName || `GBIF taxon ${species.speciesKey}`,
            scientificName: species.scientificName || `Taxon ${species.speciesKey}`
        }))).sort((first, second) => first.commonName.localeCompare(second.commonName)), [gbifData, inatData, isINat]);
    const hasChecklistData = !loading
        && !error
        && printableSpecies.length > 0
        && (isINat || gbif.namesReady);
    const checklistNamesPending = !isINat && gbif.namesLoading;
    const checklistNamesError = !isINat && gbif.namesError;
    const copyLabel = checklistNamesPending
        ? `Loading GBIF species names (${gbif.namesProgress.completed.toLocaleString()}/${gbif.namesProgress.total.toLocaleString()})`
        : checklistNamesError
            ? 'GBIF names could not all be loaded'
            : 'Copy species checklist';
    const printLabel = checklistNamesPending
        ? `Loading GBIF species names (${gbif.namesProgress.completed.toLocaleString()}/${gbif.namesProgress.total.toLocaleString()})`
        : checklistNamesError
            ? 'GBIF names could not all be loaded'
            : 'Print species checklist';
    const checklistText = useMemo(() => hasChecklistData
        ? [
            checklistTitle,
            `${printableSpecies.length.toLocaleString()} birds`,
            '',
            ...printableSpecies.map((species) => `${species.commonName} (${species.scientificName})`)
        ].join('\n')
        : null, [checklistTitle, hasChecklistData, printableSpecies]);

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
                title='Species List'
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
                                className={`drawer-header-action ${styles.viewButton}`}
                                href={inat.inatUrl}
                                target='_blank'
                                rel='noreferrer'
                                title='View on iNaturalist'
                                aria-label='View on iNaturalist'
                            >
                                <ExternalLink size={17} aria-hidden='true' />
                            </a>
                        )}
                        <CopyToClipboardButton
                            text={checklistText}
                            enabled={hasChecklistData}
                            className={`drawer-header-action ${styles.copyButton}`}
                            copyLabel={copyLabel}
                            copiedLabel='Species checklist copied'
                            failedLabel='Could not copy species checklist'
                        />
                        <button
                            type='button'
                            className={`drawer-header-action ${styles.printButton}`}
                            onClick={() => setIsPrintViewOpen(true)}
                            disabled={!hasChecklistData}
                            title={printLabel}
                            aria-label={printLabel}
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
                <div className={drawerStyles.content} ref={scrollContainerRef} data-species-scroll-root>
                    {checklistNamesPending && (
                        <div className={styles.nameLoadStatus} role='status'>
                            Loading GBIF species names ({gbif.namesProgress.completed.toLocaleString()} of {gbif.namesProgress.total.toLocaleString()}). Copy and print will be available when complete.
                        </div>
                    )}
                    {checklistNamesError && (
                        <div className={styles.nameLoadError} role='alert'>
                            Some GBIF species names could not be loaded.
                            <button
                                type='button'
                                className='drawer-header-action'
                                onClick={gbif.retryMissingNames}
                                disabled={gbif.namesLoading}
                            >
                                Retry names
                            </button>
                        </div>
                    )}
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
                        isINat
                            ? (
                                <VirtualizedGrid
                                    items={filteredINatResults}
                                    scrollElementRef={scrollContainerRef}
                                    layout='species'
                                    className={styles.grid}
                                    rowClassName={styles.virtualGridRow}
                                    minItemWidth={192}
                                    gap={16}
                                    estimateRowSize={270}
                                    getItemKey={(speciesCount, index) => `${speciesCount.taxon.id ?? index}_${speciesCount.taxon.name}`}
                                    renderItem={(speciesCount) => (
                                    <INatSpeciesCard
                                        speciesCount={speciesCount}
                                        observationsUrl={getINatTaxonObservationsUrl(inat.inatUrl, speciesCount.taxon.id)}
                                    />
                                    )}
                                />
                            )
                            : (
                                <VirtualizedGrid
                                    items={filteredGbifResults}
                                    scrollElementRef={scrollContainerRef}
                                    layout='species'
                                    className={styles.grid}
                                    rowClassName={styles.virtualGridRow}
                                    minItemWidth={192}
                                    gap={16}
                                    estimateRowSize={270}
                                    getItemKey={(species) => species.speciesKey}
                                    renderItem={(species: GbifSpecies) => (
                                        <GBIFSpeciesCard
                                            species={species}
                                            mediaBounds={gbifMediaBounds}
                                        isSpeciesNameLoading={gbif.namesLoading && (!species.commonName || !species.scientificName)}
                                        />
                                    )}
                                />
                            )
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
