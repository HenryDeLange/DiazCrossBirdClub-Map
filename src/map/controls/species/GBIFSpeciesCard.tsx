import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeciesImageGallery } from './SpeciesImageGallery';
import { SpeciesCardActions } from './SpeciesCardActions';
import styles from './SpeciesListControl.module.css';
import { getINatPhotoUrl } from './iNatPhotoUrl';
import { throttledFetchWithRetry } from './throttledFetch';
import type { ActiveSpeciesLayer, GbifSpecies, SpeciesImage, SpeciesLayerSelection } from './types';
import type { BufferedMapBounds } from './iNatObservationUrl';

type GBIFSpeciesCardProps = {
    species: GbifSpecies;
    mediaBounds: BufferedMapBounds;
    isSpeciesNameLoading: boolean;
    onShowSpeciesLayer: (selection: SpeciesLayerSelection) => void;
    activeSpeciesLayer: ActiveSpeciesLayer | null;
    onClearSpeciesLayer: () => void;
}

type GbifOccurrenceMedia = {
    type?: string;
    format?: string;
    identifier?: string;
    creator?: string;
    license?: string;
    rightsHolder?: string;
    source?: string;
    title?: string;
    description?: string;
    rank?: string;
    primary?: boolean;
    isPrimary?: boolean;
    width?: number;
    height?: number;
}

type GbifAnnotation = {
    label?: string;
    value?: string;
    controlled_attribute?: { label?: string };
    controlled_value?: { label?: string };
}

type GbifOccurrence = {
    key?: number;
    lifeStage?: string | null;
    sex?: string | null;
    country?: string | null;
    stateProvince?: string | null;
    county?: string | null;
    municipality?: string | null;
    locality?: string | null;
    verbatimLocality?: string | null;
    annotations?: GbifAnnotation[];
    media?: GbifOccurrenceMedia[];
}

type GbifOccurrenceResponse = {
    results?: GbifOccurrence[];
    offset?: number;
    limit?: number;
    endOfRecords?: boolean;
}

type MediaCursor = {
    tierIndex: number;
    offset: number;
    endOfTier: boolean;
    pendingImages: SpeciesImage[];
}

type MediaBatch = {
    images: SpeciesImage[];
    cursor: MediaCursor | null;
    hasMore: boolean;
}

type OccurrenceImagePage = {
    images: SpeciesImage[];
    nextOffset: number;
    endOfRecords: boolean;
}

type MediaState = {
    images: SpeciesImage[];
    loading: boolean;
    error: boolean;
    loadingMore: boolean;
    hasMore: boolean;
}

const mediaOccurrencesPerRequest = 20;
const maxImagesPerBatch = 10;
const maxPagesPerTierPerLoad = 3;
const maxInitialPagesPerTier = 2;
const minimumInitialImages = 5;
const nearbyBoundsPaddings = [0.5, 2] as const;

