import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type MapDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    label?: string;
    title: string;
    height: number;
    maxHeight?: string;
    children: ReactNode;
}

export function MapDrawer({
    isOpen,
    onClose,
    label,
    title,
    height,
    maxHeight = 'calc(100dvh - 1rem)',
    children
}: Readonly<MapDrawerProps>) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className='drawer-backdrop drawer-backdrop-open' onClick={onClose}>
            <div
                className='drawer-panel drawer-open'
                onClick={(event) => event.stopPropagation()}
                style={{ height, maxHeight }}
            >
                <div className='drawer-header'>
                    <div>
                        {label && <div className='drawer-label'>{label}</div>}
                        <div className='drawer-title'>{title}</div>
                    </div>
                    <button type='button' className='drawer-close drawer-close-large' onClick={onClose} aria-label='Close drawer'>
                        <X className='drawer-close-icon' />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
