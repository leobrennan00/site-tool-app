import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newLayer, layerErrors, layersForPayload, baseNoteForPayload } from '../lib/trialHole.ts';

const L = (from: string, to: string, classification = '') => ({ ...newLayer(from), to, classification });

test('0–0.3 topsoil, 0.3–0.9, 0.9–2.0 in a 2.0 m hole is valid', () => {
  const layers = [L('0', '0.3', 'Topsoil'), L('0.3', '0.9', 'Sandy CLAY'), L('0.9', '2.0', 'Gravelly CLAY')];
  assert.deepEqual(layerErrors(layers, '2.0'), []);
  const p = layersForPayload(layers);
  assert.equal(p.at(-1)?.to, 2);
  assert.equal(p[0].classification, 'Topsoil');
});

test('gap, overlap and short last layer are reported', () => {
  assert.deepEqual(layerErrors([L('0', '0.3'), L('0.4', '2.0')], '2.0'),
    ['Gap between layer 1 (ends 0.3 m) and layer 2 (starts 0.4 m).']);
  assert.deepEqual(layerErrors([L('0', '0.5'), L('0.4', '2.0')], '2.0'),
    ['Layers 1 and 2 overlap (0.4–0.5 m).']);
  assert.deepEqual(layerErrors([L('0', '0.3'), L('0.3', '1.8')], '2.0'),
    ['The last layer ends at 1.8 m but the trial hole is 2 m deep.']);
  assert.deepEqual(layerErrors([L('0', '2.4')], '2.0'),
    ['Layers go down to 2.4 m, deeper than the 2 m trial hole.']);
});

test('bad numbers and first layer not at surface', () => {
  assert.deepEqual(layerErrors([L('0', '')], '2'), ['Layer 1: "To" depth is missing or not a number.']);
  assert.deepEqual(layerErrors([L('0.2', '2.0')], '2.0'), ['The first layer must start at 0.0 m (it starts at 0.2 m).']);
  assert.deepEqual(layerErrors([L('0.9', '0.3')], '2.0'), ['Layer 1: "From" (0.9 m) must be less than "To" (0.3 m).']);
});

test('a last entry with text but no depths is a bottom-of-hole note, not an error', () => {
  const note = { ...L('', '', 'Large boulders/bedrock at bottom of trial hole @ 0.7m BGL') };
  const layers = [L('0', '0.3', 'Topsoil'), L('0.3', '0.7', 'Sandy SILT'), note];
  assert.deepEqual(layerErrors(layers, '0.7'), []);
  assert.equal(baseNoteForPayload(layers, '0.7')?.classification, 'Large boulders/bedrock at bottom of trial hole @ 0.7m BGL');
  assert.equal(layersForPayload(layers).length, 2);
});

test('the note may keep the pre-filled "From" at the hole depth', () => {
  const layers = [L('0', '0.7', 'Topsoil'), L('0.7', '', 'Bedrock at base')];
  assert.deepEqual(layerErrors(layers, '0.7'), []);
  assert.equal(baseNoteForPayload(layers, '0.7')?.classification, 'Bedrock at base');
});

test('a mid-hole layer missing "To" is still an error', () => {
  const layers = [L('0', '0.3', 'Topsoil'), L('0.3', '', 'Sandy SILT')];
  assert.deepEqual(layerErrors(layers, '2.0'), ['Layer 2: "To" depth is missing or not a number.']);
  assert.equal(baseNoteForPayload(layers, '2.0'), null);
});
