import { useEffect, useState } from 'react';

const isStandaloneMode = () => {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
};

export const usePwaInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(isStandaloneMode);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };
        const handleInstalled = () => {
            setDeferredPrompt(null);
            setIsStandalone(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);

        const media = window.matchMedia?.('(display-mode: standalone)');
        const handleDisplayModeChange = () => setIsStandalone(isStandaloneMode());
        media?.addEventListener?.('change', handleDisplayModeChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
            media?.removeEventListener?.('change', handleDisplayModeChange);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return false;
        await deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (result.outcome === 'accepted') setIsStandalone(true);
        return result.outcome === 'accepted';
    };

    return {
        canInstall: Boolean(deferredPrompt),
        isStandalone,
        install,
    };
};
