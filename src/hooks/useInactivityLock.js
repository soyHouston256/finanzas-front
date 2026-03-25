import { useEffect, useCallback, useRef } from "react";
import { LOCK_TIMEOUT } from "../config.js";

export function useInactivityLock(unlocked, onLock) {
  const lastActivity = useRef(Date.now());
  const lockTimerRef = useRef(null);

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    lockTimerRef.current = setInterval(() => {
      if (Date.now() - lastActivity.current > LOCK_TIMEOUT) { onLock(); }
    }, 10000);
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(lockTimerRef.current);
    };
  }, [unlocked, resetTimer, onLock]);

  return { resetTimer, lastActivity };
}
