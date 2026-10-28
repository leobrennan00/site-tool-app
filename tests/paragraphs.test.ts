// Each expected string is copied from one of Enda's completed reports (named),
// with his inputs. Whitespace is normalised; obvious typos in the originals
// ("exisitng", "end od") are not reproduced.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deskStudyComment, visualAssessmentComment, trialHoleEvaluation, step4Comment, siteSpecificConditions,
  qaInstallation, qaMaintenance, peComment, rangeForPV, unsaturatedDepths, moundingParagraph,
  suggestTrenchesOrFilter, suggestExpectedRange, septicCapacityLitres,
} from '../lib/designRules/paragraphs.ts';

const norm = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();
const same = (actual: string | null, expected: string) => assert.equal(norm(actual), norm(expected));

test('desk study comment: report 26093 (R2², deep well drained, low)', () => {
  same(deskStudyComment({
    soilType: 'Soils under the site are Deep well drained mineral (Mainly basic) Grey Brown Podzolics, Brown Earths (medium-high base status)',
    expectedRange: 'low', vulnerability: 'Extreme', aquiferCategory: 'Regionally Important', gwpr: 'R2²', development: 'extended',
  }),
  'Soils under the site are Deep well drained mineral (Mainly basic) Grey Brown Podzolics, Brown Earths (medium-high base status). ' +
  'Based on the characteristics of these soils, the percolation value is expected to be in the low range. ' +
  'Vulnerability at this site is extreme and the aquifer is regionally important, therefore the groundwater protection response is R2². ' +
  'Therefore, 1.2m of unsaturated soil is required below the invert of the percolation pipes if an advanced system is installed and 2.0m below the gravel layer if a septic tank is installed. ' +
  'All minimum separation distances must be adhered to: the percolation area and treatment plant must be at least 10m from streams, 3m from boundaries and 4m from roads; ' +
  'the treatment plant must be at least 7m from houses, and the percolation area must be at least 10m from houses.');
});

test('desk study comment: R1 depths and the GSI boundary note is dropped (report 26009)', () => {
  const t = deskStudyComment({
    soilType: 'Soils under the site are AminDW - Deep well drained mineral (Mainly acidic). The site is close to a soil boundary; adjoining soil within ~50 m: X',
    expectedRange: 'medium', vulnerability: 'Moderate', aquiferCategory: 'Poor', gwpr: 'R1', development: 'proposed',
  })!;
  assert.ok(t.includes('Vulnerability at this site is moderate and the aquifer is poor, therefore the groundwater protection response is R1.'));
  assert.ok(t.includes('0.9m of unsaturated soil is required below the invert of the percolation pipes if an advanced system is installed and 1.2m below the gravel layer'));
  assert.ok(!t.includes('adjoining soil'));
  assert.equal(deskStudyComment({ soilType: '', expectedRange: null, vulnerability: null, aquiferCategory: 'Poor', gwpr: 'R1', development: null }), null);
});

test('trial hole evaluation: report 25026 paragraphs 2 and 3', () => {
  const t = trialHoleEvaluation({
    layers: [{ from: 0, to: 0.3, classification: 'top soil' }, { from: 0.3, to: 1.2, classification: 'silty sand with infrequent boulders' },
             { from: 1.2, to: 2.8, classification: 'sand' }],
    depth: '2.8', bedrock: 'None', waterTable: 'None', ingress: 'None', likelyPV: '10', development: 'proposed',
  })!;
  const [p1, p2, p3] = t.split('\n\n');
  same(p1, 'The trial hole revealed top soil over silty sand with infrequent boulders over sand down to the bottom of the trial hole at 2.8m BGL. ' +
    'Water ingress and mottling were not noted during the excavation. The water table was not noted on the day of examination.');
  same(p2, 'Based on the field tests it appears that the in-situ sub-soils have good percolation properties, therefore it is anticipated that the percolation value will be in the low range.');
  same(p3, 'Based on the trial hole it appears that the sub-soil will be able to percolate, attenuate and dispose of the wastewater from the proposed dwelling house.');
});

test('trial hole evaluation: bedrock at the bottom, water table and ingress noted (report 26013)', () => {
  const t = trialHoleEvaluation({
    layers: [{ from: 0, to: 0.3, classification: 'Top soil' }, { from: 0.3, to: 1.0, classification: 'gravelly silt' },
             { from: 1.0, to: 1.8, classification: 'silt with shale fragments' }],
    depth: '1.8', bedrock: '1.8', waterTable: '1.4', ingress: '1.7', likelyPV: '35', development: 'proposed',
  })!;
  assert.ok(t.startsWith('The trial hole revealed top soil over gravelly silt over silt with shale fragments down to the bottom of the trial hole at 1.8m BGL where bedrock was encountered.'));
  assert.ok(t.includes('Water ingress was noted at 1.7m BGL during the excavation.'));
  assert.ok(t.includes('The water table was noted at 1.4m BGL on the day of examination.'));
  assert.ok(t.includes('percolation value will be in the medium range.'));
});

