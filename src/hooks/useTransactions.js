import { useState, useEffect } from 'react';

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
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    // 計算結餘
    const summary = transactions.reduce(
        (acc, curr) => {
            if (curr.type === 'income') {
                acc.income += curr.amount;
                acc.balance += curr.amount;
            } else {
                acc.expense += curr.amount;
                acc.balance -= curr.amount;
            }
            return acc;
        },
        { income: 0, expense: 0, balance: 0 }
    );

    return {
        transactions,
        addTransaction,
        deleteTransaction,
        summary
    };
};
