import { useCallback, useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const useVersionUpdate = () => {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [updateSW, setUpdateSW] = useState(null);

    useEffect(() => {
        const updater = registerSW({
            immediate: true,
            onNeedRefresh() {
                setNeedRefresh(true);
            },
            onOfflineReady() {
                setOfflineReady(true);
            },
            onRegisterError(error) {
                console.error('Service worker registration failed', error);
            },
        });

        setUpdateSW(() => updater);
    }, []);

    const applyUpdate = useCallback(() => {
        updateSW?.(true);
    }, [updateSW]);

    return {
        needRefresh,
        offlineReady,
        applyUpdate,
        dismissUpdate: () => setNeedRefresh(false),
        dismissOfflineReady: () => setOfflineReady(false),
    };
};
