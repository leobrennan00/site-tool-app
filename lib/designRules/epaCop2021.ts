// Sizing rules for on-site wastewater treatment system recommendations,
// per the EPA Code of Practice 2021. Kept as data, not hardcoded in the
// screens, so the numbers can be corrected/extended without touching any
// UI or calculation code — see lib/designRules/dwwtsSizing.ts for the pure
// functions that read this file.
export const RULES_VERSION = 'EPA CoP 2021';

// Rule 1 — design P.E. from bedroom count. 1 and 2 bedrooms both give 4;
// beyond the table (9+ bedrooms), there's no entry and callers should treat
// it as "enter manually".
export const PE_FROM_BEDROOMS: Record<number, number> = {
  1: 4,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
};

// Rule 2 — daily hydraulic load.
export const DAILY_LOAD_PER_PE_LITRES = 150;

// Rule 3 — percolation test result bands, in order, used to find which
// band a given average subsurface percolation value (min/25mm) falls into.
export interface ResultBand {
  key: string;
  min: number;
  max: number;
}
export const RESULT_BANDS: ResultBand[] = [
  { key: '3-20', min: 3, max: 20 },
  { key: '21-40', min: 21, max: 40 },
  { key: '41-50', min: 41, max: 50 },
  { key: '51-75', min: 51, max: 75 },
  { key: '76-90', min: 76, max: 90 },
];

// Rule 4 — soil polishing filter loading rate (litres/m2/day) by band.
// `null` means not yet set by design — never guess, leave for manual entry.
export const LOADING_RATE_BY_BAND: Record<string, number | null> = {
  '3-20': 20,
  '21-40': 10,
  '41-50': 5,
  '51-75': null,
  '76-90': null,
};

// Rule 6 — polishing filter trenches: metres of 500mm-wide trench per P.E.,
// by band. `null` = not yet set.
export const POLISHING_TRENCH_M_PER_PE_BY_BAND: Record<string, number | null> = {
  '3-20': 6,
  '21-40': null,
  '41-50': null,
  '51-75': null,
  '76-90': null,
};
export const POLISHING_TRENCH_MAX_LENGTH_M = 10;

// Rule 7 — septic tank percolation area trenches: fixed rate regardless of
// band, but only valid for results in range 3-50 (i.e. bands 3-20, 21-40,
// 41-50 — not 51-75 or 76-90).
export const SEPTIC_TRENCH_M_PER_PE = 18;
export const SEPTIC_TRENCH_MAX_LENGTH_M = 18;
export const SEPTIC_TRENCH_MAX_RESULT = 50;

// Paragraph templates for "Site Specific Conditions" (selectedDwwts.tsx),
// chosen by which system the assessor selects (and, for the secondary
// treatment option, by site slope — see dwwtsSizing.ts). Wording is
// deliberately a placeholder: {pe} / {band} / {area} / {loading_rate} are
// substituted in, final text to be supplied later — keep these easy to
// edit without touching any calculation logic.
export const PARAGRAPH_TEMPLATES = {
  soilPolishingFilter:
    '[PLACEHOLDER — soil polishing filter wording TBD] Proposed soil polishing filter sized for {pe} P.E. ' +
    '(result band {band}, loading rate {loading_rate} L/m2/day), surface area {area} m2.',
  percolationTrenches:
    '[PLACEHOLDER — percolation trenches wording TBD] Proposed polishing filter percolation trenches sized for ' +
    '{pe} P.E. (result band {band}).',
  septicTank:
    '[PLACEHOLDER — septic tank wording TBD] Proposed septic tank and percolation area sized for {pe} P.E. ' +
    '(result band {band}).',
  tertiaryTreatment:
    '[PLACEHOLDER — tertiary treatment wording TBD] Proposed tertiary treatment system and infiltration/treatment ' +
    'area sized for {pe} P.E. (result band {band}).',
} as const;
export type ParagraphTemplateKey = keyof typeof PARAGRAPH_TEMPLATES;

export const ENTER_MANUALLY_REASON = 'Not yet set in EPA CoP 2021 rules — enter manually.';
export const OUT_OF_RANGE_REASON = 'Result outside the EPA CoP 2021 range (3-90) — no system suggested, enter manually.';

// Shared with app/(tabs)/selectedDwwts.tsx (the "Propose to install" options)
// and app/(tabs)/visualAssessment.tsx (the "Slope" checkboxes) so the
// paragraph-template/trench-vs-filter logic in dwwtsSizing.ts always
// matches against the exact same strings the screens use — one source of
// truth instead of duplicated literals that could silently drift apart.
export const DWWTS_INSTALL_OPTIONS = {
  septicTank: 'Septic tank system (septic tank and percolation area)',
  secondaryAndPolishingFilter: 'Secondary Treatment System and soil polishing filter',
  tertiary: 'Tertiary Treatment System and Infiltration /treatment area',
} as const;

export const SLOPE_OPTIONS = {
  steep: 'Steep (>1.5)',
  shallow: 'Shallow (1.5-1:20)',
  relativelyFlat: 'Relatively Flat (<1:20)',
} as const;
