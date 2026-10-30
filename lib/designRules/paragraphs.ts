// Suggested report paragraphs in Enda Colleran's standard wording, worked out
// from his 21 completed EPA site suitability reports. Pure functions (no
// React, no network) so they run offline and are tested in
// tests/paragraphs.test.ts against sentences taken from those reports.
//
// Every builder returns null when it doesn't have enough to say anything
// useful; the screens then leave the box for the assessor. Suggestions only
// ever fill a box that is empty or still holds the previous suggestion
// (hooks/useSuggestedText.ts), so anything the assessor writes is kept.

// ---------------------------------------------------------------------------
// Shared vocabulary
// ---------------------------------------------------------------------------

/** What the wastewater comes from. Used in most paragraphs ("…from the proposed dwelling house"). */
export type Development = 'proposed' | 'existing' | 'extended' | 'replacement' | 'pods' | 'development';

export const DEVELOPMENT_OPTIONS: { value: Development; label: string }[] = [
  { value: 'proposed', label: 'Proposed dwelling house' },
  { value: 'existing', label: 'Existing dwelling house' },
  { value: 'extended', label: 'Extended dwelling house' },
  { value: 'replacement', label: 'Replacement house' },
  { value: 'pods', label: 'Pods' },
  { value: 'development', label: 'Other development' },
];

/** The three ways Enda refers to the development, depending on the sentence. */
export function developmentPhrase(d: Development | null | undefined, form: 'full' | 'house' | 'dwelling'): string {
  const table: Record<Development, [string, string, string]> = {
    //            full                         house                 dwelling
    proposed: ['proposed dwelling house', 'proposed house', 'proposed dwelling'],
    existing: ['existing dwelling house', 'existing house', 'existing dwelling'],
    extended: ['extended dwelling house', 'extended house', 'extended dwelling'],
    replacement: ['replacement house', 'replacement house', 'replacement dwelling'],
    pods: ['pods', 'pods', 'proposed pods'],
    development: ['proposed development', 'proposed development', 'proposed development'],
  };
  const row = table[d as Development] ?? table.proposed; // unknown values (older reports) read as proposed
  return row[form === 'full' ? 0 : form === 'house' ? 1 : 2];
}

export type PercRange = 'low' | 'low to medium' | 'medium' | 'medium to high' | 'high';
export const PERC_RANGES: PercRange[] = ['low', 'low to medium', 'medium', 'medium to high', 'high'];

/** Words Enda uses for a percolation value, by EPA result band: 3–20 low, 21–40 medium, 41–50 medium to high, over 50 high. */
export function rangeForPV(pv: number | null | undefined): PercRange | null {
  if (pv == null || !Number.isFinite(pv) || pv <= 0) return null;
  if (pv <= 20) return 'low';
  if (pv <= 40) return 'medium';
  if (pv <= 50) return 'medium to high';
  return 'high';
}

/** Desk-study expectation from the GSI soil description (an assessor's call; this is only the starting point). */
export function suggestExpectedRange(soilType: string): PercRange | null {
  const s = soilType.toLowerCase();
  if (!s.trim()) return null;
  if (s.includes('poorly drained') || s.includes('peat')) return 'high';
  if (s.includes('shallow well drained')) return 'medium';
  if (s.includes('deep well drained')) return 'low to medium';
  if (s.includes('well drained')) return 'medium';
  return null;
}

/** Unsaturated soil needed (m) below the percolation pipes (advanced system) and the gravel (septic tank), by GWPR. */
export function unsaturatedDepths(gwpr: string): { advanced: number; septic: number } | null {
  const g = gwpr.replace(/\s/g, '');
  if (g === 'R1' || g === 'R2¹' || g === 'R21') return { advanced: 0.9, septic: 1.2 };
  if (g === 'R2²' || g === 'R22') return { advanced: 1.2, septic: 2.0 };
  return null; // not a response Enda's reports cover: leave for the assessor
}

