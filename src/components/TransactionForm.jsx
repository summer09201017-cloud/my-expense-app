import { useState } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import './TransactionForm.css';

export function TransactionForm({ onAdd }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) {
            alert('請輸入有效的金額');
            return;
        }

        if (!category.trim()) {
            alert('請輸入分類');
            return;
        }

        onAdd({ type, amount, category, date, note });

        // 重設表單
        setAmount('');
        setCategory('');
        setNote('');
    };

    return (
        <form className="transaction-form glass-panel animate-slide-up" onSubmit={handleSubmit}>
            <div className="type-toggle">
                <button
                    type="button"
                    className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                    onClick={() => setType('expense')}
                >
                    <MinusCircle size={18} />
                    支出
                </button>
                <button
                    type="button"
                    className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
                    onClick={() => setType('income')}
                >
                    <PlusCircle size={18} />
                    收入
                </button>
            </div>

            <div className="form-group amount-group">
                <span className="currency-symbol">$</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="amount-input"
                    inputMode="decimal"
                />
            </div>

            <div className="form-row">
                <div className="form-group flex-1">
                    <label>分類</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="例如：餐飲、交通"
                        className="std-input"
                    />
                </div>

                <div className="form-group flex-1">
                    <label>日期</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="std-input"
                    />
                </div>
            </div>

            <div className="form-group">
                <label>備註 (選填)</label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="輸入備註..."
                    className="std-input"
                />
            </div>

            <button type="submit" className="submit-btn">
                新增紀錄
            </button>
        </form>
    );
}
