import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vulnerabilityFromGsi, vulnerabilityLabelFromGsi, deriveGwpr } from '../lib/designRules/groundwater.ts';

const gsiX = { description: 'Vulnerability at site: Extreme (X) – rock at or near surface or karst', raw: { VUL_CAT: 'X' } };

test('GSI X maps to Extreme with the X label', () => {
  assert.equal(vulnerabilityFromGsi(gsiX), 'Extreme');
  assert.equal(vulnerabilityLabelFromGsi(gsiX), 'Extreme (X) – rock at or near surface or karst');
  assert.equal(vulnerabilityLabelFromGsi({ raw: { VUL_CAT: 'H' } }), 'High (H)');
  assert.equal(vulnerabilityFromGsi({ description: 'Water', raw: { VUL_CAT: 'Water' } }), null);
});

test('X uses the Extreme row of the GWPR table', () => {
  const r = deriveGwpr({ aquiferCode: 'Rk', aquiferCategory: '', vulnerability: vulnerabilityFromGsi(gsiX), spaSI: false, spaSO: false });
  assert.equal(r.value, 'R2²');
  const ll = deriveGwpr({ aquiferCode: 'Ll', aquiferCategory: '', vulnerability: 'Extreme', spaSI: false, spaSO: false });
  assert.equal(ll.value, 'R2¹');
});
