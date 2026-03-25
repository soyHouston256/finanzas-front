import { createContext, useContext, useEffect, useState } from "react";
import { bootstrapPin, fetchAuthStatus, loginWithPin, setAuthToken } from "../services/financeApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [token, setToken] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [pinLength, setPinLength] = useState(4);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      setCheckingStatus(true);
      try {
        const status = await fetchAuthStatus();
        if (cancelled) return;
        setNeedsSetup(status.needsSetup);
        setPinLength(status.pinLength || 4);
        setStatusError("");
      } catch (error) {
        if (!cancelled) {
          setStatusError(error instanceof Error ? error.message : "No se pudo consultar la seguridad del backend.");
        }
      } finally {
        if (!cancelled) {
          setCheckingStatus(false);
        }
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  async function authenticate(pin) {
    const session = await loginWithPin(pin);
    setAuthToken(session.accessToken);
    setToken(session.accessToken);
    setUnlocked(true);
    setNeedsSetup(false);
    return session;
  }

  async function bootstrap(pin, nextPinLength) {
    const session = await bootstrapPin({ pin, pinLength: nextPinLength });
    setAuthToken(session.accessToken);
    setToken(session.accessToken);
    setPinLength(nextPinLength);
    setUnlocked(true);
    setNeedsSetup(false);
    return session;
  }

  function lock() {
    setAuthToken("");
    setToken("");
    setUnlocked(false);
  }

  return (
    <AuthContext.Provider
      value={{
        unlocked,
        token,
        checkingStatus,
        needsSetup,
        pinLength,
        statusError,
        setPinLength,
        authenticate,
        bootstrap,
        lock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
