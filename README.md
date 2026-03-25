# 🐾 Fang App — Personal Finance Dashboard

Dashboard de finanzas personales con PIN de seguridad, conectado a MongoDB (`expense_manager`).

## Features

### 🔐 Seguridad
- **PIN Lock** — PIN de 4-6 dígitos con hash SHA-256
- **Auto-lock** — Se bloquea a los 5 min de inactividad
- **Anti brute-force** — 5 intentos max → lockout 60s
- **Bloqueo manual** — Botón 🔒 en header y bottom nav

### 📊 Vistas
- **Resumen** — Patrimonio neto, cuentas, alertas, últimos movimientos
- **Presupuesto** — Progreso por categoría, click para drill-down
- **Movimientos** — Lista completa de transacciones del mes
- **Metas** — Deuda total, progreso préstamos, proyección payoff

### ⚡ Acciones
- **Botón +** — Modal para registrar gasto/ingreso (via Claude API → MongoDB)
- **🐾 Chat** — Fang chat integrado con contexto financiero real

## Stack
- React (JSX artifact)
- Tailwind-style inline CSS
- Claude API (Sonnet 4) para operaciones de escritura
- MongoDB `expense_manager` via MCP
- `window.storage` para persistencia del PIN

## Datos
La app carga un snapshot estático de la DB de Marzo 2026. Para datos en vivo se necesitaría un backend API frente a MongoDB.

## Cuentas configuradas
| Cuenta | Tipo | Moneda |
|--------|------|--------|
| BCP-YAPE | Débito | PEN |
| Interbank Débito | Débito | PEN |
| BCP Crédito | Tarjeta | PEN |
| IO Crédito | Tarjeta | PEN |
| Interbank Crédito | Tarjeta | PEN |
| Scotiabank Crédito | Tarjeta | USD |
| Dólares BCP | Cash | USD |
| Dólares Scotiabank | Cash | USD |

## Categorías de gasto
food, transport, health, entertainment, education, services, clothing, debt, housing, savings, other_expense
