import { BACKEND_URL } from "../config.js";

let authToken = "";

export function setAuthToken(token) {
  authToken = token || "";
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = payload?.message || payload?.error || JSON.stringify(payload);
    } catch {
      detail = await response.text();
    }

    const error = new Error(detail || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchAuthStatus() {
  return apiFetch("/auth/status");
}

export function bootstrapPin(payload) {
  return apiFetch("/auth/bootstrap", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginWithPin(pin) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export function fetchAccounts() {
  return apiFetch("/accounts");
}

export function fetchTransactions(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return apiFetch(`/transactions${query ? `?${query}` : ""}`);
}

export function fetchTransactionPeriods() {
  return apiFetch("/transactions/periods");
}

export function fetchTracking() {
  return apiFetch("/tracking");
}

export function fetchGoals() {
  return apiFetch("/goals");
}

export function createTransaction(payload) {
  return apiFetch("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAccount(id, payload) {
  return apiFetch(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
