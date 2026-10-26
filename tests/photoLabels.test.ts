import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PHOTO_LABELS, normalizePhotoLabel, exifTakenAt } from '../lib/photoLabels.ts';

test('labels match the report layout contract', () => {
  assert.equal(PHOTO_LABELS.length, 11);
  assert.ok(PHOTO_LABELS.includes('Trial hole (portrait)'));
  assert.ok(PHOTO_LABELS.includes('Subsurface percolation hole 3'));
});

test('unknown or missing labels are "Other"', () => {
  assert.equal(normalizePhotoLabel(null), 'Other');
  assert.equal(normalizePhotoLabel(''), 'Other');
  assert.equal(normalizePhotoLabel('Test area'), 'Test area');
  assert.equal(normalizePhotoLabel('Garden'), 'Other');
});

test('EXIF capture time', () => {
  assert.equal(exifTakenAt({ DateTimeOriginal: '2026:10:13 14:32:05' }), '2026-10-13T14:32:05');
  assert.equal(exifTakenAt({ DateTime: '2026:10:13 09:01:00' }), '2026-10-13T09:01:00');
  assert.equal(exifTakenAt({}), null);
  assert.equal(exifTakenAt(null), null);
});
