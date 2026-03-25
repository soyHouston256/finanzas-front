import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchAccounts,
  fetchGoals,
  fetchTracking,
  fetchTransactions,
  createTransaction as createTransactionRequest,
  updateAccount as updateAccountRequest,
} from "../services/financeApi.js";
import { useAuth } from "./AuthContext.jsx";
import { isIncomeCategory } from "../utils/constants.js";

const FinanceContext = createContext(null);

const EMPTY_TRACKING = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  total_income: 0,
  total_expenses: 0,
  expected_income: 0,
  categories: {},
};

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

function deriveTracking(transactions, existingTracking) {
  if (existingTracking) {
    return existingTracking;
  }

  if (!transactions.length) {
    return EMPTY_TRACKING;
  }

  const latestTxWithDate = transactions.find((tx) => tx?.date);
  if (!latestTxWithDate) {
    return EMPTY_TRACKING;
  }

  const latestDate = new Date(`${latestTxWithDate.date}T12:00:00`);
  const month = latestDate.getMonth() + 1;
  const year = latestDate.getFullYear();

  const currentMonthTransactions = transactions.filter((tx) => {
    if (!tx?.date || typeof tx.amount !== "number") return false;
    const txDate = new Date(`${tx.date}T12:00:00`);
    return txDate.getMonth() + 1 === month && txDate.getFullYear() === year;
  });

  const totals = currentMonthTransactions.reduce(
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
  const [goals, setGoals] = useState([]);
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!unlocked || !token) {
      setAccounts([]);
      setTransactions([]);
      setGoals([]);
      setTrackingRecords([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;

    async function loadFinanceData() {
      setLoading(true);
      setError("");
      try {
        const [accountsData, transactionsData, trackingData, goalsData] = await Promise.all([
          fetchAccounts(),
          fetchTransactions(),
          fetchTracking(),
          fetchGoals(),
        ]);

        if (cancelled) return;

        setAccounts(accountsData || []);
        setTransactions(sortTransactions((transactionsData || []).filter((tx) => typeof tx.amount === "number").map(normalizeTransaction)));
        setTrackingRecords(trackingData || []);
        setGoals(goalsData || []);
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

  const latestTracking = (() => {
    if (!trackingRecords.length) return null;
    return [...trackingRecords].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    })[0];
  })();

  const tracking = deriveTracking(transactions, latestTracking);

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
    const createdTransaction = await createTransactionRequest({
      ...payload,
      amount,
      subcategory_slug: payload.subcategory_slug || "general",
    });

    const nextBalance = Number(account.balance) + getAccountDelta(account, amount, transactionType);
    const updatedAccount = await updateAccountRequest(account._id, { balance: nextBalance });

    setTransactions((prev) => sortTransactions([normalizeTransaction(createdTransaction), ...prev]));
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
        loading,
        error,
        addTransaction,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
