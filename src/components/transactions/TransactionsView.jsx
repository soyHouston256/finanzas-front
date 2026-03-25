import { C } from "../../utils/colors.js";
import { useFinance } from "../../context/FinanceContext.jsx";
import TransactionRow from "./TransactionRow.jsx";

export default function TransactionsView() {
  const { transactions, loading, error } = useFinance();

  if (loading) {
    return <div className="view-pad" style={{ color: C.textDim }}>Cargando movimientos...</div>;
  }

  if (error) {
    return <div className="view-pad" style={{ color: C.red }}>No se pudieron cargar los movimientos: {error}</div>;
  }

  return (
    <div className="view-pad">
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 12px" }}>
        {transactions.length > 0
          ? transactions.map((tx) => <TransactionRow key={tx._id || `${tx.date}-${tx.description}`} tx={tx} />)
          : <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: "var(--text-sm)" }}>Sin movimientos registrados</div>}
      </div>
    </div>
  );
}
