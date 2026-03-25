import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchAccounts,
  fetchGoals,
  fetchTracking,
  fetchTransactions,
  fetchTransactionPeriods,
  createTransaction as createTransactionRequest,
  updateAccount as updateAccountRequest,
} from "../services/financeApi.js";
import { useAuth } from "./AuthContext.jsx";
import { isIncomeCategory } from "../utils/constants.js";

const FinanceContext = createContext(null);
const TRANSACTIONS_PAGE_SIZE = 40;

const EMPTY_TRACKING = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  total_income: 0,
  total_expenses: 0,
  expected_income: 0,
  categories: {},
};

function getPeriodKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parsePeriodKey(periodKey) {
  const [year, month] = String(periodKey || "").split("-").map(Number);
  return {
    year: Number.isFinite(year) ? year : EMPTY_TRACKING.year,
    month: Number.isFinite(month) ? month : EMPTY_TRACKING.month,
  };
}

function normalizeTransaction(tx) {
  return {
    ...tx,
    amount: typeof tx.amount === "number" ? tx.amount : 0,
    subcategory_slug: tx.subcategory_slug ?? "",
  };
}

function sortTransactions(transactions) {
  return [...transactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (b._id || "").localeCompare(a._id || "");
  });
}

function mergePeriods(trackingRecords, transactionPeriods) {
  const map = new Map();

  trackingRecords.forEach((record) => {
    const key = getPeriodKey(record.year, record.month);
    map.set(key, { key, year: record.year, month: record.month });
  });

  transactionPeriods.forEach((period) => {
    map.set(period.key, period);
  });

  return [...map.values()].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });
}

function deriveTracking(transactions, existingTracking, selectedPeriod) {
  if (existingTracking) {
    return existingTracking;
  }

  const { month, year } = parsePeriodKey(selectedPeriod);
  if (!transactions.length) {
    return {
      ...EMPTY_TRACKING,
      month,
      year,
    };
  }

  const totals = transactions.reduce(
    (acc, tx) => {
      if (isIncomeCategory(tx.category_slug)) {
        acc.total_income += tx.amount;
      } else {
        acc.total_expenses += Math.abs(tx.amount);
        const category = acc.categories[tx.category_slug] || {
          budgeted: 0,
          spent: 0,
          remaining: 0,
          pct_used: 0,
        };
        category.spent += Math.abs(tx.amount);
        category.remaining = category.budgeted - category.spent;
        category.pct_used = category.budgeted > 0 ? Math.round((category.spent / category.budgeted) * 100) : 0;
        acc.categories[tx.category_slug] = category;
      }
      return acc;
    },
    { month, year, total_income: 0, total_expenses: 0, expected_income: 0, categories: {} },
  );

  totals.expected_income = totals.total_income;
  return totals;
}

function getAccountDelta(account, amount, transactionType) {
  const signedAmount = Number(amount) || 0;
  if (account.type === "credit_card") {
    return transactionType === "expense" ? signedAmount : -signedAmount;
  }
  return transactionType === "expense" ? -signedAmount : signedAmount;
}

