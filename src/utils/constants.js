export const CATEGORY_ICONS = { food: "🍽️", transport: "🚗", health: "💊", entertainment: "🎮", education: "📚", services: "🔌", clothing: "👕", debt: "💳", housing: "🏠", savings: "🐷", other_expense: "📦", salary: "💰", comision: "🏦", accesorio_tech: "💻" };
export const CATEGORY_NAMES = { food: "Alimentación", transport: "Transporte", health: "Salud", entertainment: "Entretenimiento", education: "Educación", services: "Servicios", clothing: "Ropa", debt: "Deudas", housing: "Vivienda", savings: "Ahorro", other_expense: "Otros", salary: "Ingreso", comision: "Comisiones", accesorio_tech: "Accesorios Tech" };
export const SUBCATEGORY_NAMES = { mercado: "Mercado", restaurante: "Restaurante", delivery: "Delivery", snacks: "Snacks", gasolina: "Gasolina", uber: "Uber", transporte_publico: "Transp. Público", medicamentos: "Medicamentos", consultas: "Consultas", gym: "Gym", streaming: "Streaming", salidas: "Salidas", juegos: "Juegos", cursos: "Cursos", libros: "Libros", plataformas: "Plataformas", internet: "Internet", luz: "Luz", agua: "Agua", telefono: "Teléfono", suscripciones: "Suscripciones", ropa: "Ropa", higiene: "Higiene", corte: "Corte", prestamos: "Préstamos", tarjeta_credito: "Tarjeta Créd.", otros_deudas: "Otros", renta: "Renta", mantenimiento: "Mantenimiento", fondo_emergencia: "Fondo Emerg.", meta_especifica: "Meta Específica", salary: "Ingreso", comision: "Comisión", accesorio_tech: "Accesorio Tech" };
export const INCOME_CATEGORIES = new Set(["salary", "income", "bonus", "refund", "interest"]);

export function humanizeSlug(slug) {
  if (!slug) return "Sin categoría";
  return slug
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isIncomeCategory(slug) {
  return INCOME_CATEGORIES.has(slug);
}

export function getCategoryName(slug) {
  return CATEGORY_NAMES[slug] || humanizeSlug(slug);
}

export function getCategoryIcon(slug) {
  if (CATEGORY_ICONS[slug]) return CATEGORY_ICONS[slug];
  return isIncomeCategory(slug) ? "💰" : "📦";
}

export function getSubcategoryName(slug) {
  return SUBCATEGORY_NAMES[slug] || humanizeSlug(slug);
}
export const ACCOUNT_MAP = { "69b260853c1e46ea44d12deb": { name: "BCP-YAPE", icon: "🏦" }, "69b2e9313c1e46ea44d12dec": { name: "Interbank TC", icon: "💳" }, "69b2e9313c1e46ea44d12ded": { name: "BCP TC", icon: "💳" }, "69b2e9313c1e46ea44d12dee": { name: "IO TC", icon: "💳" }, "69b2f083df0ec27eeb047b9c": { name: "Interbank Déb.", icon: "🏦" }, "69b2f083df0ec27eeb047b9d": { name: "USD BCP", icon: "💵" }, "69b2f083df0ec27eeb047b9e": { name: "USD Scotia", icon: "💵" }, "69b2f0b3df0ec27eeb047b9f": { name: "Scotia TC USD", icon: "💵" } };
export const ACCOUNT_ORDER = [
  "69b260853c1e46ea44d12deb",
  "69b2f083df0ec27eeb047b9c",
  "69b2e9313c1e46ea44d12ded",
  "69b2e9313c1e46ea44d12dee",
  "69b2e9313c1e46ea44d12dec",
  "69b2f083df0ec27eeb047b9d",
  "69b2f083df0ec27eeb047b9e",
  "69b2f0b3df0ec27eeb047b9f",
];
