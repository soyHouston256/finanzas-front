import { C } from "../../utils/colors.js";
import { fmt, fmtDate } from "../../utils/formatters.js";
import { getCategoryIcon, getSubcategoryName, isIncomeCategory } from "../../utils/constants.js";
import { useFinance } from "../../context/FinanceContext.jsx";

export default function TransactionRow({ tx }) {
  const { accountMap } = useFinance();
  const acc = accountMap[tx.account_id] || { name: "—", icon: "" };
  const sub = tx.subcategory_slug ? getSubcategoryName(tx.subcategory_slug) : "";
  const isExpense = !isIncomeCategory(tx.category_slug);
  const amountColor = isExpense ? C.red : C.accent;
  const amountPrefix = isExpense ? "-" : "+";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "clamp(6px, 2vw, 10px) 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
      <span style={{ fontSize: "clamp(15px, 4vw, 16px)", width: 28, textAlign: "center", flexShrink: 0 }}>{getCategoryIcon(tx.category_slug)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</div>
        <div style={{ fontSize: "var(--text-xs)", color: C.textDim }}>{sub && <span style={{ marginRight: 6 }}>{sub}</span>}<span>{acc.icon} {acc.name}</span></div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: amountColor, whiteSpace: "nowrap" }}>{amountPrefix}{fmt(tx.amount, accountMap[tx.account_id]?.currency || "PEN")}</div>
        <div style={{ fontSize: "var(--text-xs)", color: C.textDim }}>{fmtDate(tx.date)}</div>
      </div>
    </div>
  );
}
