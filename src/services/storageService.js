export const PIN_KEY = "fang_pin_hash";
export const PIN_LENGTH_KEY = "fang_pin_length";

export async function storageGet(key) {
  return window.storage.get(key);
}

export async function storageSet(key, value) {
  return window.storage.set(key, value);
}
