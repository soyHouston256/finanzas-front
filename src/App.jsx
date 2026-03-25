import { useCallback, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { FinanceProvider, useFinance } from "./context/FinanceContext.jsx";
import { UIProvider, useUI } from "./context/UIContext.jsx";
import { useInactivityLock } from "./hooks/useInactivityLock.js";
import { C } from "./utils/colors.js";
import PinLockScreen from "./components/auth/PinLockScreen.jsx";
import DashboardView from "./components/dashboard/DashboardView.jsx";
import BudgetView from "./components/budget/BudgetView.jsx";
import TransactionsView from "./components/transactions/TransactionsView.jsx";
import GoalsView from "./components/goals/GoalsView.jsx";
import QuickAdd from "./components/modals/QuickAdd.jsx";
import ChatPanel from "./components/modals/ChatPanel.jsx";
import SidebarNav from "./components/common/SidebarNav.jsx";

const today = new Date();
const dayOfMonth = today.getDate();
const monthProgress = Math.round((dayOfMonth / new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) * 100);

function AppShell() {
  const { unlocked, lock } = useAuth();
  const { tracking, availablePeriods, selectedPeriod, setSelectedPeriod } = useFinance();
  const { view, setView, showAdd, showChat, setShowChat, setSelectedCat, theme, toggleTheme } = useUI();
  const monthLabel = new Date(tracking.year || today.getFullYear(), (tracking.month || today.getMonth() + 1) - 1, 1)
    .toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const isCurrentPeriod =
    tracking.year === today.getFullYear() &&
    tracking.month === today.getMonth() + 1;
  const currentPeriodDays = new Date(
    tracking.year || today.getFullYear(),
    tracking.month || today.getMonth() + 1,
    0,
  ).getDate();
  const currentDayLabel = isCurrentPeriod
    ? `Día ${dayOfMonth}/${currentPeriodDays} (${monthProgress}%)`
    : `${currentPeriodDays} días cerrados`;

  const onLock = useCallback(() => {
    lock();
    setShowChat(false);
  }, [lock, setShowChat]);

  useInactivityLock(unlocked, onLock);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  if (!unlocked) {
    return <PinLockScreen />;
  }

  return (
    <div className="app-shell" style={{ background: C.bg, color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* SIDEBAR NAV — desktop only, rendered via CSS display */}
      <SidebarNav onLock={onLock} />

      {/* HEADER */}
      <div className="app-header">
        <div>
          <div style={{ fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 700, letterSpacing: -0.5 }}>🐾 Fang</div>
          <div style={{ fontSize: "var(--text-xs)", color: C.textDim, marginTop: 2 }}>{monthLabel} · {currentDayLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={selectedPeriod}
            onChange={(event) => {
              setSelectedCat(null);
              setSelectedPeriod(event.target.value);
            }}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 10px",
              color: C.text,
              fontSize: "var(--text-sm)",
              fontFamily: "inherit",
              maxWidth: 180,
            }}
          >
            {availablePeriods.map((period) => (
              <option key={period.key} value={period.key}>
                {new Date(period.year, period.month - 1, 1).toLocaleDateString("es-PE", {
                  month: "long",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
          <button onClick={onLock} title="Bloquear" className="btn-icon" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", color: C.textDim, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>🔒</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-content">
        {/* TABS — mobile/tablet only */}
        <div className="tab-bar">
          {[
            { id: "dashboard", label: "Resumen" },
            { id: "budget", label: "Presupuesto" },
            { id: "transactions", label: "Movimientos" },
            { id: "goals", label: "Metas" },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setView(tab.id); setSelectedCat(null); }} className="tab-bar__btn" style={{
              background: view===tab.id?C.accentDim:"transparent",
              color: view===tab.id?C.accent:C.textDim,
            }}>{tab.label}</button>
          ))}
        </div>

        {/* VIEW */}
        {view === "dashboard" && <DashboardView />}
        {view === "budget" && <BudgetView />}
        {view === "transactions" && <TransactionsView />}
        {view === "goals" && <GoalsView />}
      </div>

      {/* BOTTOM NAV — mobile/tablet only */}
      <div className="bottom-nav" style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <button onClick={() => setShowChat(true)} className="bottom-nav__btn bottom-nav__btn--accent" style={{ color: C.accent }}>
          <span style={{ fontSize: 20 }}>🐾</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Chat</span>
        </button>
        <ShowAddButton />
        <button onClick={toggleTheme} className="bottom-nav__btn" style={{ color: C.textDim }}>
          <span style={{ fontSize: 20 }}>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{theme === "dark" ? "Claro" : "Oscuro"}</span>
        </button>
        <button onClick={onLock} className="bottom-nav__btn" style={{ color: C.textDim }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Bloquear</span>
        </button>
      </div>

      {/* MODALS */}
      {showAdd && <QuickAdd />}
      {showChat && <ChatPanel />}
    </div>
  );
}

function ShowAddButton() {
  const { setShowAdd } = useUI();
  return (
    <button onClick={() => setShowAdd(true)} className="fab" style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`, color: C.bg, boxShadow: `0 4px 20px ${C.accentDim}` }}>+</button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <UIProvider>
          <AppShell />
        </UIProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
