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

/** Typing aid for a date box: plain digits get the slashes put in as they are
 *  typed ("2508" → "25/08", "25082026" → "25/08/2026"); anything typed with
 *  its own separators is left as it is for parseDMY to read. */
export function maskDMY(text: string): string {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return text;
  const d = t.slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Typing aid for a 24-hour time box: four digits become "HH:MM" ("1030" →
 *  "10:30"); fewer are left alone while typing, since "930" may still become
 *  "0930". See finishHHMM for what a short entry means once the box is left. */
export function maskHHMM(text: string): string {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return text;
  const d = t.slice(0, 4);
  return d.length === 4 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

/** A finished time entry as "HH:MM": "930" → "09:30", "9:5" stays invalid,
 *  "9:30" → "09:30". Null when it isn't a real time. */
export function finishHHMM(text: string): string | null {
  const t = text.trim();
  const m = /^(\d{1,2}):?(\d{2})$/.exec(t);
  if (!m) return null;
  const h = +m[1], min = +m[2];
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" (what a browser date input uses) for a Date, local time. */
export function formatISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
