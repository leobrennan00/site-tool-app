import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrefix, fullName } from '../lib/names.ts';

test('normalizePrefix keeps real titles only', () => {
  assert.equal(normalizePrefix('Mr'), 'Mr');
  assert.equal(normalizePrefix('dr.'), 'Dr');
  assert.equal(normalizePrefix(' mrs '), 'Mrs');
  assert.equal(normalizePrefix('Enda'), '');   // first name typed into the Prefix box
  assert.equal(normalizePrefix(''), '');
});

test('fullName never repeats the first name', () => {
  assert.equal(fullName('Enda', 'Enda', 'Colleran'), 'Enda Colleran');
  assert.equal(fullName('Mr', 'Enda', 'Colleran'), 'Mr Enda Colleran');
  assert.equal(fullName('', 'Enda', 'Colleran'), 'Enda Colleran');
});
