import { useTransactions } from './hooks/useTransactions';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';

function App() {
  const { transactions, addTransaction, deleteTransaction, summary } = useTransactions();

  return (
    <>
      <Dashboard summary={summary} />
      <TransactionForm onAdd={addTransaction} />
      <TransactionList
        transactions={transactions}
        onDelete={deleteTransaction}
      />
    </>
  );
}

export default App;
