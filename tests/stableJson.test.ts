import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsonEqual, jsonEquivalent, stableStringify } from '../lib/stableJson.ts';

test('jsonEqual ignores key order (jsonb reorders keys)', () => {
  assert.ok(jsonEqual({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 }));
  assert.ok(!jsonEqual({ a: 1 }, { a: 2 }));
  assert.ok(!jsonEqual([1, 2], [2, 1]));
  assert.equal(stableStringify({ b: 1, a: undefined }), '{"b":1}');
});

test('jsonEquivalent treats blank boxes as not filled in', () => {
  assert.ok(jsonEquivalent({ a: 'x' }, { a: 'x', b: '', c: null, d: false, e: [], f: {} }));
  assert.ok(jsonEquivalent({}, { layers: [] }));
  assert.ok(!jsonEquivalent({ a: 'x' }, { a: '' }), 'clearing a field is a change');
  assert.ok(!jsonEquivalent({ a: 'x' }, { a: 'x', b: 'y' }));
  assert.ok(!jsonEquivalent({ on: true }, {}));
});

test('jsonEquivalent keeps list positions', () => {
  assert.ok(!jsonEquivalent({ l: [{ a: '' }, { a: 'x' }] }, { l: [{ a: 'x' }] }));
  assert.ok(jsonEquivalent({ l: [{ a: 'x', b: '' }] }, { l: [{ a: 'x' }] }));
});
