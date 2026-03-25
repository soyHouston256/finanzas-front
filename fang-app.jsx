import { useState, useEffect, useCallback, useRef } from "react";

// ─── FANG FINANCE APP v2 ────────────────────────────────────────
// PIN-protected personal finance dashboard
// Auto-lock after 5 min inactivity

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ─── SECURITY CONFIG ────────────────────────────────────────────
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode("fang_salt_2026_" + pin);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function askClaude(prompt, systemPrompt = "") {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 4000,
      system: systemPrompt || "You are Fang, a MongoDB finance assistant. Respond in Spanish, brief and direct.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map((b) => (b.type === "text" ? b.text : "")).join("") || "";
}

// ─── DATA MAPS ──────────────────────────────────────────────────
const CATEGORY_ICONS = { food: "🍽️", transport: "🚗", health: "💊", entertainment: "🎮", education: "📚", services: "🔌", clothing: "👕", debt: "💳", housing: "🏠", savings: "🐷", other_expense: "📦" };
const CATEGORY_NAMES = { food: "Alimentación", transport: "Transporte", health: "Salud", entertainment: "Entretenimiento", education: "Educación", services: "Servicios", clothing: "Ropa", debt: "Deudas", housing: "Vivienda", savings: "Ahorro", other_expense: "Otros" };
const SUBCATEGORY_NAMES = { mercado: "Mercado", restaurante: "Restaurante", delivery: "Delivery", snacks: "Snacks", gasolina: "Gasolina", uber: "Uber", transporte_publico: "Transp. Público", medicamentos: "Medicamentos", consultas: "Consultas", gym: "Gym", streaming: "Streaming", salidas: "Salidas", juegos: "Juegos", cursos: "Cursos", libros: "Libros", plataformas: "Plataformas", internet: "Internet", luz: "Luz", agua: "Agua", telefono: "Teléfono", suscripciones: "Suscripciones", ropa: "Ropa", higiene: "Higiene", corte: "Corte", prestamos: "Préstamos", tarjeta_credito: "Tarjeta Créd.", otros_deudas: "Otros", renta: "Renta", mantenimiento: "Mantenimiento", fondo_emergencia: "Fondo Emerg.", meta_especifica: "Meta Específica" };
const ACCOUNT_MAP = { "69b260853c1e46ea44d12deb": { name: "BCP-YAPE", icon: "🏦" }, "69b2e9313c1e46ea44d12dec": { name: "Interbank TC", icon: "💳" }, "69b2e9313c1e46ea44d12ded": { name: "BCP TC", icon: "💳" }, "69b2e9313c1e46ea44d12dee": { name: "IO TC", icon: "💳" }, "69b2f083df0ec27eeb047b9c": { name: "Interbank Déb.", icon: "🏦" }, "69b2f083df0ec27eeb047b9d": { name: "USD BCP", icon: "💵" }, "69b2f083df0ec27eeb047b9e": { name: "USD Scotia", icon: "💵" }, "69b2f0b3df0ec27eeb047b9f": { name: "Scotia TC USD", icon: "💵" } };

