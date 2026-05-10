import { useState, useEffect } from 'react';
import { toLocalMonthString } from '../utils/date';

// 預設產生一筆展示資料，或者回傳空陣列
const getInitialTransactions = () => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse transactions from local storage', e);
            return [];
        }
    }
    return [];
};

export const useTransactions = () => {
    const [transactions, setTransactions] = useState(getInitialTransactions);

    // 當 transactions 改變時，自動儲存至 LocalStorage
    useEffect(() => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    // 新增交易
    const addTransaction = ({ type, amount, category, date, note }) => {
        const newTransaction = {
            id: crypto.randomUUID(), // 使用內建的 randomUUID 產生確保唯一性
            type, // 'income' | 'expense'
            amount: Number(amount),
            category,
            date,
            note,
            createdAt: new Date().toISOString()
        };

        // 將新交易加到列表最前面
        setTransactions(prev => [newTransaction, ...prev]);
    };

    // 刪除交易
    const deleteTransaction = (id) => {
        const deleted = transactions.find(t => t.id === id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        return deleted || null;
    };

    // 更新交易
    const updateTransaction = (id, updatedData) => {
        const previous = transactions.find(t => t.id === id) || null;
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, ...updatedData } : t
        ));
        return previous;
    };

    // 從雲端還原（覆蓋）所有交易
    const restoreTransactions = (data) => {
        if (Array.isArray(data)) {
            setTransactions(data);
        }
    };

    // 合併匯入：依 id 去重；無 id 視為新資料
    const mergeTransactions = (data) => {
        if (!Array.isArray(data)) return 0;
        let added = 0;
        setTransactions(prev => {
            const seen = new Set(prev.map(t => t.id));
            const incoming = data.filter(t => {
                if (!t || typeof t !== 'object') return false;
                if (t.id && seen.has(t.id)) return false;
                if (t.id) seen.add(t.id);
                return true;
            });
            added = incoming.length;
            const merged = [...incoming, ...prev];
            return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
        });
        return added;
    };

    // 計算結餘：balance 為全部歷史總和；income/expense 僅本月
    const currentMonth = toLocalMonthString(); // YYYY-MM
    const summary = transactions.reduce(
        (acc, curr) => {
            const isCurrentMonth = curr.date && curr.date.startsWith(currentMonth);
            if (curr.type === 'income') {
                acc.balance += curr.amount;
                if (isCurrentMonth) acc.income += curr.amount;
            } else {
                acc.balance -= curr.amount;
                if (isCurrentMonth) acc.expense += curr.amount;
            }
            return acc;
        },
        { income: 0, expense: 0, balance: 0 }
    );

    return {
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        restoreTransactions,
        mergeTransactions,
        summary
    };
};
