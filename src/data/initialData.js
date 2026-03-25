export const INITIAL_ACCOUNTS = [
  { _id: "69b260853c1e46ea44d12deb", name: "BCP-YAPE", type: "bank", currency: "PEN", balance: 636, credit_limit: null },
  { _id: "69b2e9313c1e46ea44d12dec", name: "Interbank Crédito", type: "credit_card", currency: "PEN", balance: 0, credit_limit: 3000 },
  { _id: "69b2e9313c1e46ea44d12ded", name: "BCP Crédito", type: "credit_card", currency: "PEN", balance: 1661.79, credit_limit: 3000 },
  { _id: "69b2e9313c1e46ea44d12dee", name: "IO Crédito", type: "credit_card", currency: "PEN", balance: 323.53, credit_limit: 2000 },
  { _id: "69b2f083df0ec27eeb047b9c", name: "Interbank Débito", type: "bank", currency: "PEN", balance: 6000 },
  { _id: "69b2f083df0ec27eeb047b9d", name: "Dólares BCP", type: "cash", currency: "USD", balance: 45 },
  { _id: "69b2f083df0ec27eeb047b9e", name: "Dólares Scotiabank", type: "cash", currency: "USD", balance: 10 },
  { _id: "69b2f0b3df0ec27eeb047b9f", name: "Scotiabank Crédito", type: "credit_card", currency: "USD", balance: 0, credit_limit: 400 },
];

export const INITIAL_TRACKING = {
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

export const INITIAL_TRANSACTIONS = [
  { date: "2026-03-13", amount: 32, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b260853c1e46ea44d12deb", description: "Almuerzo" },
  { date: "2026-03-11", amount: 32, category_slug: "food", subcategory_slug: "restaurante", account_id: "69b260853c1e46ea44d12deb", description: "Almuerzo" },
];

export const GOALS = [
  { name: "Préstamo 1", target: 18812.2, current: 15629.24, date: "2029-11-01", payment: 427.55, installment: "16/60" },
  { name: "Préstamo 2", target: 38255.78, current: 33090.15, date: "2029-01-01", payment: 1125.17, installment: "14/48" },
];