export function GBIFSpeciesCard({ species, mediaBounds, isSpeciesNameLoading, onShowSpeciesLayer, activeSpeciesLayer, onClearSpeciesLayer }: Readonly<GBIFSpeciesCardProps>) {
    const cardRef = useRef<HTMLElement | null>(null);
    const [shouldLoadMedia, setShouldLoadMedia] = useState(() => typeof IntersectionObserver === 'undefined');
    const [mediaStateRecord, setMediaStateRecord] = useState<MediaState & { key: string }>({
        key: '',
        images: [],
        loading: true,
        error: false,
        loadingMore: false,
        hasMore: false
    });
    const [selectedImage, setSelectedImage] = useState<SpeciesImage | null>(null);
    const mediaControllerRef = useRef<AbortController | null>(null);
    const mediaCursorRef = useRef<MediaCursor | null>(null);
    const seenImageUrlsRef = useRef<Set<string>>(new Set());
    const loadingMoreRef = useRef(false);
    const handleSelectedImageChange = useCallback((image: SpeciesImage | null) => setSelectedImage(image), []);
    const { north: mediaNorth, east: mediaEast, south: mediaSouth, west: mediaWest } = mediaBounds;
    const mediaRequestKey = JSON.stringify([species.speciesKey, mediaNorth, mediaEast, mediaSouth, mediaWest, shouldLoadMedia]);
    const mediaState = mediaStateRecord.key === mediaRequestKey
        ? mediaStateRecord
        : { images: [], loading: true, error: false, loadingMore: false, hasMore: false };

    useEffect(() => {
        const card = cardRef.current;
        if (!card) {
            return;
        }

        if (!('IntersectionObserver' in window)) {
            return;
        }

        const observerRoot = card.closest<HTMLElement>('[data-species-scroll-root]');
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setShouldLoadMedia(true);
                observer.disconnect();
            }
        }, { root: observerRoot, rootMargin: '120px' });
        observer.observe(card);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!shouldLoadMedia) {
            return;
        }

        const controller = new AbortController();
        mediaControllerRef.current = controller;
        const bounds = { north: mediaNorth, east: mediaEast, south: mediaSouth, west: mediaWest };
        mediaCursorRef.current = null;
        seenImageUrlsRef.current = new Set();
        loadingMoreRef.current = false;
        void fetchSpeciesImages(species.speciesKey, bounds, controller.signal)
            .then((batch) => {
                if (controller.signal.aborted) {
                    return;
                }
                mediaCursorRef.current = batch.cursor;
                seenImageUrlsRef.current = new Set(batch.images.map((image) => image.fullUrl));
                setMediaStateRecord({
                    key: mediaRequestKey,
                    images: batch.images,
                    loading: false,
                    error: false,
                    loadingMore: false,
                    hasMore: batch.hasMore
                });
            })
            .catch((fetchError: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }
                console.error(`Error fetching GBIF images for species ${species.speciesKey}:`, fetchError);
                setMediaStateRecord({
                    key: mediaRequestKey,
                    images: [],
                    loading: false,
                    error: true,
                    loadingMore: false,
                    hasMore: false
                });
            });

        return () => {
            controller.abort();
            if (mediaControllerRef.current === controller) {
                mediaControllerRef.current = null;
            }
        };
    }, [mediaEast, mediaNorth, mediaRequestKey, mediaSouth, mediaWest, shouldLoadMedia, species.speciesKey]);

    const loadMoreImages = useCallback(async (): Promise<number> => {
        const cursor = mediaCursorRef.current;
        const controller = mediaControllerRef.current;
        if (
            !shouldLoadMedia
            || !mediaState.hasMore
            || !cursor
            || !controller
            || controller.signal.aborted
            || loadingMoreRef.current
        ) {
            return 0;
        }

        loadingMoreRef.current = true;
        setMediaStateRecord((current) => current.key === mediaRequestKey
            ? { ...current, loadingMore: true }
            : current);
        try {
            const batch = await fetchMoreSpeciesImages(
                species.speciesKey,
                { north: mediaNorth, east: mediaEast, south: mediaSouth, west: mediaWest },
                cursor,
                seenImageUrlsRef.current,
                controller.signal
            );
            if (controller.signal.aborted) {
                return 0;
            }

            mediaCursorRef.current = batch.cursor;
            for (const image of batch.images) {
                seenImageUrlsRef.current.add(image.fullUrl);
            }
            setMediaStateRecord((current) => current.key === mediaRequestKey
                ? {
                    ...current,
                    images: [...current.images, ...batch.images],
                    loadingMore: false,
                    hasMore: batch.hasMore
                }
                : current);
            return batch.images.length;
        } catch (fetchError: unknown) {
            if (!controller.signal.aborted) {
                console.error(`Error loading more GBIF images for species ${species.speciesKey}:`, fetchError);
                setMediaStateRecord((current) => current.key === mediaRequestKey
                    ? { ...current, loadingMore: false }
                    : current);
            }
            return 0;
        } finally {
            loadingMoreRef.current = false;
        }
    }, [mediaRequestKey, mediaState.hasMore, mediaEast, mediaNorth, mediaSouth, mediaWest, shouldLoadMedia, species.speciesKey]);

    const isProvisionalCommonName = !species.commonName && isSpeciesNameLoading && Boolean(species.scientificName);
    const commonName = species.commonName
        || (isSpeciesNameLoading ? species.scientificName || 'Loading name...' : `GBIF species ${species.speciesKey}`);
    const commonNameClassName = isProvisionalCommonName
        ? `${styles.gbifCommonName} ${styles.gbifCommonNamePending} ${styles.gbifCommonNameScientific}`
        : styles.gbifCommonName;

    return (
        <article ref={cardRef} className={styles.gbifCard}>
            <SpeciesImageGallery
                imageAlt={commonName}
                images={mediaState.images}
                loading={mediaState.loading}
                error={mediaState.error}
                conservationStatus={species.conservationStatus}
                hasMoreImages={mediaState.hasMore}
                loadingMoreImages={mediaState.loadingMore}
                loopNavigation={false}
                onLoadMoreImages={loadMoreImages}
                onSelectedImageChange={handleSelectedImageChange}
            />
            <a
                className={commonNameClassName}
                href={`https://www.gbif.org/species/${species.speciesKey}`}
                target='_blank'
                rel='noreferrer'
            >
                {commonName}
            </a>
            <div
                className={`${styles.gbifScientificRow} ${isProvisionalCommonName ? styles.gbifScientificRowHidden : ''}`}
                aria-hidden={isProvisionalCommonName || undefined}
            >
                <i className={styles.gbifScientificName}>{species.scientificName || (isSpeciesNameLoading ? '' : `Taxon ${species.speciesKey}`)}</i>
            </div>
            <div className={styles.gbifCountRow}>
                <span className={styles.gbifOccurrenceCount}>{species.occurrenceCount.toLocaleString()} occurrences</span>
                <SpeciesCardActions
                    attribution={selectedImage?.attribution}
                    species={{
                        gbifTaxonKey: species.speciesKey,
                        scientificName: species.scientificName || `GBIF taxon ${species.speciesKey}`,
                        displayName: species.commonName || species.scientificName || `GBIF taxon ${species.speciesKey}`
                    }}
                    onShowSpeciesLayer={onShowSpeciesLayer}
                    activeSpeciesLayer={activeSpeciesLayer}
                    onClearSpeciesLayer={onClearSpeciesLayer}
                />
            </div>
        </article>
    );
}

