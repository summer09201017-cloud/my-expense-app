import { useEffect, useState } from 'react';

const STORAGE_KEY = 'accent_color';
const DEFAULT = 'blue';
export const CUSTOM_ACCENT_PREFIX = 'custom:';

export const ACCENT_COLORS = [
    { key: 'blue', label: '藍莓藍', primary: '59, 130, 246', secondary: '139, 92, 246' },
    { key: 'purple', label: '紫藤紫', primary: '139, 92, 246', secondary: '236, 72, 153' },
    { key: 'rose', label: '玫瑰粉', primary: '236, 72, 153', secondary: '244, 63, 94' },
    { key: 'coral', label: '珊瑚紅', primary: '239, 68, 68', secondary: '249, 115, 22' },
    { key: 'orange', label: '暖橘橙', primary: '249, 115, 22', secondary: '245, 158, 11' },
    { key: 'amber', label: '金黃黃', primary: '245, 158, 11', secondary: '234, 179, 8' },
    { key: 'green', label: '森林綠', primary: '16, 185, 129', secondary: '20, 184, 166' },
    { key: 'mint', label: '薄荷綠', primary: '52, 211, 153', secondary: '45, 212, 191' },
    { key: 'teal', label: '湖水青', primary: '6, 182, 212', secondary: '59, 130, 246' },
    { key: 'cyan', label: '極光青', primary: '14, 165, 233', secondary: '6, 182, 212' },
    { key: 'indigo', label: '靛藍紫', primary: '99, 102, 241', secondary: '139, 92, 246' },
    { key: 'space', label: '深空藍', primary: '30, 41, 115', secondary: '79, 70, 229' },
];

const clampChannel = (value) => Math.min(255, Math.max(0, Number(value)));

export const rgbTupleToHex = (tuple) => {
    return `#${tuple
        .split(',')
        .map((part) => clampChannel(part.trim()).toString(16).padStart(2, '0'))
        .join('')}`.toUpperCase();
};

export const normalizeHex = (value) => {
    const raw = String(value || '').trim();
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
    return hex.toUpperCase();
};

export const hexToRgbTuple = (value) => {
    const hex = normalizeHex(value);
    if (!hex) return null;
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ].join(', ');
};

const shiftTuple = (tuple, amount) => {
    return tuple
        .split(',')
        .map((part) => clampChannel(Number(part.trim()) + amount))
        .join(', ');
};

export const toCustomAccentValue = (hex) => {
    const normalized = normalizeHex(hex);
    return normalized ? `${CUSTOM_ACCENT_PREFIX}${normalized}` : null;
};

export const getCustomHex = (value) => {
    if (!String(value).startsWith(CUSTOM_ACCENT_PREFIX)) return '';
    return normalizeHex(String(value).slice(CUSTOM_ACCENT_PREFIX.length)) || '';
};

export const getAccentConfig = (value) => {
    const customHex = getCustomHex(value);
    if (customHex) {
        const primary = hexToRgbTuple(customHex);
        return {
            key: value,
            label: '自訂色碼',
            primary,
            secondary: shiftTuple(primary, 42),
            hover: shiftTuple(primary, -28),
            hex: customHex,
            isCustom: true,
        };
    }

    const accent = ACCENT_COLORS.find((item) => item.key === value) || ACCENT_COLORS[0];
    return {
        ...accent,
        hover: accent.hover || shiftTuple(accent.primary, -28),
        hex: rgbTupleToHex(accent.primary),
        isCustom: false,
    };
};

const getInitial = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.startsWith(CUSTOM_ACCENT_PREFIX) && getCustomHex(stored)) return stored;
    if (stored && ACCENT_COLORS.some((accent) => accent.key === stored)) return stored;
    return DEFAULT;
};

const apply = (value) => {
    const accent = getAccentConfig(value);
    const root = document.documentElement;
    const primary = `rgb(${accent.primary})`;
    const secondary = `rgb(${accent.secondary})`;
    const hover = `rgb(${accent.hover})`;

    root.style.setProperty('--accent-color', primary);
    root.style.setProperty('--accent-secondary', secondary);
    root.style.setProperty('--accent-rgb', accent.primary);
    root.style.setProperty('--accent-secondary-rgb', accent.secondary);
    root.style.setProperty('--primary-hover', hover);
    root.style.setProperty('--primary-hover-rgb', accent.hover);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`);
    root.style.setProperty('--focus-ring', `0 0 0 3px rgba(${accent.primary}, 0.3)`);
    root.style.setProperty('--bg-glow-1', `rgba(${accent.primary}, 0.15)`);
    root.style.setProperty('--bg-glow-2', `rgba(${accent.secondary}, 0.15)`);
    root.dataset.accent = accent.isCustom ? 'custom' : accent.key;
};

export const useAccentColor = () => {
    const [accent, setAccent] = useState(getInitial);

    useEffect(() => {
        apply(accent);
        localStorage.setItem(STORAGE_KEY, accent);
    }, [accent]);

    return { accent, setAccent };
};
