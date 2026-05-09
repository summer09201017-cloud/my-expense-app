import { useEffect, useState } from 'react';

const STORAGE_KEY = 'recurring_transactions';

const getInitial = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
        return JSON.parse(saved) || [];
    } catch (error) {
        console.error('Failed to parse recurring transactions from local storage', error);
        return [];
    }
};

export const useRecurringTransactions = () => {
    const [recurringRules, setRecurringRules] = useState(getInitial);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringRules));
    }, [recurringRules]);

    const addRecurringRule = ({ type, amount, category, note, dayOfMonth }) => {
        const value = Number(amount);
        const day = Math.min(Math.max(Number(dayOfMonth) || 1, 1), 31);
        if (!category || !Number.isFinite(value) || value <= 0) return false;
        setRecurringRules((prev) => [
            {
                id: crypto.randomUUID(),
                type,
                amount: value,
                category,
                note: note?.trim() || '',
                dayOfMonth: day,
                enabled: true,
                lastPostedMonth: '',
            },
            ...prev,
        ]);
        return true;
    };

    const updateRecurringRule = (id, patch) => {
        setRecurringRules((prev) => prev.map((rule) => (
            rule.id === id ? { ...rule, ...patch } : rule
        )));
    };

    const deleteRecurringRule = (id) => {
        setRecurringRules((prev) => prev.filter((rule) => rule.id !== id));
    };

    const markRecurringPosted = (id, month) => {
        updateRecurringRule(id, { lastPostedMonth: month });
    };

    return {
        recurringRules,
        addRecurringRule,
        updateRecurringRule,
        deleteRecurringRule,
        markRecurringPosted,
    };
};
