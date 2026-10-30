import { API_BASE } from './apiBase';
import { getUploadedPhotoEntries } from './offlinePhotos';

// Web build: the website never queues a report for later (it is online), but
// the shared screen code can still reach this, so it sends the request now.
export async function runQueuedReportGeneration(payload: Record<string, any>): Promise<void> {
  const { __reportId, ...body } = payload;
  if (__reportId) body.photos = await getUploadedPhotoEntries(__reportId);
  const res = await fetch(`${API_BASE}/generate_report_from_app`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json?.status !== 'ok' || !json?.url) throw new Error(json?.detail || 'Report generation failed');
}
