import { useEffect, useState } from 'react';

const STORAGE_KEY = 'category_budgets';

const getInitial = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    try {
        return JSON.parse(saved) || {};
    } catch (error) {
        console.error('Failed to parse category budgets from local storage', error);
        return {};
    }
};

export const useCategoryBudgets = () => {
    const [categoryBudgets, setCategoryBudgets] = useState(getInitial);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categoryBudgets));
    }, [categoryBudgets]);

    const setCategoryBudget = (category, amount) => {
        const value = Number(amount);
        setCategoryBudgets((prev) => {
            const next = { ...prev };
            if (!Number.isFinite(value) || value <= 0) delete next[category];
            else next[category] = value;
            return next;
        });
    };

    return { categoryBudgets, setCategoryBudget };
};