const num = (s: string | number | null | undefined): number | null => {
  const m = /-?\d+(\.\d+)?/.exec(String(s ?? '').replace(',', '.'));
  return m ? Number(m[0]) : null;
};
const fmtM = (n: number) => (Math.round(n * 100) / 100).toString();
const isNone = (s: string) => !s.trim() || /^(no\s+)?(none|no|n\/a|nil|not (noted|encountered|present)|-)( noted| present| visible)?\.?$/i.test(s.trim());
const sentence = (s: string) => {
  const t = s.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.');
};
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const countWords = (n: number) => (NUMBER_WORDS[n] ? `${NUMBER_WORDS[n]} (${n})` : String(n));

const SEPARATION =
  'the percolation area and treatment plant must be at least 10m from streams, 3m from boundaries and 4m from roads; ' +
  'the treatment plant must be at least 7m from houses, and the percolation area must be at least 10m from houses.';

// ---------------------------------------------------------------------------
// 2.0 Desk study comments
// ---------------------------------------------------------------------------
export function deskStudyComment(i: {
  soilType: string;
  expectedRange: PercRange | null;
  vulnerability: string | null;
  aquiferCategory: string | null;
  gwpr: string;
  development: Development | null;
}): string | null {
  if (!i.vulnerability || !i.aquiferCategory || !i.gwpr.trim()) return null;
  const parts: string[] = [];
  const soil = i.soilType.split('. The site is close')[0].trim().replace(/\.$/, '');
  if (soil) {
    parts.push(/^soils under the site/i.test(soil) ? `${soil}.` : `Soils under the site are ${soil}.`);
    if (i.expectedRange) {
      parts.push(`Based on the characteristics of these soils, the percolation value is expected to be in the ${i.expectedRange} range.`);
    }
  }
  const aquifer = i.aquiferCategory.toLowerCase();
  parts.push(`Vulnerability at this site is ${i.vulnerability.toLowerCase()} and the aquifer is ${aquifer}, therefore the groundwater protection response is ${i.gwpr.trim()}.`);
  const depths = unsaturatedDepths(i.gwpr);
  if (depths) {
    parts.push(`Therefore, ${depths.advanced}m of unsaturated soil is required below the invert of the percolation pipes if an advanced system is installed and ${depths.septic.toFixed(1)}m below the gravel layer if a septic tank is installed.`);
  }
  parts.push(i.development === 'existing'
    ? `Although this is an existing house, all minimum separation distances should be adhered to as much as possible: ${SEPARATION}`
    : `All minimum separation distances must be adhered to: ${SEPARATION}`);
  return parts.join('  ');
}

