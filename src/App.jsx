import { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { Dashboard } from './components/Dashboard';
import { ExpenseChart } from './components/ExpenseChart';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { CloudSync } from './components/CloudSync';
import { Download } from 'lucide-react';

function App() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, restoreTransactions, summary } = useTransactions();
  const [editingTransaction, setEditingTransaction] = useState(null);

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
        // 處理備註可能包含逗號的問題
        t.note ? `"${t.note.replace(/"/g, '""')}"` : '',
        t.createdAt
      ].join(','))
    ].join('\n');

    // 加上 BOM 讓 Excel 能正確識別 UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
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
      <Dashboard summary={summary} />
      <ExpenseChart transactions={transactions} />
      <TransactionForm
        onAdd={addTransaction}
        editingTransaction={editingTransaction}
        onUpdate={updateTransaction}
        onCancelEdit={() => setEditingTransaction(null)}
      />
      <TransactionList
        transactions={transactions}
        onDelete={deleteTransaction}
        onEdit={(transaction) => {
          setEditingTransaction(transaction);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </>
  );
}

export default App;
