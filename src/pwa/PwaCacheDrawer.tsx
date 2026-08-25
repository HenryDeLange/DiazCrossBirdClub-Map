import { DatabaseZap, HardDrive, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MapDrawer } from '../map/components/MapDrawer';
import drawerStyles from '../map/components/MapDrawer.module.css';
import { clearAppCaches, getAppStorageInfo, type AppStorageInfo } from './clearAppCaches';
import styles from './PwaCacheDrawer.module.css';

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
    const reloadTimeoutRef = useRef<number | null>(null);
    const isOpenRef = useRef(isOpen);

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
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
    }, [isOpen]);

    useEffect(() => () => {
        if (reloadTimeoutRef.current !== null) {
            window.clearTimeout(reloadTimeoutRef.current);
        }
    }, []);

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
            if (!isOpenRef.current) {
                return;
            }

            setStatus('success');
            const clearedSomething = result.deletedCacheCount > 0 || result.clearedLocalStorageEntries > 0;
            setMessage(clearedSomething
                ? `${result.deletedCacheCount} web request cache${result.deletedCacheCount === 1 ? '' : 's'} and ${result.clearedLocalStorageEntries} saved setting${result.clearedLocalStorageEntries === 1 ? '' : 's'} cleared. Reloading...`
                : 'No cached files or saved settings needed clearing. Reloading...');
            reloadTimeoutRef.current = window.setTimeout(() => window.location.reload(), 900);
        }
        catch (error: unknown) {
            if (!isOpenRef.current) {
                return;
            }

            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Could not clear the app cache.');
        }
    };

    return (
        <MapDrawer
            isOpen={isOpen}
            onClose={resetAndClose}
            label='App storage'
            title={<span className={drawerStyles.titleWithIcon}><DatabaseZap className={drawerStyles.titleIcon} aria-hidden='true' /><span>App cache</span></span>}
            headerAction={(status === 'idle' || status === 'error') && <button type='button' className={`drawer-header-action ${styles.clear}`} onClick={() => void handleClear()} aria-label='Clear app cache' title='Clear app cache'><Trash2 aria-hidden='true' /><span>Clear</span></button>}
            height={height}
            onHeightChange={onHeightChange}
        >
            <div className={`${drawerStyles.content} ${styles.content}`}>
                <p className={drawerStyles.panelSubtitle}>This app stores offline files, map tiles, tide data, photos, and API responses. Clearing the app cache also removes saved map settings.</p>
                <section className={styles.overview} aria-labelledby='pwa-storage-title'>
                    <div className={styles.overviewHeading}>
                        <div className={styles.overviewTitle}><HardDrive aria-hidden='true' /><h2 id='pwa-storage-title'>Storage in use</h2></div>
                    </div>
                    {storageInfo && storageInfo.estimatedUsageBytes !== null && <p className={styles.infoMessage}>Browser storage estimate: {formatBytes(storageInfo.estimatedUsageBytes)} total for this site.</p>}
                    {storageInfoStatus === 'idle' && !storageInfo && <p className={styles.infoMessage} role='status'>Reading storage details...</p>}
                    {storageInfoStatus === 'error' && <p className={styles.infoMessage} role='alert'>Storage details are unavailable in this browser.</p>}
                    {storageInfo && (
                        <div className={styles.infoSections}>
                            <div className={styles.infoSection}>
                                <h3>Web request caches</h3>
                                {storageInfo.cacheBuckets.length > 0 ? <ul>{storageInfo.cacheBuckets.map((bucket) => <li key={bucket.name}><code>{bucket.name}</code><span>{bucket.entries} entr{bucket.entries === 1 ? 'y' : 'ies'} · {formatCacheSize(bucket)}</span></li>)}</ul> : <p>None found.</p>}
                            </div>
                            <div className={styles.infoSection}>
                                <h3>Locally stored settings</h3>
                                <StorageEntryList entries={storageInfo.localStorage.entries} />
                            </div>
                        </div>
                    )}
                </section>
                {message && <p className={`${styles.message} ${status === 'success' ? styles.messageSuccess : ''}`} role={status === 'error' ? 'alert' : 'status'} aria-live='polite'>{message}</p>}
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

function formatCacheSize(bucket: AppStorageInfo['cacheBuckets'][number]): string {
    if (bucket.unknownEntries === 0) {
        return formatBytes(bucket.bytes);
    }

    if (bucket.bytes === 0) {
        return 'Size unavailable';
    }

    return `${formatBytes(bucket.bytes)} + ${bucket.unknownEntries} unavailable`;
}

function formatBytes(bytes: number): string {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}