// ---------------------------------------------------------------------------
// 3.1 Visual assessment comments (the parts that follow from the form)
// ---------------------------------------------------------------------------
export function visualAssessmentComment(i: {
  landscape: string;
  groundCondition: string;
  vegIndicators: string;
  drainageDitches: string;
  watercourses: string;
  lakes?: string;
  waterSupply: 'Mains' | 'Private' | 'Group' | null;
  privateWell: 'Existing well on-site' | 'To be bored on-site' | null;
  development: Development | null;
}): string | null {
  const p1: string[] = [];
  const land = i.landscape.trim();
  if (land) p1.push(/^this (site|is)/i.test(land) ? sentence(land) : `This site is located in ${lowerFirst(land).replace(/\.$/, '')}.`);
  if (i.groundCondition.trim()) p1.push(`The ground is ${lowerFirst(i.groundCondition.trim()).replace(/\.$/, '')}.`);
  if (isNone(i.vegIndicators)) p1.push('There are no vegetative indicators of wet conditions.');
  else p1.push(sentence(i.vegIndicators));

  const p2: string[] = [];
  const targets: string[] = [];
  if (i.waterSupply === 'Mains') p2.push('The site is served by public water mains.');
  if (i.waterSupply === 'Group') p2.push('The site is served by a group water scheme.');
  if (i.waterSupply === 'Private') {
    if (i.privateWell === 'To be bored on-site') { p2.push('A well is proposed for this site.'); targets.push('the proposed well'); }
    else { p2.push('The site is served by an existing well.'); targets.push('the existing well'); }
  }
  const hasDrain = !isNone(i.drainageDitches);
  const hasStream = !isNone(i.watercourses);
  const hasLake = !isNone(i.lakes ?? '');
  if (hasDrain) { p2.push(sentence(i.drainageDitches)); targets.push('the drain'); }
  if (hasStream) { p2.push(sentence(i.watercourses)); targets.push('the stream'); }
  // A lake is mentioned, not made a target: whether it's far enough away is the assessor's call (Enda, 26093).
  if (hasLake) p2.push(sentence(i.lakes ?? ''));
  if (!hasStream) p2.push(`There are no ${hasDrain || hasLake ? 'other ' : ''}surface water features close to the site.`);
  p2.push(targets.length
    ? `Therefore the potential targets at risk are ${targets.join(', ')} and groundwater as a resource.`
    : 'Therefore the potential target at risk is groundwater as a resource.');

  const p3: string[] = [];
  if (i.development !== 'existing') p3.push('The site is large enough and all separation distances will be achievable.');
  p3.push(`Based on the visual assessment, this site will be able to percolate, attenuate and dispose of the wastewater generated from the ${developmentPhrase(i.development, 'full')}.`);

  return [p1.join('  '), p2.join('  '), p3.join('  ')].filter(Boolean).join('\n\n');
}

// ---------------------------------------------------------------------------
// 3.2 Trial hole evaluation
// ---------------------------------------------------------------------------
export function trialHoleEvaluation(i: {
  layers: { from: number; to: number; classification: string; colour?: string }[];
  depth: string;
  bedrock: string;
  waterTable: string;
  ingress: string;
  likelyPV: string;
  development: Development | null;
}): string | null {
  const depth = num(i.depth);
  const descs = i.layers.map((l) => l.classification.trim().replace(/\.$/, '')).filter(Boolean);
  if (!descs.length || depth == null) return null;
  const bedrock = isNone(i.bedrock) ? null : num(i.bedrock);
  const wt = isNone(i.waterTable) ? null : num(i.waterTable);
  const ingress = isNone(i.ingress) ? null : num(i.ingress);
  const mottled = i.layers.some((l) => /mottl/i.test(l.colour ?? ''));

  const chain = descs.map(lowerFirst).join(' over ');
  const atBottom = bedrock != null && Math.abs(bedrock - depth) < 0.05;
  const p1 = [`The trial hole revealed ${chain} down to the bottom of the trial hole at ${fmtM(depth)}m BGL${atBottom ? ' where bedrock was encountered' : ''}.`];
  if (bedrock != null && !atBottom) p1.push(`Bedrock was encountered at ${fmtM(bedrock)}m BGL.`);
  if (ingress == null && !mottled) p1.push('Water ingress and mottling were not noted during the excavation.');
  else {
    p1.push(ingress == null ? 'Water ingress was not noted during the excavation.' : `Water ingress was noted at ${fmtM(ingress)}m BGL during the excavation.`);
    p1.push(mottled ? 'Mottling was noted during the excavation.' : 'Mottling was not noted during the excavation.');
  }
  p1.push(wt != null ? `The water table was noted at ${fmtM(wt)}m BGL on the day of examination.` : 'The water table was not noted on the day of examination.');

  const paras = [p1.join('  ')];
  const range = rangeForPV(num(i.likelyPV));
  if (range) {
    const props = range === 'high' ? 'slow' : range === 'medium to high' ? 'acceptable' : 'good';
    paras.push(`Based on the field tests it appears that the in-situ sub-soils have ${props} percolation properties, therefore it is anticipated that the percolation value will be in the ${range} range.`);
    if (range !== 'high') {
      paras.push(`Based on the trial hole it appears that the sub-soil will be able to percolate, attenuate and dispose of the wastewater from the ${developmentPhrase(i.development, 'full')}.`);
    }
  }
  return paras.join('\n\n');
}

