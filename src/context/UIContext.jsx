import { useState, createContext, useContext, useCallback } from "react";

const UIContext = createContext(null);

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function UIProvider({ children }) {
  const [view, setView] = useState("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  return (
    <UIContext.Provider value={{ view, setView, showAdd, setShowAdd, showChat, setShowChat, selectedCat, setSelectedCat, refreshKey, setRefreshKey, theme, toggleTheme }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
