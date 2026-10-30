import { flushPendingSaves, subscribeSaving } from './offlineReports';

// Web build of the sync engine. There is no background queue on the website —
// edits are written to Supabase as they are made (offlineReports.web.ts) —
// so "syncing" is just that write being in flight, and processing the queue
// means sending anything a failed write left behind.

export function subscribeSyncing(cb: (syncing: boolean) => void): () => void {
  return subscribeSaving(cb);
}

export async function processQueue(): Promise<void> {
  await flushPendingSaves();
}

export function startSyncEngine(): void {}
