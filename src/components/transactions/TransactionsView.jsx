import { C } from "../../utils/colors.js";
import { useFinance } from "../../context/FinanceContext.jsx";
import TransactionsFeed from "./TransactionsFeed.jsx";

export default function TransactionsView() {
  const {
    transactions,
    loading,
    loadingTransactions,
    transactionsHasMore,
    loadMoreTransactions,
    error,
  } = useFinance();

  if (loading || (loadingTransactions && transactions.length === 0)) {
    return <div className="view-pad" style={{ color: C.textDim }}>Cargando movimientos...</div>;
  }

  if (error) {
    return <div className="view-pad" style={{ color: C.red }}>No se pudieron cargar los movimientos: {error}</div>;
  }

  return (
    <div className="view-pad">
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 12px" }}>
        <TransactionsFeed
          transactions={transactions}
          hasMore={transactionsHasMore}
          loadingMore={loadingTransactions}
          onLoadMore={loadMoreTransactions}
          emptyText="Sin movimientos registrados"
        />
      </div>
    </div>
  );
}
