import { useEffect, useRef, useState } from "react";
import { C } from "../../utils/colors.js";
import { LOCKOUT_DURATION, MAX_ATTEMPTS } from "../../config.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function PinLockScreen() {
  const { checkingStatus, needsSetup, pinLength, statusError, setPinLength, authenticate, bootstrap } = useAuth();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(null);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (checkingStatus) return;
    setConfirmPin(null);
    setPin(["", "", "", "", "", ""]);
    setError("");
    setAttempts(0);
    setLockedUntil(null);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [checkingStatus, needsSetup, pinLength]);

  useEffect(() => {
    if (!lockedUntil) return;
    const iv = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        setAttempts(0);
        setError("");
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [lockedUntil]);

  const resetPin = () => {
    setPin(["", "", "", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleInput = (index, value) => {
    if (lockedUntil || !/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");
    if (value && index < pinLength - 1) inputRefs.current[index + 1]?.focus();
    const entered = newPin.slice(0, pinLength).join("");
    if (entered.length === pinLength && newPin.slice(0, pinLength).every((digit) => digit !== "")) {
      setTimeout(() => handleSubmit(entered), 150);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      const nextPin = [...pin];
      nextPin[index - 1] = "";
      setPin(nextPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (entered) => {
    if (submitting) return;

    if (needsSetup) {
      if (!confirmPin) {
        setConfirmPin(entered);
        resetPin();
        return;
      }

      if (entered !== confirmPin) {
        setError("Los PINs no coinciden");
        triggerShake();
        setConfirmPin(null);
        resetPin();
        return;
      }
    }

    setSubmitting(true);

    try {
      if (needsSetup) {
        await bootstrap(entered, pinLength);
      } else {
        await authenticate(entered);
      }
      setAttempts(0);
      setError("");
    } catch (authError) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      triggerShake();
      const message = authError instanceof Error ? authError.message : "No se pudo autenticar";
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION);
        setError("Demasiados intentos. Espera 60s.");
      } else {
        setError(message);
      }
      if (needsSetup) {
        setConfirmPin(null);
      }
      resetPin();
    } finally {
      setSubmitting(false);
    }
  };

  const lockSec = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;

  if (checkingStatus) {
    return (
      <div style={{ background: C.bg, height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textDim, fontSize: "var(--text-base)" }}>🐾 Cargando seguridad...</div>
      </div>
    );
  }

  return (
    <div className="pin-screen">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: "clamp(40px, 12vw, 52px)", marginBottom: 8 }}>🐾</div>
        <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: C.text, letterSpacing: -1 }}>Fang</div>
        <div style={{ fontSize: "var(--text-xs)", color: C.textDim, marginTop: 4 }}>
          {needsSetup ? (confirmPin ? "Confirma el PIN del backend" : "Configura el PIN seguro del backend") : "Ingresa tu PIN"}
        </div>
      </div>

      {statusError && (
        <div style={{ background: C.redDim, border: `1px solid ${C.redSubtle}`, borderRadius: 10, padding: "10px 20px", marginBottom: 16, textAlign: "center", width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: "var(--text-sm)", color: C.red, fontWeight: 500 }}>{statusError}</div>
        </div>
      )}

      {needsSetup && !confirmPin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[4, 5, 6].map((len) => (
            <button
              key={len}
              onClick={() => { setPinLength(len); resetPin(); }}
              className="btn-icon"
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: `1px solid ${pinLength === len ? C.accent : C.border}`,
                background: pinLength === len ? C.accentDim : "transparent",
                color: pinLength === len ? C.accent : C.textDim,
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {len} dígitos
            </button>
          ))}
        </div>
      )}

      <div className="pin-inputs" style={{ animation: shake ? "shake 0.4s ease-in-out" : "none" }}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <div key={index} style={{ position: "relative" }}>
            <input
              ref={(element) => { inputRefs.current[index] = element; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[index]}
              onChange={(event) => handleInput(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              disabled={Boolean(lockedUntil) || submitting}
              autoComplete="off"
              className="pin-input"
              style={{
                background: pin[index] ? C.accentDim : C.card,
                border: `2px solid ${pin[index] ? C.accent : error ? C.redMedium : C.border}`,
                color: C.text,
              }}
              onFocus={(event) => { event.target.style.borderColor = C.accent; }}
              onBlur={(event) => { if (!pin[index]) event.target.style.borderColor = error ? C.redMedium : C.border; }}
            />
            {pin[index] && <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: C.accent }} />}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: C.redDim, border: `1px solid ${C.redSubtle}`, borderRadius: 10, padding: "10px 20px", marginBottom: 16, textAlign: "center", width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: "var(--text-sm)", color: C.red, fontWeight: 500 }}>{error}</div>
          {lockedUntil && <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: C.red, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{lockSec}s</div>}
        </div>
      )}

      {!needsSetup && attempts > 0 && !lockedUntil && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {Array.from({ length: MAX_ATTEMPTS }).map((_, index) => (
            <div key={index} style={{ width: 8, height: 8, borderRadius: "50%", background: index < attempts ? C.red : C.border, transition: "background 0.3s" }} />
          ))}
        </div>
      )}

      <div style={{ fontSize: "var(--text-xs)", color: C.textMuted, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
        {needsSetup
          ? "El PIN se guarda en el backend y se usa para emitir un token corto en cada desbloqueo."
          : "El frontend ya no guarda una llave maestra. Cada sesión usa un token temporal."}
      </div>
      <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-12px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-8px); } 80% { transform: translateX(6px); } }`}</style>
    </div>
  );
}
