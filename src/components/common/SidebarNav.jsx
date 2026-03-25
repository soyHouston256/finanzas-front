import { C } from "../../utils/colors.js";
import { useUI } from "../../context/UIContext.jsx";

const NAV_ITEMS = [
  { id: "dashboard",    label: "Resumen",      icon: "📊" },
  { id: "budget",       label: "Presupuesto",  icon: "📋" },
  { id: "transactions", label: "Movimientos",  icon: "💸" },
  { id: "goals",        label: "Metas",        icon: "🎯" },
];

export default function SidebarNav({ onLock }) {
  const { view, setView, setSelectedCat, setShowAdd, setShowChat, theme, toggleTheme } = useUI();

  return (
    <nav className="sidebar-nav" style={{ background: C.card, borderRight: `1px solid ${C.border}` }}>
      <div className="sidebar-nav__logo">
        <div className="sidebar-nav__logo-title" style={{ color: C.text }}>🐾 Fang</div>
        <div className="sidebar-nav__logo-sub">Finanzas personales</div>
      </div>

      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => { setView(item.id); setSelectedCat(null); }}
          className={`sidebar-nav__btn${view === item.id ? " sidebar-nav__btn--active" : ""}`}
        >
          <span className="sidebar-nav__btn-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div className="sidebar-nav__spacer" />

      <div className="sidebar-nav__divider" />

      <button
        onClick={() => setShowAdd(true)}
        className="fab fab--sidebar"
        style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`, color: C.bg, boxShadow: `0 4px 20px ${C.accentDim}`, border: "none" }}
      >
        <span style={{ fontSize: 18 }}>+</span>
        Nuevo gasto
      </button>

      <button
        onClick={() => setShowChat(true)}
        className="sidebar-nav__btn"
        style={{ marginTop: 4 }}
      >
        <span className="sidebar-nav__btn-icon">🐾</span>
        Chat Fang
      </button>

      <button
        onClick={toggleTheme}
        className="sidebar-nav__btn"
      >
        <span className="sidebar-nav__btn-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
        {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
      </button>

      <button
        onClick={onLock}
        className="sidebar-nav__btn"
      >
        <span className="sidebar-nav__btn-icon">🔒</span>
        Bloquear
      </button>
    </nav>
  );
}
