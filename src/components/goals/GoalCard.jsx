import { C } from "../../utils/colors.js";
import { fmt } from "../../utils/formatters.js";

export default function GoalCard({ goal }) {
  const paid = goal.target - goal.current, pct = Math.round((paid / goal.target) * 100);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "clamp(12px, 3.5vw, 16px)", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: C.text }}>💳 {goal.name}</span>
        <span style={{ fontSize: "var(--text-xs)", color: C.textDim, whiteSpace: "nowrap" }}>Cuota {goal.installment} · {fmt(goal.payment)}/mes</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.blue})`, width: `${pct}%`, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: C.textDim, flexWrap: "wrap", gap: 4 }}>
        <span>Pagado: {fmt(paid)} ({pct}%)</span>
        <span>Saldo: {fmt(goal.current)}</span>
      </div>
    </div>
  );
}
