// Percolation test arithmetic (EPA CoP 2021, Annex B forms 3.3(a)/3.3(b)).
// Pure functions — no React, no network — so the screens, the Conclusion
// auto-fills and the unit tests (tests/percolation.test.ts) all share one
// implementation. The backend mirrors these rules in percolation.py and is
// checked against the same cases (tests/percolation_cases.json).
//
// Rules that matter for accuracy:
//  - Times are 24h "HH:mm". A finish earlier than its start is flagged,
//    never silently wrapped to the next day.
//  - A hole only produces a value when every fill/band in it is valid.
//    A hole with some but not all readings is reported as incomplete (with
//    the reason) instead of quietly vanishing from the average.
//  - The overall average uses complete holes only and says how many of the
//    holes it covers; `complete` is false whenever any hole is missing.
//  - Values are carried unrounded and only rounded for display.

/** Time factors T_f for the four 50 mm bands 300→250, 250→200, 200→150, 150→100 mm. */
export const TF_FACTORS = [8.1, 9.7, 11.9, 14.1] as const;
export const BAND_LABELS = ['300→250', '250→200', '200→150', '150→100'] as const;

/** Minutes since midnight for a 24h "H:mm"/"HH:mm" string, or null if not a valid time. */
export function parseHHMM(t: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
  if (!m) return null;
  const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** "HH:mm" for a Date (local time). */
export function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export type Span = {
  /** Elapsed minutes, or null when either end is missing/invalid. */
  minutes: number | null;
  /** True when both ends are blank (nothing recorded yet). */
  empty: boolean;
  /** Why `minutes` is null even though something was recorded. */
  issue: string | null;
};

export function span(start: string | null | undefined, finish: string | null | undefined): Span {
  const s = String(start ?? '').trim();
  const f = String(finish ?? '').trim();
  if (!s && !f) return { minutes: null, empty: true, issue: null };
  if (!s) return { minutes: null, empty: false, issue: 'start time missing' };
  if (!f) return { minutes: null, empty: false, issue: 'finish time missing' };
  const sm = parseHHMM(s), fm = parseHHMM(f);
  if (sm == null) return { minutes: null, empty: false, issue: `start "${s}" is not a 24h time (HH:mm)` };
  if (fm == null) return { minutes: null, empty: false, issue: `finish "${f}" is not a 24h time (HH:mm)` };
  if (fm < sm) return { minutes: null, empty: false, issue: `finish ${f} is before start ${s}` };
  if (fm === sm) return { minutes: null, empty: false, issue: 'finish is the same as start' };
  return { minutes: fm - sm, empty: false, issue: null };
}

export type HoleStatus = 'complete' | 'incomplete' | 'empty';

export type HoleResult = {
  status: HoleStatus;
  /** The hole's value (t_s, T-value or T100) — null unless status is 'complete'. */
  value: number | null;
  /** Human-readable problems, e.g. "Fill 3: finish time missing". */
  issues: string[];
  /** How `value` was worked out, e.g. "(42 + 45 + 47) / 3 = 44.67 min; 44.67 / 4 = 11.17". */
  formula: string | null;
};

export const fmt2 = (n: number) => n.toFixed(2);
const sumOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function holeStatus(spans: Span[], label: (i: number) => string): Pick<HoleResult, 'status' | 'issues'> {
  if (spans.every((s) => s.empty)) return { status: 'empty', issues: [] };
  const issues: string[] = [];
  spans.forEach((s, i) => {
    if (s.empty) issues.push(`${label(i)}: not recorded`);
    else if (s.issue) issues.push(`${label(i)}: ${s.issue}`);
  });
  return { status: issues.length ? 'incomplete' : 'complete', issues };
}

/** Step 4 standard method: three fills, Δt per fill, t_s = mean(Δt) / 4. */
export function standardHole(fills: { start: string; finish: string }[]) {
  const spans = fills.map((f) => span(f.start, f.finish));
  const { status, issues } = holeStatus(spans, (i) => `Fill ${i + 1}`);
  const deltas = spans.map((s) => s.minutes);
  if (status !== 'complete') {
    return { status, issues, value: null, formula: null, deltas, avgDelta: null as number | null };
  }
  const ds = deltas as number[];
  const avgDelta = sumOf(ds) / ds.length;
  const ts = avgDelta / 4;
  const formula = `Δt = (${ds.join(' + ')}) / ${ds.length} = ${fmt2(avgDelta)} min;  t = ${fmt2(avgDelta)} / 4 = ${fmt2(ts)}`;
  return { status, issues, value: ts, formula, deltas, avgDelta };
}

export type BandCalc = { tm: number | null; k: number | null; t: number | null };

/**
 * Step 5 modified method: four 50 mm bands. For each band
 *   K = T_f / T_m  and  T = 4.45 / K  (= 4.45 × T_m / T_f),
 * and the hole's T-value is the mean of the four band T's.
 */
export function modifiedHole(bands: { start: string; finish: string }[]) {
  const spans = bands.map((b) => span(b.start, b.finish));
  const { status, issues } = holeStatus(spans, (i) => `Band ${BAND_LABELS[i] ?? i + 1} mm`);
  const calcs: BandCalc[] = spans.map((s, i) => {
    if (s.minutes == null) return { tm: null, k: null, t: null };
    const k = TF_FACTORS[i] / s.minutes;
    return { tm: s.minutes, k, t: 4.45 / k };
  });
  if (status !== 'complete') return { status, issues, value: null, formula: null, bands: calcs };
  const ts = calcs.map((c) => c.t as number);
  const value = sumOf(ts) / ts.length;
  const formula = `T = (${ts.map(fmt2).join(' + ')}) / ${ts.length} = ${fmt2(value)}`;
  return { status, issues, value, formula, bands: calcs };
}

/** Step 3: T100 = minutes for the water to fall from 400 mm to 300 mm. */
export function t100Hole(fillTime: string, waterLevelTime: string): HoleResult {
  const s = span(fillTime, waterLevelTime);
  if (s.empty) return { status: 'empty', value: null, issues: [], formula: null };
  if (s.issue) return { status: 'incomplete', value: null, issues: [s.issue], formula: null };
  return { status: 'complete', value: s.minutes, issues: [], formula: `${fillTime.trim()} → ${waterLevelTime.trim()} = ${s.minutes} min` };
}

export type OverallResult = {
  value: number | null;
  /** False when any hole is missing or incomplete — the value then covers fewer holes. */
  complete: boolean;
  holesUsed: number;
  holesTotal: number;
  /** e.g. "(11.17 + 12.00) / 2 = 11.58 — holes 1, 2 only" */
  formula: string | null;
  /** One line per hole that was left out and why. */
  warnings: string[];
};

/** Mean of the complete holes' values, reporting which holes were left out and why. */
export function overallResult(holes: { status: HoleStatus; value: number | null; issues: string[] }[]): OverallResult {
  const used = holes.map((h, i) => ({ h, n: i + 1 })).filter(({ h }) => h.status === 'complete' && h.value != null);
  const warnings: string[] = [];
  holes.forEach((h, i) => {
    if (h.status === 'empty') warnings.push(`Hole ${i + 1}: no readings`);
    else if (h.status === 'incomplete') warnings.push(`Hole ${i + 1}: ${h.issues.join('; ')}`);
  });
  if (!used.length) {
    return { value: null, complete: false, holesUsed: 0, holesTotal: holes.length, formula: null, warnings: holes.every((h) => h.status === 'empty') ? [] : warnings };
  }
  const vals = used.map(({ h }) => h.value as number);
  const value = sumOf(vals) / vals.length;
  const complete = used.length === holes.length;
  let formula = `(${vals.map(fmt2).join(' + ')}) / ${vals.length} = ${fmt2(value)}`;
  if (!complete) formula += ` — hole${used.length > 1 ? 's' : ''} ${used.map((u) => u.n).join(', ')} only`;
  return { value, complete, holesUsed: used.length, holesTotal: holes.length, formula, warnings };
}

/** Round to 2 dp for storing alongside the raw times (display / legacy fields). */
export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Above this T100 (minutes) the percolation value is >90: unsuitable. */
export const T100_UNSUITABLE = 300;
/** Up to this T100 the standard method applies; above it, the modified method. */
export const T100_STANDARD_MAX = 210;

/**
 * Which percolation result to report, from the average T100 (EPA CoP form
 * 3.3): T100 ≤ 210 → standard method; 210 < T100 ≤ 300 → modified method;
 * T100 > 300 → value above 90 (reported as 91, unsuitable). With no T100
 * entered, `fallbackToAny` returns whichever method has a result (subsurface
 * historically did this); otherwise there is no value yet.
 */
export function pickPercolationValue(
  avgT100: number | null,
  standard: number | null,
  modified: number | null,
  fallbackToAny = false,
): number | null {
  if (avgT100 == null) return fallbackToAny ? (standard ?? modified ?? null) : null;
  if (avgT100 > T100_UNSUITABLE) return 91;
  return avgT100 <= T100_STANDARD_MAX ? standard : modified;
}

/**
 * Hole fields that are the same for every test hole on a site: the holes are
 * dug to one size, pre-soaked together and filled to 400 mm together (true in
 * all 21 of Enda's reports). The time at 300 mm differs per hole, so it isn't here.
 */
export const SHARED_HOLE_FIELDS = [
  'topDepth', 'baseDepth', 'holeDepth', 'dimensions',
  'preSoak1Date', 'preSoak1Time', 'preSoak2Date', 'preSoak2Time',
  'testDate', 'fillTime',
] as const;

type SharedHole = { [K in (typeof SHARED_HOLE_FIELDS)[number]]?: string };

/**
 * After hole 1 is edited (`prev` → `next`), copy each changed shared field to
 * the other holes that are still blank or still hold hole 1's old value, so a
 * hole the assessor has given its own value keeps it. Returns `next`, updated.
 */
export function copyHoleOne<T extends SharedHole>(prev: T[], next: T[]): T[] {
  if (!prev.length || !next.length) return next;
  for (const f of SHARED_HOLE_FIELDS) {
    const oldFirst = prev[0][f] ?? '';
    const newFirst = next[0][f] ?? '';
    if (oldFirst === newFirst) continue;
    for (let i = 1; i < next.length && i < prev.length; i++) {
      const v = prev[i][f] ?? '';
      if (v.trim() === '' || v === oldFirst) next[i] = { ...next[i], [f]: newFirst };
    }
  }
  return next;
}
