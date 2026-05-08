import { useState } from 'react';
import { Trash2, Edit2, Calendar, Search, Copy } from 'lucide-react';
import './TransactionList.css';

export function TransactionList({ transactions, onDelete, onEdit, onCopy }) {
    const [viewMode, setViewMode] = useState('day'); // 'day' 或是 'month'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
    const [searchKeyword, setSearchKeyword] = useState('');

    // 格式化日期
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    };

    // 格式化金額
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (transactions.length === 0) {
        return (
            <div className="transaction-list empty-state glass-panel animate-slide-up">
                <p>目前還沒有任何記帳紀錄 📝</p>
                <p className="sub-text">趕快新增第一筆收支吧！</p>
            </div>
        );
    }

    // 根據目前的檢視模式過濾紀錄
    const filteredTransactions = transactions.filter(t => {
        let matchDate = false;
        if (viewMode === 'day') {
            matchDate = t.date === selectedDate;
        } else {
            matchDate = t.date.startsWith(selectedMonth);
        }

        if (matchDate && searchKeyword.trim()) {
            const keyword = searchKeyword.toLowerCase();
            return t.note && t.note.toLowerCase().includes(keyword);
        }

        return matchDate;
    });

    // 計算過濾後的區間總結
    const periodSummary = filteredTransactions.reduce((acc, curr) => {
        if (curr.type === 'income') acc.income += curr.amount;
        else acc.expense += curr.amount;
        return acc;
    }, { income: 0, expense: 0 });

    return (
        <div className="transaction-list glass-panel animate-slide-up">
            <div className="list-header">
                <div className="view-mode-toggle">
                    <button
                        type="button"
                        className={`mode-btn ${viewMode === 'day' ? 'active' : ''}`}
                        onClick={() => setViewMode('day')}
                    >
                        📅 按日
                    </button>
                    <button
                        type="button"
                        className={`mode-btn ${viewMode === 'month' ? 'active' : ''}`}
                        onClick={() => setViewMode('month')}
                    >
                        🗓️ 按月
                    </button>
                </div>
                <div className="date-picker-wrapper">
                    <Calendar size={18} className="calendar-icon" />
                    {viewMode === 'day' ? (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="date-filter-input"
                        />
                    ) : (
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="date-filter-input"
                        />
                    )}
                </div>
            </div>

            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜尋備註關鍵字..."
                    className="search-input"
                />
            </div>

            <div className="period-summary">
                <div className="summary-item expense">
                    <span>{viewMode === 'day' ? '當日支出' : '當月支出'}</span>
                    <span className="amount">{formatMoney(periodSummary.expense)}</span>
                </div>
                <div className="summary-item income">
                    <span>{viewMode === 'day' ? '當日收入' : '當月收入'}</span>
                    <span className="amount">{formatMoney(periodSummary.income)}</span>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                    <p>{viewMode === 'day' ? '這天' : '這個月'}沒有任何記帳紀錄 📝</p>
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
                                style={{ animationDelay: `${i * 0.05}s` }}
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
                                            onClick={() => onCopy(t)}
                                            className="copy-btn"
                                            title="複製此筆（再記一筆相同）"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(t)}
                                            className="edit-btn"
                                            title="修改"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
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
