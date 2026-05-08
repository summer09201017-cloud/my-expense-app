import { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useTheme } from './hooks/useTheme';
import { useBudget } from './hooks/useBudget';
import { Dashboard } from './components/Dashboard';
import { ExpenseChart } from './components/ExpenseChart';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { CloudSync } from './components/CloudSync';
import { Download, Sun, Moon, Monitor } from 'lucide-react';

function App() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, restoreTransactions, summary } = useTransactions();
  const { theme, cycleTheme } = useTheme();
  const { budget, setBudget } = useBudget();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [prefillTransaction, setPrefillTransaction] = useState(null);

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const themeLabel = theme === 'light' ? '淺色' : theme === 'dark' ? '深色' : '系統';

  const handleCopy = (transaction) => {
    setEditingTransaction(null);
    setPrefillTransaction({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      date: new Date().toISOString().split('T')[0], // 複製到今天
      note: transaction.note || '',
      _ts: Date.now(), // 強制 useEffect 觸發
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={cycleTheme}
          className="glass-panel"
          title={`目前：${themeLabel}模式（點擊切換）`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: '600',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <ThemeIcon size={16} />
          {themeLabel}
        </button>
        <CloudSync transactions={transactions} onRestore={restoreTransactions} />
        <button
          onClick={exportToCSV}
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: '600',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Download size={16} />
          匯出 CSV
        </button>
      </div>
      <Dashboard summary={summary} budget={budget} onBudgetChange={setBudget} />
      <ExpenseChart transactions={transactions} />
      <TransactionForm
        onAdd={addTransaction}
        editingTransaction={editingTransaction}
        prefillTransaction={prefillTransaction}
        onUpdate={updateTransaction}
        onCancelEdit={() => setEditingTransaction(null)}
        onConsumePrefill={() => setPrefillTransaction(null)}
      />
      <TransactionList
        transactions={transactions}
        onDelete={deleteTransaction}
        onCopy={handleCopy}
        onEdit={(transaction) => {
          setPrefillTransaction(null);
          setEditingTransaction(transaction);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </>
  );
}

export default App;
