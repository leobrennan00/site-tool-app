import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDMY, formatDMY, displayDMY } from '../lib/dates.ts';

test('parseDMY reads day-first dates', () => {
  assert.equal(formatDMY(parseDMY('25/08/2026')!), '25/08/2026');
  assert.equal(formatDMY(parseDMY('5/8/2026')!), '05/08/2026');
  assert.equal(formatDMY(parseDMY('05-08-2026')!), '05/08/2026');
});

test('parseDMY still reads dates saved year-first', () => {
  assert.equal(formatDMY(parseDMY('2026-08-25')!), '25/08/2026');
  assert.equal(formatDMY(parseDMY('2026-08-25T10:00:00Z')!), '25/08/2026');
});

test('parseDMY rejects impossible dates and junk', () => {
  assert.equal(parseDMY('31/02/2026'), null);
  assert.equal(parseDMY('13/13/2026'), null);
  assert.equal(parseDMY('tomorrow'), null);
  assert.equal(parseDMY(''), null);
});

test('displayDMY shows old values day-first and leaves other text alone', () => {
  assert.equal(displayDMY('2026-08-25'), '25/08/2026');
  assert.equal(displayDMY('25/08/2026'), '25/08/2026');
  assert.equal(displayDMY('see notes'), 'see notes');
  assert.equal(displayDMY(''), '');
});