// ---------------------------------------------------------------------------
// 3.3 Step 4 comments (subsurface and surface)
// ---------------------------------------------------------------------------
export function step4Comment(i: {
  kind: 'subsurface' | 'surface';
  likelyPV: string;
  actualPV: number | null;
  development: Development | null;
}): string | null {
  if (i.actualPV == null || !Number.isFinite(i.actualPV)) return null;
  const actual = rangeForPV(i.actualPV);
  if (!actual) return null;
  const who = developmentPhrase(i.development, 'house');
  const label = i.kind === 'subsurface' ? 'sub-surface' : 'surface';
  const soils = i.kind === 'subsurface' ? 'sub-soils' : 'soils';
  if (i.actualPV > 90) {
    return `The ${label} percolation value is greater than 90, therefore the in-situ ${soils} are not suitable for the percolation, attenuation and disposal of the wastewater generated from the ${who}.`;
  }
  const likely = num(i.likelyPV);
  let compare = 'as predicted';
  if (likely != null && rangeForPV(likely) !== actual) compare = i.actualPV < likely ? 'faster than predicted' : 'slower than predicted';
  const test = i.kind === 'surface' ? 'surface percolation test' : 'percolation test';
  return `The results of the ${test} show that the percolation rates are ${compare} at the time of the trial hole examination with the ${label} percolation value in the ${actual} range.  ` +
    `The in-situ ${soils} are suitable for the percolation, attenuation and disposal of the wastewater generated from the ${who}.`;
}

// ---------------------------------------------------------------------------
// 5.0 Site specific conditions
// ---------------------------------------------------------------------------
export type SystemKind = 'septic' | 'trenches' | 'filter' | 'tertiary';

const TRENCH_CONSTRUCTION =
  'The percolation trenches will be 500mm wide and 850mm deep.  The trenches will be installed on 2.5m centres.  ' +
  'The trenches will be dug to a level of 850mm BGL.  The trenches will be filled with 300mm of 15-25mm washed stone.  ' +
  'Then the distribution pipe will be placed on the 300mm of washed stone.  The distribution pipes will be 100mm diameter ' +
  "with 8mm pre-drilled holes at 4, 6 and 8 o'clock every 75mm along the pipe.  The distribution pipes will be laid at a " +
  'gradient of 1 in 200.  Then the trenches will be filled with another 250mm of washed stone.  The stone will be covered ' +
  'with a geotextile membrane which will be covered back to finished ground level with at least 300mm of top soil.';

/** "21 < PV < 40" style band text Enda uses, from the band key ("21-40"). */
const bandText = (band: string) => band.replace('-', ' < PV < ');

/** Septic tank design capacity (litres), EPA CoP 2021 Section 7.1.1. */
export const septicCapacityLitres = (pe: number) => 2000 + 150 * pe;

