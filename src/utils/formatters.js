export const fmt = (n, cur = "PEN") => `${cur === "USD" ? "$" : "S/"}${Math.abs(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (d) => new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
export const statusIcon = (p) => p >= 100 ? "🚨" : p >= 80 ? "⚠️" : "✅";