async function fetchSpeciesImages(
    speciesKey: number,
    mapBounds: BufferedMapBounds,
    signal: AbortSignal
): Promise<MediaBatch> {
    const searchTiers = getMediaSearchTiers(mapBounds);
    for (let tierIndex = 0; tierIndex < searchTiers.length; tierIndex++) {
        let offset = 0;
        let endOfTier = false;
        const tierImages: SpeciesImage[] = [];
        const seen = new Set<string>();
        for (let pageIndex = 0; pageIndex < maxInitialPagesPerTier; pageIndex++) {
            const page = await fetchOccurrenceImages(speciesKey, searchTiers[tierIndex], offset, signal);
            for (const image of page.images) {
                if (!seen.has(image.fullUrl)) {
                    tierImages.push(image);
                    seen.add(image.fullUrl);
                }
            }
            offset = page.nextOffset;
            endOfTier = page.endOfRecords;
            if (tierImages.length >= minimumInitialImages || endOfTier) {
                break;
            }
        }

        if (tierImages.length > 0) {
            const cursor = {
                tierIndex,
                offset,
                endOfTier,
                pendingImages: tierImages.slice(maxImagesPerBatch)
            };
            const images = tierImages.slice(0, maxImagesPerBatch);
            const hasMore = hasMoreMedia(cursor, searchTiers.length);
            return {
                images,
                cursor: hasMore ? cursor : null,
                hasMore
            };
        }
    }

    return { images: [], cursor: null, hasMore: false };
}

function getMediaSearchTiers(mapBounds: BufferedMapBounds): Array<BufferedMapBounds | undefined> {
    return [
        ...nearbyBoundsPaddings.map((padding) => ({
            north: Math.min(90, mapBounds.north + padding),
            east: Math.min(180, mapBounds.east + padding),
            south: Math.max(-90, mapBounds.south - padding),
            west: Math.max(-180, mapBounds.west - padding)
        })),
        undefined
    ];
}

