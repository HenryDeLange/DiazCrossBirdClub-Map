import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapDrawer } from '../map/components/MapDrawer';
import { clearAppCaches } from './clearAppCaches';

type PwaCacheDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    height: number;
    onHeightChange: (height: number) => void;
}

type CacheDrawerStatus = 'idle' | 'clearing' | 'success' | 'error';

export function PwaCacheDrawer({ isOpen, onClose, height, onHeightChange }: Readonly<PwaCacheDrawerProps>) {
    const [status, setStatus] = useState<CacheDrawerStatus>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isOpen || status === 'clearing') {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setStatus('idle');
                setMessage('');
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, status]);

    const reset = () => {
        setStatus('idle');
        setMessage('');
    };

    const resetAndClose = () => {
        reset();
        onClose();
    };

    const handleClear = async () => {
        setStatus('clearing');
        setMessage('Removing cached map tiles, photos, API responses, and the app shell...');

        try {
            const deletedCacheCount = await clearAppCaches();
            setStatus('success');
            setMessage(deletedCacheCount > 0
                ? `${deletedCacheCount} app cache${deletedCacheCount === 1 ? '' : 's'} cleared. Reloading...`
                : 'The app cache was already clear. Reloading...');
            window.setTimeout(() => window.location.reload(), 900);
        }
        catch (error: unknown) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Could not clear the app cache.');
        }
    };

    return (
        <MapDrawer
            isOpen={isOpen}
            onClose={resetAndClose}
            label='App storage'
            title={<span className='drawer-title-with-icon'><Trash2 className='drawer-title-icon' aria-hidden='true' /><span>Clear app cache</span></span>}
            height={height}
            onHeightChange={onHeightChange}
        >
            <div className='drawer-content pwa-cache-content'>
                <p className='drawer-panel-subtitle'>Remove cached map tiles, iNaturalist photos, API responses, and the offline app shell. Your map position and layer choices will stay.</p>
                {message && <p className='pwa-cache-message' role={status === 'error' ? 'alert' : 'status'} aria-live='polite'>{message}</p>}
                {status === 'idle' && (
                    <div className='pwa-cache-actions'>
                        <button type='button' className='pwa-cache-action pwa-cache-action-primary' onClick={() => void handleClear()}>Clear</button>
                    </div>
                )}
                {status === 'clearing' && <p className='pwa-cache-message' role='status' aria-live='polite'>Clearing app storage...</p>}
                {status === 'success' && <p className='pwa-cache-message pwa-cache-message-success' role='status' aria-live='polite'>Reloading the map...</p>}
                {status === 'error' && (
                    <div className='pwa-cache-actions'>
                        <button type='button' className='pwa-cache-action pwa-cache-action-primary' onClick={() => void handleClear()}>try again</button>
                    </div>
                )}
            </div>
        </MapDrawer>
    );
}