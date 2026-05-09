import { useRef, useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useTheme } from './hooks/useTheme';
import { useBudget } from './hooks/useBudget';
import { Dashboard } from './components/Dashboard';
import { ExpenseChart } from './components/ExpenseChart';
import { TrendChart } from './components/TrendChart';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { CalendarView } from './components/CalendarView';
import { ReportView } from './components/ReportView';
import { CloudSync } from './components/CloudSync';
import { TabBar } from './components/TabBar';
import { Download, Upload, Sun, Moon, Monitor } from 'lucide-react';
import { csvToTransactions } from './utils/csv';

function App() {
    const { transactions, addTransaction, deleteTransaction, updateTransaction, restoreTransactions, mergeTransactions, summary } = useTransactions();
    const { theme, cycleTheme } = useTheme();
    const { budget, setBudget } = useBudget();
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [prefillTransaction, setPrefillTransaction] = useState(null);
    const [activeTab, setActiveTab] = useState('add');
    const fileInputRef = useRef(null);

    const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
    const themeLabel = theme === 'light' ? '淺色' : theme === 'dark' ? '深色' : '系統';

    // 從其他分頁觸發複製：跳到記帳分頁並預填
    const handleCopy = (transaction) => {
        setEditingTransaction(null);
        setPrefillTransaction({
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            date: new Date().toISOString().split('T')[0],
            note: transaction.note || '',
            _ts: Date.now(),
        });
        setActiveTab('add');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEdit = (transaction) => {
        setPrefillTransaction(null);
        setEditingTransaction(transaction);
        setActiveTab('add');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const text = await file.text();
            const { transactions: parsed, skipped } = csvToTransactions(text);
            if (parsed.length === 0) {
                alert(`CSV 中沒有有效資料${skipped ? `（已忽略 ${skipped} 筆無效列）` : ''}`);
                return;
            }
            const replace = window.confirm(
                `成功解析 ${parsed.length} 筆${skipped ? `（忽略 ${skipped} 筆）` : ''}。\n\n按「確定」= 覆蓋現有資料\n按「取消」= 合併（依 ID 去重）`
            );
            if (replace) {
                if (!window.confirm('再次確認：覆蓋將清除目前所有本地紀錄，確定？')) return;
                restoreTransactions(parsed);
                alert(`✅ 已覆蓋，共 ${parsed.length} 筆`);
            } else {
                const added = mergeTransactions(parsed);
                alert(`✅ 已合併，新增 ${added} 筆（其餘為重複資料）`);
            }
        } catch (err) {
            alert(`匯入失敗：${err.message}`);
        }
    };

    const exportToCSV = () => {
        if (transactions.length === 0) {
            alert('沒有資料可供匯出');
            return;
        }
        const headers = ['ID', '類型', '金額', '分類', '日期', '備註', '建立時間'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.id,
                t.type === 'income' ? '收入' : '支出',
                t.amount,
                t.category,
                t.date,
                t.note ? `"${t.note.replace(/"/g, '""')}"` : '',
                t.createdAt
            ].join(','))
        ].join('\n');
        const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `expense_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <header className="app-toolbar">
                <button
                    onClick={cycleTheme}
                    className="toolbar-btn"
                    title={`目前：${themeLabel}模式（點擊切換）`}
                >
                    <ThemeIcon size={16} />
                    <span className="toolbar-label">{themeLabel}</span>
                </button>
                <CloudSync transactions={transactions} onRestore={restoreTransactions} />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportCSV}
                    style={{ display: 'none' }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="toolbar-btn"
                    title="匯入 CSV"
                >
                    <Upload size={16} />
                    <span className="toolbar-label">匯入</span>
                </button>
                <button
                    onClick={exportToCSV}
                    className="toolbar-btn"
                    title="匯出 CSV"
                >
                    <Download size={16} />
                    <span className="toolbar-label">匯出</span>
                </button>
            </header>

            <main className="app-main">
                {activeTab === 'add' && (
                    <>
                        <Dashboard summary={summary} budget={budget} onBudgetChange={setBudget} />
                        <TransactionForm
                            onAdd={addTransaction}
                            editingTransaction={editingTransaction}
                            prefillTransaction={prefillTransaction}
                            onUpdate={updateTransaction}
                            onCancelEdit={() => setEditingTransaction(null)}
                            onConsumePrefill={() => setPrefillTransaction(null)}
                        />
                    </>
                )}

                {activeTab === 'list' && (
                    <TransactionList
                        transactions={transactions}
                        onDelete={deleteTransaction}
                        onCopy={handleCopy}
                        onEdit={handleEdit}
                    />
                )}

                {activeTab === 'calendar' && (
                    <CalendarView
                        transactions={transactions}
                        onDelete={deleteTransaction}
                        onEdit={handleEdit}
                        onCopy={handleCopy}
                    />
                )}

                {activeTab === 'charts' && (
                    <>
                        <TrendChart transactions={transactions} />
                        <ExpenseChart transactions={transactions} />
                        {transactions.length === 0 && (
                            <div className="glass-panel empty-state-pad">
                                <p>📊 還沒有任何紀錄</p>
                                <p className="sub-text">先到「記帳」分頁新增第一筆吧</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'report' && (
                    <ReportView transactions={transactions} />
                )}
            </main>

            <TabBar active={activeTab} onChange={setActiveTab} />
        </>
    );
}

export default App;