test('step 4 comment: report 26060 (as predicted, medium)', () => {
  same(step4Comment({ kind: 'subsurface', likelyPV: '30', actualPV: 25.69, development: 'proposed' }),
    'The results of the percolation test show that the percolation rates are as predicted at the time of the trial hole examination with the sub-surface percolation value in the medium range. ' +
    'The in-situ sub-soils are suitable for the percolation, attenuation and disposal of the wastewater generated from the proposed house.');
  same(step4Comment({ kind: 'surface', likelyPV: '15', actualPV: 12.72, development: 'extended' }),
    'The results of the surface percolation test show that the percolation rates are as predicted at the time of the trial hole examination with the surface percolation value in the low range. ' +
    'The in-situ soils are suitable for the percolation, attenuation and disposal of the wastewater generated from the extended house.');
  assert.ok(step4Comment({ kind: 'subsurface', likelyPV: '30', actualPV: 12, development: 'proposed' })!.includes('faster than predicted'));
  assert.equal(step4Comment({ kind: 'subsurface', likelyPV: '30', actualPV: null, development: 'proposed' }), null);
});

test('site specific conditions: pumped soil polishing filter (UPLOAD Site Suitability Report (1))', () => {
  same(siteSpecificConditions({
    system: 'filter', pe: 6, band: '21-40', filterArea: 90, trenches: null, gwpr: 'R2¹', bedrock: '0.80', waterTable: 'None',
    unitName: 'BAF', development: 'existing',
  }),
  'Wastewater will flow via gravity from the existing dwelling to a wastewater treatment system (BAF). Treated effluent from the treatment system will be pumped to a soil polishing filter. ' +
  'The p.e. is 6 and the percolation value is 21 < PV < 40, therefore in accordance with Table 10.1 of the EPA Code of Practice 2021, the soil polishing filter must be 90 square metres. ' +
  'Bedrock is 0.8m BGL and the Groundwater Protection Response is R2¹. Therefore, 0.9m of unsaturated soil is required below the invert of the gravel layer. ' +
  'In this case, 0.1m of re-mounded soil from on-site will be placed in the footprint of the soil polishing filter to provide 0.9m of unsaturated soil below the invert of the gravel layer. ' +
  'Therefore the invert of the gravel layer will be 0.1m above existing ground level. ' +
  'Please refer to the attached drawings and site layout plan for the configuration of the proposed system.');
});

test('site specific conditions: septic tank (UPLOAD Site Characterisation Report)', () => {
  const t = siteSpecificConditions({
    system: 'septic', pe: 6, band: '3-20', filterArea: null, trenches: { count: 6, lengthEach: 18, total: 108 },
    gwpr: 'R2¹', bedrock: 'None', waterTable: 'None', unitName: '', development: 'proposed',
  })!;
  assert.ok(norm(t).startsWith(norm(
    'Wastewater will flow via gravity from the proposed dwelling to a septic tank. Effluent from the septic tank will flow via gravity to a percolation area. ' +
    'The p.e. is 6, therefore in accordance with Section 7.1.1 of the EPA Code of Practice 2021, the design capacity of the septic tank must be at least 2900 litres. ' +
    'There will be six (6) percolation trenches, each 18m long, giving a total trench length of 108m in accordance with Table 7.2 of the EPA Code of Practice, 2021. ' +
    'The percolation trenches will be 500mm wide and 850mm deep.')));
  assert.ok(t.includes("8mm pre-drilled holes at 4, 6 and 8 o'clock every 75mm"));
  assert.equal(septicCapacityLitres(5), 2750);
});

test('site specific conditions: gravity trenches (report 26009)', () => {
  const t = siteSpecificConditions({
    system: 'trenches', pe: 5, band: '3-20', filterArea: null, trenches: { count: 3, lengthEach: 10, total: 30 },
    gwpr: 'R1', bedrock: 'None', waterTable: 'None', unitName: 'BAF', development: 'proposed',
  })!;
  assert.ok(norm(t).startsWith(norm(
    'Wastewater will flow via gravity from the proposed dwelling to a wastewater treatment system (BAF). The treatment system must be a p.e. = 5. ' +
    'Treated effluent from the treatment system will flow via gravity to a distribution box. Effluent from the distribution box will discharge via gravity to 3 percolation trenches. ' +
    'Each trench will be 10m long, giving a total trench length of 30m in accordance with Table 10.1 of the EPA Code of Practice, 2021.')));
});

test('mounding: report 26093 (R2², bedrock 0.70) needs 0.5m', () => {
  const t = moundingParagraph('R2²', '0.70', 'None')!;
  assert.ok(t.includes('1.2m of unsaturated soil is required'));
  assert.ok(t.includes('0.5m of re-mounded soil'));
  assert.equal(moundingParagraph('R1', '2.0', 'None'), null);
});

