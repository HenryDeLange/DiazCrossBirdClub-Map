import { Copyright } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { INatSpeciesCardProps } from './types';

export function INatSpeciesCard({ speciesCount }: Readonly<INatSpeciesCardProps>) {
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
