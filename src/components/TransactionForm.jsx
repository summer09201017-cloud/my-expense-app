import { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, X } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import './TransactionForm.css';

export function TransactionForm({ onAdd, editingTransaction, onUpdate, onCancelEdit }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    
    const { categories, addCategory, deleteCategory } = useCategories();
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

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
            // 重設表單
            setAmount('');
            setCategory('');
            setNote('');
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

            <div className="form-actions">
                {editingTransaction && (
                    <button type="button" onClick={onCancelEdit} className="cancel-btn">
                        取消
                    </button>
                )}
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                    {editingTransaction ? '儲存修改' : '新增紀錄'}
                </button>
            </div>
        </form>
    );
}
