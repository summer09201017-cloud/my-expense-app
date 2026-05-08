import { useEffect, useState } from 'react';

const STORAGE_KEY = 'monthly_budget';

const getInitial = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const n = saved ? Number(saved) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const useBudget = () => {
    const [budget, setBudget] = useState(getInitial);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(budget));
    }, [budget]);

    return { budget, setBudget };
};
