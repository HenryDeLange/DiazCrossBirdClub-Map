import { ChevronLeft, ChevronRight, Copyright, Hd, Image as ImageIcon, ImageDown, LayoutGrid, MapPin, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { SpeciesImage } from './types';
import { VirtualizedGrid } from './VirtualizedGrid';
import styles from './SpeciesImageGallery.module.css';

type SpeciesImageViewerProps = {
    images: readonly SpeciesImage[];
    imageIndex: number;
    imageAlt: string;
    additionalImagesLoading: boolean;
    hasMoreImages: boolean;
    loadingMoreImages: boolean;
    loopNavigation: boolean;
    onLoadMoreImages?: () => Promise<number>;
    onSelectImage: (index: number) => void;
    onClose: () => void;
}

type Point = {
    x: number;
    y: number;
}

type PinchStart = {
    distance: number;
    zoom: number;
}

type ViewMode = 'single' | 'grid';

const minimumZoom = 1;
const maximumZoom = 5;
const minimumSwipeDistance = 56;
const swipeTransitionDuration = 180;

export function SpeciesImageViewer({
    images,
    imageIndex,
    imageAlt,
    additionalImagesLoading,
    hasMoreImages,
    loadingMoreImages,
    loopNavigation,
    onLoadMoreImages,
    onSelectImage,
    onClose
}: Readonly<SpeciesImageViewerProps>) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [isOriginalImage, setIsOriginalImage] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwipeSettling, setIsSwipeSettling] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('single');
    const [loadedImages, setLoadedImages] = useState<ReadonlySet<string>>(() => new Set());
    const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(() => new Set());
    const dialogRef = useRef<HTMLElement | null>(null);
    const historyEntryRef = useRef(false);
    const onCloseRef = useRef(onClose);
    const pointersRef = useRef(new Map<number, Point>());
    const pinchStartRef = useRef<PinchStart | null>(null);
    const dragStartRef = useRef<{ point: Point; pan: Point } | null>(null);
    const swipeAxisRef = useRef<'horizontal' | 'vertical' | null>(null);
    const swipeTransitionRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const swipeActionRef = useRef<'next' | 'previous' | 'settle' | null>(null);
    const zoomRef = useRef(zoom);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const gridViewportRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const image = images[imageIndex];

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!historyEntryRef.current) {
            const currentState = window.history.state;
            const state = typeof currentState === 'object' && currentState !== null ? currentState : {};
            window.history.pushState({ ...state, speciesImageViewer: true }, '', window.location.href);
            historyEntryRef.current = true;
        }
        dialogRef.current?.focus();

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handlePopState = () => {
            if (!historyEntryRef.current) {
                return;
            }
            historyEntryRef.current = false;
            onCloseRef.current();
        };

        const closeFromUser = () => {
            if (historyEntryRef.current) {
                historyEntryRef.current = false;
                window.history.back();
            }
            onCloseRef.current();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                closeFromUser();
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            if (swipeTransitionRef.current !== null) {
                window.clearTimeout(swipeTransitionRef.current);
            }
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('keydown', handleKeyDown, true);
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const clampPan = useCallback((nextPan: Point, nextZoom: number): Point => {
        const viewport = viewportRef.current;
        const imageElement = imageRef.current;
        if (!viewport || !imageElement) {
            return { x: 0, y: 0 };
        }

        const maxX = Math.max(0, (imageElement.offsetWidth * nextZoom - viewport.clientWidth) / 2);
        const maxY = Math.max(0, (imageElement.offsetHeight * nextZoom - viewport.clientHeight) / 2);
        return {
            x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
            y: Math.max(-maxY, Math.min(maxY, nextPan.y))
        };
    }, []);

    const changeZoom = useCallback((value: number) => {
        const nextZoom = Math.min(maximumZoom, Math.max(minimumZoom, value));
        zoomRef.current = nextZoom;
        setZoom(nextZoom);
        setPan((current) => nextZoom === minimumZoom ? { x: 0, y: 0 } : clampPan(current, nextZoom));
    }, [clampPan]);

    const handleWheel = useCallback((event: globalThis.WheelEvent) => {
        event.preventDefault();
        changeZoom(zoomRef.current + (event.deltaY < 0 ? 0.25 : -0.25));
    }, [changeZoom]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

        viewport.addEventListener('wheel', handleWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    useEffect(() => {
        const gridViewport = gridViewportRef.current;
        if (viewMode !== 'grid' || !gridViewport) {
            return;
        }

        const handleGridWheel = (event: globalThis.WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const deltaMultiplier = event.deltaMode === globalThis.WheelEvent.DOM_DELTA_LINE
                ? 16
                : event.deltaMode === globalThis.WheelEvent.DOM_DELTA_PAGE
                    ? gridViewport.clientHeight
                    : 1;
            gridViewport.scrollTop += event.deltaY * deltaMultiplier;
        };

        gridViewport.addEventListener('wheel', handleGridWheel, { passive: false });
        return () => gridViewport.removeEventListener('wheel', handleGridWheel);
    }, [viewMode]);

    if (!image) {
        return null;
    }

    const isINatImage = image.source === 'inat';
    const largeImageUrl = image.largeUrl ?? image.fullUrl;
    const currentImageUrl = isOriginalImage ? image.fullUrl : largeImageUrl;
    const canToggleImageSize = largeImageUrl !== image.fullUrl;
    const hasImageCredits = Boolean(
        image.attribution
        || image.credits?.rightsHolder
        || image.credits?.license
    );
    const isImageLoading = !failedImages.has(currentImageUrl)
        && (!loadedImages.has(currentImageUrl) || (isINatImage && additionalImagesLoading));
    const canNavigatePrevious = loopNavigation ? images.length > 1 : imageIndex > 0;
    const canNavigateNext = loopNavigation ? images.length > 1 : imageIndex < images.length - 1;
    const hasImageNavigation = images.length > 1 || hasMoreImages;
    const previousImage = canNavigatePrevious
        ? images[(imageIndex - 1 + images.length) % images.length]
        : null;
    const nextImage = canNavigateNext
        ? images[(imageIndex + 1) % images.length]
        : null;
    const imageSlides = [
        ...(previousImage ? [{ image: previousImage, position: 'previous' as const }] : []),
        { image, position: 'current' as const },
        ...(nextImage ? [{ image: nextImage, position: 'next' as const }] : [])
    ];

    const clearSwipeTransition = () => {
        if (swipeTransitionRef.current !== null) {
            window.clearTimeout(swipeTransitionRef.current);
            swipeTransitionRef.current = null;
        }
    };

    const selectImage = (index: number) => {
        clearSwipeTransition();
        onSelectImage(index);
        setViewMode('single');
        changeZoom(1);
        setPan({ x: 0, y: 0 });
        setIsOriginalImage(false);
        setSwipeOffset(0);
        setIsSwipeSettling(false);
        swipeActionRef.current = null;
        swipeAxisRef.current = null;
    };

    const showPrevious = () => {
        if (imageIndex > 0) {
            selectImage(imageIndex - 1);
        } else if (loopNavigation && images.length > 1) {
            selectImage(images.length - 1);
        }
    };
    const showNext = async () => {
        if (imageIndex < images.length - 1) {
            selectImage(imageIndex + 1);
        } else if (loopNavigation && images.length > 1) {
            selectImage(0);
        } else if (hasMoreImages && !loadingMoreImages && onLoadMoreImages) {
            const addedImages = await onLoadMoreImages();
            if (addedImages > 0) {
                selectImage(imageIndex + 1);
            }
        }
    };

    const finishSwipeTransition = () => {
        clearSwipeTransition();
        const action = swipeActionRef.current;
        swipeActionRef.current = null;
        if (action === 'next') {
            void showNext();
        } else if (action === 'previous') {
            showPrevious();
        } else if (action === 'settle') {
            setIsSwipeSettling(false);
        }
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (isSwipeSettling || (event.pointerType === 'mouse' && event.button !== 0)) {
            return;
        }
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = { x: event.clientX, y: event.clientY };
        pointersRef.current.set(event.pointerId, point);
        if (pointersRef.current.size === 2) {
            const [first, second] = [...pointersRef.current.values()];
            pinchStartRef.current = { distance: Math.max(getDistance(first, second), 1), zoom: zoomRef.current };
            dragStartRef.current = null;
            swipeAxisRef.current = null;
            setSwipeOffset(0);
        } else if (pointersRef.current.size === 1) {
            dragStartRef.current = { point, pan };
            swipeAxisRef.current = null;
            setSwipeOffset(0);
        }
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!pointersRef.current.has(event.pointerId)) {
            return;
        }

        pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointersRef.current.size >= 2 && pinchStartRef.current) {
            const [first, second] = [...pointersRef.current.values()];
            changeZoom(pinchStartRef.current.zoom * getDistance(first, second) / pinchStartRef.current.distance);
            return;
        }

        if (zoomRef.current > minimumZoom && dragStartRef.current) {
            setPan(clampPan({
                x: dragStartRef.current.pan.x + event.clientX - dragStartRef.current.point.x,
                y: dragStartRef.current.pan.y + event.clientY - dragStartRef.current.point.y
            }, zoomRef.current));
            return;
        }

        if (pointersRef.current.size === 1 && dragStartRef.current) {
            const deltaX = event.clientX - dragStartRef.current.point.x;
            const deltaY = event.clientY - dragStartRef.current.point.y;
            if (
                swipeAxisRef.current === null
                && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8
            ) {
                swipeAxisRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
            }
            if (swipeAxisRef.current === 'horizontal') {
                setSwipeOffset(deltaX);
            }
        }
    };

    const handlePointerEnd = (event: PointerEvent<HTMLDivElement>, allowSwipe: boolean) => {
        if (!pointersRef.current.has(event.pointerId)) {
            return;
        }

        const dragStart = dragStartRef.current;
        const wasSinglePointer = pointersRef.current.size === 1;
        const wasPinching = pinchStartRef.current !== null || pointersRef.current.size > 1;
        let swipeDirection: 'next' | 'previous' | null = null;
        if (
            allowSwipe
            && wasSinglePointer
            && !wasPinching
            && zoomRef.current <= minimumZoom
            && (canNavigatePrevious || canNavigateNext)
            && swipeAxisRef.current !== 'vertical'
            && dragStart
        ) {
            const deltaX = event.clientX - dragStart.point.x;
            const deltaY = event.clientY - dragStart.point.y;
            if (Math.abs(deltaX) >= minimumSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
                const direction = deltaX < 0 ? 'next' : 'previous';
                if (direction === 'next' ? canNavigateNext : canNavigatePrevious) {
                    swipeDirection = direction;
                }
            }
        }

        pointersRef.current.delete(event.pointerId);
        pinchStartRef.current = null;
        const remainingPointer = [...pointersRef.current.values()][0];
        dragStartRef.current = remainingPointer ? { point: remainingPointer, pan } : null;
        swipeAxisRef.current = null;

        if (swipeDirection) {
            clearSwipeTransition();
            swipeActionRef.current = swipeDirection;
            const viewportWidth = viewportRef.current?.clientWidth ?? minimumSwipeDistance;
            setIsSwipeSettling(true);
            setSwipeOffset(swipeDirection === 'next' ? -viewportWidth : viewportWidth);
            swipeTransitionRef.current = window.setTimeout(() => {
                swipeTransitionRef.current = null;
                finishSwipeTransition();
            }, swipeTransitionDuration + 100);
        } else if (Math.abs(swipeOffset) > 0) {
            clearSwipeTransition();
            swipeActionRef.current = 'settle';
            setIsSwipeSettling(true);
            setSwipeOffset(0);
            swipeTransitionRef.current = window.setTimeout(() => {
                swipeTransitionRef.current = null;
                finishSwipeTransition();
            }, swipeTransitionDuration + 100);
        }
    };

    const closeFromButton = () => {
        if (historyEntryRef.current) {
            historyEntryRef.current = false;
            window.history.back();
        }
        onCloseRef.current();
    };

    return createPortal(
        <div
            className={styles.backdrop}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    closeFromButton();
                }
            }}
        >
            <section
                ref={dialogRef}
                className={styles.dialog}
                onClick={(event) => {
                    if (event.detail === 0 || !(event.target instanceof Element)) {
                        return;
                    }
                    const button = event.target.closest('button');
                    if (button && event.currentTarget.contains(button)) {
                        button.blur();
                    }
                }}
                role='dialog'
                aria-modal='true'
                aria-label={`Image of ${imageAlt}`}
                tabIndex={-1}
            >
                <header className={styles.viewerHeader}>
                    <span className={styles.viewerTitle} title={imageAlt}>{imageAlt}</span>
                    <div className={styles.viewerHeaderActions}>
                        {(images.length > 1 || hasMoreImages) && (
                            <button
                                type='button'
                                className={styles.headerButton}
                                aria-label={viewMode === 'single' ? 'Show image grid' : 'Show single image'}
                                title={viewMode === 'single' ? 'Show image grid' : 'Show single image'}
                                onClick={() => {
                                    if (viewMode === 'single') {
                                        setViewMode('grid');
                                        if (hasMoreImages && !loadingMoreImages) {
                                            void onLoadMoreImages?.();
                                        }
                                    } else {
                                        setViewMode('single');
                                    }
                                }}
                            >
                                {viewMode === 'single' ? <LayoutGrid aria-hidden='true' /> : <ImageIcon aria-hidden='true' />}
                            </button>
                        )}
                        <button
                            type='button'
                            className={styles.headerButton}
                            aria-label='Close image viewer'
                            title='Close image viewer'
                            onClick={closeFromButton}
                        >
                            <X aria-hidden='true' />
                        </button>
                    </div>
                </header>
                {viewMode === 'grid' ? (
                    <div
                        ref={gridViewportRef}
                        className={styles.gridViewport}
                        aria-label={image.source === 'gbif' ? `Photo grid of ${imageAlt}` : `${images.length} images of ${imageAlt}`}
                        onScroll={(event) => {
                            const viewport = event.currentTarget;
                            if (
                                hasMoreImages
                                && !loadingMoreImages
                                && viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 320
                            ) {
                                void onLoadMoreImages?.();
                            }
                        }}
                    >
                        <VirtualizedGrid
                            items={images}
                            scrollElementRef={gridViewportRef}
                            layout='photos'
                            className={styles.gridCanvas}
                            rowClassName={styles.gridRow}
                            minItemWidth={128}
                            gap={9}
                            getItemKey={(gridImage) => gridImage.id}
                            renderItem={(gridImage, index) => (
                                <button
                                    type='button'
                                    className={`${styles.gridImageButton} ${index === imageIndex ? styles.selectedGridImage : ''}`}
                                    aria-label={image.source === 'gbif'
                                        ? `View photo ${index + 1}`
                                        : `View image ${index + 1} of ${images.length}`}
                                    onClick={() => selectImage(index)}
                                >
                                    <img src={gridImage.thumbnailUrl} alt='' loading='lazy' decoding='async' />
                                    {gridImage.labels.length > 0 && (
                                        <span className={styles.gridLabels}>{gridImage.labels.slice(0, 2).join(', ')}</span>
                                    )}
                                </button>
                            )}
                        />
                        {loadingMoreImages && (
                            <div className={styles.gridLoading} role='status' aria-label='Loading more photos'>
                                <ImageDown className={styles.loadingIcon} aria-hidden='true' />
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        ref={viewportRef}
                        className={styles.viewport}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={(event) => handlePointerEnd(event, true)}
                        onPointerCancel={(event) => handlePointerEnd(event, false)}
                    >
                        {isImageLoading && (
                            <div className={styles.fullImageLoading} role='status' aria-label='Loading image'>
                                <ImageDown className={styles.loadingIcon} aria-hidden='true' />
                            </div>
                        )}
                        <div className={styles.fullImageSlides}>
                            {imageSlides.map((slide) => {
                                const isCurrent = slide.position === 'current';
                                const slideImageUrl = isCurrent
                                    ? currentImageUrl
                                    : slide.image.largeUrl ?? slide.image.fullUrl;
                                const slideOffset = slide.position === 'previous'
                                    ? '-100%'
                                    : slide.position === 'next'
                                        ? '100%'
                                        : '0%';
                                const isSlideLoading = !loadedImages.has(slideImageUrl)
                                    && !failedImages.has(slideImageUrl);

                                return (
                                    <div
                                        key={`${slide.position}-${slide.image.id}-${slideImageUrl}`}
                                        className={styles.fullImageSlide}
                                        onTransitionEnd={(event) => {
                                            if (
                                                isCurrent
                                                && event.target === event.currentTarget
                                                && event.propertyName === 'transform'
                                                && swipeActionRef.current !== null
                                            ) {
                                                finishSwipeTransition();
                                            }
                                        }}
                                        style={{
                                            transform: `translateX(${slideOffset}) translateX(${swipeOffset}px)`,
                                            transition: isSwipeSettling
                                                ? `transform ${swipeTransitionDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
                                                : 'none'
                                        }}
                                    >
                                        {failedImages.has(slideImageUrl) ? (
                                            <div className={styles.imageError}>Full-size image unavailable</div>
                                        ) : (
                                            <img
                                                ref={isCurrent ? imageRef : null}
                                                className={styles.fullImage}
                                                src={slideImageUrl}
                                                alt={isCurrent ? imageAlt : ''}
                                                draggable={false}
                                                loading='eager'
                                                decoding='async'
                                                onLoad={() => setLoadedImages((current) => new Set(current).add(slideImageUrl))}
                                                onError={() => setFailedImages((current) => new Set(current).add(slideImageUrl))}
                                                style={{
                                                    opacity: loadedImages.has(slideImageUrl) ? 1 : 0,
                                                    transform: isCurrent
                                                        ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                                                        : 'none'
                                                }}
                                            />
                                        )}
                                        {!isCurrent && isSlideLoading && (
                                            <div className={styles.fullImageLoading} aria-hidden='true'>
                                                <ImageDown className={styles.loadingIcon} aria-hidden='true' />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {(hasImageCredits || image.location) && (
                            <div className={styles.imageMetadataOverlay} onPointerDown={(event) => event.stopPropagation()}>
                                {hasImageCredits && <ImageCredits image={image} />}
                                {image.location && <ImageLocation image={image} />}
                            </div>
                        )}
                        {image.labels.length > 0 && (
                            <div className={styles.imageLabels} role='group' aria-label='Image details'>
                                {image.labels.map((label) => <span className={styles.label} key={label}>{label}</span>)}
                            </div>
                        )}
                        {(hasImageNavigation || canToggleImageSize) && (
                            <div
                                className={styles.viewerNavigation}
                                role='group'
                                aria-label='Image navigation'
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                                {canToggleImageSize && (
                                    <button
                                        type='button'
                                        className={styles.imageSizeToggle}
                                        aria-label='Original resolution'
                                        aria-pressed={isOriginalImage}
                                        title='Original resolution'
                                        onClick={() => setIsOriginalImage((current) => !current)}
                                    >
                                        <Hd aria-hidden='true' />
                                    </button>
                                )}
                                {hasImageNavigation && (
                                    <>
                                        <button type='button' onClick={showPrevious} disabled={!loopNavigation && imageIndex === 0} aria-label='Previous image'>
                                            <ChevronLeft aria-hidden='true' />
                                        </button>
                                        <span>{loopNavigation ? `${imageIndex + 1} / ${images.length}` : imageIndex + 1}</span>
                                        <button
                                            type='button'
                                            onClick={() => void showNext()}
                                            disabled={
                                                (!loopNavigation && imageIndex === images.length - 1 && !hasMoreImages)
                                                || (loadingMoreImages && imageIndex === images.length - 1 && !loopNavigation)
                                            }
                                            aria-label='Next image'
                                        >
                                            <ChevronRight aria-hidden='true' />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        <div
                            className={styles.floatingZoomControls}
                            role='group'
                            aria-label='Image zoom controls'
                            onPointerDown={(event) => event.stopPropagation()}
                        >
                            <button type='button' onClick={() => changeZoom(zoomRef.current + 0.5)} aria-label='Zoom in'>
                                <ZoomIn aria-hidden='true' />
                            </button>
                            <button type='button' onClick={() => changeZoom(zoomRef.current - 0.5)} aria-label='Zoom out'>
                                <ZoomOut aria-hidden='true' />
                            </button>
                            <button type='button' onClick={() => changeZoom(1)} aria-label='Reset zoom'>
                                <RotateCcw aria-hidden='true' />
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>,
        document.body
    );
}

function ImageCredits({ image }: Readonly<{ image: SpeciesImage }>) {
    const credits = image.credits;
    if (image.source === 'gbif') {
        if (!credits?.rightsHolder && !credits?.license) {
            return null;
        }

        return (
            <span className={styles.creditList}>
                {credits.rightsHolder && (
                    <span className={styles.creditItem}>
                        <Copyright aria-label='Copyright' />
                        <span>© {credits.rightsHolder}</span>
                    </span>
                )}
                {credits.license && <span className={styles.creditItem}>({getLicenseName(credits.license)})</span>}
            </span>
        );
    }
    if (!image.attribution) {
        return null;
    }

    return (
        <span className={styles.creditItem}>
            <Copyright aria-label='Attribution' />
            <span>{image.attribution}</span>
        </span>
    );
}

function ImageLocation({ image }: Readonly<{ image: SpeciesImage }>) {
    const location = image.location;
    if (!location) {
        return null;
    }

    const place = [location.region || location.stateProvince, location.country].filter(Boolean).join(', ');
    if (!place) {
        return null;
    }

    return (
        <span className={styles.creditItem}>
            <MapPin aria-label='Photo location' />
            <span>{place}</span>
        </span>
    );
}

function getLicenseName(license: string): string {
    try {
        const url = new URL(license);
        if (url.hostname.endsWith('creativecommons.org')) {
            const parts = url.pathname.split('/').filter(Boolean).slice(-2);
            const code = parts[0];
            const version = parts[1];
            if (code) {
                return version ? `CC ${code.toUpperCase()} ${version}` : `CC ${code.toUpperCase()}`;
            }
        }
    } catch {
        return license;
    }
    return license;
}

function getDistance(first: Point, second: Point): number {
    return Math.hypot(first.x - second.x, first.y - second.y);
}
