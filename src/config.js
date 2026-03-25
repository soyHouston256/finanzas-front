export const API_URL = "https://api.anthropic.com/v1/messages";
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export const LOCK_TIMEOUT = 5 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 60 * 1000;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
