import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './ExpenseChart.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export function ExpenseChart({ transactions }) {
    const data = useMemo(() => {
        // 只取支出的紀錄
        const expenses = transactions.filter(t => t.type === 'expense');

        // 計算每個分類的總額
        const categoryTotals = expenses.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

        // 轉換為 Recharts 所需格式並排序
        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // 格式化 tooltip 顯示的金額
    const formatTooltip = (value) => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (transactions.filter(t => t.type === 'expense').length === 0) {
        return null; // 若沒有任何支出則不顯示圖表
    }

    return (
        <div className="expense-chart glass-panel animate-slide-up">
            <h3 className="chart-title">支出占比</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            animationBegin={200}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={formatTooltip}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '0.85rem' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
