// Run with: npm test   (node's built-in runner; no extra dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHHMM, span, standardHole, modifiedHole, t100Hole, overallResult } from '../lib/percolation.ts';

const cases = JSON.parse(readFileSync(join(import.meta.dirname, 'percolation_cases.json'), 'utf8'));
const close = (a: number | null, b: number, tol = 0.001) =>
  assert.ok(a != null && Math.abs(a - b) < tol, `expected ${b}, got ${a}`);

test('parseHHMM accepts 24h times only', () => {
  assert.equal(parseHHMM('09:05'), 545);
  assert.equal(parseHHMM('9:05'), 545);
  assert.equal(parseHHMM('23:59'), 1439);
  assert.equal(parseHHMM('24:00'), null);
  assert.equal(parseHHMM('10:60'), null);
  assert.equal(parseHHMM('10.30'), null);
  assert.equal(parseHHMM(''), null);
});

test('span never wraps past midnight', () => {
  assert.deepEqual(span('23:50', '00:10'), { minutes: null, empty: false, issue: 'finish 00:10 is before start 23:50' });
});

for (const c of cases.standard) {
  test(`standard: ${c.name}`, () => {
    const r = standardHole(c.fills.map(([start, finish]: string[]) => ({ start, finish })));
    assert.equal(r.status, c.status);
    if (c.value != null) close(r.value, c.value); else assert.equal(r.value, null);
    if (c.issues) assert.deepEqual(r.issues, c.issues);
    if (c.status === 'complete') assert.ok(r.formula && r.formula.includes(' / 4 = '));
  });
}

for (const c of cases.modified) {
  test(`modified: ${c.name}`, () => {
    const r = modifiedHole(c.bands.map(([start, finish]: string[]) => ({ start, finish })));
    assert.equal(r.status, c.status);
    if (c.value != null) close(r.value, c.value); else assert.equal(r.value, null);
    c.bandT.forEach((t: number | null, i: number) => (t == null ? assert.equal(r.bands[i].t, null) : close(r.bands[i].t, t)));
    if (c.issues) assert.deepEqual(r.issues, c.issues);
  });
}

for (const c of cases.overall) {
  test(`overall: ${c.name}`, () => {
    const r = overallResult(c.holes);
    close(r.value, c.value);
    assert.equal(r.complete, c.complete);
    assert.equal(r.holesUsed, c.holesUsed);
    assert.deepEqual(r.warnings, c.warnings);
    if (!c.complete) assert.match(r.formula ?? '', /only$/);
  });
}

test('T100 hole', () => {
  assert.deepEqual(t100Hole('10:00', '10:52'), { status: 'complete', value: 52, issues: [], formula: '10:00 → 10:52 = 52 min' });
  assert.equal(t100Hole('10:00', '').status, 'incomplete');
  assert.equal(t100Hole('', '').status, 'empty');
});
