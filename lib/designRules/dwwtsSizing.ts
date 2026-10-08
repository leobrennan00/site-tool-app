// Pure sizing calculations for DWWTS recommendations — no React, no
// network, nothing but arithmetic against lib/designRules/epaCop2021.ts.
// Every function returns a `value` (or null, when the rules don't cover
// the input — "enter manually", never a guess) plus a one-line `reason`
// suitable for display under the suggested field.
import {
  PE_FROM_BEDROOMS,
  DAILY_LOAD_PER_PE_LITRES,
  RESULT_BANDS,
  LOADING_RATE_BY_BAND,
  POLISHING_TRENCH_M_PER_PE_BY_BAND,
  POLISHING_TRENCH_MAX_LENGTH_M,
  SEPTIC_TRENCH_M_PER_PE,
  SEPTIC_TRENCH_MAX_LENGTH_M,
  SEPTIC_TRENCH_MAX_RESULT,
  ENTER_MANUALLY_REASON,
  OUT_OF_RANGE_REASON,
  DWWTS_INSTALL_OPTIONS,
  SLOPE_OPTIONS,
  PARAGRAPH_TEMPLATES,
  ParagraphTemplateKey,
} from './epaCop2021';

export interface Suggestion<T> {
  value: T | null;
  reason: string;
}

function round(n: number, dp = 1): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

/** Rule 1 — design P.E. from bedroom count. */
export function peFromBedrooms(bedrooms: number): Suggestion<number> {
  if (!Number.isFinite(bedrooms) || bedrooms < 1) {
    return { value: null, reason: 'Enter number of bedrooms to suggest a design P.E.' };
  }
  const pe = PE_FROM_BEDROOMS[Math.floor(bedrooms)];
  if (pe == null) {
    return { value: null, reason: `${bedrooms} bedrooms is outside the EPA CoP 2021 table — enter manually.` };
  }
  return { value: pe, reason: `${bedrooms} bedroom(s) → design P.E. ${pe} (EPA CoP 2021 table).` };
}

/** Rule 2 — daily hydraulic load in litres. */
export function dailyLoadLitres(pe: number): number {
  return pe * DAILY_LOAD_PER_PE_LITRES;
}

/** Rule 3 — which result band a given average subsurface percolation
 *  value (min/25mm) falls into. Null (with reason) if outside 3-90. */
export function resultBand(ssPV: number): Suggestion<string> {
  if (!Number.isFinite(ssPV) || ssPV < 3 || ssPV > 90) {
    return { value: null, reason: OUT_OF_RANGE_REASON };
  }
  const band = RESULT_BANDS.find((b) => ssPV >= b.min && ssPV <= b.max);
  if (!band) return { value: null, reason: OUT_OF_RANGE_REASON };
  return { value: band.key, reason: `Percolation result ${ssPV} falls in band ${band.key}.` };
}

/** Rule 4 — soil polishing filter loading rate (L/m2/day) for a band. */
export function loadingRateForBand(band: string): Suggestion<number> {
  const rate = LOADING_RATE_BY_BAND[band];
  if (rate == null) return { value: null, reason: ENTER_MANUALLY_REASON };
  return { value: rate, reason: `Band ${band} → loading rate ${rate} L/m2/day (EPA CoP 2021).` };
}

/** Rule 5 — soil polishing filter area = daily load / loading rate. */
export function polishingFilterArea(pe: number, ssPV: number): Suggestion<number> {
  const band = resultBand(ssPV);
  if (!band.value) return { value: null, reason: band.reason };
  const rate = loadingRateForBand(band.value);
  if (rate.value == null) return { value: null, reason: rate.reason };
  const load = dailyLoadLitres(pe);
  const area = round(load / rate.value, 1);
  return {
    value: area,
    reason: `${pe} P.E. x ${DAILY_LOAD_PER_PE_LITRES} L / ${rate.value} L/m2/day (band ${band.value}) = ${area} m2`,
  };
}

