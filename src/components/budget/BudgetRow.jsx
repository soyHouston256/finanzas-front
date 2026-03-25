import { C } from "../../utils/colors.js";
import { fmt, statusIcon } from "../../utils/formatters.js";
import { getCategoryIcon, getCategoryName } from "../../utils/constants.js";

export default function BudgetRow({ slug, data, onClick }) {
  const pct = Math.round(data.pct_used), color = pct >= 100 ? C.red : pct >= 80 ? C.yellow : C.accent;
  return (
    <div onClick={() => onClick?.(slug)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = C.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span style={{ fontSize: "clamp(16px, 4vw, 18px)", width: 28, textAlign: "center", flexShrink: 0 }}>{getCategoryIcon(slug)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: C.text }}>{getCategoryName(slug)}</span>
          <span style={{ fontSize: "var(--text-sm)", fontFamily: "'JetBrains Mono', monospace", color, whiteSpace: "nowrap" }}>{fmt(data.spent)} / {fmt(data.budgeted)} {statusIcon(pct)}</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: color, width: `${Math.min(pct, 100)}%`, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: C.textDim, marginTop: 2, textAlign: "right" }}>{pct}%{data.remaining < 0 ? ` · excedido ${fmt(Math.abs(data.remaining))}` : ` · quedan ${fmt(data.remaining)}`}</div>
      </div>
    </div>
  );
}
