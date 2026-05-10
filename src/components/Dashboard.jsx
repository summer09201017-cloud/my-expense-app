import { useState } from 'react';
import {
    Award,
    BellRing,
    CalendarClock,
    Check,
    Edit3,
    PiggyBank,
    Target,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';
import './Dashboard.css';

export function Dashboard({
    summary,
    budget,
    onBudgetChange,
    categoryBudgets = {},
    categorySpending = {},
    moneyInsights,
    dueRecurringRules = [],
    recurringSummary,
    onPostRecurring,
}) {
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
    const projectedRatio = budget > 0 && moneyInsights
        ? moneyInsights.projectedExpenseRatio
        : 0;
    const projectedLevel =
        projectedRatio >= 1 ? 'danger'
        : projectedRatio >= 0.8 ? 'warn'
        : 'ok';

    const remaining = budget - summary.expense;
    const projectedRemaining = budget - (moneyInsights?.projectedMonthExpense || 0);
    const categoryBudgetRows = Object.entries(categoryBudgets)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([category, amount]) => {
            const spent = categorySpending[category] || 0;
            const usedRatio = amount > 0 ? spent / amount : 0;
            return { category, amount, spent, usedRatio };
        })
        .sort((a, b) => b.usedRatio - a.usedRatio);

    const startEdit = () => {
        setDraftBudget(budget);
        setIsEditing(true);
    };

    const renderComparisonValue = (comparison) => {
        if (!comparison) return '0%';
        if (comparison.percent === null) return '新增';
        return `${comparison.percent >= 0 ? '+' : ''}${comparison.percent}%`;
    };

    const renderComparisonDetail = (comparison, positiveWord, negativeWord) => {
        if (!comparison) return '尚無資料';
        if (comparison.previous === 0 && comparison.current === 0) return '與上月持平';
        if (comparison.previous === 0) return `比上月多 ${formatMoney(comparison.current)}`;
        if (comparison.diff === 0) return '與上月持平';
        return `${comparison.diff > 0 ? positiveWord : negativeWord} ${formatMoney(Math.abs(comparison.diff))}`;
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
                        <div className="daily-allowance">
                            <PiggyBank size={16} />
                            <span>剩餘日均可花</span>
                            <strong>{formatMoney(moneyInsights?.dailyAllowance || 0)}</strong>
                        </div>
                        {moneyInsights && (
                            <div className={`budget-forecast ${projectedLevel}`}>
                                <div>
                                    <span>月底預估支出</span>
                                    <strong>{formatMoney(moneyInsights.projectedMonthExpense)}</strong>
                                </div>
                                <p>
                                    {projectedRemaining < 0
                                        ? `照目前速度，可能超支 ${formatMoney(Math.abs(projectedRemaining))}`
                                        : `照目前速度，月底約可剩 ${formatMoney(projectedRemaining)}`}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {recurringSummary?.enabledCount > 0 ? (
                <div className="dashboard-section recurring-dashboard">
                    <div className="dashboard-section-title">
                        <BellRing size={16} />
                        <span>固定交易儀表板</span>
                    </div>
                    <div className="recurring-summary-grid">
                        <div>
                            <span>固定支出</span>
                            <strong>{formatMoney(recurringSummary.expenseTotal)}</strong>
                        </div>
                        <div>
                            <span>固定收入</span>
                            <strong>{formatMoney(recurringSummary.incomeTotal)}</strong>
                        </div>
                        <div className={recurringSummary.dueCount > 0 ? 'warn' : ''}>
                            <span>待記入</span>
                            <strong>{recurringSummary.pendingCount}</strong>
                        </div>
                    </div>
                    {recurringSummary.upcomingRules.length > 0 && (
                        <div className="recurring-mini-list">
                            {recurringSummary.upcomingRules.map((rule) => (
                                <div key={rule.id} className={`recurring-reminder-row ${rule.isDue ? 'due' : ''}`}>
                                    <div>
                                        <span>{rule.note || rule.category}</span>
                                        <small>
                                            {rule.scheduledDate.slice(5)} · {rule.type === 'income' ? '收入' : '支出'} · {formatMoney(rule.amount)}
                                        </small>
                                    </div>
                                    {rule.isDue ? (
                                        <button type="button" onClick={() => onPostRecurring?.(rule)}>記入</button>
                                    ) : (
                                        <em>未到期</em>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : dueRecurringRules.length > 0 && (
                <div className="dashboard-section recurring-reminders">
                    <div className="dashboard-section-title">
                        <BellRing size={16} />
                        <span>固定交易提醒</span>
                    </div>
                    {dueRecurringRules.map((rule) => (
                        <div key={rule.id} className="recurring-reminder-row due">
                            <span>{rule.note || rule.category} · {formatMoney(rule.amount)}</span>
                            <button type="button" onClick={() => onPostRecurring?.(rule)}>記入</button>
                        </div>
                    ))}
                </div>
            )}

            {categoryBudgetRows.length > 0 && (
                <div className="dashboard-section category-budget-summary">
                    <div className="dashboard-section-title">
                        <Target size={16} />
                        <span>分類預算</span>
                    </div>
                    {categoryBudgetRows.slice(0, 4).map((row) => {
                        const pct = Math.round(row.usedRatio * 100);
                        const level = row.usedRatio >= 1 ? 'danger' : row.usedRatio >= 0.8 ? 'warn' : 'ok';
                        return (
                            <div key={row.category} className="category-budget-mini">
                                <div className="category-budget-mini-row">
                                    <span>{row.category}</span>
                                    <strong>{pct}%</strong>
                                </div>
                                <div className={`mini-budget-bar ${level}`}>
                                    <div style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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

            {moneyInsights && (
                <div className="dashboard-section month-compare-section">
                    <div className="dashboard-section-title">
                        <CalendarClock size={16} />
                        <span>本月 vs 上月</span>
                    </div>
                    <div className="month-compare-grid">
                        <div className={`month-compare-card ${moneyInsights.monthComparison.expense.diff > 0 ? 'bad' : moneyInsights.monthComparison.expense.diff < 0 ? 'good' : ''}`}>
                            <span>支出變化</span>
                            <strong>{renderComparisonValue(moneyInsights.monthComparison.expense)}</strong>
                            <small>{renderComparisonDetail(moneyInsights.monthComparison.expense, '多花', '少花')}</small>
                        </div>
                        <div className={`month-compare-card ${moneyInsights.monthComparison.income.diff > 0 ? 'good' : moneyInsights.monthComparison.income.diff < 0 ? 'bad' : ''}`}>
                            <span>收入變化</span>
                            <strong>{renderComparisonValue(moneyInsights.monthComparison.income)}</strong>
                            <small>{renderComparisonDetail(moneyInsights.monthComparison.income, '增加', '減少')}</small>
                        </div>
                    </div>
                </div>
            )}

            {moneyInsights && (
                <div className="dashboard-section habit-section">
                    <div className="habit-metrics">
                        <div>
                            <span>連續記帳</span>
                            <strong>{moneyInsights.streak} 天</strong>
                        </div>
                        <div>
                            <span>本月無支出日</span>
                            <strong>{moneyInsights.noExpenseDays} 天</strong>
                        </div>
                    </div>
                    {moneyInsights.badges.length > 0 && (
                        <div className="badge-strip">
                            {moneyInsights.badges.slice(0, 4).map((badge) => (
                                <span key={badge.key} title={badge.hint}>
                                    <Award size={13} />
                                    {badge.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
