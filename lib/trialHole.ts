// Trial hole (3.2) soil layers. Pure — shared by the Trial Hole screen, the
// Generate Report check and tests/trialHole.test.ts.

export type SoilLayer = {
  id: string;
  from: string;          // m below ground, e.g. "0.3"
  to: string;            // m below ground, e.g. "0.9"
  classification: string;
  dilatancy: string;     // plasticity & dilatancy
  structure: string;
  compactness: string;   // density / compactness
  colour: string;
  flowpaths: string;     // preferential flowpaths
};

export const LAYER_TEXT_FIELDS: { key: keyof SoilLayer; label: string }[] = [
  { key: 'classification', label: 'Soil/subsoil texture & classification' },
  { key: 'dilatancy', label: 'Plasticity & dilatancy' },
  { key: 'structure', label: 'Soil structure' },
  { key: 'compactness', label: 'Density / compactness' },
  { key: 'colour', label: 'Colour' },
  { key: 'flowpaths', label: 'Preferential flowpaths' },
];

const newId = () => Math.random().toString(36).slice(2);

export function newLayer(from = ''): SoilLayer {
  return { id: newId(), from, to: '', classification: '', dilatancy: '', structure: '', compactness: '', colour: '', flowpaths: '' };
}

const num = (s: string) => {
  const t = String(s ?? '').trim().replace(',', '.');
  return t === '' ? NaN : Number(t);
};
const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/**
 * Problems with the layer log, in plain words. Empty array = OK.
 * Checks: numbers present, from < to, first layer starts at 0, no gaps or
 * overlaps between consecutive layers, no layer below the hole, and the last
 * layer reaches the full trial hole depth.
 */
export function layerErrors(layers: SoilLayer[], trialDepth: string): string[] {
  const errs: string[] = [];
  if (!layers.length) return errs;
  const EPS = 0.005;
  const parsed = layers.map((l, i) => ({ n: i + 1, from: num(l.from), to: num(l.to) }));

  for (const p of parsed) {
    if (Number.isNaN(p.from)) errs.push(`Layer ${p.n}: "From" depth is missing or not a number.`);
    if (Number.isNaN(p.to)) errs.push(`Layer ${p.n}: "To" depth is missing or not a number.`);
    if (!Number.isNaN(p.from) && !Number.isNaN(p.to) && !(p.from < p.to)) {
      errs.push(`Layer ${p.n}: "From" (${fmt(p.from)} m) must be less than "To" (${fmt(p.to)} m).`);
    }
  }
  if (errs.length) return errs;

  const sorted = [...parsed].sort((a, b) => a.from - b.from);
  if (Math.abs(sorted[0].from) > EPS) errs.push(`The first layer must start at 0.0 m (it starts at ${fmt(sorted[0].from)} m).`);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1], cur = sorted[i];
    if (cur.from > prev.to + EPS) errs.push(`Gap between layer ${prev.n} (ends ${fmt(prev.to)} m) and layer ${cur.n} (starts ${fmt(cur.from)} m).`);
    if (cur.from < prev.to - EPS) errs.push(`Layers ${prev.n} and ${cur.n} overlap (${fmt(cur.from)}–${fmt(prev.to)} m).`);
  }

  const td = num(trialDepth);
  const last = sorted[sorted.length - 1];
  if (Number.isNaN(td)) {
    errs.push('Enter the depth of the trial hole so the last layer can be checked against it.');
  } else {
    if (last.to < td - EPS) errs.push(`The last layer ends at ${fmt(last.to)} m but the trial hole is ${fmt(td)} m deep.`);
    if (last.to > td + EPS) errs.push(`Layers go down to ${fmt(last.to)} m, deeper than the ${fmt(td)} m trial hole.`);
  }
  return errs;
}

/** Layers for the report payload: sorted, trimmed, depths as numbers. */
export function layersForPayload(layers: SoilLayer[]) {
  return layers
    .map((l) => ({
      from: num(l.from), to: num(l.to),
      classification: l.classification.trim(), dilatancy: l.dilatancy.trim(), structure: l.structure.trim(),
      compactness: l.compactness.trim(), colour: l.colour.trim(), flowpaths: l.flowpaths.trim(),
    }))
    .filter((l) => !Number.isNaN(l.from) && !Number.isNaN(l.to) && l.to > l.from)
    .sort((a, b) => a.from - b.from);
}
