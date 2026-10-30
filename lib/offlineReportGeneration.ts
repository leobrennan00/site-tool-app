import { getDb } from './db';
import { getUploadedPhotoEntries } from './offlinePhotos';
import { API_BASE } from './apiBase';

/**
 * Runs a "Generate report" request that was queued while offline (see
 * generateReport() in app/(tabs)/index.tsx). The payload is the exact body
 * that would have been POSTed at tap-time, with one refresh: `photos` is
 * re-read from the local DB right before sending, since photos taken while
 * offline can only finish uploading once we're back online — by the time
 * this queue item is reached, any report_upsert/photo_upload items queued
 * before it (i.e. everything the engineer did up to tapping "Generate
 * report") have already been processed, so their URLs are available here.
 */
export async function runQueuedReportGeneration(payload: Record<string, any>): Promise<void> {
  const { __reportId, ...body } = payload;

  if (__reportId) {
    // With their labels, so the report lays them out as tagged.
    body.photos = await getUploadedPhotoEntries(__reportId);
  }

  const res = await fetch(`${API_BASE}/generate_report_from_app`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();

  if (json?.status !== 'ok' || !json?.url) {
    throw new Error(json?.detail || 'Report generation failed');
  }

  if (__reportId) {
    const db = await getDb();
    await db.runAsync(`UPDATE reports SET pdf_url = ? WHERE id = ?`, [json.url, __reportId]);
  }
}
