export async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode("fang_salt_2026_" + pin);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
