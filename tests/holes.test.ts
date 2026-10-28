import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyHoleOne } from '../lib/percolation.ts';

const blank = () => ({ topDepth: '', dimensions: '', preSoak1Time: '', fillTime: '', waterLevelTime: '' });

test('hole 1 fills the other holes while they are blank', () => {
  const prev = [blank(), blank(), blank()];
  const next = [{ ...blank(), topDepth: '400', fillTime: '09:00', waterLevelTime: '10:28' }, blank(), blank()];
  const out = copyHoleOne(prev, next);
  assert.deepEqual(out.map((h) => h.topDepth), ['400', '400', '400']);
  assert.deepEqual(out.map((h) => h.fillTime), ['09:00', '09:00', '09:00']);
  assert.deepEqual(out.map((h) => h.waterLevelTime), ['10:28', '', '']);   // differs per hole, never copied
});

test('editing hole 1 again updates holes that still match it', () => {
  const prev = [{ ...blank(), preSoak1Time: '08:00' }, { ...blank(), preSoak1Time: '08:00' }, { ...blank(), preSoak1Time: '08:00' }];
  const next = [{ ...prev[0], preSoak1Time: '08:15' }, prev[1], prev[2]];
  assert.deepEqual(copyHoleOne(prev, next).map((h) => h.preSoak1Time), ['08:15', '08:15', '08:15']);
});

test('a hole given its own value keeps it', () => {
  const prev = [{ ...blank(), dimensions: '300 x 300' }, { ...blank(), dimensions: '350 x 300' }, { ...blank(), dimensions: '300 x 300' }];
  const next = [{ ...prev[0], dimensions: '300 x 250' }, prev[1], prev[2]];
  assert.deepEqual(copyHoleOne(prev, next).map((h) => h.dimensions), ['300 x 250', '350 x 300', '300 x 250']);
});

test('editing hole 2 or 3 changes nothing else', () => {
  const prev = [blank(), blank(), blank()];
  const next = [blank(), { ...blank(), fillTime: '09:05' }, blank()];
  assert.deepEqual(copyHoleOne(prev, next).map((h) => h.fillTime), ['', '09:05', '']);
});
