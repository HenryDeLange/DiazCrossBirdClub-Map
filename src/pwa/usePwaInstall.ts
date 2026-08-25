import { useCallback, useEffect, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PwaInstallState = {
    canInstall: boolean;
    isInstalled: boolean;
    install: () => Promise<boolean>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function usePwaInstall(): PwaInstallState {
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const isMountedRef = useRef(false);
    const isPromptingRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        const updateInstalledState = () => {
            setIsInstalled(isAppInstalled());
        };

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            const installEvent = event as BeforeInstallPromptEvent;
            deferredInstallPrompt = installEvent;
            if (!isAppInstalled()) {
                setCanInstall(true);
            }
        };
        const handleAppInstalled = () => {
            deferredInstallPrompt = null;
            setCanInstall(false);
            setIsInstalled(true);
        };

        updateInstalledState();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            isMountedRef.current = false;
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const install = useCallback(async (): Promise<boolean> => {
        if (!deferredInstallPrompt || isInstalled || isPromptingRef.current) {
            return false;
        }

        const installEvent = deferredInstallPrompt;
        isPromptingRef.current = true;

        try {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            if (choice.outcome === 'accepted' && isMountedRef.current) {
                setIsInstalled(true);
            }
            return choice.outcome === 'accepted';
        }
        catch {
            return false;
        }
        finally {
            deferredInstallPrompt = null;
            isPromptingRef.current = false;
            if (isMountedRef.current) {
                setCanInstall(false);
            }
        }
    }, [isInstalled]);

    return { canInstall: canInstall && !isInstalled, isInstalled, install };
}

function isAppInstalled(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches
        || standaloneNavigator.standalone === true
        || document.referrer.startsWith('android-app://');
}