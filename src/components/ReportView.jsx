import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, Trophy, Hash } from 'lucide-react';
import './ReportView.css';

const formatMoney = (n) => new Intl.NumberFormat('zh-TW', {
    style: 'currency', currency: 'TWD', minimumFractionDigits: 0
}).format(n);

const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const RANGES = [
    { key: 'week', label: '本週' },
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季' },
    { key: 'year', label: '本年' },
    { key: 'all', label: '全部' },
    { key: 'custom', label: '自訂' },
];

const computeRange = (key) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);
    switch (key) {
        case 'week': {
            const day = today.getDay(); // 0=Sun
            const diff = day === 0 ? 6 : day - 1; // 以週一起
            start.setDate(today.getDate() - diff);
            end.setDate(start.getDate() + 6);
            break;
        }
        case 'month':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'quarter': {
            const q = Math.floor(today.getMonth() / 3);
            start = new Date(today.getFullYear(), q * 3, 1);
            end = new Date(today.getFullYear(), q * 3 + 3, 0);
            break;
        }
        case 'year':
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31);
            break;
        case 'all':
        default:
            start = null;
            end = null;
    }
    return { start: start ? ymd(start) : null, end: end ? ymd(end) : null };
};

export function ReportView({ transactions }) {
    const [rangeKey, setRangeKey] = useState('month');
    const initial = computeRange('month');
    const [customStart, setCustomStart] = useState(initial.start || ymd(new Date()));
    const [customEnd, setCustomEnd] = useState(initial.end || ymd(new Date()));

    const range = useMemo(() => {
        if (rangeKey === 'custom') return { start: customStart, end: customEnd };
        return computeRange(rangeKey);
    }, [rangeKey, customStart, customEnd]);

    const filtered = useMemo(() => {
        return transactions.filter(t => {
            if (!t.date) return false;
            if (range.start && t.date < range.start) return false;
            if (range.end && t.date > range.end) return false;
            return true;
        });
    }, [transactions, range]);

    const stats = useMemo(() => {
        let income = 0, expense = 0, maxIncome = null, maxExpense = null;
        const dateSet = new Set();
        filtered.forEach(t => {
            dateSet.add(t.date);
            if (t.type === 'income') {
                income += t.amount;
                if (!maxIncome || t.amount > maxIncome.amount) maxIncome = t;
            } else {
                expense += t.amount;
                if (!maxExpense || t.amount > maxExpense.amount) maxExpense = t;
            }
        });
        // 區間天數
        let days = dateSet.size || 1;
        if (range.start && range.end) {
            const ms = new Date(range.end) - new Date(range.start);
            days = Math.max(1, Math.round(ms / 86400000) + 1);
        }
        return {
            income,
            expense,
            net: income - expense,
            count: filtered.length,
            days,
            avgDailyExpense: expense / days,
            avgDailyIncome: income / days,
            avgPerEntry: filtered.length ? (income + expense) / filtered.length : 0,
            maxIncome,
            maxExpense,
        };
    }, [filtered, range]);

    // Top 分類（支出 / 收入分開）
    const topExpenseCategories = useMemo(() => {
        const map = new Map();
        filtered.filter(t => t.type === 'expense').forEach(t => {
            map.set(t.category, (map.get(t.category) || 0) + t.amount);
        });
        return [...map.entries()]
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filtered]);

    const topIncomeCategories = useMemo(() => {
        const map = new Map();
        filtered.filter(t => t.type === 'income').forEach(t => {
            map.set(t.category, (map.get(t.category) || 0) + t.amount);
        });
        return [...map.entries()]
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filtered]);

    const expenseRatio = stats.income > 0 ? Math.min(stats.expense / stats.income, 1.5) * 100 : 0;

    return (
        <div className="report-view">
            <div className="report-range glass-panel animate-slide-up">
                <div className="range-tabs">
                    {RANGES.map(r => (
                        <button
                            type="button"
                            key={r.key}
                            className={`range-tab ${rangeKey === r.key ? 'active' : ''}`}
                            onClick={() => setRangeKey(r.key)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                {rangeKey === 'custom' && (
                    <div className="custom-range">
                        <input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            className="std-input"
                        />
                        <span>至</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="std-input"
                        />
                    </div>
                )}
                {range.start && range.end && (
                    <p className="range-hint">{range.start} ～ {range.end}（{stats.days} 天）</p>
                )}
            </div>

            <div className="report-cards">
                <div className="report-card income">
                    <TrendingUp size={18} />
                    <span className="card-label">總收入</span>
                    <strong>{formatMoney(stats.income)}</strong>
                </div>
                <div className="report-card expense">
                    <TrendingDown size={18} />
                    <span className="card-label">總支出</span>
                    <strong>{formatMoney(stats.expense)}</strong>
                </div>
                <div className={`report-card net ${stats.net >= 0 ? 'pos' : 'neg'}`}>
                    <Wallet size={18} />
                    <span className="card-label">淨額</span>
                    <strong>{formatMoney(stats.net)}</strong>
                </div>
                <div className="report-card">
                    <Calendar size={18} />
                    <span className="card-label">日均支出</span>
                    <strong>{formatMoney(stats.avgDailyExpense)}</strong>
                </div>
                <div className="report-card">
                    <Hash size={18} />
                    <span className="card-label">紀錄筆數</span>
                    <strong>{stats.count}</strong>
                </div>
                <div className="report-card">
                    <Trophy size={18} />
                    <span className="card-label">每筆平均</span>
                    <strong>{formatMoney(stats.avgPerEntry)}</strong>
                </div>
            </div>

            {stats.income > 0 && (
                <div className="report-section glass-panel animate-slide-up">
                    <h3 className="report-title">支出 / 收入比例</h3>
                    <div className="ratio-bar">
                        <div className="ratio-fill" style={{ width: `${Math.min(expenseRatio, 100)}%` }} />
                    </div>
                    <p className="ratio-text">
                        {expenseRatio < 100
                            ? `本期支出占收入的 ${expenseRatio.toFixed(0)}%，剩 ${(100 - expenseRatio).toFixed(0)}% 可儲蓄`
                            : `⚠️ 本期支出已超過收入 ${(expenseRatio - 100).toFixed(0)}%`}
                    </p>
                </div>
            )}

            {topExpenseCategories.length > 0 && (
                <div className="report-section glass-panel animate-slide-up">
                    <h3 className="report-title">支出排行 Top 5</h3>
                    <ul className="ranking-list">
                        {topExpenseCategories.map((c, i) => {
                            const pct = stats.expense ? (c.value / stats.expense) * 100 : 0;
                            return (
                                <li key={c.name} className="ranking-item">
                                    <span className="rank-num">{i + 1}</span>
                                    <div className="rank-content">
                                        <div className="rank-row">
                                            <span className="rank-name">{c.name}</span>
                                            <span className="rank-val">{formatMoney(c.value)}</span>
                                        </div>
                                        <div className="rank-bar">
                                            <div className="rank-bar-fill expense" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="rank-pct">{pct.toFixed(1)}%</div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {topIncomeCategories.length > 0 && (
                <div className="report-section glass-panel animate-slide-up">
                    <h3 className="report-title">收入排行 Top 5</h3>
                    <ul className="ranking-list">
                        {topIncomeCategories.map((c, i) => {
                            const pct = stats.income ? (c.value / stats.income) * 100 : 0;
                            return (
                                <li key={c.name} className="ranking-item">
                                    <span className="rank-num">{i + 1}</span>
                                    <div className="rank-content">
                                        <div className="rank-row">
                                            <span className="rank-name">{c.name}</span>
                                            <span className="rank-val">{formatMoney(c.value)}</span>
                                        </div>
                                        <div className="rank-bar">
                                            <div className="rank-bar-fill income" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="rank-pct">{pct.toFixed(1)}%</div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {(stats.maxIncome || stats.maxExpense) && (
                <div className="report-section glass-panel animate-slide-up">
                    <h3 className="report-title">最大單筆</h3>
                    <div className="biggest-row">
                        {stats.maxExpense && (
                            <div className="biggest-card expense">
                                <span className="biggest-label">最大支出</span>
                                <strong>{formatMoney(stats.maxExpense.amount)}</strong>
                                <span className="biggest-cat">{stats.maxExpense.category}</span>
                                <span className="biggest-date">{stats.maxExpense.date}</span>
                            </div>
                        )}
                        {stats.maxIncome && (
                            <div className="biggest-card income">
                                <span className="biggest-label">最大收入</span>
                                <strong>{formatMoney(stats.maxIncome.amount)}</strong>
                                <span className="biggest-cat">{stats.maxIncome.category}</span>
                                <span className="biggest-date">{stats.maxIncome.date}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="glass-panel empty-report">
                    <p>📊 此區間沒有任何紀錄</p>
                </div>
            )}
        </div>
    );
}
