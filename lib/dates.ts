// Dates are entered and stored day-first ("DD/MM/YYYY"), the Irish order.
// Older reports saved "YYYY-MM-DD"; both are read, and the backend accepts both.

/** A Date (local midnight) for "DD/MM/YYYY" or legacy "YYYY-MM-DD", or null if not a real date. */
export function parseDMY(s: string | null | undefined): Date | null {
  const t = String(s ?? '').trim();
  let d: number, m: number, y: number;
  let match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (match) {
    [d, m, y] = [+match[1], +match[2], +match[3]];
  } else if ((match = /^(\d{4})-(\d{2})-(\d{2})/.exec(t))) {
    [y, m, d] = [+match[1], +match[2], +match[3]];
  } else {
    return null;
  }
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

/** "DD/MM/YYYY" for a Date (local time). */
export function formatDMY(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** A stored date shown day-first; text that isn't a date is returned as typed. */
export function displayDMY(s: string | null | undefined): string {
  const d = parseDMY(s);
  return d ? formatDMY(d) : String(s ?? '').trim();
}

/** Today as "DD/MM/YYYY" (local date, not UTC, so it is right just after midnight). */
export function todayDMY(): string {
  return formatDMY(new Date());
}
