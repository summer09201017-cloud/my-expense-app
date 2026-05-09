import { useEffect, useState } from 'react';
import {
    Check,
    Hash,
    Keyboard,
    MinusCircle,
    PlusCircle,
    Repeat,
    Save,
    Trash2,
    X,
    Zap,
} from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useQuickTemplates } from '../hooks/useQuickTemplates';
import { Numpad } from './Numpad';
import { AddCategoryDialog } from './IconPicker';
import { joinCategory } from '../utils/icons';
import { toLocalDateString } from '../utils/date';
import './TransactionForm.css';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export function TransactionForm({ onAdd, editingTransaction, prefillTransaction, onUpdate, onCancelEdit, onConsumePrefill, categoriesState }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(toLocalDateString());
    const [note, setNote] = useState('');
    const [continuousMode, setContinuousMode] = useState(() => localStorage.getItem('continuous_mode') === '1');
    const [useNumpad, setUseNumpad] = useState(() => localStorage.getItem('numpad_mode') !== '0');
    const [justSaved, setJustSaved] = useState(false);

    const localCategoriesState = useCategories();
    const { categories, addCategory, deleteCategory } = categoriesState || localCategoriesState;
    const { templates, addTemplate, deleteTemplate } = useQuickTemplates();
    const [showAddCategory, setShowAddCategory] = useState(false);

    useEffect(() => {
        localStorage.setItem('continuous_mode', continuousMode ? '1' : '0');
    }, [continuousMode]);

    useEffect(() => {
        localStorage.setItem('numpad_mode', useNumpad ? '1' : '0');
    }, [useNumpad]);

    useEffect(() => {
        if (editingTransaction) {
            setType(editingTransaction.type);
            setAmount(String(editingTransaction.amount));
            setCategory(editingTransaction.category);
            setDate(editingTransaction.date);
            setNote(editingTransaction.note || '');
        } else {
            setType('expense');
            setAmount('');
            setCategory('');
            setDate(toLocalDateString());
            setNote('');
        }
    }, [editingTransaction]);

    useEffect(() => {
        if (prefillTransaction) {
            setType(prefillTransaction.type);
            setAmount(String(prefillTransaction.amount));
            setCategory(prefillTransaction.category);
            setDate(prefillTransaction.date);
            setNote(prefillTransaction.note || '');
        }
    }, [prefillTransaction]);

    useEffect(() => {
        if (category && !categories[type].includes(category)) {
            setCategory('');
        }
    }, [type, categories, category]);

    const flashSaved = () => {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
    };

    const handleAddCategory = ({ icon, name }) => {
        const joined = joinCategory(icon, name);
        const success = addCategory(type, joined);
        if (success) {
            setCategory(joined);
            setShowAddCategory(false);
        } else {
            alert('此分類已存在或名稱無效！');
        }
    };

    const handleQuickAdd = (template) => {
        onAdd({
            type: template.type,
            amount: template.amount,
            category: template.category,
            date: toLocalDateString(),
            note: template.note || '',
        });
        flashSaved();
    };

    const handleSaveTemplate = () => {
        const success = addTemplate({ type, amount, category, note });
        if (!success) {
            alert('請先輸入有效金額並選擇分類，才能存成模板');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const amt = Number(amount);
        if (!amount || !Number.isFinite(amt) || amt <= 0) {
            alert('請輸入有效的金額');
            return;
        }
        if (!category.trim()) {
            alert('請選擇分類');
            return;
        }

        if (editingTransaction) {
            onUpdate(editingTransaction.id, { type, amount: amt, category, date, note });
            onCancelEdit();
        } else {
            onAdd({ type, amount: amt, category, date, note });
            if (continuousMode) {
                setAmount('');
                setNote('');
            } else {
                setAmount('');
                setCategory('');
                setNote('');
            }
            if (prefillTransaction && onConsumePrefill) onConsumePrefill();
            flashSaved();
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

            {!editingTransaction && templates.length > 0 && (
                <div className="template-section">
                    <div className="template-header">
                        <span><Zap size={15} /> 常用模板</span>
                        <button
                            type="button"
                            className="save-template-btn"
                            onClick={handleSaveTemplate}
                            title="把目前輸入存成模板"
                        >
                            <Save size={14} />
                            存目前
                        </button>
                    </div>
                    <div className="template-chips">
                        {templates.map((template) => (
                            <button
                                type="button"
                                key={template.id}
                                className={`template-chip ${template.type}`}
                                onClick={() => handleQuickAdd(template)}
                                title="一鍵新增今天的這筆紀錄"
                            >
                                <span>{template.note || template.category}</span>
                                <strong>${template.amount}</strong>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className="template-delete"
                                    title="刪除模板"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        deleteTemplate(template.id);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            deleteTemplate(template.id);
                                        }
                                    }}
                                >
                                    <Trash2 size={12} />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-group amount-group">
                <span className="currency-symbol">$</span>
                <input
                    type={useNumpad ? 'text' : 'number'}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="amount-input"
                    inputMode={useNumpad ? 'none' : 'decimal'}
                    readOnly={useNumpad}
                />
                <button
                    type="button"
                    className="kb-toggle"
                    onClick={() => setUseNumpad(v => !v)}
                    title={useNumpad ? '切換系統鍵盤' : '切換數字鍵盤'}
                >
                    {useNumpad ? <Keyboard size={16} /> : <Hash size={16} />}
                </button>
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

            {useNumpad && (
                <Numpad
                    value={amount}
                    onChange={setAmount}
                    onDone={handleSubmit}
                />
            )}

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
                        <button
                            type="button"
                            className="category-chip add-btn"
                            onClick={() => setShowAddCategory(true)}
                        >
                            + 新增
                        </button>
                    </div>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group flex-1">
                    <label>日期</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="std-input"
                    />
                </div>
                <div className="form-group flex-1">
                    <label>備註 (選填)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="輸入備註..."
                        className="std-input"
                    />
                </div>
            </div>

            {!editingTransaction && (
                <div className="form-options">
                    <label className={`continuous-toggle ${continuousMode ? 'active' : ''}`} title="開啟後送出仍保留分類與日期，方便連續輸入">
                        <input
                            type="checkbox"
                            checked={continuousMode}
                            onChange={(e) => setContinuousMode(e.target.checked)}
                        />
                        <Repeat size={14} />
                        <span>連續記帳模式</span>
                    </label>
                    <button
                        type="button"
                        className="save-template-inline"
                        onClick={handleSaveTemplate}
                    >
                        <Save size={14} />
                        存成模板
                    </button>
                </div>
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

            {showAddCategory && (
                <AddCategoryDialog
                    onCancel={() => setShowAddCategory(false)}
                    onConfirm={handleAddCategory}
                />
            )}
        </form>
    );
}
