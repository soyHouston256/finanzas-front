import { C } from "../../utils/colors.js";
import { fmt } from "../../utils/formatters.js";
import { getCategoryName } from "../../utils/constants.js";
import { statusIcon } from "../../utils/formatters.js";
import { useFinance } from "../../context/FinanceContext.jsx";
import AccountCard from "../common/AccountCard.jsx";
import TransactionRow from "../transactions/TransactionRow.jsx";

const today = new Date();
const dayOfMonth = today.getDate();
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

export default function DashboardView() {
  const { accounts, tracking, transactions, loading, error } = useFinance();

  const penAccounts = accounts.filter(a => a.currency === "PEN");
  const usdAccounts = accounts.filter(a => a.currency === "USD");
  const netPEN = penAccounts.reduce((s, a) => s + (a.type === "credit_card" ? -a.balance : a.balance), 0);
  const netUSD = usdAccounts.reduce((s, a) => s + (a.type === "credit_card" ? -a.balance : a.balance), 0);
  const sortedCats = Object.entries(tracking.categories || {}).filter(([,d]) => d.budgeted > 0 || d.spent > 0).sort((a, b) => b[1].spent - a[1].spent);

  if (loading) {
    return <div className="view-pad" style={{ color: C.textDim }}>Cargando datos...</div>;
  }

  if (error) {
    return <div className="view-pad" style={{ color: C.red }}>No se pudo conectar al backend: {error}</div>;
  }

  return (
    <div className="view-pad">
      {/* Desktop two-column grid wrapper */}
      <div className="dashboard-grid">

        {/* Left column / full-width on mobile: hero + accounts + alerts */}
        <div>
          {/* Net worth hero card */}
          <div style={{ background: `linear-gradient(135deg, ${C.card}, ${C.heroGradient})`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "clamp(14px, 4vw, 24px)", marginBottom: 16 }}>
            <div style={{ fontSize: "var(--text-xs)", color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Patrimonio Neto</div>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: netPEN >= 0 ? C.accent : C.red }}>{netPEN < 0 ? "-" : ""}{fmt(Math.abs(netPEN))}</div>
            {netUSD !== 0 && <div style={{ fontSize: "var(--text-base)", color: C.blue, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>+ {fmt(netUSD, "USD")}</div>}
            <div style={{ fontSize: "var(--text-xs)", color: C.textDim, marginTop: 8 }}>Ingresos del periodo: {fmt(tracking.expected_income || tracking.total_income)} · Faltan {Math.max(28 - dayOfMonth, 0)} días</div>
          </div>

          {/* PEN accounts */}
          <div className="section-label">Cuentas PEN</div>
          <div className={`account-grid${penAccounts.length === 1 ? " account-grid--single" : ""}`}>
            {penAccounts.map(a => <AccountCard key={a._id} acc={a} />)}
          </div>

          {/* USD accounts */}
          {usdAccounts.length > 0 && (
            <>
              <div className="section-label">Cuentas USD</div>
              <div className={`account-grid${usdAccounts.length === 1 ? " account-grid--single" : ""}`}>
                {usdAccounts.map(a => <AccountCard key={a._id} acc={a} />)}
              </div>
            </>
          )}

          {/* Budget alerts */}
          {sortedCats.filter(([,d]) => d.pct_used >= 80).length > 0 && (
            <div style={{ background: C.redDim, border: `1px solid ${C.redSubtle}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: C.red, marginBottom: 6 }}>⚠️ Alertas de Presupuesto</div>
              {sortedCats.filter(([,d]) => d.pct_used >= 80).map(([slug, d]) => (
                <div key={slug} style={{ fontSize: "var(--text-sm)", color: C.text, marginBottom: 2 }}>
                  {statusIcon(d.pct_used)} {getCategoryName(slug)}: {Math.round(d.pct_used)}%{d.remaining < 0 ? ` — excedido ${fmt(Math.abs(d.remaining))}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column / full-width on mobile: recent transactions */}
        <div>
          <div className="section-label">Últimos Movimientos</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 12px" }}>
            {transactions.length > 0
              ? transactions.slice(0, 6).map((tx) => <TransactionRow key={tx._id || `${tx.date}-${tx.description}`} tx={tx} />)
              : <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: "var(--text-sm)" }}>Sin movimientos registrados</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
