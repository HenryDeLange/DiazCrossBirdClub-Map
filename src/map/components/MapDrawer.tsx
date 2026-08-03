import { ArrowLeft, X } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

type MapDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    label?: string;
    title: string;
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
    const [panelHeight, setPanelHeight] = useState(() => clampHeight(height, minHeight));
    const dragRef = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            const frameId = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(frameId);
        }

        setIsVisible(false);
        const timeoutId = window.setTimeout(() => setIsRendered(false), drawerTransitionDuration);
        return () => window.clearTimeout(timeoutId);
    }, [isOpen]);

    useEffect(() => {
        setPanelHeight(clampHeight(height, minHeight));
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

    if (!isRendered) {
        return null;
    }

    return (
        <div className={`drawer-backdrop ${isVisible ? 'drawer-backdrop-open' : 'drawer-backdrop-closing'}`} onClick={onClose} onDoubleClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}>
            <div
                className={`drawer-panel ${isVisible ? 'drawer-open' : 'drawer-closing'}`}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onWheel={(event) => event.stopPropagation()}
                style={{ height: panelHeight, maxHeight }}
            >
                <div className='drawer-topbar'>
                    {onBack ? (
                        <button type='button' className='drawer-topbar-button drawer-back' onClick={onBack} aria-label='Back to previous drawer' title='Back to previous drawer'>
                            <ArrowLeft className='drawer-topbar-icon' />
                        </button>
                    ) : <span className='drawer-topbar-spacer' aria-hidden='true' />}
                    <button
                        type='button'
                        className='drawer-drag-handle'
                        aria-label='Resize drawer'
                        title='Resize drawer'
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={stopDragging}
                        onPointerCancel={stopDragging}
                    >
                        <span className='drawer-drag-bar' aria-hidden='true' />
                    </button>
                    <button type='button' className='drawer-topbar-button drawer-close drawer-close-large' onClick={onClose} aria-label='Close drawer' title='Close drawer'>
                        <X className='drawer-topbar-icon drawer-close-icon' />
                    </button>
                </div>
                <div className='drawer-header'>
                    <div>
                        {label && <div className='drawer-label'>{label}</div>}
                        <div className='drawer-title'>{title}</div>
                    </div>
                    {headerAction}
                </div>
                {children}
            </div>
        </div>
    );
}

function clampHeight(value: number, minHeight: number): number {
    const viewportMaxHeight = typeof window === 'undefined' ? value : Math.max(minHeight, window.innerHeight - 8);
    return Math.min(Math.max(value, minHeight), viewportMaxHeight);
}
