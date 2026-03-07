import { useState, useEffect } from 'react';

const DEFAULT_CATEGORIES = {
    expense: ['🍽️ 餐飲', '🚌 交通', '🛍️ 購物', '🍿 娛樂', '🏠 居住', '🏥 醫療', '📚 教育', '📦 其他'],
    income: ['💰 薪資', '🎁 獎金', '📈 投資', '💵 零用錢', '💻 副業', '✨ 其他']
};

const getInitialCategories = () => {
    const saved = localStorage.getItem('categories');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse categories from local storage', e);
            return DEFAULT_CATEGORIES;
        }
    }
    return DEFAULT_CATEGORIES;
};

export const useCategories = () => {
    const [categories, setCategories] = useState(getInitialCategories);

    useEffect(() => {
        localStorage.setItem('categories', JSON.stringify(categories));
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
