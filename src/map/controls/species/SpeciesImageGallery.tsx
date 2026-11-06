import { ChevronLeft, ChevronRight, ImageDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeciesConservationIndicator } from './SpeciesConservationIndicator';
import { SpeciesImageViewer } from './SpeciesImageViewer';
import type { INatConservationStatus } from '../../iNatTypes';
import type { SpeciesImage } from './types';
import styles from './SpeciesImageGallery.module.css';

type SpeciesImageGalleryProps = {
    imageAlt: string;
    images: readonly SpeciesImage[];
    loading?: boolean;
    error?: boolean;
    conservationStatus?: INatConservationStatus;
    additionalImagesLoading?: boolean;
    hasMoreImages?: boolean;
    loadingMoreImages?: boolean;
    loopNavigation?: boolean;
    onLoadMoreImages?: () => Promise<number>;
    onSelectedImageChange?: (image: SpeciesImage | null) => void;
    onOpen?: () => void;
}

export function SpeciesImageGallery({
    imageAlt,
    images,
    loading = false,
    error = false,
    conservationStatus,
    additionalImagesLoading = false,
    hasMoreImages = false,
    loadingMoreImages = false,
    loopNavigation = true,
    onLoadMoreImages,
    onSelectedImageChange,
    onOpen
}: Readonly<SpeciesImageGalleryProps>) {
    const [requestedIndex, setRequestedIndex] = useState(0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [fullResolutionThumbnails, setFullResolutionThumbnails] = useState<ReadonlySet<string>>(() => new Set());
    const [loadedThumbnails, setLoadedThumbnails] = useState<ReadonlySet<string>>(() => new Set());
    const [failedThumbnails, setFailedThumbnails] = useState<ReadonlySet<string>>(() => new Set());
    const thumbnailButtonRef = useRef<HTMLButtonElement | null>(null);
    const selectedIndex = images.length === 0 ? 0 : Math.min(requestedIndex, images.length - 1);
    const selectedImage = images[selectedIndex] ?? images[0] ?? null;

    useEffect(() => {
        onSelectedImageChange?.(selectedImage);
    }, [onSelectedImageChange, selectedImage]);

    const closeViewer = useCallback(() => {
        setIsViewerOpen(false);
        thumbnailButtonRef.current?.focus();
    }, []);

    const showPrevious = () => {
        if (images.length === 0) {
            return;
        }
        setRequestedIndex(loopNavigation
            ? (selectedIndex - 1 + images.length) % images.length
            : Math.max(0, selectedIndex - 1));
    };
    const showNext = async () => {
        if (selectedIndex < images.length - 1) {
            setRequestedIndex(selectedIndex + 1);
        } else if (loopNavigation && images.length > 1) {
            setRequestedIndex(0);
        } else if (hasMoreImages && !loadingMoreImages && onLoadMoreImages) {
            const addedImages = await onLoadMoreImages();
            if (addedImages > 0) {
                setRequestedIndex(selectedIndex + 1);
            }
        }
    };

    return (
        <>
            <div className={styles.gallery}>
                {selectedImage ? (
                    <>
                        <div className={styles.conservationBadge}>
                            <SpeciesConservationIndicator status={conservationStatus} />
                        </div>
                        {failedThumbnails.has(selectedImage.id) ? (
                            <div className={styles.failedThumbnail}>Image unavailable</div>
                        ) : (
                            <button
                                ref={thumbnailButtonRef}
                                type='button'
                                className={styles.thumbnailButton}
                                aria-label={`Open full-size image of ${imageAlt}`}
                                onClick={() => {
                                    onOpen?.();
                                    setIsViewerOpen(true);
                                }}
                            >
                                <img
                                    className={styles.thumbnail}
                                    src={fullResolutionThumbnails.has(selectedImage.id) ? selectedImage.fullUrl : selectedImage.thumbnailUrl}
                                    alt={imageAlt}
                                    loading='lazy'
                                    decoding='async'
                                    onLoad={() => setLoadedThumbnails((current) => new Set(current).add(selectedImage.id))}
                                    onError={() => {
                                        if (selectedImage.thumbnailUrl !== selectedImage.fullUrl && !fullResolutionThumbnails.has(selectedImage.id)) {
                                            setFullResolutionThumbnails((current) => new Set(current).add(selectedImage.id));
                                        } else {
                                            setFailedThumbnails((current) => new Set(current).add(selectedImage.id));
                                        }
                                    }}
                                    style={{ visibility: loadedThumbnails.has(selectedImage.id) ? 'visible' : 'hidden' }}
                                />
                                {(!loadedThumbnails.has(selectedImage.id) || loadingMoreImages) && (
                                    <span className={styles.imageLoading} role='status' aria-label='Loading image'>
                                        <ImageDown className={styles.loadingIcon} aria-hidden='true' />
                                    </span>
                                )}
                            </button>
                        )}
                        {(images.length > 1 || hasMoreImages) && (
                            <div className={styles.carousel}>
                                <button
                                    type='button'
                                    className={styles.carouselButton}
                                    onClick={showPrevious}
                                    disabled={selectedIndex === 0 && !loopNavigation}
                                    aria-label='Previous species image'
                                >
                                    <ChevronLeft aria-hidden='true' />
                                </button>
                                <button
                                    type='button'
                                    className={styles.carouselButton}
                                    onClick={() => void showNext()}
                                    disabled={
                                        (selectedIndex === images.length - 1 && !hasMoreImages && !loopNavigation)
                                        || (loadingMoreImages && selectedIndex === images.length - 1 && !loopNavigation)
                                    }
                                    aria-label='Next species image'
                                >
                                    <ChevronRight aria-hidden='true' />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.placeholder}>
                        {loading ? (
                            <ImageDown className={styles.loadingIcon} aria-label='Loading images' />
                        ) : error ? 'Images unavailable' : 'No image available'}
                    </div>
                )}
            </div>
            {isViewerOpen && selectedImage && (
                <SpeciesImageViewer
                    images={images}
                    imageIndex={selectedIndex}
                    imageAlt={imageAlt}
                    additionalImagesLoading={additionalImagesLoading}
                    hasMoreImages={hasMoreImages}
                    loadingMoreImages={loadingMoreImages}
                    loopNavigation={loopNavigation}
                    onLoadMoreImages={onLoadMoreImages}
                    onSelectImage={setRequestedIndex}
                    onClose={closeViewer}
                />
            )}
        </>
    );
}