test('QA wording matches Enda exactly', () => {
  assert.equal(qaInstallation('filter'), "The wastewater treatment system must be installed in accordance with the manufacturer's instructions.  The soil polishing filter must be installed in accordance with the plans attached below.");
  assert.equal(qaMaintenance('filter'), 'The homeowner must enter into a maintenance contract with the system manufacturer.  The system must be inspected and maintained on an annual basis.');
  assert.ok(qaMaintenance('septic')!.startsWith('The septic tank must be desludged in accordance with the frequency outlined in Table 12.2'));
  assert.ok(qaInstallation('trenches')!.endsWith('in accordance with the details given in Section 5.0 above.'));
  assert.equal(peComment(6), 'P.E. = 6');
});

test('visual assessment: targets at risk follow the form (report 26009 style)', () => {
  const t = visualAssessmentComment({
    landscape: 'Undulating countryside with a slight gradient to the southwest', groundCondition: 'firm and dry', vegIndicators: 'None',
    drainageDitches: 'A drain is located along the road', watercourses: '', waterSupply: 'Private', privateWell: 'To be bored on-site', development: 'proposed',
  });
  const [p1, p2, p3] = t!.split('\n\n');
  same(p1, 'This site is located in undulating countryside with a slight gradient to the southwest. The ground is firm and dry. There are no vegetative indicators of wet conditions.');
  same(p2, 'A well is proposed for this site. A drain is located along the road. There are no other surface water features close to the site. ' +
    'Therefore the potential targets at risk are the proposed well, the drain and groundwater as a resource.');
  same(p3, 'The site is large enough and all separation distances will be achievable. Based on the visual assessment, this site will be able to percolate, attenuate and dispose of the wastewater generated from the proposed dwelling house.');
  const mains = visualAssessmentComment({ landscape: '', groundCondition: '', vegIndicators: '', drainageDitches: 'None', watercourses: '',
    waterSupply: 'Mains', privateWell: null, development: 'existing' })!;
  assert.ok(mains.includes('The site is served by public water mains.'));
  assert.ok(mains.includes('Therefore the potential target at risk is groundwater as a resource.'));
  assert.ok(!mains.includes('large enough'));
});

test('ranges, depths and suggestions', () => {
  assert.deepEqual([9.5, 23, 41.7, 56].map(rangeForPV), ['low', 'medium', 'medium to high', 'high']);
  assert.deepEqual(unsaturatedDepths('R2²'), { advanced: 1.2, septic: 2.0 });
  assert.equal(unsaturatedDepths('R3²'), null);
  assert.equal(suggestExpectedRange('AminPD - Mineral poorly drained (Mainly acidic)'), 'high');
  // trenches only on a new build with 0.85m trench + unsaturated depth above rock/water (reports 26002, 26013)
  assert.equal(suggestTrenchesOrFilter({ gwpr: 'R1', bedrock: '1.8', waterTable: 'None', development: 'proposed' })!.value, 'trenches');
  assert.equal(suggestTrenchesOrFilter({ gwpr: 'R2¹', bedrock: '0.7', waterTable: 'None', development: 'proposed' })!.value, 'filter');
  assert.equal(suggestTrenchesOrFilter({ gwpr: 'R1', bedrock: 'None', waterTable: 'None', development: 'existing' })!.value, 'filter');
});

test('P.E. read from the comments box', async () => {
  const { parsePE } = await import('../lib/designRules/paragraphs.ts');
  assert.equal(parsePE('P.E. = 6'), 6);
  assert.equal(parsePE('6'), 6);
  assert.equal(parsePE('40 employees: 60 litres per employee per day = TOTAL DAILY HYDRAULIC FLOW 2400 litres =2400 / 150 = 16 p.e.'), 16);
  assert.equal(parsePE('6 PE based on 4 bedroom house'), null);
  assert.equal(parsePE(''), null);
});

test('visual comment: "No none" vegetation and a lake nearby (26093)', () => {
  const t = visualAssessmentComment({
    landscape: 'Open countryside with a gradient to the south', groundCondition: 'Firm and dry', vegIndicators: 'No none',
    drainageDitches: 'None', watercourses: 'None', lakes: 'Ballymacahill Lough is located ~200m south of the site',
    waterSupply: 'Mains', privateWell: null, development: 'existing',
  })!;
  assert.ok(t.includes('There are no vegetative indicators of wet conditions.'));
  assert.ok(!t.includes('No none'));
  assert.ok(t.includes('Ballymacahill Lough is located ~200m south of the site.  There are no other surface water features close to the site.'));
  assert.ok(t.includes('Therefore the potential target at risk is groundwater as a resource.'));
});