/** Rule 6 — polishing filter trenches: total length + trench count. */
export function polishingTrenchLength(
  pe: number,
  ssPV: number
): Suggestion<{ totalM: number; trenchCount: number }> {
  const band = resultBand(ssPV);
  if (!band.value) return { value: null, reason: band.reason };
  const mPerPe = POLISHING_TRENCH_M_PER_PE_BY_BAND[band.value];
  if (mPerPe == null) return { value: null, reason: ENTER_MANUALLY_REASON };
  const totalM = round(mPerPe * pe, 1);
  const trenchCount = Math.ceil(totalM / POLISHING_TRENCH_MAX_LENGTH_M);
  return {
    value: { totalM, trenchCount },
    reason: `${mPerPe} m per P.E. x ${pe} P.E. = ${totalM} m total (max ${POLISHING_TRENCH_MAX_LENGTH_M} m/trench ⇒ ${trenchCount} trench(es))`,
  };
}

/** Rule 7 — septic tank percolation trenches: only valid for results 3-50. */
export function septicTrenchLength(
  pe: number,
  ssPV: number
): Suggestion<{ totalM: number; trenchCount: number }> {
  const band = resultBand(ssPV);
  if (!band.value) return { value: null, reason: band.reason };
  if (ssPV > SEPTIC_TRENCH_MAX_RESULT) {
    return {
      value: null,
      reason: `Septic tank percolation area only applies to results up to ${SEPTIC_TRENCH_MAX_RESULT} — enter manually.`,
    };
  }
  const totalM = round(SEPTIC_TRENCH_M_PER_PE * pe, 1);
  const trenchCount = Math.ceil(totalM / SEPTIC_TRENCH_MAX_LENGTH_M);
  return {
    value: { totalM, trenchCount },
    reason: `${SEPTIC_TRENCH_M_PER_PE} m per P.E. x ${pe} P.E. = ${totalM} m total (max ${SEPTIC_TRENCH_MAX_LENGTH_M} m/trench ⇒ ${trenchCount} trench(es))`,
  };
}

/**
 * Which of the 4 paragraph templates applies, based on the system the
 * assessor selected in "Propose to install" and — only for the secondary
 * treatment + polishing filter option, which can be built either way — the
 * recorded site slope. Returns null when the assessor hasn't chosen a
 * system yet, or (for the secondary option) hasn't recorded a slope: in
 * either case there's nothing to suggest and the assessor picks manually.
 */
export function pickParagraphTemplateKey(
  dwwtsInstall: string,
  slope: string
): ParagraphTemplateKey | null {
  if (dwwtsInstall === DWWTS_INSTALL_OPTIONS.septicTank) return 'septicTank';
  if (dwwtsInstall === DWWTS_INSTALL_OPTIONS.tertiary) return 'tertiaryTreatment';
  if (dwwtsInstall === DWWTS_INSTALL_OPTIONS.secondaryAndPolishingFilter) {
    if (slope === SLOPE_OPTIONS.steep || slope === SLOPE_OPTIONS.shallow) return 'percolationTrenches';
    if (slope === SLOPE_OPTIONS.relativelyFlat) return 'soilPolishingFilter';
    return null;
  }
  return null;
}

/** Fills {pe}/{band}/{area}/{loading_rate} placeholders. Any value not
 *  available yet (e.g. area is "Enter manually") renders as "—" rather
 *  than leaving the literal placeholder text in the paragraph. */
export function renderParagraphTemplate(
  key: ParagraphTemplateKey,
  values: { pe?: number | null; band?: string | null; area?: number | null; loadingRate?: number | null }
): string {
  const fmt = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));
  return PARAGRAPH_TEMPLATES[key]
    .replace('{pe}', fmt(values.pe))
    .replace('{band}', fmt(values.band))
    .replace('{area}', fmt(values.area))
    .replace('{loading_rate}', fmt(values.loadingRate));
}