export function siteSpecificConditions(i: {
  system: SystemKind | null;
  pe: number | null;
  band: string | null;
  filterArea: number | null;
  trenches: { count: number; lengthEach: number; total: number } | null;
  gwpr: string;
  bedrock: string;
  waterTable: string;
  unitName: string;
  development: Development | null;
}): string | null {
  if (!i.system || !i.pe) return null;
  const from = developmentPhrase(i.development, 'dwelling');
  const unit = i.unitName.trim() ? ` (${i.unitName.trim()})` : '';

  if (i.system === 'septic') {
    if (!i.trenches) return null;
    return `Wastewater will flow via gravity from the ${from} to a septic tank.  Effluent from the septic tank will flow via gravity to a percolation area.   ` +
      `The p.e. is ${i.pe}, therefore in accordance with Section 7.1.1 of the EPA Code of Practice 2021, the design capacity of the septic tank must be at least ${septicCapacityLitres(i.pe)} litres.\n\n` +
      `There will be ${countWords(i.trenches.count)} percolation trenches, each ${fmtM(i.trenches.lengthEach)}m long, giving a total trench length of ${fmtM(i.trenches.total)}m in accordance with Table 7.2 of the EPA Code of Practice, 2021.  ` +
      `${TRENCH_CONSTRUCTION} The end of each percolation pipe must be vented to above finished ground level.`;
  }

  if (i.system === 'trenches') {
    if (!i.trenches) return null;
    return `Wastewater will flow via gravity from the ${from} to a wastewater treatment system${unit}.  The treatment system must be a p.e. = ${i.pe}.  ` +
      `Treated effluent from the treatment system will flow via gravity to a distribution box.  Effluent from the distribution box will discharge via gravity to ${i.trenches.count} percolation trenches.\n\n` +
      `Each trench will be ${fmtM(i.trenches.lengthEach)}m long, giving a total trench length of ${fmtM(i.trenches.total)}m in accordance with Table 10.1 of the EPA Code of Practice, 2021.  ${TRENCH_CONSTRUCTION}`;
  }

  if (i.system === 'filter') {
    if (!i.band || i.filterArea == null) return null;
    const paras = [
      `Wastewater will flow via gravity from the ${from} to a wastewater treatment system${unit}.   Treated effluent from the treatment system will be pumped to a soil polishing filter.`,
      `The p.e. is ${i.pe} and the percolation value is ${bandText(i.band)}, therefore in accordance with Table 10.1 of the EPA Code of Practice 2021, the soil polishing filter must be ${fmtM(i.filterArea)} square metres.`,
    ];
    const mound = moundingParagraph(i.gwpr, i.bedrock, i.waterTable);
    if (mound) paras.push(mound);
    paras.push('Please refer to the attached drawings and site layout plan for the configuration of the proposed system.');
    return paras.join('\n\n');
  }

  // tertiary: Enda's wording varies by job, so only the common frame
  return `Wastewater will flow via gravity from the ${from} to a secondary wastewater treatment system.  Effluent from the secondary wastewater treatment system will be pumped to a tertiary treatment unit.  ` +
    `Effluent from the tertiary treatment unit will discharge via gravity to an infiltration area.\n\nPlease refer to the attached drawings for details.`;
}

/** Re-mounded soil needed when bedrock or the water table is shallower than the required unsaturated depth. */
export function moundingParagraph(gwpr: string, bedrock: string, waterTable: string): string | null {
  const depths = unsaturatedDepths(gwpr);
  if (!depths) return null;
  const rock = isNone(bedrock) ? null : num(bedrock);
  const wt = isNone(waterTable) ? null : num(waterTable);
  const limits = [rock != null ? { d: rock, what: 'Bedrock' } : null, wt != null ? { d: wt, what: 'The water table' } : null]
    .filter(Boolean) as { d: number; what: string }[];
  if (!limits.length) return null;
  const lim = limits.reduce((a, b) => (b.d < a.d ? b : a));
  if (lim.d >= depths.advanced) return null;
  const mound = Math.ceil((depths.advanced - lim.d) * 20 - 1e-9) / 20;          // to the next 50mm
  return `${lim.what} is ${fmtM(lim.d)}m BGL and the Groundwater Protection Response is ${gwpr.trim()}.  Therefore, ${depths.advanced}m of unsaturated soil is required below the invert of the gravel layer.  ` +
    `In this case, ${fmtM(mound)}m of re-mounded soil from on-site will be placed in the footprint of the soil polishing filter to provide ${fmtM(lim.d + mound)}m of unsaturated soil below the invert of the gravel layer.   ` +
    `Therefore the invert of the gravel layer will be ${fmtM(mound)}m above existing ground level.`;
}

