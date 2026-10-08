import * as Crypto from 'expo-crypto';
import { getDb } from './db';

// Generic, dependency-free queue of pending background work (report
// upserts/deletes, photo uploads, deferred report-generation requests).
// This file only knows how to store/list/update queue rows and notify
// listeners that the queue changed — it has no idea *how* to actually
// perform an operation. lib/syncProcessor.ts owns that (see there for why
// the split: it avoids a circular import between this file and
// lib/offlineReports.ts / lib/offlinePhotos.ts, which both need to enqueue
// work here).
export type SyncOpType =
  | 'report_upsert'
  | 'report_delete'
  | 'photo_upload'
  | 'report_generate';

export interface SyncQueueItem {
  id: string;
  type: SyncOpType;
  report_id: string | null;
  payload: string; // JSON, shape depends on `type`
  status: 'pending' | 'processing' | 'error';
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

const listeners = new Set<() => void>();
function notifyChanged() {
  listeners.forEach((cb) => cb());
}
export function subscribeQueueChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Add work to the queue. For report_upsert we coalesce: if there's already
 * a pending (not yet processing) upsert for the same report, we replace its
 * payload instead of stacking up redundant rows — every keystroke's debounced
 * save would otherwise leave dozens of near-duplicate queue rows behind.
 */
export async function enqueue(
  type: SyncOpType,
  payload: unknown,
  reportId: string | null = null
): Promise<string> {
  const db = await getDb();
  const now = new Date().toISOString();

  if (type === 'report_upsert' && reportId) {
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM sync_queue WHERE type = 'report_upsert' AND report_id = ? AND status = 'pending' LIMIT 1`,
      [reportId]
    );
    if (existing) {
      await db.runAsync(
        `UPDATE sync_queue SET payload = ?, updated_at = ? WHERE id = ?`,
        [JSON.stringify(payload), now, existing.id]
      );
      notifyChanged();
      return existing.id;
    }
  }

  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO sync_queue (id, type, report_id, payload, status, attempts, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
    [id, type, reportId, JSON.stringify(payload), now, now]
  );
  notifyChanged();
  return id;
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue WHERE status IN ('pending', 'error') ORDER BY created_at ASC`
  );
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM sync_queue WHERE status IN ('pending', 'error')`
  );
  return row?.c ?? 0;
}

export async function markProcessing(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE sync_queue SET status = 'processing', updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    id,
  ]);
  notifyChanged();
}

export async function markDone(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  notifyChanged();
}

export async function markError(id: string, error: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ attempts: number }>(`SELECT attempts FROM sync_queue WHERE id = ?`, [id]);
  await db.runAsync(
    `UPDATE sync_queue SET status = 'error', attempts = ?, last_error = ?, updated_at = ? WHERE id = ?`,
    [(row?.attempts ?? 0) + 1, error.slice(0, 500), new Date().toISOString(), id]
  );
  notifyChanged();
}