async function fetchMoreSpeciesImages(
    speciesKey: number,
    mapBounds: BufferedMapBounds,
    cursor: MediaCursor,
    seenImageUrls: ReadonlySet<string>,
    signal: AbortSignal
): Promise<MediaBatch> {
    const searchTiers = getMediaSearchTiers(mapBounds);
    const nextCursor = { ...cursor, pendingImages: [...cursor.pendingImages] };
    const images: SpeciesImage[] = [];
    const seen = new Set(seenImageUrls);
    let fetchedPages = 0;

    while (images.length < maxImagesPerBatch) {
        const pendingImage = nextCursor.pendingImages.shift();
        if (pendingImage) {
            if (!seen.has(pendingImage.fullUrl)) {
                images.push(pendingImage);
                seen.add(pendingImage.fullUrl);
            }
            continue;
        }

        if (nextCursor.endOfTier) {
            if (nextCursor.tierIndex >= searchTiers.length - 1) {
                break;
            }
            nextCursor.tierIndex += 1;
            nextCursor.offset = 0;
            nextCursor.endOfTier = false;
            fetchedPages = 0;
        }

        if (fetchedPages >= maxPagesPerTierPerLoad) {
            if (images.length > 0 || nextCursor.tierIndex >= searchTiers.length - 1) {
                break;
            }
            nextCursor.tierIndex += 1;
            nextCursor.offset = 0;
            nextCursor.endOfTier = false;
            fetchedPages = 0;
            continue;
        }

        const page = await fetchOccurrenceImages(
            speciesKey,
            searchTiers[nextCursor.tierIndex],
            nextCursor.offset,
            signal
        );
        fetchedPages += 1;
        nextCursor.offset = page.nextOffset;
        nextCursor.endOfTier = page.endOfRecords;
        nextCursor.pendingImages = page.images.filter((image) => !seen.has(image.fullUrl));
    }

    const hasMore = hasMoreMedia(nextCursor, searchTiers.length);
    return {
        images,
        cursor: hasMore ? nextCursor : null,
        hasMore
    };
}

function hasMoreMedia(cursor: MediaCursor, tierCount: number): boolean {
    return cursor.pendingImages.length > 0 || !cursor.endOfTier || cursor.tierIndex < tierCount - 1;
}

async function fetchOccurrenceImages(
    speciesKey: number,
    bounds: BufferedMapBounds | undefined,
    offset: number,
    signal: AbortSignal
): Promise<OccurrenceImagePage> {
    const params = new URLSearchParams({
        taxonKey: String(speciesKey),
        mediaType: 'StillImage',
        occurrenceStatus: 'PRESENT',
        limit: String(mediaOccurrencesPerRequest),
        offset: String(offset)
    });
    if (bounds) {
        params.set('geometry', `POLYGON((${bounds.west} ${bounds.south},${bounds.east} ${bounds.south},${bounds.east} ${bounds.north},${bounds.west} ${bounds.north},${bounds.west} ${bounds.south}))`);
    }

    const url = `https://api.gbif.org/v1/occurrence/search?${params.toString()}`;
    const response = await throttledFetchWithRetry(url, { signal });
    if (!response.ok) {
        throw new Error(`GBIF media request failed with status ${response.status}`);
    }

    const data = await response.json() as GbifOccurrenceResponse;
    const occurrences = data.results ?? [];
    const endOfRecords = data.endOfRecords ?? occurrences.length < (data.limit ?? mediaOccurrencesPerRequest);
    return {
        images: parseOccurrenceImages(occurrences),
        nextOffset: (data.offset ?? offset) + occurrences.length,
        endOfRecords
    };
}

