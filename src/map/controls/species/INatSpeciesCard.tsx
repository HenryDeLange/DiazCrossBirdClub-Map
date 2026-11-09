import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { INatTaxon, INatTaxonPhoto } from '../../iNatTypes';
import { SpeciesImageGallery } from './SpeciesImageGallery';
import { SpeciesMetadataIndicators } from './SpeciesMetadataIndicators';
import styles from './SpeciesListControl.module.css';
import { getINatPhotoUrl } from './iNatPhotoUrl';
import { throttledFetchWithRetry } from './throttledFetch';
import type { INatSpeciesCardProps, SpeciesImage } from './types';
import type { INatPhoto } from '../../iNatTypes';

export function INatSpeciesCard({ speciesCount, commonName, observationsUrl }: Readonly<INatSpeciesCardProps>) {
    const [selectedImage, setSelectedImage] = useState<SpeciesImage | null>(null);
    const [taxonPhotos, setTaxonPhotos] = useState<INatTaxonPhoto[] | null>(null);
    const [taxonPhotosLoading, setTaxonPhotosLoading] = useState(false);
    const photoRequestStartedRef = useRef(false);
    const photoRequestRef = useRef<AbortController | null>(null);
    const images = useMemo(() => {
        const photos = (taxonPhotos ?? speciesCount.taxon.taxon_photos ?? [])
            .slice()
            .sort((first, second) => (first.position ?? Number.MAX_SAFE_INTEGER) - (second.position ?? Number.MAX_SAFE_INTEGER))
            .map((taxonPhoto, index) => createINatImage(taxonPhoto.photo, index, getTaxonPhotoLabels(taxonPhoto)))
            .filter((image): image is SpeciesImage => image !== null);
        if (photos.length > 0) {
            return photos;
        }

        const defaultPhoto = speciesCount.taxon.default_photo;
        const image = defaultPhoto ? createINatImage(defaultPhoto, 0) : null;
        return image ? [image] : [];
    }, [speciesCount.taxon.default_photo, speciesCount.taxon.taxon_photos, taxonPhotos]);
    const handleSelectedImageChange = useCallback((image: SpeciesImage | null) => setSelectedImage(image), []);
    const loadTaxonPhotos = useCallback(() => {
        const taxonId = speciesCount.taxon.id;
        if (!taxonId || speciesCount.taxon.taxon_photos?.length || photoRequestStartedRef.current) {
            return;
        }

        photoRequestStartedRef.current = true;
        const controller = new AbortController();
        photoRequestRef.current = controller;
        setTaxonPhotosLoading(true);
        throttledFetchWithRetry(`https://api.inaturalist.org/v1/taxa/${taxonId}?include_taxon_photos=true`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`iNaturalist taxon request failed with status ${response.status}`);
                }
                return response.json() as Promise<{ results?: INatTaxon[] }>;
            })
            .then((response) => {
                const photos = response.results?.[0]?.taxon_photos;
                if (!photos) {
                    throw new Error(`iNaturalist taxon response did not include photos for taxon ${taxonId}`);
                }
                setTaxonPhotos(photos);
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }
                console.error(`Error fetching iNaturalist taxon photos for ${taxonId}:`, error);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setTaxonPhotosLoading(false);
                }
            });
    }, [speciesCount.taxon.id, speciesCount.taxon.taxon_photos]);

    useEffect(() => () => photoRequestRef.current?.abort(), []);

    return (
        <div className={styles.card}>
            <SpeciesImageGallery
                imageAlt={commonName}
                images={images}
                conservationStatus={speciesCount.taxon.conservation_status}
                additionalImagesLoading={taxonPhotosLoading}
                onSelectedImageChange={handleSelectedImageChange}
                onOpen={loadTaxonPhotos}
            />
            <div className={styles.cardTitle}>
                <a
                    href={speciesCount.taxon.id ? `https://www.inaturalist.org/taxa/${speciesCount.taxon.id}` : undefined}
                    target='_blank'
                    rel='noreferrer'
                >
                    {commonName}
                </a>
            </div>
            <div className={styles.cardMeta}>
                <div className={styles.cardScientificRow}>
                    <span className={styles.cardScientific}><i>{speciesCount.taxon.name}</i></span>
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
                    <SpeciesMetadataIndicators attribution={selectedImage?.attribution} />
                </div>
            </div>
        </div>
    );
}

function createINatImage(photo: INatPhoto, index: number, labels: string[] = []): SpeciesImage | null {
    const sourceUrl = photo.original_url ?? photo.url ?? photo.medium_url ?? photo.square_url;
    const fullUrl = photo.original_url ?? getINatPhotoUrl(sourceUrl, 'original') ?? sourceUrl;
    const thumbnailUrl = photo.medium_url ?? photo.square_url ?? photo.url ?? fullUrl;
    if (!fullUrl || !thumbnailUrl) {
        return null;
    }
    const largeUrl = getINatPhotoUrl(sourceUrl, 'large') ?? fullUrl;

    return {
        id: `inat-${photo.id ?? index}-${fullUrl}`,
        source: 'inat',
        thumbnailUrl,
        ...(largeUrl !== fullUrl ? { largeUrl } : {}),
        fullUrl,
        attribution: photo.attribution,
        labels
    };
}

function getTaxonPhotoLabels(taxonPhoto: INatTaxonPhoto): string[] {
    const labels = new Set<string>();
    if (taxonPhoto.primary === true) {
        labels.add('Primary');
    } else if (taxonPhoto.primary === false) {
        labels.add('Secondary');
    }
    if (taxonPhoto.rank) {
        labels.add(formatLabel(taxonPhoto.rank));
    }
    if (taxonPhoto.life_stage) {
        labels.add(formatLabel(taxonPhoto.life_stage));
    }
    for (const annotation of [...(taxonPhoto.annotations ?? []), ...(taxonPhoto.photo.annotations ?? [])]) {
        const value = annotation.controlled_value?.label ?? annotation.value ?? annotation.label;
        if (value) {
            const attribute = annotation.controlled_attribute?.label;
            labels.add(attribute ? `${formatLabel(attribute)}: ${formatLabel(value)}` : formatLabel(value));
        }
    }
    return [...labels];
}

function formatLabel(value: string): string {
    return value
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
