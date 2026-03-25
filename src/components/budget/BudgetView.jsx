import { C } from "../../utils/colors.js";
import { fmt } from "../../utils/formatters.js";
import { getCategoryIcon, getCategoryName } from "../../utils/constants.js";
import { useFinance } from "../../context/FinanceContext.jsx";
import { useUI } from "../../context/UIContext.jsx";
import ProgressRing from "../common/ProgressRing.jsx";
import BudgetRow from "./BudgetRow.jsx";
import TransactionsFeed from "../transactions/TransactionsFeed.jsx";

const today = new Date();
const dayOfMonth = today.getDate();

export default function BudgetView() {
  const {
    tracking,
    transactions,
    transactionsHasMore,
    loading,
    loadingTransactions,
    loadMoreTransactions,
    error,
  } = useFinance();
  const { selectedCat, setSelectedCat } = useUI();

  const totalBudgeted = Object.values(tracking.categories || {}).reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = tracking.total_expenses;
  const totalPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const sortedCats = Object.entries(tracking.categories || {}).filter(([,d]) => d.budgeted > 0 || d.spent > 0).sort((a, b) => b[1].spent - a[1].spent);
  const filteredTx = selectedCat ? transactions.filter(t => t.category_slug === selectedCat) : transactions;
  const daysInSelectedMonth = new Date(tracking.year, tracking.month, 0).getDate();
  const isCurrentPeriod = tracking.year === today.getFullYear() && tracking.month === today.getMonth() + 1;
  const periodHint = isCurrentPeriod
    ? `Quedan ${daysInSelectedMonth - dayOfMonth} días`
    : `${daysInSelectedMonth} días del periodo`;

  if (loading || (loadingTransactions && transactions.length === 0 && Object.keys(tracking.categories || {}).length === 0)) {
    return <div className="view-pad" style={{ color: C.textDim }}>Cargando presupuesto...</div>;
  }

  if (error) {
    return <div className="view-pad" style={{ color: C.red }}>No se pudo cargar el presupuesto: {error}</div>;
  }

  return (
    <div className="view-pad">
      {/* Budget summary header */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "clamp(12px, 3.5vw, 20px)", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <ProgressRing pct={totalPct} size={64} stroke={5} color={totalPct > 80 ? C.red : C.accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-xs)", color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>Gastado del Total</div>
          <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{totalPct}%</div>
          <div style={{ fontSize: "var(--text-sm)", color: C.textDim }}>{fmt(totalSpent)} de {fmt(totalBudgeted)} · {periodHint}</div>
        </div>
      </div>

      {selectedCat && (
        <button onClick={() => setSelectedCat(null)} className="btn-icon" style={{ background: C.accentDim, border: `1px solid ${C.accentSubtle}`, borderRadius: 8, padding: "6px 12px", color: C.accent, fontSize: "var(--text-sm)", cursor: "pointer", marginBottom: 12, fontFamily: "inherit" }}>← Todas</button>
      )}

      {/* Budget rows: 2-column grid on desktop */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 0", overflow: "hidden" }}>
        <div className={selectedCat ? undefined : "budget-rows-grid"}>
          {(selectedCat ? sortedCats.filter(([s]) => s === selectedCat) : sortedCats).map(([slug, data]) => <BudgetRow key={slug} slug={slug} data={data} onClick={setSelectedCat} />)}
        </div>
      </div>

      {!sortedCats.length && (
        <div style={{ marginTop: 16, color: C.textDim, fontSize: "var(--text-sm)", textAlign: "center" }}>
          No hay tracking guardado en backend. El presupuesto se está calculando desde transacciones del periodo actual.
        </div>
      )}

      {selectedCat && (
        <div style={{ marginTop: 16 }}>
          <div className="section-label">{getCategoryIcon(selectedCat)} {getCategoryName(selectedCat)}</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 12px" }}>
            <TransactionsFeed
              transactions={filteredTx}
              hasMore={transactionsHasMore}
              loadingMore={loadingTransactions}
              onLoadMore={loadMoreTransactions}
              emptyText="Sin movimientos"
            />
          </div>
        </div>
      )}
    </div>
  );
}
