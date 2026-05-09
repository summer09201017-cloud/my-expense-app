import { useState, useEffect } from 'react';
import { V4_EXPENSE, V4_INCOME } from '../utils/migrations';

// 預設分類即 V4 列表（20 支出 + 10 收入）。版本升級與字串遷移由 src/utils/migrations.js
// 在開機時集中處理，這裡只負責讀寫 localStorage。
const DEFAULT_CATEGORIES = {
    expense: V4_EXPENSE.slice(),
    income: V4_INCOME.slice(),
};

const STORAGE_KEY = 'categories';

const getInitialCategories = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_CATEGORIES;
    try {
        const parsed = JSON.parse(saved);
        return {
            expense: Array.isArray(parsed?.expense) ? parsed.expense : DEFAULT_CATEGORIES.expense.slice(),
            income: Array.isArray(parsed?.income) ? parsed.income : DEFAULT_CATEGORIES.income.slice(),
        };
    } catch (e) {
        console.error('Failed to parse categories from local storage', e);
        return DEFAULT_CATEGORIES;
    }
};

export const useCategories = () => {
    const [categories, setCategories] = useState(getInitialCategories);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    }, [categories]);

    const addCategory = (type, newCategory) => {
        if (!newCategory.trim()) return false;

        // Check if category already exists
        if (categories[type].includes(newCategory.trim())) {
            return false;
        }

        setCategories(prev => ({
            ...prev,
            [type]: [...prev[type], newCategory.trim()]
        }));
        return true;
    };

    const deleteCategory = (type, categoryToDelete) => {
        setCategories(prev => ({
            ...prev,
            [type]: prev[type].filter(cat => cat !== categoryToDelete)
        }));
    };

    return {
        categories,
        addCategory,
        deleteCategory
    };
};
