import { Copyright } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './SpeciesListControl.module.css';
import type { INatSpeciesCardProps } from './types';

export function INatSpeciesCard({ speciesCount, observationsUrl }: Readonly<INatSpeciesCardProps>) {
    const [isAttributionOpen, setIsAttributionOpen] = useState(false);
    const attributionRef = useRef<HTMLDivElement | null>(null);
    const image = speciesCount.taxon.default_photo ?? null;
    const mediumImageUrl = image?.medium_url ?? '';
    const squareImageUrl = image?.square_url ?? '';
    const [imageUrl, setImageUrl] = useState(mediumImageUrl || squareImageUrl);

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
        <div className={styles.card}>
            <div className={styles.cardMedia}>
                {imageUrl ? (
                    <img
                        className={styles.cardImage}
                        alt={speciesCount.taxon.name}
                        src={imageUrl}
                        loading='lazy'
                        decoding='async'
                        onError={() => {
                            if (imageUrl !== squareImageUrl && squareImageUrl) {
                                setImageUrl(squareImageUrl);
                                return;
                            }

                            setImageUrl('');
                        }}
                    />
                ) : (
                    <div className={`${styles.cardImage} ${styles.cardImageEmpty}`}>No image available</div>
                )}
            </div>
            <div className={styles.cardTitle}>
                <a
                    href={speciesCount.taxon.id ? `https://www.inaturalist.org/taxa/${speciesCount.taxon.id}` : undefined}
                    target='_blank'
                    rel='noreferrer'
                >
                    {speciesCount.taxon.preferred_common_name || speciesCount.taxon.name}
                </a>
            </div>
            <div className={styles.cardMeta}>
                <span className={styles.cardScientific}><i>{speciesCount.taxon.name}</i></span>
                <div className={styles.cardMetaRow}>
                    {typeof speciesCount.count === 'number' && (
                        observationsUrl ? (
                            <a className={styles.cardCount} href={observationsUrl} target='_blank' rel='noreferrer'>
                                {speciesCount.count.toLocaleString()} observations
                            </a>
                        ) : (
                            <span className={styles.cardCount}>{speciesCount.count.toLocaleString()} observations</span>
                        )
                    )}
                    {image?.attribution && (
                        <div className={styles.cardAttribution} ref={attributionRef}>
                            <button
                                type='button'
                                className={styles.cardAttributionTrigger}
                                aria-label='Show image attribution'
                                aria-expanded={isAttributionOpen}
                                onClick={() => setIsAttributionOpen((current) => !current)}
                            >
                                <Copyright className={styles.cardAttributionIcon} />
                            </button>
                            {isAttributionOpen && (
                                <div className={styles.cardAttributionTooltip}>{image.attribution}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