// ─── SNAPSHOT DATA ──────────────────────────────────────────────
const INITIAL_ACCOUNTS = [
  { _id: "69b260853c1e46ea44d12deb", name: "BCP-YAPE", type: "bank", currency: "PEN", balance: 636, credit_limit: null },
  { _id: "69b2e9313c1e46ea44d12dec", name: "Interbank Crédito", type: "credit_card", currency: "PEN", balance: 0, credit_limit: 3000 },
  { _id: "69b2e9313c1e46ea44d12ded", name: "BCP Crédito", type: "credit_card", currency: "PEN", balance: 1661.79, credit_limit: 3000 },
  { _id: "69b2e9313c1e46ea44d12dee", name: "IO Crédito", type: "credit_card", currency: "PEN", balance: 323.53, credit_limit: 2000 },
  { _id: "69b2f083df0ec27eeb047b9c", name: "Interbank Débito", type: "bank", currency: "PEN", balance: 6000 },
  { _id: "69b2f083df0ec27eeb047b9d", name: "Dólares BCP", type: "cash", currency: "USD", balance: 45 },
  { _id: "69b2f083df0ec27eeb047b9e", name: "Dólares Scotiabank", type: "cash", currency: "USD", balance: 10 },
  { _id: "69b2f0b3df0ec27eeb047b9f", name: "Scotiabank Crédito", type: "credit_card", currency: "USD", balance: 0, credit_limit: 400 },
];
const INITIAL_TRACKING = {
  month: 3, year: 2026, total_income: 0, total_expenses: 3349.32, expected_income: 5800,
  categories: {
    food: { budgeted: 600, spent: 1271.96, remaining: -671.96, pct_used: 212 },
    transport: { budgeted: 400, spent: 152.21, remaining: 247.79, pct_used: 38 },
    health: { budgeted: 100, spent: 85, remaining: 15, pct_used: 85 },
    entertainment: { budgeted: 100, spent: 27, remaining: 73, pct_used: 27 },
    education: { budgeted: 1800, spent: 0, remaining: 1800, pct_used: 0 },
    services: { budgeted: 100, spent: 222.63, remaining: -122.63, pct_used: 223 },
    clothing: { budgeted: 30, spent: 410.2, remaining: -380.2, pct_used: 1367 },
    debt: { budgeted: 1552.72, spent: 0, remaining: 1552.72, pct_used: 0 },
    housing: { budgeted: 1300, spent: 1300, remaining: 0, pct_used: 100 },
    savings: { budgeted: 290, spent: 0, remaining: 290, pct_used: 0 },
    other_expense: { budgeted: 0, spent: -119.78, remaining: 119.78, pct_used: 0 },
  },
};
const INITIAL_TRANSACTIONS = [
  { date: "2026-03-13", amount: 32, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b260853c1e46ea44d12deb", description: "Almuerzo" },
  { date: "2026-03-11", amount: 32, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b260853c1e46ea44d12deb", description: "Almuerzo" },
  { date: "2026-03-10", amount: 124.9, category_slug: "food", subcategory_slug: "mercado", account_id: "69b2e9313c1e46ea44d12ded", description: "Alimentos" },
  { date: "2026-03-09", amount: 56, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b2e9313c1e46ea44d12ded", description: "Café" },
  { date: "2026-03-08", amount: 155, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b2e9313c1e46ea44d12ded", description: "Gran Parrillada Timbo" },
  { date: "2026-03-07", amount: 35.8, category_slug: "food", subcategory_slug: "snacks", account_id: "69b2e9313c1e46ea44d12ded", description: "PH19 Larco Kioscos" },
  { date: "2026-03-06", amount: 22.5, category_slug: "food", subcategory_slug: "mercado", account_id: "69b2e9313c1e46ea44d12ded", description: "Wong Bajada Balta" },
  { date: "2026-03-06", amount: 158.6, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b2e9313c1e46ea44d12ded", description: "Tori Polleria" },
  { date: "2026-03-06", amount: 410.2, category_slug: "clothing", subcategory_slug: "ropa", account_id: "69b2e9313c1e46ea44d12ded", description: "Puma Salaverry" },
  { date: "2026-03-06", amount: 89.9, category_slug: "other_expense", subcategory_slug: null, account_id: "69b2e9313c1e46ea44d12ded", description: "Plaza Vea - Electrodom." },
  { date: "2026-03-05", amount: 57.6, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b2e9313c1e46ea44d12ded", description: "Lucha Diagonal" },
  { date: "2026-03-05", amount: 130.01, category_slug: "transport", subcategory_slug: "gasolina", account_id: "69b2e9313c1e46ea44d12ded", description: "IZI Gasolinera" },
  { date: "2026-03-05", amount: 6.3, category_slug: "transport", subcategory_slug: "transporte_publico", account_id: "69b2e9313c1e46ea44d12ded", description: "Apparka LAP" },
  { date: "2026-03-05", amount: 32.5, category_slug: "food", subcategory_slug: "mercado", account_id: "69b2e9313c1e46ea44d12ded", description: "Plaza Vea San Isidro" },
  { date: "2026-03-04", amount: 79.9, category_slug: "services", subcategory_slug: "suscripciones", account_id: "69b2e9313c1e46ea44d12dee", description: "ChatGPT" },
  { date: "2026-03-03", amount: 13.5, category_slug: "food", subcategory_slug: "snacks", account_id: "69b2e9313c1e46ea44d12ded", description: "Puku Puku La Paz" },
  { date: "2026-03-03", amount: 209.68, category_slug: "food", subcategory_slug: "mercado", account_id: "69b2e9313c1e46ea44d12ded", description: "Makro Surco" },
  { date: "2026-03-03", amount: 35, category_slug: "health", subcategory_slug: "consultas", account_id: "69b2e9313c1e46ea44d12dee", description: "Sanna Miraflores" },
  { date: "2026-03-03", amount: 50, category_slug: "health", subcategory_slug: "consultas", account_id: "69b2e9313c1e46ea44d12dee", description: "Sanna Miraflores" },
  { date: "2026-03-02", amount: 17, category_slug: "entertainment", subcategory_slug: "salidas", account_id: "69b2e9313c1e46ea44d12ded", description: "Cinerama" },
  { date: "2026-03-02", amount: 10, category_slug: "entertainment", subcategory_slug: "salidas", account_id: "69b2e9313c1e46ea44d12ded", description: "Cinerama" },
  { date: "2026-03-02", amount: 56, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b2e9313c1e46ea44d12ded", description: "Don Humberto" },
  { date: "2026-03-02", amount: 1300, category_slug: "housing", subcategory_slug: "renta", account_id: "69b260853c1e46ea44d12deb", description: "Renta marzo" },
  { date: "2026-03-01", amount: 66.3, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b2e9313c1e46ea44d12ded", description: "Sanguchisimo" },
  { date: "2026-03-01", amount: 10, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b2e9313c1e46ea44d12ded", description: "The Nomad Group" },
  { date: "2026-03-01", amount: 142.73, category_slug: "services", subcategory_slug: "suscripciones", account_id: "69b2e9313c1e46ea44d12dee", description: "Google Workspace" },
  { date: "2026-03-01", amount: 15.9, category_slug: "transport", subcategory_slug: "uber", account_id: "69b2e9313c1e46ea44d12dee", description: "Uber" },
];
const GOALS = [
  { name: "Préstamo 1", target: 18812.2, current: 15629.24, date: "2029-11-01", payment: 427.55, installment: "16/60" },
  { name: "Préstamo 2", target: 38255.78, current: 33090.15, date: "2029-01-01", payment: 1125.17, installment: "14/48" },
];

// ─── UTILS ──────────────────────────────────────────────────────
const fmt = (n, cur = "PEN") => `${cur === "USD" ? "$" : "S/"}${Math.abs(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
const statusIcon = (p) => p >= 100 ? "🚨" : p >= 80 ? "⚠️" : "✅";
const today = new Date();
const dayOfMonth = today.getDate();
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

const C = { bg: "#0a0a0f", card: "#12121a", cardHover: "#1a1a25", border: "#1e1e2e", accent: "#6ee7b7", accentDim: "#6ee7b740", red: "#f87171", redDim: "#f8717130", yellow: "#fbbf24", blue: "#60a5fa", purple: "#a78bfa", text: "#e2e8f0", textDim: "#64748b", textMuted: "#475569" };

// ═══════════════════════════════════════════════════════════════
// PIN LOCK SCREEN
// ═══════════════════════════════════════════════════════════════
function PinLockScreen({ onUnlock }) {
  const [mode, setMode] = useState("checking");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(null);
  const [pinLength, setPinLength] = useState(4);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await window.storage.get("fang_pin_hash");
        const len = await window.storage.get("fang_pin_length");
        if (stored?.value) { setPinLength(parseInt(len?.value || "4")); setMode("login"); }
        else setMode("setup");
      } catch { setMode("setup"); }
    })();
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const iv = setInterval(() => { if (Date.now() >= lockedUntil) { setLockedUntil(null); setAttempts(0); setError(""); } }, 1000);
    return () => clearInterval(iv);
  }, [lockedUntil]);

  useEffect(() => { if (mode !== "checking") setTimeout(() => inputRefs.current[0]?.focus(), 100); }, [mode, confirmPin]);

  const resetPin = () => { setPin(["", "", "", "", "", ""]); setTimeout(() => inputRefs.current[0]?.focus(), 50); };
  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleInput = (index, value) => {
    if (lockedUntil || !/^\d?$/.test(value)) return;
    const newPin = [...pin]; newPin[index] = value; setPin(newPin); setError("");
    if (value && index < pinLength - 1) inputRefs.current[index + 1]?.focus();
    const entered = newPin.slice(0, pinLength).join("");
    if (entered.length === pinLength && newPin.slice(0, pinLength).every(d => d !== "")) setTimeout(() => handleSubmit(entered), 150);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) { const np = [...pin]; np[index - 1] = ""; setPin(np); inputRefs.current[index - 1]?.focus(); }
  };

  const handleSubmit = async (entered) => {
    if (mode === "setup") {
      if (!confirmPin) { setConfirmPin(entered); setPin(["", "", "", "", "", ""]); setTimeout(() => inputRefs.current[0]?.focus(), 100); return; }
      if (entered !== confirmPin) { setError("Los PINs no coinciden"); triggerShake(); setConfirmPin(null); resetPin(); return; }
      const hashed = await hashPin(entered);
      try { await window.storage.set("fang_pin_hash", hashed); await window.storage.set("fang_pin_length", String(pinLength)); } catch {}
      onUnlock();
    } else {
      const hashed = await hashPin(entered);
      let storedHash = "";
      try { storedHash = (await window.storage.get("fang_pin_hash"))?.value || ""; } catch {}
      if (hashed === storedHash) { setAttempts(0); onUnlock(); }
      else {
        const na = attempts + 1; setAttempts(na); triggerShake();
        if (na >= MAX_ATTEMPTS) { setLockedUntil(Date.now() + LOCKOUT_MS); setError("Demasiados intentos. Espera 60s."); }
        else setError(`PIN incorrecto. ${MAX_ATTEMPTS - na} intentos.`);
        resetPin();
      }
    }
  };

  const lockSec = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;

  if (mode === "checking") return <div style={{ background: C.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.textDim, fontSize: 14 }}>🐾 Cargando...</div></div>;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🐾</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: -1 }}>Fang</div>
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{mode === "setup" ? (confirmPin ? "Confirma tu PIN" : "Crea un PIN de acceso") : "Ingresa tu PIN"}</div>
      </div>

      {mode === "setup" && !confirmPin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[4, 5, 6].map(len => (
            <button key={len} onClick={() => { setPinLength(len); resetPin(); }} style={{
              padding: "6px 16px", borderRadius: 8, border: `1px solid ${pinLength === len ? C.accent : C.border}`,
              background: pinLength === len ? C.accentDim : "transparent", color: pinLength === len ? C.accent : C.textDim,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>{len} dígitos</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 24, animation: shake ? "shake 0.4s ease-in-out" : "none" }}>
        {Array.from({ length: pinLength }).map((_, i) => (
          <div key={i} style={{ position: "relative" }}>
            <input ref={el => inputRefs.current[i] = el} type="password" inputMode="numeric" maxLength={1}
              value={pin[i]} onChange={e => handleInput(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
              disabled={!!lockedUntil} autoComplete="off"
              style={{
                width: 48, height: 56, textAlign: "center", fontSize: 24, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                background: pin[i] ? C.accentDim : C.card, border: `2px solid ${pin[i] ? C.accent : error ? C.red + "60" : C.border}`,
                borderRadius: 12, color: C.text, outline: "none", caretColor: "transparent", transition: "all 0.15s ease",
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => { if (!pin[i]) e.target.style.borderColor = error ? C.red + "60" : C.border; }}
            />
            {pin[i] && <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: C.accent }} />}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 10, padding: "10px 20px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.red, fontWeight: 500 }}>{error}</div>
          {lockedUntil && <div style={{ fontSize: 22, fontWeight: 700, color: C.red, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{lockSec}s</div>}
        </div>
      )}

      {mode === "login" && attempts > 0 && !lockedUntil && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < attempts ? C.red : C.border, transition: "background 0.3s" }} />
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>
        {mode === "setup" ? "Este PIN protege tu info financiera. Se guarda localmente." : "Auto-lock a los 5 min de inactividad."}
      </div>
      <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-12px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-8px); } 80% { transform: translateX(6px); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
function ProgressRing({ pct, size = 52, stroke = 4, color }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (<svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color || C.accent} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} /></svg>);
}

function AccountCard({ acc }) {
  const isCC = acc.type === "credit_card", isUSD = acc.currency === "USD";
  const available = isCC ? acc.credit_limit - acc.balance : null, usedPct = isCC ? Math.round((acc.balance / acc.credit_limit) * 100) : null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{isCC ? "💳" : isUSD ? "💵" : "🏦"} {acc.name}</div>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isCC && acc.balance > 0 ? C.red : C.text }}>{isCC && acc.balance > 0 ? "-" : ""}{fmt(acc.balance, acc.currency)}</div>
        {isCC && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Disp: {fmt(available, acc.currency)} · {usedPct}%</div>}
      </div>
      {isCC && <ProgressRing pct={usedPct} size={40} stroke={3} color={usedPct > 70 ? C.red : C.accent} />}
    </div>
  );
}

function BudgetRow({ slug, data, onClick }) {
  const pct = Math.round(data.pct_used), color = pct >= 100 ? C.red : pct >= 80 ? C.yellow : C.accent;
  return (
    <div onClick={() => onClick?.(slug)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background = C.cardHover} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{CATEGORY_ICONS[slug] || "📦"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{CATEGORY_NAMES[slug] || slug}</span>
          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color }}>{fmt(data.spent)} / {fmt(data.budgeted)} {statusIcon(pct)}</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: color, width: `${Math.min(pct, 100)}%`, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 2, textAlign: "right" }}>{pct}%{data.remaining < 0 ? ` · excedido ${fmt(Math.abs(data.remaining))}` : ` · quedan ${fmt(data.remaining)}`}</div>
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  const acc = ACCOUNT_MAP[tx.account_id] || { name: "—", icon: "" };
  const sub = tx.subcategory_slug ? SUBCATEGORY_NAMES[tx.subcategory_slug] || tx.subcategory_slug : "";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}22` }}>
      <span style={{ fontSize: 16, width: 28, textAlign: "center" }}>{CATEGORY_ICONS[tx.category_slug] || "📦"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</div>
        <div style={{ fontSize: 10, color: C.textDim }}>{sub && <span style={{ marginRight: 6 }}>{sub}</span>}<span>{acc.icon} {acc.name}</span></div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: C.red }}>-{fmt(tx.amount)}</div>
        <div style={{ fontSize: 10, color: C.textDim }}>{fmtDate(tx.date)}</div>
      </div>
    </div>
  );
}

function GoalCard({ goal }) {
  const paid = goal.target - goal.current, pct = Math.round((paid / goal.target) * 100);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>💳 {goal.name}</span>
        <span style={{ fontSize: 11, color: C.textDim }}>Cuota {goal.installment} · {fmt(goal.payment)}/mes</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.accent}, ${C.blue})`, width: `${pct}%`, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textDim }}><span>Pagado: {fmt(paid)} ({pct}%)</span><span>Saldo: {fmt(goal.current)}</span></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUICK ADD + CHAT (same as v1)
// ═══════════════════════════════════════════════════════════════
function QuickAdd({ onClose, onAdd }) {
  const [amount, setAmount] = useState(""); const [desc, setDesc] = useState(""); const [category, setCategory] = useState("food");
  const [subcategory, setSubcategory] = useState(""); const [account, setAccount] = useState("69b260853c1e46ea44d12deb");
  const [type, setType] = useState("expense"); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const inputRef = useRef(null); useEffect(() => { inputRef.current?.focus(); }, []);
  const SUBCATS = { food: ["mercado","restaurante","delivery","snacks"], transport: ["gasolina","uber","transporte_publico"], health: ["medicamentos","consultas","gym"], entertainment: ["streaming","salidas","juegos"], education: ["cursos","libros","plataformas"], services: ["internet","luz","agua","telefono","suscripciones"], clothing: ["ropa","higiene","corte"], debt: ["prestamos","tarjeta_credito","otros_deudas"], housing: ["renta","mantenimiento"], savings: ["fondo_emergencia","meta_especifica"] };
  const handleSubmit = async () => {
    if (!amount || !desc) return; setLoading(true);
    try {
      await askClaude(`Register ${type}: ${amount} PEN, "${desc}", cat=${category}, sub=${subcategory||"null"}, acc=${account}, date=${new Date().toISOString().slice(0,10)}. Insert transactions, update budget_tracking m3 y2026. Respond: {"success":true}`);
      setResult({ ok: true, msg: `✅ ${fmt(parseFloat(amount))} — ${desc}` }); setTimeout(() => { onAdd(); onClose(); }, 1200);
    } catch { setResult({ ok: false, msg: "❌ Error" }); } setLoading(false);
  };
  const inp = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 14, width: "100%", outline: "none", fontFamily: "inherit" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: 380, maxWidth: "90vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>{type === "expense" ? "💸 Gasto" : "💰 Ingreso"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["expense","income"].map(t => (<button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${type===t?C.accent:C.border}`, background: type===t?C.accentDim:"transparent", color: type===t?C.accent:C.textDim, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>{t==="expense"?"Gasto":"Ingreso"}</button>))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input ref={inputRef} type="number" placeholder="Monto (S/)" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inp, fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }} />
          <input placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} style={inp} />
          <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); }} style={{ ...inp, cursor: "pointer" }}>{Object.entries(CATEGORY_NAMES).map(([k,v]) => <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>)}</select>
          {SUBCATS[category] && <select value={subcategory} onChange={e => setSubcategory(e.target.value)} style={{ ...inp, cursor: "pointer" }}><option value="">— Subcategoría —</option>{SUBCATS[category].map(s => <option key={s} value={s}>{SUBCATEGORY_NAMES[s]||s}</option>)}</select>}
          <select value={account} onChange={e => setAccount(e.target.value)} style={{ ...inp, cursor: "pointer" }}>{INITIAL_ACCOUNTS.map(a => <option key={a._id} value={a._id}>{a.name} ({a.currency})</option>)}</select>
        </div>
        {result && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500, background: result.ok?C.accentDim:C.redDim, color: result.ok?C.accent:C.red }}>{result.msg}</div>}
        <button onClick={handleSubmit} disabled={loading||!amount||!desc} style={{ marginTop: 16, width: "100%", padding: "12px 0", borderRadius: 10, background: loading?C.border:`linear-gradient(135deg, ${C.accent}, ${C.blue})`, border: "none", color: C.bg, fontSize: 15, fontWeight: 700, cursor: loading?"wait":"pointer", fontFamily: "inherit", opacity: (!amount||!desc)?0.4:1 }}>{loading?"Registrando...":"Registrar"}</button>
      </div>
    </div>
  );
}

