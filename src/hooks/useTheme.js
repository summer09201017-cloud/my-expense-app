import { useEffect, useState } from 'react';

// 'light' | 'dark' | 'system'
const STORAGE_KEY = 'theme';

const getInitial = () => {
    return localStorage.getItem(STORAGE_KEY) || 'system';
};

const apply = (theme) => {
    const root = document.documentElement;
    if (theme === 'system') {
        delete root.dataset.theme;
    } else {
        root.dataset.theme = theme;
    }
};

export const useTheme = () => {
    const [theme, setTheme] = useState(getInitial);

    useEffect(() => {
        apply(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const cycleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light');
    };

    return { theme, setTheme, cycleTheme };
};
