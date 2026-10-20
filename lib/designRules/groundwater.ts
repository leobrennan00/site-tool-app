// Groundwater vulnerability + Groundwater Protection Response (GWPR) rules.
// Pure functions — no React, no network — so they run offline and can be
// re-run whenever the assessor changes aquifer/vulnerability/SPA on the form.

export type Vulnerability = 'Extreme' | 'High' | 'Moderate' | 'Low';

// GSI Groundwater Vulnerability (1:40k) VUL_CAT codes → EPA category (which
// row of the GWPR table applies) and the label shown to the assessor. "X" is
// GSI's "Rock at or near Surface or Karst" — a sub-class of Extreme, so it
// uses the Extreme row. Its description contains none of the words
// extreme/high/moderate/low, which is why matching on the description text
// left it blank (common in karst areas — e.g. ~40% of points around
// Castlecrine, Co. Clare are X). "Water" (site falls in a water body) has no
// category and stays blank. Same table on the backend: site_checker.py
// VULNERABILITY_CATEGORIES.
export const VULNERABILITY_CATEGORIES: Record<string, { category: Vulnerability; label: string }> = {
  X: { category: 'Extreme', label: 'Extreme (X) – rock at or near surface or karst' },
  E: { category: 'Extreme', label: 'Extreme (E)' },
  H: { category: 'High', label: 'High (H)' },
  M: { category: 'Moderate', label: 'Moderate (M)' },
  L: { category: 'Low', label: 'Low (L)' },
};

/** GSI label for the site point, e.g. "Extreme (X) – rock at or near surface or karst", or null. */
export function vulnerabilityLabelFromGsi(summary: any): string | null {
  const code = String(summary?.raw?.VUL_CAT ?? '').trim().toUpperCase();
  return VULNERABILITY_CATEGORIES[code]?.label ?? null;
}

/** Maps the backend's layer-summary vulnerability object to the form value.
 *  Prefers the GSI category code; falls back to matching the description. */
export function vulnerabilityFromGsi(summary: any): Vulnerability | null {
  if (!summary) return null;
  const code = String(summary?.raw?.VUL_CAT ?? '').trim().toUpperCase();
  if (VULNERABILITY_CATEGORIES[code]) return VULNERABILITY_CATEGORIES[code].category;

  const desc = String(summary.description ?? '').toLowerCase();
  if (desc.includes('rock at or near surface') || desc.includes('karst')) return 'Extreme';
  if (desc.includes('extreme')) return 'Extreme';
  if (desc.includes('high')) return 'High';
  if (desc.includes('moderate')) return 'Moderate';
  if (desc.includes('low')) return 'Low';
  return null;
}

// EPA CoP (DWWTS) Table 2 — Groundwater Protection Responses.
// Priority: SPA Inner (SI) → SPA Outer (SO) → aquifer code column.
const GWPR_TABLE: Record<Vulnerability, Record<string, string>> = {
  Extreme:  { SI: 'R3²', SO: 'R3¹', Rk: 'R2²', 'Rf/Rg': 'R2²', 'Lm/Lg': 'R2¹', Ll: 'R2¹', Pl: 'R2¹', Pu: 'R2¹' },
  High:     { SI: 'R2⁴', SO: 'R2³', Rk: 'R2¹', 'Rf/Rg': 'R1',  'Lm/Lg': 'R1',  Ll: 'R1',  Pl: 'R1',  Pu: 'R1'  },
  Moderate: { SI: 'R2⁴', SO: 'R2³', Rk: 'R1',  'Rf/Rg': 'R1',  'Lm/Lg': 'R1',  Ll: 'R1',  Pl: 'R1',  Pu: 'R1'  },
  Low:      { SI: 'R2⁴', SO: 'R1',  Rk: 'R1',  'Rf/Rg': 'R1',  'Lm/Lg': 'R1',  Ll: 'R1',  Pl: 'R1',  Pu: 'R1'  },
};

// Form aquifer code → Table 2 column.
const AQUIFER_CODE_TO_COLUMN: Record<string, string> = {
  Rk: 'Rk',
  Rkc: 'Rk',
  Rkd: 'Rk',
  'Rf/Rk': 'Rk', // mixed fissured/karstified — conservative Rk column
  Rf: 'Rf/Rg',
  Rg: 'Rf/Rg',
  Lm: 'Lm/Lg',
  Lg: 'Lm/Lg',
  Lk: 'Lm/Lg',
  Ll: 'Ll',
  Pl: 'Pl',
  Pu: 'Pu',
};

// When only the aquifer *category* is known (no code), a column can still
// be picked where every code in that category has identical responses in
// Table 2 — true for Locally Important (Lm/Lg = Ll) and Poor (Pl = Pu), but
// not Regionally Important (Rk differs from Rf/Rg), which needs the code.
const CATEGORY_TO_COLUMN: Record<string, string> = {
  'Locally Important': 'Ll',
  Poor: 'Pl',
};

export const GWPR_UNDETERMINED = 'Could not determine – enter manually';

export interface GwprInputs {
  aquiferCode: string | null | undefined;
  aquiferCategory: string | null | undefined;
  vulnerability: Vulnerability | null | undefined;
  spaSI: boolean;
  spaSO: boolean;
}

/** Derives the GWPR from aquifer + vulnerability (+ SPA). `value` is null
 *  when it can't be determined; `reason` is always set for display. */
export function deriveGwpr(i: GwprInputs): { value: string | null; reason: string } {
  if (!i.vulnerability) {
    return { value: null, reason: `${GWPR_UNDETERMINED} (vulnerability not set).` };
  }

  let column: string | null = null;
  let source = '';
  if (i.spaSI) {
    column = 'SI';
    source = 'Source Protection Area (Inner)';
  } else if (i.spaSO) {
    column = 'SO';
    source = 'Source Protection Area (Outer)';
  } else if (i.aquiferCode && AQUIFER_CODE_TO_COLUMN[i.aquiferCode]) {
    column = AQUIFER_CODE_TO_COLUMN[i.aquiferCode];
    source = `aquifer ${i.aquiferCode}`;
  } else if (i.aquiferCategory && CATEGORY_TO_COLUMN[i.aquiferCategory]) {
    column = CATEGORY_TO_COLUMN[i.aquiferCategory];
    source = `${i.aquiferCategory} aquifer`;
  }

  if (!column) {
    const missing = i.aquiferCategory === 'Regionally Important' ? 'aquifer code needed' : 'aquifer not set';
    return { value: null, reason: `${GWPR_UNDETERMINED} (${missing}).` };
  }

  const value = GWPR_TABLE[i.vulnerability][column] ?? null;
  if (!value) return { value: null, reason: `${GWPR_UNDETERMINED}.` };
  return { value, reason: `${i.vulnerability} vulnerability + ${source} → ${value} (EPA CoP Table 2).` };
}
