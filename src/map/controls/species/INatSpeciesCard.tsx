import { Copyright, Heart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './SpeciesListControl.module.css';
import type { INatSpeciesCardProps } from './types';

export function INatSpeciesCard({ speciesCount, observationsUrl }: Readonly<INatSpeciesCardProps>) {
    const [openPopup, setOpenPopup] = useState<'attribution' | 'conservation' | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const image = speciesCount.taxon.default_photo ?? null;
    const mediumImageUrl = image?.medium_url ?? '';
    const squareImageUrl = image?.square_url ?? '';
    const conservationStatus = speciesCount.taxon.conservation_status;
    const statusLabel = conservationStatus?.status_name
        ? conservationStatus.status_name.charAt(0).toUpperCase() + conservationStatus.status_name.slice(1)
        : conservationStatus?.status;
    const hasConservationStatus = Boolean(statusLabel);
    const [imageUrl, setImageUrl] = useState(mediumImageUrl || squareImageUrl);

    useEffect(() => {
        if (!openPopup) {
            return;
        }

        const handleOutsidePointerDown = (event: PointerEvent) => {
            const card = cardRef.current;
            const clickedInsidePopup = card !== null && event.composedPath().some((target) => (
                target instanceof Element
                && card.contains(target)
                && (target.matches('[role="tooltip"]') || target.matches('button[aria-expanded="true"]'))
            ));
            if (!clickedInsidePopup) {
                setOpenPopup(null);
            }
        };

        document.addEventListener('pointerdown', handleOutsidePointerDown, true);
        return () => document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    }, [openPopup]);

    return (
        <div ref={cardRef} className={styles.card}>
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
                <div className={styles.cardScientificRow}>
                    <span className={styles.cardScientific}><i>{speciesCount.taxon.name}</i></span>
                    {hasConservationStatus && (
                        <button
                            type='button'
                            className={`${styles.cardMetaIconTrigger} ${styles.conservationTrigger}`}
                            aria-label='Show conservation status'
                            aria-expanded={openPopup === 'conservation'}
                            title={`Conservation status: ${statusLabel ?? ''}${conservationStatus?.authority ? ` (${conservationStatus.authority})` : ''}`}
                            onClick={() => setOpenPopup((current) => current === 'conservation' ? null : 'conservation')}
                        >
                            <Heart className={styles.cardMetaIcon} />
                        </button>
                    )}
                    {openPopup === 'conservation' && hasConservationStatus && (
                        <div className={styles.cardMetaPopup} role='tooltip'>
                            <strong>{statusLabel}</strong>
                            {conservationStatus?.authority && <span>Authority: {conservationStatus.authority}</span>}
                            {conservationStatus?.status && conservationStatus.status !== conservationStatus.status_name && (
                                <span>Code: {conservationStatus.status}</span>
                            )}
                        </div>
                    )}
                </div>
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
                        <button
                            type='button'
                            className={styles.cardMetaIconTrigger}
                            aria-label='Show image attribution'
                            aria-expanded={openPopup === 'attribution'}
                            onClick={() => setOpenPopup((current) => current === 'attribution' ? null : 'attribution')}
                        >
                            <Copyright className={styles.cardMetaIcon} />
                        </button>
                    )}
                    {openPopup === 'attribution' && image?.attribution && (
                        <div className={styles.cardMetaPopup} role='tooltip'>{image.attribution}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
