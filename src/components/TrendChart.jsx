import { useMemo, useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import './TrendChart.css';

const formatTWD = (n) => new Intl.NumberFormat('zh-TW', {
    style: 'currency', currency: 'TWD', minimumFractionDigits: 0
}).format(n);

const lastNDays = (n) => {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        out.push(d.toISOString().split('T')[0]);
    }
    return out;
};

const lastNMonths = (n) => {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
};

export function TrendChart({ transactions }) {
    const [mode, setMode] = useState('day'); // 'day' | 'month'

    const data = useMemo(() => {
        const buckets = mode === 'day' ? lastNDays(30) : lastNMonths(12);
        const expenseMap = new Map(buckets.map(k => [k, 0]));
        const incomeMap = new Map(buckets.map(k => [k, 0]));

        transactions.forEach(t => {
            if (!t.date) return;
            const key = mode === 'day' ? t.date : t.date.substring(0, 7);
            if (!expenseMap.has(key)) return;
            if (t.type === 'expense') expenseMap.set(key, expenseMap.get(key) + t.amount);
            else incomeMap.set(key, incomeMap.get(key) + t.amount);
        });

        return buckets.map(k => ({
            label: mode === 'day' ? k.slice(5) : k.slice(2), // MM-DD 或 YY-MM
            支出: expenseMap.get(k),
            收入: incomeMap.get(k),
        }));
    }, [transactions, mode]);

    const hasAny = transactions.length > 0;
    if (!hasAny) return null;

    return (
        <div className="trend-chart glass-panel animate-slide-up">
            <div className="trend-header">
                <h3 className="chart-title">收支趨勢</h3>
                <div className="trend-mode-toggle">
                    <button
                        type="button"
                        className={`mode-btn ${mode === 'day' ? 'active' : ''}`}
                        onClick={() => setMode('day')}
                    >
                        近 30 天
                    </button>
                    <button
                        type="button"
                        className={`mode-btn ${mode === 'month' ? 'active' : ''}`}
                        onClick={() => setMode('month')}
                    >
                        近 12 月
                    </button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis
                        dataKey="label"
                        stroke="var(--text-secondary)"
                        tick={{ fontSize: 11 }}
                        interval={mode === 'day' ? 4 : 0}
                    />
                    <YAxis
                        stroke="var(--text-secondary)"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <Tooltip
                        formatter={formatTWD}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            background: 'var(--bg-card)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }} />
                    <Line
                        type="monotone"
                        dataKey="支出"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="收入"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