function parseOccurrenceImages(occurrences: GbifOccurrence[]): SpeciesImage[] {
    const seenIdentifiers = new Set<string>();
    const images: Array<{ image: SpeciesImage; primary: boolean; pixelCount: number; index: number }> = [];

    let imageIndex = 0;
    for (const occurrence of occurrences) {
        for (const [mediaIndex, media] of (occurrence.media ?? []).entries()) {
            if (media.type && media.type !== 'StillImage') {
                continue;
            }
            if (isXenoCantoMedia(media)) {
                continue;
            }
            const imageUrl = getHttpsImageUrl(media.identifier);
            if (!imageUrl || seenIdentifiers.has(imageUrl)) {
                continue;
            }
            seenIdentifiers.add(imageUrl);
            const pixelCount = typeof media.width === 'number' && typeof media.height === 'number'
                ? media.width * media.height
                : 0;
            const fullUrl = getINatPhotoUrl(imageUrl, 'original') ?? imageUrl;
            const largeUrl = getINatPhotoUrl(imageUrl, 'large') ?? fullUrl;
            images.push({
                image: {
                    id: `${occurrence.key ?? 'occurrence'}-${mediaIndex}-${imageUrl}`,
                    source: 'gbif',
                    thumbnailUrl: getINatPhotoUrl(imageUrl, 'medium') ?? imageUrl,
                    ...(largeUrl !== fullUrl ? { largeUrl } : {}),
                    fullUrl,
                    attribution: getMediaAttribution(media),
                    credits: {
                        creator: media.creator,
                        rightsHolder: media.rightsHolder,
                        license: media.license,
                        source: media.source
                    },
                    location: getOccurrenceLocation(occurrence),
                    labels: getMediaLabels(occurrence, media)
                },
                primary: media.primary === true || media.isPrimary === true,
                pixelCount,
                index: imageIndex++
            });
        }
    }

    return images
        .sort((first, second) => Number(second.primary) - Number(first.primary)
            || second.pixelCount - first.pixelCount
            || first.index - second.index)
        .map(({ image }) => image);
}

function isXenoCantoMedia(media: GbifOccurrenceMedia): boolean {
    return [media.identifier, media.source, media.title, media.description, media.creator, media.rightsHolder]
        .some((value) => value !== undefined && /xeno[-\s]?canto/i.test(value));
}

function getOccurrenceLocation(occurrence: GbifOccurrence): SpeciesImage['location'] {
    const region = [occurrence.locality, occurrence.municipality, occurrence.county, occurrence.verbatimLocality, occurrence.stateProvince]
        .find((value) => value && value !== occurrence.country);
    const location = {
        country: occurrence.country || undefined,
        stateProvince: occurrence.stateProvince || undefined,
        region: region || undefined
    };
    return Object.values(location).some((value) => value !== undefined) ? location : undefined;
}

function getHttpsImageUrl(value: string | undefined): string | undefined {
    if (!value) {
        return undefined;
    }

    try {
        const url = new URL(value);
        if (url.protocol === 'http:') {
            url.protocol = 'https:';
        }
        return url.protocol === 'https:' ? url.toString() : undefined;
    } catch {
        return undefined;
    }
}

function getMediaAttribution(media: GbifOccurrenceMedia): string | undefined {
    const licenseNeedsAttribution = Boolean(media.license && /\bby(?:[-/ ]|$)/i.test(media.license));
    if (!media.rightsHolder && !licenseNeedsAttribution) {
        return undefined;
    }

    return [
        media.rightsHolder && `© ${media.rightsHolder}`,
        media.license && `License: ${media.license}`,
    ].filter((line): line is string => Boolean(line)).join('\n');
}

function getMediaLabels(occurrence: GbifOccurrence, media: GbifOccurrenceMedia): string[] {
    const labels = new Set<string>();
    if (media.primary === true || media.isPrimary === true) {
        labels.add('Primary');
    } else if (media.primary === false || media.isPrimary === false) {
        labels.add('Secondary');
    }
    if (media.rank) {
        labels.add(formatLabel(media.rank));
    }
    if (occurrence.lifeStage) {
        labels.add(formatLabel(occurrence.lifeStage));
    }
    if (occurrence.sex) {
        labels.add(formatLabel(occurrence.sex));
    }
    for (const annotation of occurrence.annotations ?? []) {
        const annotationText = annotation.controlled_value?.label
            ?? annotation.value
            ?? annotation.label
            ?? annotation.controlled_attribute?.label;
        if (annotationText) {
            labels.add(formatLabel(annotationText));
        }
    }

    const metadataText = `${media.title ?? ''} ${media.description ?? ''}`;
    for (const label of ['primary', 'secondary', 'adult', 'juvenile', 'nestling', 'fledgling', 'chick', 'egg', 'nest', 'male', 'female']) {
        if (new RegExp(`\\b${label}\\b`, 'i').test(metadataText)) {
            labels.add(formatLabel(label));
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
