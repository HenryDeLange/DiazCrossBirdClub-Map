import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import inatLogo from '../assets/inat-logo.png';
import type { INatSpeciesCount } from './iNatTypes';

type Props = {
    mapHeight: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function SpeciesListControl({ mapHeight, isOpen, onToggle, onClose }: Readonly<Props>) {
    const map = useMap();
    const [isMounted, setIsMounted] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);
    const [data, setData] = useState<INatSpeciesCount | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            setIsClosing(false);
            setData(null);
        }
        else if (isMounted) {
            setIsClosing(true);
            const timeout = window.setTimeout(() => {
                setIsMounted(false);
                setIsClosing(false);
            }, 240);
            return () => window.clearTimeout(timeout);
        }
    }, [isOpen, isMounted]);

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
                .then((data) => {
                    setData(data);
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
    const showDrawer = isMounted || isOpen;

    return (
        <>
            <div className='control-group inat-group'>
                <button className='control-button inat-button' onClick={(event) => { event.stopPropagation(); onToggle(); }} title='iNaturalist Species List' type='button'>
                    <img className='button-icon inat-icon' alt='iNaturalist' src={inatLogo} />
                </button>
            </div>
            {showDrawer && (
                <div className={`drawer-backdrop ${isOpen ? 'drawer-backdrop-open' : 'drawer-backdrop-closing'}`} onClick={onClose}>
                    <div
                        className={`drawer-panel ${isOpen ? 'drawer-open' : 'drawer-closed'} ${isClosing ? 'drawer-closing' : ''}`}
                        onClick={(event) => event.stopPropagation()}
                        style={{ height: drawerHeight }}
                    >
                        <div className='drawer-header'>
                            <div>
                                <div className='drawer-label'>Species list</div>
                                <div className='drawer-title'>iNaturalist observations</div>
                            </div>
                            <button type='button' className='drawer-close drawer-close-large' onClick={onClose} aria-label='Close drawer'>
                                <X className='drawer-close-icon' />
                            </button>
                        </div>
                        <div className='drawer-content'>
                            <div className='drawer-panel-subtitle'>View the top species found in the visible map area.</div>
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
                            {!data &&
                                <div className='drawer-empty'>Loading species...</div>
                            }
                            {data &&
                                <div className='inat-grid'>
                                    {data.results.map((speciesCount, index) => {
                                        const imageUrl = speciesCount.taxon.default_photo?.medium_url || speciesCount.taxon.default_photo?.square_url || '';

                                        return (
                                            <div key={`${index}_${speciesCount.taxon.name}`} className='inat-card'>
                                                <img
                                                    className='inat-card-image'
                                                    alt={speciesCount.taxon.name}
                                                    src={imageUrl}
                                                />
                                                <div className='inat-card-title'>{speciesCount.taxon.preferred_common_name || speciesCount.taxon.name}</div>
                                                <div className='inat-card-meta'>
                                                    <span className='inat-card-scientific'><i>{speciesCount.taxon.name}</i></span>
                                                    {typeof speciesCount.count === 'number' && (
                                                        <span className='inat-card-count'>{speciesCount.count.toLocaleString()} observations</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
