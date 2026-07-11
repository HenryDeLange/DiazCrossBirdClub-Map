import { Copyright, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useDebounceValue } from 'usehooks-ts';
import inatLogo from '../assets/inat-logo.png';
import { DrawerSearchField } from './DrawerSearchField';
import type { INatCount, INatSpeciesCount } from './iNatTypes';

type Props = {
    mapHeight: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function SpeciesListControl({ mapHeight, isOpen, onToggle, onClose }: Readonly<Props>) {
    const map = useMap();
    const [data, setData] = useState<INatSpeciesCount | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchInput] = useDebounceValue(searchInput, 180);

    useEffect(() => {
        if (isOpen) {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();

            const bounds = map.getBounds();
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();
            const northEastLat = Number(northEast.lat);
            const northEastLng = Number(northEast.lng);
            const southWestLat = Number(southWest.lat);
            const southWestLng = Number(southWest.lng);

            fetch(`https://api.inaturalist.org/v1/observations/species_counts?captive=false&iconic_taxa=Aves&nelat=${northEastLat}&nelng=${northEastLng}&swlat=${southWestLat}&swlng=${southWestLng}&verifiable=true&per_page=500`)
                .then((response) => response.json())
                .then((responseData: INatSpeciesCount) => {
                    setData(responseData);
                })
                .catch((error) => {
                    console.error('Error fetching data:', error);
                });
        }
        else {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
        }
    }, [isOpen, map]);

    const drawerHeight = Math.min(mapHeight * 0.82, 780);
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
            <div className='control-group inat-group'>
                <button
                    className='control-button inat-button'
                    onClick={(event) => {
                        event.stopPropagation();
                        if (!isOpen) {
                            setData(null);
                            setSearchInput('');
                        }
                        onToggle();
                    }}
                    title='iNaturalist Species List'
                    type='button'
                >
                    <img className='button-icon inat-icon' alt='iNaturalist' src={inatLogo} />
                </button>
            </div>
            {isOpen && (
                <div className={`drawer-backdrop ${isOpen ? 'drawer-backdrop-open' : 'drawer-backdrop-closing'}`} onClick={onClose}>
                    <div
                        className={`drawer-panel ${isOpen ? 'drawer-open' : 'drawer-closed'}`}
                        onClick={(event) => event.stopPropagation()}
                        style={{ height: drawerHeight }}
                    >
                        <div className='drawer-header'>
                            <div>
                                <div className='drawer-label'>Species List</div>
                                <div className='drawer-title'>iNaturalist Observations</div>
                            </div>
                            <button type='button' className='drawer-close drawer-close-large' onClick={onClose} aria-label='Close drawer'>
                                <X className='drawer-close-icon' />
                            </button>
                        </div>
                        <div className='drawer-content'>
                            <div className='drawer-panel-subtitle'>
                                {data
                                    ? `Found ${data.results.length.toLocaleString()} bird species in the visible map area.`
                                    : 'Finding bird species in the visible map area.'}
                            </div>
                            <div className='drawer-link-row'>
                                <a
                                    className='drawer-link'
                                    href={`https://www.inaturalist.org/observations?captive=false&subview=map&view=species&iconic_taxa=Aves&nelat=${Number(map.getBounds().getNorthEast().lat)}&nelng=${Number(map.getBounds().getNorthEast().lng)}&swlat=${Number(map.getBounds().getSouthWest().lat)}&swlng=${Number(map.getBounds().getSouthWest().lng)}`}
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
                            {!data && (
                                <div className='drawer-empty'>Loading species...</div>
                            )}
                            {data && filteredResults.length === 0 && (
                                <div className='drawer-empty'>No species match your search.</div>
                            )}
                            {data && filteredResults.length > 0 && (
                                <div className='inat-grid'>
                                    {filteredResults.map((speciesCount, index) => (
                                        <INatSpeciesCard key={`${index}_${speciesCount.taxon.name}`} speciesCount={speciesCount} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

type INatSpeciesCardProps = {
    speciesCount: INatCount;
}

function INatSpeciesCard({ speciesCount }: Readonly<INatSpeciesCardProps>) {
    const [isAttributionOpen, setIsAttributionOpen] = useState(false);
    const attributionRef = useRef<HTMLDivElement | null>(null);
    const image = speciesCount.taxon.default_photo ?? null;
    const imageUrl = image?.medium_url ?? image?.square_url ?? '';

    useEffect(() => {
        if (!isAttributionOpen) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent) => {
            if (attributionRef.current && !attributionRef.current.contains(event.target as Node)) {
                setIsAttributionOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isAttributionOpen]);

    return (
        <div className='inat-card'>
            <div className='inat-card-media'>
                {imageUrl ? (
                    <img
                        className='inat-card-image'
                        alt={speciesCount.taxon.name}
                        src={imageUrl}
                    />
                ) : (
                    <div className='inat-card-image inat-card-image-empty'>No image available</div>
                )}
            </div>
            <div className='inat-card-title'>
                <a
                    href={speciesCount.taxon.id ? `https://www.inaturalist.org/taxa/${speciesCount.taxon.id}` : undefined}
                    target='_blank'
                    rel='noreferrer'
                >
                    {speciesCount.taxon.preferred_common_name || speciesCount.taxon.name}
                </a>
            </div>
            <div className='inat-card-meta'>
                <span className='inat-card-scientific'><i>{speciesCount.taxon.name}</i></span>
                <div className='inat-card-meta-row'>
                    {typeof speciesCount.count === 'number' && (
                        <span className='inat-card-count'>{speciesCount.count.toLocaleString()} observations</span>
                    )}
                    {image?.attribution && (
                        <div className='inat-card-attribution' ref={attributionRef}>
                            <button
                                type='button'
                                className='inat-card-attribution-trigger'
                                aria-label='Show image attribution'
                                onClick={() => setIsAttributionOpen((current) => !current)}
                            >
                                <Copyright className='inat-card-attribution-icon' />
                            </button>
                            {isAttributionOpen && (
                                <div className='inat-card-attribution-tooltip'>{image.attribution}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
