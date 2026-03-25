import { C } from "../../utils/colors.js";
import { fmt } from "../../utils/formatters.js";
import ProgressRing from "./ProgressRing.jsx";

export default function AccountCard({ acc }) {
  const isCC = acc.type === "credit_card", isUSD = acc.currency === "USD";
  const usedAmount = isCC ? Math.max(acc.balance, 0) : 0;
  const available = isCC ? acc.credit_limit - usedAmount : null, usedPct = isCC && acc.credit_limit ? Math.round((usedAmount / acc.credit_limit) * 100) : null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "clamp(10px, 3vw, 14px) clamp(12px, 3.5vw, 16px)", display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0 }}>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{ fontSize: "var(--text-xs)", color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{isCC ? "💳" : isUSD ? "💵" : "🏦"} {acc.name}</div>
        <div style={{ fontSize: "clamp(16px, 4.5vw, 20px)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isCC && acc.balance > 0 ? C.red : C.text, whiteSpace: "nowrap" }}>{isCC && acc.balance > 0 ? "-" : ""}{fmt(acc.balance, acc.currency)}</div>
        {isCC && <div style={{ fontSize: "var(--text-xs)", color: C.textDim, marginTop: 2 }}>Disp: {fmt(available, acc.currency)} · {usedPct}%</div>}
      </div>
      {isCC && <ProgressRing pct={usedPct} size={40} stroke={3} color={usedPct > 70 ? C.red : C.accent} />}
    </div>
  );
}