function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: "🐾 Fang activo. ¿Qué necesitas?\n\n• gasté S/50 en almuerzo\n• cómo voy este mes\n• cuánto me queda en transporte" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false); const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = async () => {
    if (!input.trim()||loading) return; const msg = input.trim(); setInput(""); setMessages(p => [...p, { role: "user", content: msg }]); setLoading(true);
    try {
      const sys = `Eres Fang 🐾, asistente finanzas de Max. Español, breve.\nMarzo 2026: BCP-YAPE S/636, Interbank Déb S/6000, BCP TC deuda S/1661.79, IO TC S/323.53.\nGastado S/3,349 de S/6,273. Alertas: food 212%🚨, services 223%🚨, clothing 1367%🚨, health 85%⚠️.\nSueldo S/5800 día 28. P1 S/15,629 (S/427/mes), P2 S/33,090 (S/1,125/mes).`;
      const res = await askClaude(msg, sys); setMessages(p => [...p, { role: "assistant", content: res }]);
    } catch { setMessages(p => [...p, { role: "assistant", content: "❌ Error." }]); } setLoading(false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 500, height: "70vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>🐾 Fang Chat</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (<div key={i} style={{ alignSelf: m.role==="user"?"flex-end":"flex-start", maxWidth: "85%", padding: "10px 14px", borderRadius: 12, background: m.role==="user"?C.accentDim:C.bg, color: C.text, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.content}</div>))}
          {loading && <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 12, background: C.bg, color: C.textDim, fontSize: 13 }}>🐾 Pensando...</div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&send()} placeholder="Ej: gasté S/45 en almuerzo..." style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <button onClick={send} disabled={loading} style={{ background: C.accent, border: "none", borderRadius: 10, padding: "0 16px", color: C.bg, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP — AUTH WRAPPER + INACTIVITY LOCK
// ═══════════════════════════════════════════════════════════════
export default function FangApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [view, setView] = useState("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastActivity = useRef(Date.now());
  const lockTimerRef = useRef(null);

  const resetTimer = useCallback(() => { lastActivity.current = Date.now(); }, []);

  useEffect(() => {
    if (!unlocked) return;
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    lockTimerRef.current = setInterval(() => {
      if (Date.now() - lastActivity.current > LOCK_TIMEOUT_MS) { setUnlocked(false); setShowAdd(false); setShowChat(false); }
    }, 10000);
    return () => { events.forEach(e => window.removeEventListener(e, resetTimer)); clearInterval(lockTimerRef.current); };
  }, [unlocked, resetTimer]);

  if (!unlocked) return <PinLockScreen onUnlock={() => { setUnlocked(true); lastActivity.current = Date.now(); }} />;

  const tracking = INITIAL_TRACKING, accounts = INITIAL_ACCOUNTS, transactions = INITIAL_TRANSACTIONS;
  const totalBudgeted = Object.values(tracking.categories).reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = tracking.total_expenses, totalPct = Math.round((totalSpent / totalBudgeted) * 100);
  const penAccounts = accounts.filter(a => a.currency === "PEN"), usdAccounts = accounts.filter(a => a.currency === "USD");
  const netPEN = penAccounts.reduce((s, a) => s + (a.type === "credit_card" ? -a.balance : a.balance), 0);
  const netUSD = usdAccounts.reduce((s, a) => s + (a.type === "credit_card" ? -a.balance : a.balance), 0);
  const sortedCats = Object.entries(tracking.categories).filter(([,d]) => d.budgeted > 0 || d.spent > 0).sort((a, b) => b[1].spent - a[1].spent);
  const filteredTx = selectedCat ? transactions.filter(t => t.category_slug === selectedCat) : transactions;

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "'DM Sans', -apple-system, sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ padding: "20px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>🐾 Fang</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Marzo 2026 · Día {dayOfMonth}/{daysInMonth} ({monthProgress}%)</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: totalPct > 80 ? C.redDim : C.accentDim, color: totalPct > 80 ? C.red : C.accent, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(totalSpent)} / {fmt(totalBudgeted)}</div>
          <button onClick={() => setUnlocked(false)} title="Bloquear" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", color: C.textDim, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>🔒</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, padding: "0 16px", marginBottom: 16 }}>
        {[{ id: "dashboard", label: "Resumen" }, { id: "budget", label: "Presupuesto" }, { id: "transactions", label: "Movimientos" }, { id: "goals", label: "Metas" }].map(tab => (
          <button key={tab.id} onClick={() => { setView(tab.id); setSelectedCat(null); }} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: view===tab.id?C.accentDim:"transparent",
            color: view===tab.id?C.accent:C.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>{tab.label}</button>
        ))}
      </div>

      {view === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: `linear-gradient(135deg, ${C.card}, #1a1a2e)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Patrimonio Neto</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: netPEN >= 0 ? C.accent : C.red }}>{netPEN < 0 ? "-" : ""}{fmt(Math.abs(netPEN))}</div>
            {netUSD !== 0 && <div style={{ fontSize: 14, color: C.blue, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>+ {fmt(netUSD, "USD")}</div>}
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 8 }}>Sueldo: {fmt(5800)} el día 28 · Faltan {Math.max(28 - dayOfMonth, 0)} días</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Cuentas PEN</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>{penAccounts.map(a => <AccountCard key={a._id} acc={a} />)}</div>
          {usdAccounts.length > 0 && (<><div style={{ fontSize: 13, fontWeight: 600, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Cuentas USD</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>{usdAccounts.map(a => <AccountCard key={a._id} acc={a} />)}</div></>)}
          {sortedCats.filter(([,d]) => d.pct_used >= 80).length > 0 && (
            <div style={{ background: C.redDim, border: `1px solid ${C.red}30`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 6 }}>⚠️ Alertas de Presupuesto</div>
              {sortedCats.filter(([,d]) => d.pct_used >= 80).map(([slug, d]) => (<div key={slug} style={{ fontSize: 12, color: C.text, marginBottom: 2 }}>{statusIcon(d.pct_used)} {CATEGORY_NAMES[slug]}: {Math.round(d.pct_used)}%{d.remaining < 0 ? ` — excedido ${fmt(Math.abs(d.remaining))}` : ""}</div>))}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Últimos Movimientos</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 12px" }}>{transactions.slice(0, 6).map((tx, i) => <TransactionRow key={i} tx={tx} />)}</div>
        </div>
      )}

      {view === "budget" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <ProgressRing pct={totalPct} size={64} stroke={5} color={totalPct > 80 ? C.red : C.accent} />
            <div><div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>Gastado del Total</div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{totalPct}%</div><div style={{ fontSize: 12, color: C.textDim }}>{fmt(totalSpent)} de {fmt(totalBudgeted)} · Quedan {daysInMonth - dayOfMonth} días</div></div>
          </div>
          {selectedCat && <button onClick={() => setSelectedCat(null)} style={{ background: C.accentDim, border: `1px solid ${C.accent}40`, borderRadius: 8, padding: "6px 12px", color: C.accent, fontSize: 12, cursor: "pointer", marginBottom: 12, fontFamily: "inherit" }}>← Todas</button>}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 0" }}>
            {(selectedCat ? sortedCats.filter(([s]) => s === selectedCat) : sortedCats).map(([slug, data]) => <BudgetRow key={slug} slug={slug} data={data} onClick={setSelectedCat} />)}
          </div>
          {selectedCat && (<div style={{ marginTop: 16 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{CATEGORY_ICONS[selectedCat]} {CATEGORY_NAMES[selectedCat]}</div><div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 12px" }}>{filteredTx.length > 0 ? filteredTx.map((tx, i) => <TransactionRow key={i} tx={tx} />) : <div style={{ padding: 16, textAlign: "center", color: C.textDim, fontSize: 13 }}>Sin movimientos</div>}</div></div>)}
        </div>
      )}

      {view === "transactions" && (<div style={{ padding: "0 16px" }}><div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 12px" }}>{transactions.map((tx, i) => <TransactionRow key={i} tx={tx} />)}</div></div>)}

      {view === "goals" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Deuda Total</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: C.red }}>{fmt(GOALS.reduce((s, g) => s + g.current, 0))}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>Pago mensual: {fmt(GOALS.reduce((s, g) => s + g.payment, 0))}</div>
          </div>
          {GOALS.map((g, i) => <GoalCard key={i} goal={g} />)}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>📈 Proyección</div>
            <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.8 }}>• Préstamo 1: Nov 2029 ({60-16} cuotas)<br/>• Préstamo 2: Ene 2029 ({48-14} cuotas)<br/>• Extra S/200/mes al P2 → libre ~6 meses antes</div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 100 }}>
        <button onClick={() => setShowChat(true)} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit" }}><span style={{ fontSize: 20 }}>🐾</span><span style={{ fontSize: 10, fontWeight: 600 }}>Chat</span></button>
        <button onClick={() => setShowAdd(true)} style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`, border: "none", borderRadius: "50%", width: 48, height: 48, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: C.bg, marginTop: -20, boxShadow: `0 4px 20px ${C.accentDim}` }}>+</button>
        <button onClick={() => setUnlocked(false)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "inherit" }}><span style={{ fontSize: 20 }}>🔒</span><span style={{ fontSize: 10, fontWeight: 600 }}>Bloquear</span></button>
      </div>

      {showAdd && <QuickAdd onClose={() => setShowAdd(false)} onAdd={() => setRefreshKey(k => k + 1)} />}
      {showChat && <ChatPanel onClose={() => setShowChat(false)} />}
    </div>
  );
}
