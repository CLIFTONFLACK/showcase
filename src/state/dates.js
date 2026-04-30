export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function fmt(n) {
  return n.toLocaleString('en-GB');
}

export function formatShortDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Returns a { h, m } countdown until 24h after the given ISO timestamp.
 * If already past 24h, returns { h: 0, m: 0 }.
 */
export function hoursRemainingUntil24h(fromIso) {
  if (!fromIso) return { h: 0, m: 0 };
  const elapsedMs = Date.now() - new Date(fromIso).getTime();
  const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsedMs);
  const totalMin = Math.floor(remainingMs / 60_000);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}
