import { Trash2 } from 'lucide-react';
import './TransactionList.css';

export function TransactionList({ transactions, onDelete }) {
    // 格式化日期
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
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

    return (
        <div className="transaction-list glass-panel animate-slide-up">
            <h3 className="list-title">最近的紀錄</h3>
            <div className="list-container">
                {transactions.map((t, i) => (
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

                            <button
                                onClick={() => onDelete(t.id)}
                                className="delete-btn"
                                title="刪除"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
