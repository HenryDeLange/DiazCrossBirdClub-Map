import type { ReactNode } from 'react';
import styles from './MapControlButton.module.css';

type MapControlButtonProps = {
    groupClassName: 'locationsGroup' | 'inatGroup' | 'astraGroup' | 'installGroup' | 'tidesGroup' | 'speciesLayerGroup';
    title: string;
    onClick: () => void;
    size?: 'default' | 'small';
    label?: string;
    children: ReactNode;
}

export function MapControlButton({ groupClassName, title, onClick, size = 'default', label, children }: Readonly<MapControlButtonProps>) {
    return (
        <div className={`${styles.controlGroup} ${styles[groupClassName]}`}>
            <button
                className={`${styles.controlButton} ${size === 'small' ? styles.smallControlButton : ''} ${label ? styles.labelControlButton : ''}`}
                aria-label={title}
                onClick={(event) => {
                    event.stopPropagation();
                    onClick();
                }}
                title={title}
                type='button'
            >
                {children}
                {label && <span className={styles.controlLabel}>{label}</span>}
            </button>
        </div>
    );
}
