import { useMemo, useState } from 'react';
import { Calendar, Copy, Edit2, Search, Trash2 } from 'lucide-react';
import { getDateRange, isDateInRange, toLocalDateString } from '../utils/date';
import './TransactionList.css';

const RANGE_OPTIONS = [
    { key: 'today', label: '今天' },
    { key: 'week', label: '本週' },
    { key: 'month', label: '本月' },
    { key: 'custom', label: '自訂' },
    { key: 'all', label: '全部' },
];

const TYPE_OPTIONS = [
    { key: 'all', label: '全部' },
    { key: 'expense', label: '只看支出' },
    { key: 'income', label: '只看收入' },
];

export function TransactionList({ transactions, onDelete, onEdit, onCopy }) {
    const today = toLocalDateString();
    const [rangeKey, setRangeKey] = useState('month');
    const [customStart, setCustomStart] = useState(today);
    const [customEnd, setCustomEnd] = useState(today);
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const range = rangeKey === 'custom'
        ? { start: customStart, end: customEnd }
        : getDateRange(rangeKey);

    const filteredTransactions = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase();
        return transactions.filter((t) => {
            if (!isDateInRange(t.date, range.start, range.end)) return false;
            if (typeFilter !== 'all' && t.type !== typeFilter) return false;

            if (!keyword) return true;
            const typeLabel = t.type === 'income' ? '收入 income 收' : '支出 expense 支';
            const haystack = [
                t.category,
                t.note,
                t.date,
                String(t.amount),
                formatMoney(t.amount),
                typeLabel,
            ].join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }, [transactions, range.start, range.end, typeFilter, searchKeyword]);

    const periodSummary = filteredTransactions.reduce((acc, curr) => {
        if (curr.type === 'income') acc.income += curr.amount;
        else acc.expense += curr.amount;
        return acc;
    }, { income: 0, expense: 0 });

    if (transactions.length === 0) {
        return (
            <div className="transaction-list empty-state glass-panel animate-slide-up">
                <p>目前還沒有任何記帳紀錄 📝</p>
                <p className="sub-text">趕快新增第一筆收支吧！</p>
            </div>
        );
    }

    return (
        <div className="transaction-list glass-panel animate-slide-up">
            <div className="filter-group">
                <div className="view-mode-toggle range-toggle">
                    {RANGE_OPTIONS.map((option) => (
                        <button
                            type="button"
                            key={option.key}
                            className={`mode-btn ${rangeKey === option.key ? 'active' : ''}`}
                            onClick={() => setRangeKey(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {rangeKey === 'custom' && (
                    <div className="custom-range-filter">
                        <Calendar size={17} />
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="date-filter-input"
                        />
                        <span>至</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="date-filter-input"
                        />
                    </div>
                )}

                <div className="type-filter">
                    {TYPE_OPTIONS.map((option) => (
                        <button
                            type="button"
                            key={option.key}
                            className={`${typeFilter === option.key ? 'active' : ''}`}
                            onClick={() => setTypeFilter(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜尋分類、備註、金額、收入或支出..."
                    className="search-input"
                />
            </div>

            <div className="period-summary">
                <div className="summary-item expense">
                    <span>篩選支出</span>
                    <span className="amount">{formatMoney(periodSummary.expense)}</span>
                </div>
                <div className="summary-item income">
                    <span>篩選收入</span>
                    <span className="amount">{formatMoney(periodSummary.income)}</span>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                    <p>目前篩選條件下沒有紀錄 📝</p>
                </div>
            ) : (
                <div className="list-container">
                    {[...filteredTransactions]
                        .sort((a, b) => {
                            const dateDiff = new Date(b.date) - new Date(a.date);
                            if (dateDiff !== 0) return dateDiff;
                            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                        })
                        .map((t, i) => (
                            <div
                                key={t.id}
                                className="transaction-item"
                                style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
                            >
                                <div className="item-left">
                                    <div className={`type-badge ${t.type}`}>
                                        {t.type === 'income' ? '收' : '支'}
                                    </div>
                                    <div className="item-details">
                                        <span className="item-category">{t.category}</span>
                                        {t.note && <span className="item-note">{t.note}</span>}
                                    </div>
                                </div>

                                <div className="item-right">
                                    <div className="item-meta">
                                        <span className={`item-amount ${t.type}`}>
                                            {t.type === 'income' ? '+' : '-'}
                                            {formatMoney(t.amount)}
                                        </span>
                                        <span className="item-date">{formatDate(t.date)}</span>
                                    </div>

                                    <div className="item-actions">
                                        <button
                                            type="button"
                                            onClick={() => onCopy(t)}
                                            className="copy-btn"
                                            title="複製此筆（再記一筆相同）"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onEdit(t)}
                                            className="edit-btn"
                                            title="修改"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(t.id)}
                                            className="delete-btn"
                                            title="刪除"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
