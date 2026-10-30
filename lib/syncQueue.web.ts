// Web build of the sync queue. The website writes straight to Supabase (see
// offlineReports.web.ts), so there is no on-device queue table — just the
// list of saves still on their way, which the sync status pill shows, and
// the same change notifications the screens already subscribe to.
export type SyncOpType =
  | 'report_upsert'
  | 'report_delete'
  | 'photo_upload'
  | 'report_generate';

export interface SyncQueueItem {
  id: string;
  type: SyncOpType;
  report_id: string | null;
  payload: string;
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
export const notifyLocalChange = notifyChanged;
export function subscribeQueueChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let pending: SyncQueueItem[] = [];

/** Called by the web report store whenever its outstanding saves change. */
export function setPendingItems(items: SyncQueueItem[]): void {
  pending = items;
  notifyChanged();
}

// Nothing is queued for later on the web: saves go out as they are made.
// Kept so shared code that enqueues (report_upsert after a save) still runs.
let flushHandler: (() => void) | null = null;
export function setFlushHandler(fn: () => void): void {
  flushHandler = fn;
}
export async function enqueue(_type: SyncOpType, _payload: unknown, _reportId: string | null = null): Promise<string> {
  flushHandler?.();
  return '';
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  return pending;
}

export async function getPendingCount(): Promise<number> {
  return pending.length;
}

export async function markProcessing(_id: string): Promise<void> {}
export async function markDone(_id: string): Promise<void> {}
export async function markError(_id: string, _error: string): Promise<void> {}
