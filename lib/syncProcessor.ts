import { AppState, AppStateStatus } from 'react-native';
import { getPendingItems, markProcessing, markDone, markError, subscribeQueueChanged, SyncQueueItem, enqueue } from './syncQueue';
import { syncOneReport, pullNewReportsFromServer, getDirtyReportIds } from './offlineReports';
import { syncPhotoUpload } from './offlinePhotos';
import { runQueuedReportGeneration } from './offlineReportGeneration';
import { isOnline, subscribeOnline } from './network';

// Drains the sync queue whenever we're online. This is the only place that
// actually talks to Supabase/FastAPI for background work — everything else
// (offlineReports, offlinePhotos) just writes to SQLite and enqueues here.
// Deliberately sequential (one item at a time): report upserts read-then-
// write the server row for conflict resolution, so running two for the same
// report concurrently could race.

let processing = false;
let syncingListeners = new Set<(syncing: boolean) => void>();
function setSyncing(v: boolean) {
  syncingListeners.forEach((cb) => cb(v));
}
export function subscribeSyncing(cb: (syncing: boolean) => void): () => void {
  syncingListeners.add(cb);
  return () => syncingListeners.delete(cb);
}

async function runOne(item: SyncQueueItem): Promise<void> {
  await markProcessing(item.id);
  try {
    switch (item.type) {
      case 'report_upsert':
      case 'report_delete':
        if (item.report_id) await syncOneReport(item.report_id);
        break;
      case 'photo_upload': {
        const payload = JSON.parse(item.payload || '{}');
        if (payload.photoId) await syncPhotoUpload(payload.photoId);
        break;
      }
      case 'report_generate': {
        const payload = JSON.parse(item.payload || '{}');
        await runQueuedReportGeneration(payload);
        break;
      }
      default:
        break;
    }
    await markDone(item.id);
  } catch (err: any) {
    await markError(item.id, err?.message || String(err));
    // Stop draining on the first failure rather than hammering through a
    // string of items that are likely to fail for the same reason (e.g.
    // connection dropped mid-sync) — the next trigger (reconnect, timer,
    // app foreground) will pick back up including this item.
    throw err;
  }
}

export async function processQueue(): Promise<void> {
  if (processing || !isOnline()) return;
  processing = true;
  setSyncing(true);
  try {
    await pullNewReportsFromServer().catch(() => {});

    // Defensive reconciliation: a report's `dirty=1` write and its queue
    // enqueue (see saveReportSections in lib/offlineReports.ts) aren't one
    // atomic operation, so in the rare case the app is killed between the
    // two, a dirty report could end up with no queue item pointing at it.
    // enqueue() coalesces with any existing pending item for the same
    // report, so this is a cheap no-op in the normal case.
    const dirtyIds = await getDirtyReportIds().catch(() => [] as string[]);
    for (const id of dirtyIds) {
      await enqueue('report_upsert', {}, id);
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!isOnline()) break;
      const items = await getPendingItems();
      if (items.length === 0) break;
      try {
        await runOne(items[0]);
      } catch {
        break;
      }
    }
  } finally {
    processing = false;
    setSyncing(false);
  }
}

let started = false;
export function startSyncEngine(): void {
  if (started) return;
  started = true;

  subscribeOnline((online) => {
    if (online) processQueue();
  });

  subscribeQueueChanged(() => {
    if (isOnline()) processQueue();
  });

  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') processQueue();
  });

  // Fallback safety net in case something was missed (e.g. an op failed
  // and nothing else happened to re-trigger it) — not the primary mechanism.
  setInterval(() => {
    if (isOnline()) processQueue();
  }, 60_000);

  processQueue();
}
