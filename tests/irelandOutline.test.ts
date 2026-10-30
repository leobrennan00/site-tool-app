import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IRELAND_PATHS, IRELAND_VIEWBOX, projectIreland, isNearIreland } from '../lib/irelandOutline.ts';

test('towns land inside the map frame, the right way round', () => {
  const dublin = projectIreland(-6.26, 53.35);
  const galway = projectIreland(-9.05, 53.27);
  const malin = projectIreland(-7.37, 55.38);
  const mizen = projectIreland(-9.82, 51.45);
  for (const p of [dublin, galway, malin, mizen]) {
    assert.ok(p.x > 0 && p.x < IRELAND_VIEWBOX.width && p.y > 0 && p.y < IRELAND_VIEWBOX.height);
  }
  assert.ok(dublin.x > galway.x, 'east is right');
  assert.ok(malin.y < mizen.y, 'north is up');
});

test('coordinates outside Ireland are rejected', () => {
  assert.ok(isNearIreland(-8.5, 53.2));
  assert.ok(!isNearIreland(8.5, 53.2), 'dropped minus sign');
  assert.ok(!isNearIreland(-53.2, 8.5), 'lat and lon swapped');
  assert.ok(!isNearIreland(-0.12, 51.5), 'London');
});

test('the outline is present', () => {
  assert.ok(IRELAND_PATHS.length >= 2);
  assert.ok(IRELAND_PATHS.every((d) => d.startsWith('M') && d.endsWith('Z')));
});
