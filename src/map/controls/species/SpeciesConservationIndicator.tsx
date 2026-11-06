import { Heart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { INatConservationStatus } from '../../iNatTypes';
import styles from './SpeciesConservationIndicator.module.css';

type SpeciesConservationIndicatorProps = {
    status?: INatConservationStatus;
}

export function SpeciesConservationIndicator({ status }: Readonly<SpeciesConservationIndicatorProps>) {
    const [isOpen, setIsOpen] = useState(false);
    const indicatorRef = useRef<HTMLSpanElement | null>(null);
    const statusLabel = status?.status_name
        ? status.status_name.charAt(0).toUpperCase() + status.status_name.slice(1)
        : status?.status;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleOutsidePointerDown = (event: PointerEvent) => {
            const indicator = indicatorRef.current;
            if (indicator && event.target instanceof Node && !indicator.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleOutsidePointerDown, true);
        return () => document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    }, [isOpen]);

    if (!statusLabel) {
        return null;
    }

    return (
        <span ref={indicatorRef} className={styles.indicator}>
            <button
                type='button'
                className={styles.trigger}
                aria-label='Show conservation status'
                aria-expanded={isOpen}
                title={`Conservation status: ${statusLabel}${status?.authority ? ` (${status.authority})` : ''}`}
                onClick={() => setIsOpen((current) => !current)}
            >
                <Heart className={styles.icon} aria-hidden='true' />
            </button>
            {isOpen && (
                <span className={styles.popup} role='tooltip'>
                    <strong>{statusLabel}</strong>
                    {status?.authority && <span>Authority: {status.authority}</span>}
                    {status?.status && status.status !== status.status_name && <span>Code: {status.status}</span>}
                </span>
            )}
        </span>
    );
}
