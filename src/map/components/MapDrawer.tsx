import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import styles from './MapDrawer.module.css';

type MapDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    backLabel?: string;
    label?: string;
    title: ReactNode;
    headerAction?: ReactNode;
    height: number;
    onHeightChange?: (height: number) => void;
    maxHeight?: string;
    minHeight?: number;
    children: ReactNode;
}

const drawerTransitionDuration = 380;

export function MapDrawer({
    isOpen,
    onClose,
    onBack,
    backLabel,
    label,
    title,
    headerAction,
    height,
    onHeightChange,
    maxHeight = 'calc(100dvh - 1rem)',
    minHeight = 180,
    children
}: Readonly<MapDrawerProps>) {
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);
    const [isSettled, setIsSettled] = useState(false);
    const [panelHeight, setPanelHeight] = useState(() => clampHeight(height, minHeight));
    const dragRef = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(null);

    useEffect(() => {
        const resetSettledFrameId = requestAnimationFrame(() => setIsSettled(false));

        if (isOpen) {
            let visibleFrameId: number | undefined;
            const renderTimeoutId = window.setTimeout(() => {
                setIsRendered(true);
                visibleFrameId = requestAnimationFrame(() => setIsVisible(true));
            }, 0);

            return () => {
                cancelAnimationFrame(resetSettledFrameId);
                window.clearTimeout(renderTimeoutId);
                if (visibleFrameId !== undefined) {
                    cancelAnimationFrame(visibleFrameId);
                }
            };
        }

        const closeFrameId = requestAnimationFrame(() => setIsVisible(false));
        const timeoutId = window.setTimeout(() => setIsRendered(false), drawerTransitionDuration);

        return () => {
            cancelAnimationFrame(resetSettledFrameId);
            cancelAnimationFrame(closeFrameId);
            window.clearTimeout(timeoutId);
        };
    }, [isOpen]);

    useEffect(() => {
        const frameId = requestAnimationFrame(() => setPanelHeight(clampHeight(height, minHeight)));
        return () => cancelAnimationFrame(frameId);
    }, [height, minHeight]);

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startHeight: panelHeight
        };
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        const nextHeight = drag.startHeight + drag.startY - event.clientY;
        if (nextHeight < minHeight) {
            dragRef.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
            onClose();
            return;
        }

        const clampedHeight = clampHeight(nextHeight, minHeight);
        setPanelHeight(clampedHeight);
        onHeightChange?.(clampedHeight);
    };

    const stopDragging = (event: PointerEvent<HTMLButtonElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handlePanelTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
        if (isVisible && event.target === event.currentTarget && event.propertyName === 'transform') {
            setIsSettled(true);
        }
    };

    if (!isRendered) {
        return null;
    }

    return (
        <div className={`${styles.backdrop} ${isVisible ? styles.backdropOpen : styles.backdropClosing}`} onClick={onClose} onDoubleClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
            <div
            className={`${styles.panel} ${isVisible ? styles.open : styles.closing} ${isSettled ? styles.settled : ''}`}
                onTransitionEnd={handlePanelTransitionEnd}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onWheel={(event) => event.stopPropagation()}
                style={{ height: panelHeight, maxHeight }}
            >
                <div className={styles.topbar}>
                    <div className={styles.topbarContext}>
                        {onBack ? (
                            <button type='button' className={styles.topbarButton} onClick={onBack} aria-label='Back to previous drawer' title='Back to previous drawer'>
                                <ArrowLeft className={styles.topbarIcon} />
                            </button>
                        ) : <span className={styles.topbarSpacer} aria-hidden='true' />}
                        {onBack && backLabel && <span className={styles.topbarContextLabel} title={backLabel}>{backLabel}</span>}
                    </div>
                    <button
                        type='button'
                        className={styles.dragHandle}
                        aria-label='Resize drawer'
                        title='Resize drawer'
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={stopDragging}
                        onPointerCancel={stopDragging}
                    >
                        <span className={styles.dragBar} aria-hidden='true' />
                    </button>
                    <button type='button' className={`${styles.topbarButton} ${styles.close}`} onClick={onClose} aria-label='Close drawer' title='Close drawer'>
                        <X className={`${styles.topbarIcon} ${styles.closeIcon}`} />
                    </button>
                </div>
                <div className={styles.header}>
                    <div>
                        {label && <div className={styles.label}>{label}</div>}
                        <div className={styles.title}>{title}</div>
                    </div>
                    {headerAction}
                </div>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function clampHeight(value: number, minHeight: number): number {
    const viewportMaxHeight = typeof window === 'undefined' ? value : Math.max(minHeight, getViewportHeight() - 8);
    return Math.min(Math.max(value, minHeight), viewportMaxHeight);
}

function getViewportHeight(): number {
    const visualViewportHeight = window.visualViewport?.height;
    return Math.round(visualViewportHeight && visualViewportHeight > 0
        ? visualViewportHeight
        : document.documentElement.clientHeight || window.innerHeight);
}
