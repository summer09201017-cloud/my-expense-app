import { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, X, Repeat, Check } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import './TransactionForm.css';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export function TransactionForm({ onAdd, editingTransaction, prefillTransaction, onUpdate, onCancelEdit, onConsumePrefill }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [continuousMode, setContinuousMode] = useState(() => localStorage.getItem('continuous_mode') === '1');
    const [justSaved, setJustSaved] = useState(false);

    const { categories, addCategory, deleteCategory } = useCategories();
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        localStorage.setItem('continuous_mode', continuousMode ? '1' : '0');
    }, [continuousMode]);

    // 當傳入 editingTransaction 時，將表單內容設為該筆紀錄
    useEffect(() => {
        if (editingTransaction) {
            setType(editingTransaction.type);
            setAmount(editingTransaction.amount);
            setCategory(editingTransaction.category);
            setDate(editingTransaction.date);
            setNote(editingTransaction.note || '');
        } else {
            // 重設回預設
            setType('expense');
            setAmount('');
            setCategory('');
            setDate(new Date().toISOString().split('T')[0]);
            setNote('');
        }
    }, [editingTransaction]);

    // 處理「複製此筆」prefill：載入但不進入編輯狀態
    useEffect(() => {
        if (prefillTransaction) {
            setType(prefillTransaction.type);
            setAmount(prefillTransaction.amount);
            setCategory(prefillTransaction.category);
            setDate(prefillTransaction.date);
            setNote(prefillTransaction.note || '');
        }
    }, [prefillTransaction]);

    // 當切換收支類型時，如果目前選擇的類別不在新類型的列表中，則清空選擇
    useEffect(() => {
        if (category && !categories[type].includes(category)) {
            setCategory('');
        }
    }, [type, categories, category]);

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            const success = addCategory(type, newCategoryName);
            if (success) {
                setCategory(newCategoryName.trim());
            } else {
                alert('此分類已存在或名稱無效！');
            }
        }
        setIsAddingCategory(false);
        setNewCategoryName('');
    };

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

        if (editingTransaction) {
            onUpdate(editingTransaction.id, { type, amount: Number(amount), category, date, note });
            onCancelEdit();
        } else {
            onAdd({ type, amount: Number(amount), category, date, note });
            // 連續模式：保留 type / category / date，僅清空金額與備註
            if (continuousMode) {
                setAmount('');
                setNote('');
            } else {
                setAmount('');
                setCategory('');
                setNote('');
            }
            if (prefillTransaction && onConsumePrefill) onConsumePrefill();
            // 短暫顯示「已新增」提示
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 1200);
        }
    };

    return (
        <form className="transaction-form glass-panel animate-slide-up" onSubmit={handleSubmit}>
            {editingTransaction && (
                <div className="edit-header">
                    <span>✏️ 正在修改紀錄</span>
                    <button type="button" onClick={onCancelEdit} className="cancel-edit-btn" title="取消修改">
                        <X size={18} />
                    </button>
                </div>
            )}
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

            <div className="quick-amounts">
                {QUICK_AMOUNTS.map(n => (
                    <button
                        type="button"
                        key={n}
                        className="quick-amount-chip"
                        onClick={() => setAmount(String(n))}
                    >
                        ${n}
                    </button>
                ))}
                {amount && (
                    <button
                        type="button"
                        className="quick-amount-chip clear"
                        onClick={() => setAmount('')}
                        title="清除金額"
                    >
                        清除
                    </button>
                )}
            </div>

            <div className="form-row">
                <div className="form-group flex-1">
                    <label>分類</label>
                    <div className="category-chips">
                        {categories[type].map(cat => (
                            <div
                                key={cat}
                                className={`category-chip ${category === cat ? 'selected' : ''}`}
                                onClick={() => setCategory(cat)}
                            >
                                {cat}
                                <button
                                    type="button"
                                    className="delete-category-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`確定要刪除「${cat}」分類嗎？`)) {
                                            deleteCategory(type, cat);
                                            if (category === cat) setCategory('');
                                        }
                                    }}
                                    title="刪除此分類"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {isAddingCategory ? (
                            <div className="category-chip adding">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="新分類"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCategory();
                                        } else if (e.key === 'Escape') {
                                            setIsAddingCategory(false);
                                            setNewCategoryName('');
                                        }
                                    }}
                                    onBlur={() => {
                                        if(newCategoryName.trim()) {
                                            handleAddCategory();
                                        } else {
                                            setIsAddingCategory(false);
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="category-chip add-btn"
                                onClick={() => setIsAddingCategory(true)}
                            >
                                + 新增
                            </button>
                        )}
                    </div>
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

            {!editingTransaction && (
                <label className={`continuous-toggle ${continuousMode ? 'active' : ''}`} title="開啟後送出仍保留分類與日期，方便連續輸入">
                    <input
                        type="checkbox"
                        checked={continuousMode}
                        onChange={(e) => setContinuousMode(e.target.checked)}
                    />
                    <Repeat size={14} />
                    <span>連續記帳模式</span>
                </label>
            )}

            <div className="form-actions">
                {editingTransaction && (
                    <button type="button" onClick={onCancelEdit} className="cancel-btn">
                        取消
                    </button>
                )}
                <button type="submit" className={`submit-btn ${justSaved ? 'saved' : ''}`} style={{ flex: 1 }}>
                    {justSaved ? <><Check size={18} /> 已新增</> : (editingTransaction ? '儲存修改' : '新增紀錄')}
                </button>
            </div>
        </form>
    );
}
