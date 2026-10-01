import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

let updateAvailable = false;
let updateSW: ReturnType<typeof registerSW> | undefined;
const listeners = new Set<() => void>();

export function registerPwaServiceWorker(): void {
    updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
            updateAvailable = true;
            listeners.forEach((listener) => listener());
        }
    });
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getUpdateAvailable(): boolean {
    return updateAvailable;
}

export function usePwaUpdate() {
    const isUpdateAvailable = useSyncExternalStore(subscribe, getUpdateAvailable, getUpdateAvailable);

    return {
        isUpdateAvailable,
        reloadWithUpdate: () => updateSW?.()
    };
}