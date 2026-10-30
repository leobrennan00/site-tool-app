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

test('maskDMY puts the slashes into typed digits', async () => {
  const { maskDMY } = await import('../lib/dates.ts');
  assert.equal(maskDMY('25'), '25');
  assert.equal(maskDMY('2508'), '25/08');
  assert.equal(maskDMY('250820'), '25/08/20');
  assert.equal(maskDMY('25082026'), '25/08/2026');
  assert.equal(maskDMY('250820261'), '25/08/2026');
  assert.equal(maskDMY('5/8/2026'), '5/8/2026');
});

test('maskHHMM puts the colon into four typed digits', async () => {
  const { maskHHMM } = await import('../lib/dates.ts');
  assert.equal(maskHHMM('10'), '10');
  assert.equal(maskHHMM('930'), '930');
  assert.equal(maskHHMM('1030'), '10:30');
  assert.equal(maskHHMM('10.30'), '10.30');
});

test('finishHHMM reads short and colon times, rejects impossible ones', async () => {
  const { finishHHMM } = await import('../lib/dates.ts');
  assert.equal(finishHHMM('930'), '09:30');
  assert.equal(finishHHMM('0930'), '09:30');
  assert.equal(finishHHMM('9:30'), '09:30');
  assert.equal(finishHHMM('10:30'), '10:30');
  assert.equal(finishHHMM('2460'), null);
  assert.equal(finishHHMM('93'), null);
  assert.equal(finishHHMM('10.30'), null);
});
