import { C } from "../../utils/colors.js";
import { fmt } from "../../utils/formatters.js";
import { useFinance } from "../../context/FinanceContext.jsx";
import GoalCard from "./GoalCard.jsx";

export default function GoalsView() {
  const { goals, loading, error } = useFinance();

  if (loading) {
    return <div className="view-pad" style={{ color: C.textDim }}>Cargando metas...</div>;
  }

  if (error) {
    return <div className="view-pad" style={{ color: C.red }}>No se pudieron cargar las metas: {error}</div>;
  }

  return (
    <div className="view-pad">
      {/* Total debt summary */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "clamp(12px, 3.5vw, 20px)", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: "var(--text-xs)", color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Deuda Total</div>
        <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: C.red }}>{fmt(goals.reduce((s, g) => s + g.current, 0))}</div>
        <div style={{ fontSize: "var(--text-sm)", color: C.textDim, marginTop: 4 }}>Pago mensual: {fmt(goals.reduce((s, g) => s + g.payment, 0))}</div>
      </div>

      {/* Goal cards: 2-3 column grid on tablet/desktop */}
      <div className="goals-grid">
        {goals.length > 0
          ? goals.map((g) => <GoalCard key={g._id || g.name} goal={g} />)
          : <div style={{ color: C.textDim, fontSize: "var(--text-sm)", textAlign: "center" }}>No hay metas registradas en la colección `goals`.</div>}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "clamp(12px, 3.5vw, 20px)", marginTop: 8 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: C.text, marginBottom: 8 }}>📈 Proyección</div>
        <div style={{ fontSize: "var(--text-sm)", color: C.textDim, lineHeight: 1.8 }}>
          {goals.length > 0
            ? goals.map((goal) => (
              <div key={goal._id || goal.name}>
                • {goal.name}: saldo {fmt(goal.current)} · cuota {goal.installment}
              </div>
            ))
            : "Agrega documentos en `goals` para que esta vista muestre la proyección real."}
        </div>
      </div>
    </div>
  );
}
