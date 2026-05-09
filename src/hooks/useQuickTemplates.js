import { useEffect, useState } from 'react';

const STORAGE_KEY = 'quick_templates';

const DEFAULT_TEMPLATES = [
    { id: 'default-breakfast', type: 'expense', amount: 60, category: '🍽️ 餐飲', note: '早餐' },
    { id: 'default-lunch', type: 'expense', amount: 120, category: '🍽️ 餐飲', note: '午餐' },
    { id: 'default-mrt', type: 'expense', amount: 30, category: '🚌 交通', note: '捷運' },
    { id: 'default-coffee', type: 'expense', amount: 75, category: '🍽️ 餐飲', note: '咖啡' },
];

const getInitial = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_TEMPLATES;
    try {
        return JSON.parse(saved) || [];
    } catch (error) {
        console.error('Failed to parse quick templates from local storage', error);
        return DEFAULT_TEMPLATES;
    }
};

export const useQuickTemplates = () => {
    const [templates, setTemplates] = useState(getInitial);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }, [templates]);

    const addTemplate = ({ type, amount, category, note }) => {
        const value = Number(amount);
        if (!category || !Number.isFinite(value) || value <= 0) return false;
        const template = {
            id: crypto.randomUUID(),
            type,
            amount: value,
            category,
            note: note?.trim() || category.replace(/^\S+\s*/, ''),
        };
        setTemplates((prev) => [template, ...prev].slice(0, 12));
        return true;
    };

    const deleteTemplate = (id) => {
        setTemplates((prev) => prev.filter((template) => template.id !== id));
    };

    return { templates, addTemplate, deleteTemplate };
};
