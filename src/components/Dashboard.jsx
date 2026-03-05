import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import './Dashboard.css';

export function Dashboard({ summary }) {
    // 格式化金額
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(amount);
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
