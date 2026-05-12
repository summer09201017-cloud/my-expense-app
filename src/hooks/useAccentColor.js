import { useEffect, useState } from 'react';

const STORAGE_KEY = 'accent_color';
const DEFAULT = 'blue';

// 每個主題色提供 primary / secondary 兩個 RGB tuple，主畫面所有需要 accent 的地方
// （focus ring、漸層按鈕、背景光暈、color-mix tint）都透過 CSS 變數讀取
export const ACCENT_COLORS = [
    { key: 'blue', label: '海洋藍', primary: '59, 130, 246', secondary: '139, 92, 246' },
    { key: 'purple', label: '魅力紫', primary: '139, 92, 246', secondary: '236, 72, 153' },
    { key: 'pink', label: '櫻花粉', primary: '236, 72, 153', secondary: '244, 63, 94' },
    { key: 'red', label: '熱情紅', primary: '239, 68, 68', secondary: '249, 115, 22' },
    { key: 'orange', label: '陽光橘', primary: '249, 115, 22', secondary: '245, 158, 11' },
    { key: 'green', label: '森林綠', primary: '16, 185, 129', secondary: '20, 184, 166' },
    { key: 'teal', label: '清新青', primary: '6, 182, 212', secondary: '59, 130, 246' },
    { key: 'indigo', label: '深邃靛', primary: '99, 102, 241', secondary: '139, 92, 246' },
];

const getInitial = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ACCENT_COLORS.some((c) => c.key === stored)) return stored;
    return DEFAULT;
};

const apply = (key) => {
    const accent = ACCENT_COLORS.find((c) => c.key === key) || ACCENT_COLORS[0];
    const root = document.documentElement;
    const primary = `rgb(${accent.primary})`;
    const secondary = `rgb(${accent.secondary})`;
    root.style.setProperty('--accent-color', primary);
    root.style.setProperty('--accent-secondary', secondary);
    root.style.setProperty('--accent-rgb', accent.primary);
    root.style.setProperty('--accent-secondary-rgb', accent.secondary);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
    root.style.setProperty('--focus-ring', `0 0 0 3px rgba(${accent.primary}, 0.3)`);
    root.style.setProperty('--bg-glow-1', `rgba(${accent.primary}, 0.15)`);
    root.style.setProperty('--bg-glow-2', `rgba(${accent.secondary}, 0.15)`);
    root.dataset.accent = accent.key;
};

export const useAccentColor = () => {
    const [accent, setAccent] = useState(getInitial);

    useEffect(() => {
        apply(accent);
        localStorage.setItem(STORAGE_KEY, accent);
    }, [accent]);

    return { accent, setAccent };
};