export function FinanceProvider({ children }) {
  const { unlocked, token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactionPeriods, setTransactionPeriods] = useState([]);
  const [goals, setGoals] = useState([]);
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [transactionsPage, setTransactionsPage] = useState(0);
  const [transactionsHasMore, setTransactionsHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!unlocked || !token) {
      setAccounts([]);
      setTransactions([]);
      setTransactionPeriods([]);
      setGoals([]);
      setTrackingRecords([]);
      setSelectedPeriod("");
      setTransactionsPage(0);
      setTransactionsHasMore(false);
      setLoading(false);
      setLoadingTransactions(false);
      setError("");
      return undefined;
    }

    let cancelled = false;

    async function loadFinanceData() {
      setLoading(true);
      setError("");
      try {
        const [accountsData, trackingData, goalsData, periodsData] = await Promise.all([
          fetchAccounts(),
          fetchTracking(),
          fetchGoals(),
          fetchTransactionPeriods(),
        ]);

        if (cancelled) return;

        setAccounts(accountsData || []);
        setTrackingRecords(trackingData || []);
        setGoals(goalsData || []);
        setTransactionPeriods(periodsData || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la data financiera.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFinanceData();

    return () => {
      cancelled = true;
    };
  }, [token, unlocked]);

  const availablePeriods = mergePeriods(trackingRecords, transactionPeriods);

  useEffect(() => {
    if (!availablePeriods.length) return;
    const hasSelectedPeriod = availablePeriods.some((period) => period.key === selectedPeriod);
    if (!selectedPeriod || !hasSelectedPeriod) {
      setSelectedPeriod(availablePeriods[0].key);
    }
  }, [availablePeriods, selectedPeriod]);

  async function loadTransactionsPage(page, reset = false) {
    if (!selectedPeriod || !token) return;

    const { month, year } = parsePeriodKey(selectedPeriod);
    setLoadingTransactions(true);

    try {
      const response = await fetchTransactions({
        page,
        limit: TRANSACTIONS_PAGE_SIZE,
        month,
        year,
      });

      const nextItems = sortTransactions((response.items || []).map(normalizeTransaction));
      setTransactions((prev) => (reset ? nextItems : sortTransactions([...prev, ...nextItems])));
      setTransactionsPage(response.page || page);
      setTransactionsHasMore(Boolean(response.hasMore));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los movimientos.");
    } finally {
      setLoadingTransactions(false);
    }
  }

  useEffect(() => {
    if (!unlocked || !token || !selectedPeriod) return;
    setTransactions([]);
    setTransactionsPage(0);
    setTransactionsHasMore(false);
    void loadTransactionsPage(1, true);
  }, [selectedPeriod, token, unlocked]);

  async function loadMoreTransactions() {
    if (!transactionsHasMore || loadingTransactions) return;
    await loadTransactionsPage(transactionsPage + 1);
  }

  const selectedPeriodParts = parsePeriodKey(selectedPeriod || availablePeriods[0]?.key);
  const selectedTracking = trackingRecords.find(
    (record) =>
      record.year === selectedPeriodParts.year &&
      record.month === selectedPeriodParts.month,
  );

  const tracking = deriveTracking(transactions, selectedTracking, selectedPeriod || availablePeriods[0]?.key);

  const accountMap = accounts.reduce((acc, account) => {
    acc[account._id] = {
      name: account.name,
      icon: account.type === "credit_card" ? "💳" : account.currency === "USD" ? "💵" : "🏦",
      currency: account.currency,
    };
    return acc;
  }, {});

  async function addTransaction(payload) {
    const account = accounts.find((item) => item._id === payload.account_id);
    if (!account) {
      throw new Error("Cuenta no encontrada.");
    }

    const amount = Number(payload.amount);
    const transactionType = payload.transaction_type || "expense";
    const createdTransaction = normalizeTransaction(
      await createTransactionRequest({
        ...payload,
        amount,
        subcategory_slug: payload.subcategory_slug || "general",
      }),
    );

    const nextBalance = Number(account.balance) + getAccountDelta(account, amount, transactionType);
    const updatedAccount = await updateAccountRequest(account._id, { balance: nextBalance });

    const createdPeriod = getPeriodKey(
      new Date(`${createdTransaction.date}T12:00:00`).getFullYear(),
      new Date(`${createdTransaction.date}T12:00:00`).getMonth() + 1,
    );

    if (createdPeriod === selectedPeriod) {
      setTransactions((prev) => sortTransactions([createdTransaction, ...prev]));
    }

    setAccounts((prev) => prev.map((item) => (item._id === updatedAccount._id ? updatedAccount : item)));

    return createdTransaction;
  }

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        accountMap,
        tracking,
        transactions,
        goals,
        availablePeriods,
        selectedPeriod,
        setSelectedPeriod,
        transactionsHasMore,
        loading,
        loadingTransactions,
        error,
        addTransaction,
        loadMoreTransactions,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
