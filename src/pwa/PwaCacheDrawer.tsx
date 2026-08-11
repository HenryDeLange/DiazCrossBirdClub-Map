import { DatabaseZap, HardDrive, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapDrawer } from '../map/components/MapDrawer';
import { clearAppCaches, getAppStorageInfo, type AppStorageInfo } from './clearAppCaches';

type PwaCacheDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    height: number;
    onHeightChange: (height: number) => void;
}

type CacheDrawerStatus = 'idle' | 'clearing' | 'success' | 'error';
type StorageInfoStatus = 'idle' | 'ready' | 'error';

export function PwaCacheDrawer({ isOpen, onClose, height, onHeightChange }: Readonly<PwaCacheDrawerProps>) {
    const [status, setStatus] = useState<CacheDrawerStatus>('idle');
    const [message, setMessage] = useState('');
    const [storageInfo, setStorageInfo] = useState<AppStorageInfo | null>(null);
    const [storageInfoStatus, setStorageInfoStatus] = useState<StorageInfoStatus>('idle');

    useEffect(() => {
        if (!isOpen || status === 'clearing') {
            return;
        }

        let isCancelled = false;

        getAppStorageInfo()
            .then((info) => {
                if (!isCancelled) {
                    setStorageInfo(info);
                    setStorageInfoStatus('ready');
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setStorageInfoStatus('error');
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [isOpen, status]);

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
        setStorageInfo(null);
        setStorageInfoStatus('idle');
    };

    const resetAndClose = () => {
        reset();
        onClose();
    };

    const handleClear = async () => {
        setStatus('clearing');
        setMessage('Clearing cached app files and saved map settings...');

        try {
            const result = await clearAppCaches();
            setStatus('success');
            const clearedSomething = result.deletedCacheCount > 0 || result.clearedLocalStorageEntries > 0;
            setMessage(clearedSomething
                ? `${result.deletedCacheCount} web request cache${result.deletedCacheCount === 1 ? '' : 's'} and ${result.clearedLocalStorageEntries} saved setting${result.clearedLocalStorageEntries === 1 ? '' : 's'} cleared. Reloading...`
                : 'No cached files or saved settings needed clearing. Reloading...');
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
            title={<span className='drawer-title-with-icon'><DatabaseZap className='drawer-title-icon' aria-hidden='true' /><span>App cache</span></span>}
            headerAction={(status === 'idle' || status === 'error') && <button type='button' className='drawer-header-action pwa-cache-clear' onClick={() => void handleClear()} aria-label='Clear app cache' title='Clear app cache'><Trash2 aria-hidden='true' /><span>Clear</span></button>}
            height={height}
            onHeightChange={onHeightChange}
        >
            <div className='drawer-content pwa-cache-content'>
                <p className='drawer-panel-subtitle'>This app stores offline files, map tiles, tide data, photos, and API responses. Clearing the app cache also removes saved map settings.</p>
                <section className='pwa-cache-overview' aria-labelledby='pwa-storage-title'>
                    <div className='pwa-cache-overview-heading'>
                        <div className='pwa-cache-overview-title'><HardDrive aria-hidden='true' /><h2 id='pwa-storage-title'>Storage in use</h2></div>
                    </div>
                    {storageInfoStatus === 'idle' && !storageInfo && <p className='pwa-cache-info-message' role='status'>Reading storage details...</p>}
                    {storageInfoStatus === 'error' && <p className='pwa-cache-info-message' role='alert'>Storage details are unavailable in this browser.</p>}
                    {storageInfo && (
                        <div className='pwa-cache-info-sections'>
                            <div className='pwa-cache-info-section'>
                                <h3>Web request caches</h3>
                                {storageInfo.cacheBuckets.length > 0 ? <ul>{storageInfo.cacheBuckets.map((bucket) => <li key={bucket.name}><code>{bucket.name}</code><span>{bucket.entries} entr{bucket.entries === 1 ? 'y' : 'ies'} · {formatBytes(bucket.bytes)}</span></li>)}</ul> : <p>None found.</p>}
                            </div>
                            <div className='pwa-cache-info-section'>
                                <h3>Local settings storage</h3>
                                <StorageEntryList entries={storageInfo.localStorage.entries} />
                            </div>
                        </div>
                    )}
                </section>
                {message && <p className='pwa-cache-message' role={status === 'error' ? 'alert' : 'status'} aria-live='polite'>{message}</p>}
                {status === 'clearing' && <p className='pwa-cache-message' role='status' aria-live='polite'>Clearing app cache...</p>}
                {status === 'success' && <p className='pwa-cache-message pwa-cache-message-success' role='status' aria-live='polite'>Reloading the map...</p>}
            </div>
        </MapDrawer>
    );
}

function StorageEntryList({ entries }: Readonly<{ entries: AppStorageInfo['localStorage']['entries'] }>) {
    if (entries.length === 0) {
        return <p>None found.</p>;
    }

    return <ul>{entries.map((entry) => <li key={entry.key}><code>{entry.key}</code><span>{formatBytes(entry.bytes)}</span></li>)}</ul>;
}

function formatBytes(bytes: number | null): string {
    if (bytes === null) {
        return 'Size unavailable';
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}