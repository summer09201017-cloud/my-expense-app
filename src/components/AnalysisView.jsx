import { useState } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { ExpenseChart } from './ExpenseChart';
import { ReportView } from './ReportView';
import { TrendChart } from './TrendChart';
import './AnalysisView.css';

const ANALYSIS_TABS = [
    { key: 'charts', label: '圖表', Icon: PieChart },
    { key: 'report', label: '報告', Icon: BarChart3 },
];

export function AnalysisView({ transactions }) {
    const [mode, setMode] = useState('charts');

    return (
        <div className="analysis-view">
            <div className="analysis-switch glass-panel animate-slide-up" role="tablist" aria-label="分析類型">
                {ANALYSIS_TABS.map((tab) => {
                    const TabIcon = tab.Icon;
                    return (
                        <button
                            type="button"
                            role="tab"
                            key={tab.key}
                            aria-selected={mode === tab.key}
                            className={`analysis-switch-btn ${mode === tab.key ? 'active' : ''}`}
                            onClick={() => setMode(tab.key)}
                        >
                            <TabIcon size={17} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {mode === 'charts' ? (
                <>
                    <TrendChart transactions={transactions} />
                    <ExpenseChart transactions={transactions} />
                    {transactions.length === 0 && (
                        <div className="glass-panel empty-state-pad">
                            <p>📊 還沒有任何紀錄</p>
                            <p className="sub-text">先到「記帳」新增第一筆吧</p>
                        </div>
                    )}
                </>
            ) : (
                <ReportView transactions={transactions} />
            )}
        </div>
    );
}
