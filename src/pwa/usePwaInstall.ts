import { useEffect, useState } from 'react';

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

    useEffect(() => {
        const updateInstalledState = () => {
            setIsInstalled(isAppInstalled());
        };

        const handleBeforeInstallPrompt = (event: Event) => {
            const installEvent = event as BeforeInstallPromptEvent;
            deferredInstallPrompt = installEvent;
            setCanInstall(!isAppInstalled());
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
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const install = async (): Promise<boolean> => {
        if (!deferredInstallPrompt || isInstalled) {
            return false;
        }

        const installEvent = deferredInstallPrompt;
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        deferredInstallPrompt = null;
        setCanInstall(false);
        return choice.outcome === 'accepted';
    };

    return { canInstall: canInstall && !isInstalled, isInstalled, install };
}

function isAppInstalled(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches
        || standaloneNavigator.standalone === true
        || document.referrer.startsWith('android-app://');
}