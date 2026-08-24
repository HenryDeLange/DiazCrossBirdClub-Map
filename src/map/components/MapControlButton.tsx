import type { ReactNode } from 'react';
import styles from './MapControlButton.module.css';

type MapControlButtonProps = {
    groupClassName: 'locationsGroup' | 'inatGroup' | 'astraGroup' | 'installGroup' | 'tidesGroup';
    title: string;
    onClick: () => void;
    children: ReactNode;
}

export function MapControlButton({ groupClassName, title, onClick, children }: Readonly<MapControlButtonProps>) {
    return (
        <div className={`${styles.controlGroup} ${styles[groupClassName]}`}>
            <button
                className={styles.controlButton}
                aria-label={title}
                onClick={(event) => {
                    event.stopPropagation();
                    onClick();
                }}
                title={title}
                type='button'
            >
                {children}
            </button>
        </div>
    );
}
