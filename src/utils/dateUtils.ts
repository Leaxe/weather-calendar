/**
 * Format a Date as a local YYYY-MM-DD string (no UTC conversion).
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get today's date as a local YYYY-MM-DD string.
 */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/**
 * Add days to a YYYY-MM-DD date string, returning a new YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

/**
 * Get the Sunday that starts the week containing the given date.
 */
export function getSunday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return toLocalDateStr(d);
}
