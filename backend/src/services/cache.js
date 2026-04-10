// Cache simples em memória com TTL
const store = new Map();

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data, ttlMinutes = 10) {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  });
}

export function clearCache() {
  store.clear();
}
