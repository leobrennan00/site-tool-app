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

/** Discharge rate in m³/hr: the daily load spread over 24 hours (6 P.E. → 0.0375, as Enda writes it). */
export function dischargeRateM3PerHour(pe: number): number {
  return round(dailyLoadLitres(pe) / 1000 / 24, 5);
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
): Suggestion<{ totalM: number; trenchCount: number; lengthEach: number }> {
  const band = resultBand(ssPV);
  if (!band.value) return { value: null, reason: band.reason };
  const mPerPe = POLISHING_TRENCH_M_PER_PE_BY_BAND[band.value];
  if (mPerPe == null) return { value: null, reason: ENTER_MANUALLY_REASON };
  const needM = mPerPe * pe;
  const trenchCount = Math.ceil(needM / POLISHING_TRENCH_MAX_LENGTH_M - 1e-9);
  // whole trenches of equal length, rounded up to the next 0.5m (as in Enda's
  // reports: 48m needed -> 5 trenches x 10m = 50m)
  const lengthEach = Math.ceil((needM / trenchCount) * 2 - 1e-9) / 2;
  const totalM = round(trenchCount * lengthEach, 1);
  return {
    value: { totalM, trenchCount, lengthEach },
    reason: `${mPerPe} m per P.E. x ${pe} P.E. = ${round(needM, 1)} m needed ⇒ ${trenchCount} trench(es) x ${lengthEach} m = ${totalM} m`,
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
