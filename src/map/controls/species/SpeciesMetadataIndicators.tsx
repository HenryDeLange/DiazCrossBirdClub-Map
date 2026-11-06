import { Copyright } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './SpeciesMetadataIndicators.module.css';

type SpeciesMetadataIndicatorsProps = {
    attribution?: string;
}

export function SpeciesMetadataIndicators({ attribution }: Readonly<SpeciesMetadataIndicatorsProps>) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const indicatorsRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        if (!isPopupOpen) {
            return;
        }

        const handleOutsidePointerDown = (event: PointerEvent) => {
            const indicators = indicatorsRef.current;
            if (indicators && event.target instanceof Node && !indicators.contains(event.target)) {
                setIsPopupOpen(false);
            }
        };

        document.addEventListener('pointerdown', handleOutsidePointerDown, true);
        return () => document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    }, [isPopupOpen]);

    if (!attribution) {
        return null;
    }

    return (
        <span ref={indicatorsRef} className={styles.indicators}>
            <button
                type='button'
                className={styles.trigger}
                aria-label='Show image attribution'
                aria-expanded={isPopupOpen}
                onClick={() => setIsPopupOpen((current) => !current)}
            >
                <Copyright className={styles.icon} aria-hidden='true' />
            </button>
            {isPopupOpen && attribution && (
                <span className={styles.popup} role='tooltip'>{attribution}</span>
            )}
        </span>
    );
}
