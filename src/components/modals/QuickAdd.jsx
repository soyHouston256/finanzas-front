import { useState, useEffect, useRef } from "react";
import { C } from "../../utils/colors.js";
import { fmt } from "../../utils/formatters.js";
import { CATEGORY_ICONS, CATEGORY_NAMES, SUBCATEGORY_NAMES } from "../../utils/constants.js";
import { useUI } from "../../context/UIContext.jsx";
import { useFinance } from "../../context/FinanceContext.jsx";

const SUBCATS = {
  food: ["mercado","restaurante","delivery","snacks"],
  transport: ["gasolina","uber","transporte_publico"],
  health: ["medicamentos","consultas","gym"],
  entertainment: ["streaming","salidas","juegos"],
  education: ["cursos","libros","plataformas"],
  services: ["internet","luz","agua","telefono","suscripciones"],
  clothing: ["ropa","higiene","corte"],
  debt: ["prestamos","tarjeta_credito","otros_deudas"],
  housing: ["renta","mantenimiento"],
  savings: ["fondo_emergencia","meta_especifica"],
};

export default function QuickAdd() {
  const { setShowAdd } = useUI();
  const { accounts, addTransaction } = useFinance();

  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("food");
  const [subcategory, setSubcategory] = useState("");
  const [account, setAccount] = useState("");
  const [type, setType] = useState("expense");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (!account && accounts.length > 0) {
      setAccount(accounts[0]._id);
    }
  }, [account, accounts]);

  const onClose = () => setShowAdd(false);

  const handleSubmit = async () => {
    if (!amount || !desc || !account) return;
    setLoading(true);
    try {
      const selectedAccount = accounts.find((item) => item._id === account);
      const transactionCategory = type === "income" ? "salary" : category;
      const transactionSubcategory = type === "income" ? "salary" : (subcategory || "general");

      await addTransaction({
        date: new Date().toISOString().slice(0,10),
        amount: Number(amount),
        category_slug: transactionCategory,
        subcategory_slug: transactionSubcategory,
        account_id: account,
        description: desc,
        transaction_type: type,
      });
      setResult({ ok: true, msg: `✅ ${fmt(parseFloat(amount), selectedAccount?.currency || "PEN")} — ${desc}` });
      setTimeout(() => { onClose(); }, 1200);
    } catch (error) {
      setResult({ ok: false, msg: `❌ ${error instanceof Error ? error.message : "Error"}` });
    }
    setLoading(false);
  };

  const inp = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: "var(--text-base)", width: "100%", outline: "none", fontFamily: "inherit", minHeight: "var(--tap-min)" };

  return (
    <div className="modal-overlay modal-overlay--center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="modal-card modal-card--quickadd" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", color: C.text }}>{type === "expense" ? "💸 Gasto" : "💰 Ingreso"}</h3>
          <button onClick={onClose} className="btn-icon" style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["expense","income"].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${type===t?C.accent:C.border}`, background: type===t?C.accentDim:"transparent", color: type===t?C.accent:C.textDim, cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 600, fontFamily: "inherit", minHeight: "var(--tap-min)" }}>
              {t==="expense"?"Gasto":"Ingreso"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input ref={inputRef} type="number" placeholder="Monto (S/)" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inp, fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }} />
          <input placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} style={inp} />
          {type === "expense" ? (
            <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(""); }} style={{ ...inp, cursor: "pointer" }}>
              {Object.entries(CATEGORY_NAMES).map(([k,v]) => <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>)}
            </select>
          ) : (
            <div style={{ ...inp, display: "flex", alignItems: "center", color: C.textDim }}>
              Se registrará como ingreso en la categoría `salary`
            </div>
          )}
          {type === "expense" && SUBCATS[category] && (
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="">— Subcategoría —</option>
              {SUBCATS[category].map(s => <option key={s} value={s}>{SUBCATEGORY_NAMES[s]||s}</option>)}
            </select>
          )}
          <select value={account} onChange={e => setAccount(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            {accounts.map(a => <option key={a._id} value={a._id}>{a.name} ({a.currency})</option>)}
          </select>
        </div>
        {result && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, fontSize: "var(--text-sm)", fontWeight: 500, background: result.ok?C.accentDim:C.redDim, color: result.ok?C.accent:C.red }}>{result.msg}</div>}
        <button onClick={handleSubmit} disabled={loading||!amount||!desc||!account} style={{ marginTop: 16, width: "100%", padding: "14px 0", borderRadius: 10, background: loading?C.border:`linear-gradient(135deg, ${C.accent}, ${C.blue})`, border: "none", color: C.bg, fontSize: "var(--text-md)", fontWeight: 700, cursor: loading?"wait":"pointer", fontFamily: "inherit", opacity: (!amount||!desc||!account)?0.4:1 }}>
          {loading?"Registrando...":"Registrar"}
        </button>
      </div>
    </div>
  );
}
