// Postgres jsonb hands objects back with its own key order, so the same
// section can serialise differently depending on whether it came from the
// server or from the app. Comparisons between the two go through these.

/** JSON with object keys sorted, so equal values always give equal strings. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortKeys(v);
    }
    return out;
  }
  return value;
}

/** Deep equality for JSON values, ignoring object key order. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

/** A value with blank fields ('' / null / false / empty lists and objects)
 *  removed from objects. List items keep their places. */
function withoutBlanks(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutBlanks);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = withoutBlanks(v);
      if (isBlank(cleaned)) continue;
      out[k] = cleaned;
    }
    return out;
  }
  return value;
}

function isBlank(v: unknown): boolean {
  if (v === '' || v === null || v === undefined || v === false) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

/** Equal once blank fields are ignored: a form section that only adds empty
 *  boxes to what was saved says the same thing as what was saved. */
export function jsonEquivalent(a: unknown, b: unknown): boolean {
  return stableStringify(withoutBlanks(a)) === stableStringify(withoutBlanks(b));
}
