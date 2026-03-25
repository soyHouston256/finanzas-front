import { useState, useEffect, useRef } from "react";
import { C } from "../../utils/colors.js";
import { useUI } from "../../context/UIContext.jsx";
import { useFinance } from "../../context/FinanceContext.jsx";
import { askClaude } from "../../services/claudeService.js";

export default function ChatPanel() {
  const { setShowChat } = useUI();
  const { accounts, tracking, goals } = useFinance();

  const [messages, setMessages] = useState([
    { role: "assistant", content: "🐾 Fang activo. ¿Qué necesitas?\n\n• gasté S/50 en almuerzo\n• cómo voy este mes\n• cuánto me queda en transporte" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const onClose = () => setShowChat(false);

  const buildSystemPrompt = () => {
    const penAccounts = accounts.filter(a => a.currency === "PEN");
    const totalSpent = tracking.total_expenses;
    const totalBudgeted = Object.values(tracking.categories || {}).reduce((s, c) => s + c.budgeted, 0);
    const alerts = Object.entries(tracking.categories || {})
      .filter(([, d]) => d.pct_used >= 80)
      .map(([slug, d]) => `${slug} ${Math.round(d.pct_used)}%`)
      .join(", ") || "sin alertas";
    const goalSummary = goals.map(g => `${g.name} S/${g.current.toLocaleString()} (S/${g.payment}/mes)`).join(", ");
    const accountSummary = penAccounts.map(a => `${a.name} S/${a.balance}`).join(", ");

    return `Eres Fang 🐾, asistente finanzas de Max. Español, breve.\n${accountSummary}.\nGastado S/${totalSpent} de S/${totalBudgeted}. Alertas: ${alerts}.\nSueldo S/${tracking.expected_income} día 28. ${goalSummary}.`;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const sys = buildSystemPrompt();
      const res = await askClaude(msg, sys);
      setMessages(p => [...p, { role: "assistant", content: res }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "❌ Error." }]);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay modal-overlay--chat" style={{ zIndex: "var(--z-modal)" }}>
      <div className="chat-panel" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: C.text }}>🐾 Fang Chat</span>
          <button onClick={onClose} className="btn-icon" style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div className="scroll-y" style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role==="user"?"flex-end":"flex-start", maxWidth: "85%", padding: "10px 14px", borderRadius: 12, background: m.role==="user"?C.accentDim:C.bg, color: C.text, fontSize: "var(--text-sm)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          ))}
          {loading && <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 12, background: C.bg, color: C.textDim, fontSize: "var(--text-sm)" }}>🐾 Pensando...</div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", flexShrink: 0, paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Ej: gasté S/45 en almuerzo..."
            style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: "var(--text-base)", outline: "none", fontFamily: "inherit", minHeight: "var(--tap-min)" }}
          />
          <button onClick={send} disabled={loading} className="btn-icon" style={{ background: C.accent, border: "none", borderRadius: 10, padding: "0 18px", color: C.bg, fontWeight: 700, cursor: "pointer", fontSize: "var(--text-base)", height: "var(--tap-min)", flexShrink: 0 }}>→</button>
        </div>
      </div>
    </div>
  );
}