/** Gravity trenches suit a new build with enough soil: 850mm trench depth + the required unsaturated depth above rock/water. */
export function suggestTrenchesOrFilter(i: { gwpr: string; bedrock: string; waterTable: string; development: Development | null }):
  { value: 'trenches' | 'filter'; reason: string } | null {
  const depths = unsaturatedDepths(i.gwpr);
  if (!depths) return null;
  const rock = isNone(i.bedrock) ? null : num(i.bedrock);
  const wt = isNone(i.waterTable) ? null : num(i.waterTable);
  const limit = Math.min(rock ?? Infinity, wt ?? Infinity);
  const needed = 0.85 + depths.advanced;
  const newBuild = i.development === 'proposed' || i.development === 'replacement' || i.development == null;
  if (newBuild && limit >= needed) {
    return { value: 'trenches', reason: `Gravity trenches suggested: ${limit === Infinity ? 'no bedrock or water table' : `${fmtM(limit)}m to bedrock/water`} gives the 850mm trench plus ${depths.advanced}m unsaturated soil (${fmtM(needed)}m).` };
  }
  return {
    value: 'filter',
    reason: newBuild
      ? `Pumped soil polishing filter suggested: ${fmtM(limit)}m to bedrock/water is less than the ${fmtM(needed)}m gravity trenches need.`
      : 'Pumped soil polishing filter suggested for an existing or extended house.',
  };
}

// ---------------------------------------------------------------------------
// 6.0 Quality assurance, and the P.E. comment
// ---------------------------------------------------------------------------
export function qaInstallation(system: SystemKind | null): string | null {
  const box = 'The distribution box and pipes must be installed in accordance with the details given in Section 5.0 above.';
  if (system === 'septic') return `The septic tank must be installed in accordance with the manufacturer's instructions.  ${box}`;
  if (system === 'trenches') return `The wastewater treatment system must be installed in accordance with the manufacturer's instructions.  ${box}`;
  if (system === 'filter') return "The wastewater treatment system must be installed in accordance with the manufacturer's instructions.  The soil polishing filter must be installed in accordance with the plans attached below.";
  if (system === 'tertiary') return "The wastewater treatment system must be installed in accordance with the manufacturer's instructions.";
  return null;
}

export function qaMaintenance(system: SystemKind | null): string | null {
  const box = 'The distribution box must be visually inspected annually for cracks and to ensure that the box remains level giving equal distribution to all distribution pipes.';
  const contract = 'The homeowner must enter into a maintenance contract with the system manufacturer.  The system must be inspected and maintained on an annual basis.';
  if (system === 'septic') return `The septic tank must be desludged in accordance with the frequency outlined in Table 12.2 of the EPA Code of Practice 2021.  ${box}`;
  if (system === 'trenches') return `${contract}  ${box}`;
  if (system === 'filter' || system === 'tertiary') return contract;
  return null;
}

export const peComment = (pe: number | null): string | null => (pe ? `P.E. = ${pe}` : null);

export function pastExperienceSuggestion(d: Development | null): string | null {
  if (d === 'existing' || d === 'extended') {
    return 'A new wastewater treatment system is proposed for this existing house, therefore a site assessment will be completed and the results will be used to design a new wastewater treatment system.';
  }
  if (d === 'replacement') return 'Existing house to be removed and replaced with a new dwelling house.';
  return d ? 'None' : null;
}

/**
 * The design P.E. from the "Comments on population equivalent" box, which Enda
 * writes as "P.E. = 6" (and older reports as just "6"). For a worked
 * commercial calculation it takes the "= N p.e." result.
 */
export function parsePE(text: string): number | null {
  const s = String(text ?? '');
  const m = /p\.?\s*e\.?\s*=\s*(\d+(?:\.\d+)?)/i.exec(s)
    ?? /=\s*(\d+(?:\.\d+)?)\s*p\.?\s*e\b/i.exec(s)
    ?? /^\s*(\d+(?:\.\d+)?)\s*$/.exec(s);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
