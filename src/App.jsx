import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Monitor, Moon, Plus, Settings, Smartphone, Sun, Upload } from 'lucide-react';
import { useTransactions } from './hooks/useTransactions';
import { useTheme } from './hooks/useTheme';
import { useBudget } from './hooks/useBudget';
import { useCategories } from './hooks/useCategories';
import { useCategoryBudgets } from './hooks/useCategoryBudgets';
import { useRecurringTransactions } from './hooks/useRecurringTransactions';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useAccentColor } from './hooks/useAccentColor';
import { useVersionUpdate } from './hooks/useVersionUpdate';
import { AnalysisView } from './components/AnalysisView';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { CalendarView } from './components/CalendarView';
import { CloudSync } from './components/CloudSync';
import { SettingsView } from './components/SettingsView';
import { TabBar } from './components/TabBar';
import { csvToTransactions } from './utils/csv';
import { getCategorySpending, getMoneyInsights } from './utils/financeStats';
import { localDateForMonthDay, toLocalDateString, toLocalMonthString } from './utils/date';

function App() {
    const {
        transactions,
        addTransaction,
        deleteTransaction,
        deleteTransactions,
        updateTransaction,
        updateTransactionsCategory,
        restoreTransactionSnapshots,
        restoreTransactions,
        mergeTransactions,
        summary,
    } = useTransactions();
    const { theme, setTheme, cycleTheme } = useTheme();
    const { accent, setAccent } = useAccentColor();
    const { budget, setBudget } = useBudget();
    const categoriesState = useCategories();
    const { categoryBudgets, setCategoryBudget } = useCategoryBudgets();
    const {
        recurringRules,
        addRecurringRule,
        updateRecurringRule,
        deleteRecurringRule,
        markRecurringPosted,
    } = useRecurringTransactions();
    const pwa = usePwaInstall();
    const versionUpdate = useVersionUpdate();

    const [editingTransaction, setEditingTransaction] = useState(null);
    const [prefillTransaction, setPrefillTransaction] = useState(null);
    const [activeTab, setActiveTab] = useState('add');
    const [focusSearchRequest, setFocusSearchRequest] = useState(0);
    const [undoAction, setUndoAction] = useState(null);
    const undoTimerRef = useRef(null);
    const fileInputRef = useRef(null);

    const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
    const themeLabel = theme === 'light' ? '淺色' : theme === 'dark' ? '深色' : '系統';
    const currentMonth = toLocalMonthString();
    const today = toLocalDateString();

    const categorySpending = useMemo(
        () => getCategorySpending(transactions, currentMonth),
        [transactions, currentMonth]
    );
    const moneyInsights = useMemo(
        () => getMoneyInsights(transactions, budget),
        [transactions, budget]
    );
    const scheduledRecurringRules = useMemo(() => {
        return recurringRules
            .filter((rule) => rule.enabled)
            .map((rule) => {
                const scheduledDate = localDateForMonthDay(currentMonth, rule.dayOfMonth);
                return {
                    ...rule,
                    scheduledDate,
                    postedThisMonth: rule.lastPostedMonth === currentMonth,
                    isDue: rule.lastPostedMonth !== currentMonth && scheduledDate <= today,
                };
            })
            .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    }, [recurringRules, currentMonth, today]);
    const dueRecurringRules = useMemo(
        () => scheduledRecurringRules.filter((rule) => rule.isDue),
        [scheduledRecurringRules]
    );
    const recurringSummary = useMemo(() => {
        const expenseTotal = scheduledRecurringRules
            .filter((rule) => rule.type === 'expense')
            .reduce((sum, rule) => sum + rule.amount, 0);
        const incomeTotal = scheduledRecurringRules
            .filter((rule) => rule.type === 'income')
            .reduce((sum, rule) => sum + rule.amount, 0);
        const pendingRules = scheduledRecurringRules.filter((rule) => !rule.postedThisMonth);

        return {
            enabledCount: scheduledRecurringRules.length,
            expenseTotal,
            incomeTotal,
            postedCount: scheduledRecurringRules.length - pendingRules.length,
            pendingCount: pendingRules.length,
            dueCount: dueRecurringRules.length,
            upcomingRules: pendingRules.slice(0, 3),
        };
    }, [scheduledRecurringRules, dueRecurringRules]);

    useEffect(() => {
        const isTypingTarget = (target) => {
            const tagName = target?.tagName?.toLowerCase();
            return tagName === 'input'
                || tagName === 'textarea'
                || tagName === 'select'
                || target?.isContentEditable;
        };

        const tabMap = {
            1: 'add',
            2: 'list',
            3: 'calendar',
            4: 'analysis',
        };

        const onKeyDown = (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;

            if (event.key === 'Escape') {
                setEditingTransaction(null);
                setPrefillTransaction(null);
                return;
            }

            if (isTypingTarget(event.target)) return;

            if (event.key.toLowerCase() === 'n') {
                setEditingTransaction(null);
                setPrefillTransaction(null);
                setActiveTab('add');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            if (event.key === '/') {
                event.preventDefault();
                setActiveTab('list');
                setFocusSearchRequest(Date.now());
                return;
            }

            if (tabMap[event.key]) {
                event.preventDefault();
                setActiveTab(tabMap[event.key]);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const updateBadge = async () => {
            try {
                if (dueRecurringRules.length > 0 && 'setAppBadge' in navigator) {
                    await navigator.setAppBadge(dueRecurringRules.length);
                } else if ('clearAppBadge' in navigator) {
                    await navigator.clearAppBadge();
                }
            } catch (error) {
                console.debug('Unable to update PWA badge', error);
            }
        };

        updateBadge();
    }, [dueRecurringRules.length]);

    const showUndoAction = (action) => {
        window.clearTimeout(undoTimerRef.current);
        setUndoAction(action);
        undoTimerRef.current = window.setTimeout(() => setUndoAction(null), 7000);
    };

    const handleCopy = (transaction) => {
        setEditingTransaction(null);
        setPrefillTransaction({
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            date: toLocalDateString(),
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

    const handleDelete = (id) => {
        const target = transactions.find((transaction) => transaction.id === id);
        if (!target) return;
        if (!window.confirm(`確定刪除「${target.category} ${target.amount}」這筆紀錄？`)) return;

        const deleted = deleteTransaction(id);
        if (!deleted) return;
        showUndoAction({
            type: 'delete',
            transaction: deleted,
            message: '已刪除 1 筆紀錄',
        });
    };

    const handleBulkDelete = (ids) => {
        if (ids.length === 0) return;
        if (!window.confirm(`確定刪除 ${ids.length} 筆交易？`)) return;

        const deleted = deleteTransactions(ids);
        if (!deleted.length) return;
        showUndoAction({
            type: 'bulk-delete',
            transactions: deleted,
            message: `已刪除 ${deleted.length} 筆交易`,
        });
    };

    const handleUpdateTransaction = (id, updatedData) => {
        const previous = updateTransaction(id, updatedData);
        if (!previous) return;
        showUndoAction({
            type: 'edit',
            transaction: previous,
            message: '已儲存修改',
        });
    };

    const handleBulkChangeCategory = (ids, category) => {
        if (ids.length === 0 || !category) return;
        const previous = updateTransactionsCategory(ids, category);
        if (!previous.length) return;
        showUndoAction({
            type: 'bulk-edit',
            transactions: previous,
            message: `已改分類 ${previous.length} 筆交易`,
        });
    };

    const handleUndoAction = () => {
        if (!undoAction) return;
        if (undoAction.type === 'delete') {
            mergeTransactions([undoAction.transaction]);
        }
        if (undoAction.type === 'edit') {
            updateTransaction(undoAction.transaction.id, undoAction.transaction);
        }
        if (undoAction.type === 'bulk-delete') {
            mergeTransactions(undoAction.transactions);
        }
        if (undoAction.type === 'bulk-edit') {
            restoreTransactionSnapshots(undoAction.transactions);
        }
        window.clearTimeout(undoTimerRef.current);
        setUndoAction(null);
    };

    const handlePostRecurring = (rule) => {
        addTransaction({
            type: rule.type,
            amount: rule.amount,
            category: rule.category,
            date: localDateForMonthDay(currentMonth, rule.dayOfMonth),
            note: rule.note || '',
        });
        markRecurringPosted(rule.id, currentMonth);
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
        link.setAttribute('download', `expense_export_${toLocalDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <header className="app-toolbar">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`toolbar-btn settings-toolbar-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    title="設定"
                    aria-label="設定"
                >
                    <Settings size={16} />
                    <span className="toolbar-label">設定</span>
                </button>
                <div className="toolbar-title">
                    <strong>隨身記帳本</strong>
                    <span>PWA</span>
                </div>
                <div className="toolbar-actions">
                    {pwa.canInstall && !pwa.isStandalone && (
                        <button
                            onClick={pwa.install}
                            className="toolbar-btn install-toolbar-btn"
                            title="安裝成 PWA"
                        >
                            <Smartphone size={16} />
                            <span className="toolbar-label">安裝</span>
                        </button>
                    )}
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
                </div>
            </header>

            <main className="app-main">
                {activeTab === 'add' && (
                    <>
                        <Dashboard
                            summary={summary}
                            budget={budget}
                            onBudgetChange={setBudget}
                            categoryBudgets={categoryBudgets}
                            categorySpending={categorySpending}
                            moneyInsights={moneyInsights}
                            dueRecurringRules={dueRecurringRules}
                            recurringSummary={recurringSummary}
                            onPostRecurring={handlePostRecurring}
                        />
                        <TransactionForm
                            onAdd={addTransaction}
                            editingTransaction={editingTransaction}
                            prefillTransaction={prefillTransaction}
                            onUpdate={handleUpdateTransaction}
                            onCancelEdit={() => setEditingTransaction(null)}
                            onConsumePrefill={() => setPrefillTransaction(null)}
                            categoriesState={categoriesState}
                        />
                    </>
                )}

                {activeTab === 'list' && (
                    <TransactionList
                        transactions={transactions}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                        onEdit={handleEdit}
                        onBulkDelete={handleBulkDelete}
                        onBulkChangeCategory={handleBulkChangeCategory}
                        categoriesState={categoriesState}
                        focusSearchRequest={focusSearchRequest}
                    />
                )}

                {activeTab === 'calendar' && (
                    <CalendarView
                        transactions={transactions}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onCopy={handleCopy}
                    />
                )}

                {activeTab === 'analysis' && (
                    <AnalysisView transactions={transactions} />
                )}

                {activeTab === 'settings' && (
                    <SettingsView
                        theme={theme}
                        setTheme={setTheme}
                        accent={accent}
                        setAccent={setAccent}
                        pwa={pwa}
                        categories={categoriesState.categories}
                        categoryBudgets={categoryBudgets}
                        setCategoryBudget={setCategoryBudget}
                        recurringRules={recurringRules}
                        addRecurringRule={addRecurringRule}
                        updateRecurringRule={updateRecurringRule}
                        deleteRecurringRule={deleteRecurringRule}
                        onPostRecurring={handlePostRecurring}
                    />
                )}
            </main>

            {activeTab !== 'add' && (
                <button
                    type="button"
                    onClick={() => {
                        setEditingTransaction(null);
                        setPrefillTransaction(null);
                        setActiveTab('add');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="fab-add"
                    aria-label="新增交易"
                    title="新增交易"
                >
                    <Plus size={26} strokeWidth={2.5} />
                </button>
            )}

            {undoAction && (
                <div className="undo-toast" role="status">
                    <span>{undoAction.message}</span>
                    <button type="button" onClick={handleUndoAction}>復原</button>
                </div>
            )}

            {versionUpdate.needRefresh && (
                <div className="version-toast" role="status">
                    <div className="version-toast-text">
                        <strong>新版本已準備好</strong>
                        <span>更新後會重新載入，使用最新功能與快取。</span>
                    </div>
                    <button type="button" className="update-now-btn" onClick={versionUpdate.applyUpdate}>
                        立即更新
                    </button>
                    <button type="button" className="update-later-btn" onClick={versionUpdate.dismissUpdate}>
                        稍後
                    </button>
                </div>
            )}

            <TabBar active={activeTab} onChange={setActiveTab} />
        </>
    );
}

export default App;
