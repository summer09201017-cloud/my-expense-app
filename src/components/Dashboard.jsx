import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Target, Edit3, Check, X } from 'lucide-react';
import './Dashboard.css';

export function Dashboard({ summary, budget, onBudgetChange }) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftBudget, setDraftBudget] = useState(budget);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const ratio = budget > 0 ? Math.min(summary.expense / budget, 1.5) : 0;
    const percent = Math.round(ratio * 100);
    const overspent = budget > 0 && summary.expense > budget;
    const warningLevel =
        ratio >= 1 ? 'danger'
        : ratio >= 0.8 ? 'warn'
        : 'ok';

    const remaining = budget - summary.expense;

    const startEdit = () => {
        setDraftBudget(budget);
        setIsEditing(true);
    };

    const saveEdit = () => {
        const n = Number(draftBudget);
        if (!Number.isFinite(n) || n < 0) {
            setIsEditing(false);
            return;
        }
        onBudgetChange(n);
        setIsEditing(false);
    };

    return (
        <div className="dashboard glass-panel animate-scale-in">
            <div className="balance-card">
                <div className="balance-header">
                    <Wallet className="icon-main" />
                    <span>總結餘</span>
                </div>
                <h2 className="balance-amount">{formatMoney(summary.balance)}</h2>
            </div>

            <div className="budget-section">
                <div className="budget-header">
                    <div className="budget-title">
                        <Target size={16} />
                        <span>本月預算</span>
                    </div>
                    {isEditing ? (
                        <div className="budget-edit">
                            <input
                                type="number"
                                value={draftBudget}
                                onChange={(e) => setDraftBudget(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                                autoFocus
                                className="budget-input"
                                placeholder="設定金額"
                                min="0"
                            />
                            <button type="button" className="budget-icon-btn" onClick={saveEdit} title="儲存">
                                <Check size={16} />
                            </button>
                            <button type="button" className="budget-icon-btn" onClick={() => setIsEditing(false)} title="取消">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button type="button" className="budget-edit-btn" onClick={startEdit}>
                            {budget > 0 ? formatMoney(budget) : '點擊設定'}
                            <Edit3 size={12} />
                        </button>
                    )}
                </div>

                {budget > 0 && (
                    <>
                        <div className={`budget-bar ${warningLevel}`}>
                            <div
                                className="budget-bar-fill"
                                style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                        </div>
                        <div className="budget-meta">
                            <span>{percent}% 已用</span>
                            <span>
                                {overspent
                                    ? `已超支 ${formatMoney(Math.abs(remaining))}`
                                    : `剩 ${formatMoney(remaining)}`}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="stats-row">
                <div className="stat-card income">
                    <div className="stat-icon-wrapper">
                        <TrendingUp className="icon-income" />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">本月收入</span>
                        <span className="stat-value">{formatMoney(summary.income)}</span>
                    </div>
                </div>

                <div className="stat-card expense">
                    <div className="stat-icon-wrapper">
                        <TrendingDown className="icon-expense" />
                    </div>
                    <div className="stat-details">
                        <span className="stat-label">本月支出</span>
                        <span className="stat-value">{formatMoney(summary.expense)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
