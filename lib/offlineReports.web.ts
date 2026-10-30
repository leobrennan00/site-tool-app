import { supabase } from './supabase';
import { setPendingItems, setFlushHandler, SyncQueueItem } from './syncQueue';
import { SECTION_COLUMNS, SectionColumn, emptySection } from './reportColumns';
import { jsonEquivalent } from './stableJson';
import type { Report } from './reports';

// Web build of the report store. The phone keeps a local-first SQLite copy
// and syncs it in the background (offlineReports.ts); the website has a
// connection by definition, so Supabase *is* the store: reports are read
// fresh from the server (which is how a report started on the phone shows up
// here with everything the phone has synced) and edits are written straight
// back, section by section, so they merge cleanly with the phone's own
// section-level sync. Exports mirror offlineReports.ts so the screens are
// shared unchanged.

export { SECTION_COLUMNS, SECTION_KEY_TO_COLUMN } from './reportColumns';
export type { SectionColumn } from './reportColumns';

// The last server copy of each report, with this tab's unsent edits applied.
const cache = new Map<string, Report>();

interface PendingSave {
  sections: Partial<Record<SectionColumn | 'site_name' | 'status', unknown>>;
  since: string;
  attempts: number;
  error: string | null;
}
// Edits not yet acknowledged by Supabase, per report. Saves made while one
// is in flight are merged here and go out in the next write.
const pending = new Map<string, PendingSave>();
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const syncingListeners = new Set<(syncing: boolean) => void>();

export function subscribeSaving(cb: (syncing: boolean) => void): () => void {
  syncingListeners.add(cb);
  return () => syncingListeners.delete(cb);
}

function publishPending() {
  const items: SyncQueueItem[] = [...pending.entries()].map(([reportId, p]) => ({
    id: reportId,
    type: 'report_upsert',
    report_id: reportId,
    payload: '{}',
    status: p.error ? 'error' : 'pending',
    attempts: p.attempts,
    last_error: p.error,
    created_at: p.since,
    updated_at: p.since,
  }));
  setPendingItems(items);
}

function normalise(row: Record<string, any>): Report {
  const report: Record<string, any> = { ...row, status: row.status || 'draft' };
  for (const col of SECTION_COLUMNS) report[col] = row[col] ?? emptySection(col);
  return report as Report;
}

/** A server row with this tab's unsent edits laid over it. */
function withPending(report: Report): Report {
  const p = pending.get(report.id);
  return p ? ({ ...report, ...p.sections } as Report) : report;
}

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function listLocalReports(): Promise<Report[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => {
    const report = withPending(normalise(row));
    cache.set(report.id, report);
    return report;
  });
}

/** Always re-read from the server, so a report continued here has the
 *  phone's latest synced edits; the cached copy is the fallback. */
export async function getLocalReport(id: string): Promise<Report | null> {
  const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
  if (error || !data) return cache.get(id) ?? null;
  const report = withPending(normalise(data));
  cache.set(id, report);
  return report;
}

/** The copy this tab last read or wrote, without a network round trip. */
export function getCachedReport(id: string): Report | null {
  return cache.get(id) ?? null;
}

async function ensureProfileExists(userId: string): Promise<void> {
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!profile) {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('profiles').insert([
      { id: userId, email: session?.user?.email, full_name: session?.user?.user_metadata?.full_name || 'Unknown' },
    ]);
  }
}

export async function createReportOffline(siteName?: string): Promise<{ data: Report | null; error: any }> {
  const userId = await getUserId();
  if (!userId) return { data: null, error: { message: 'Not authenticated' } };

  const now = new Date().toISOString();
  const row: Record<string, any> = {
    id: globalThis.crypto.randomUUID(),
    user_id: userId,
    status: 'draft',
    site_name: siteName || 'Untitled Report',
    pdf_url: null,
    created_at: now,
    updated_at: now,
  };
  for (const col of SECTION_COLUMNS) row[col] = emptySection(col);
  if (photoMetaMissing) delete row.photo_meta;

  let { error } = await supabase.from('reports').insert([row]);
  if (error && isMissingPhotoMeta(error)) {
    photoMetaMissing = true;
    delete row.photo_meta;
    ({ error } = await supabase.from('reports').insert([row]));
  }
  if (error && String(error.message || '').toLowerCase().includes('foreign key')) {
    await ensureProfileExists(userId);
    ({ error } = await supabase.from('reports').insert([row]));
  }
  if (error) return { data: null, error };
  const report = normalise(row);
  cache.set(report.id, report);
  return { data: report, error: null };
}

/**
 * Saves the sections that changed (from hooks/useAutoSave.ts, already
 * debounced). Opening a report re-saves every section once, with the form's
 * empty boxes filled in as blanks; those say nothing new, so a section
 * equivalent to the server's copy is not written. Otherwise just opening a
 * report here could overwrite edits the phone hasn't synced yet.
 */
export async function saveReportSections(
  reportId: string,
  changedSections: Partial<Record<SectionColumn, unknown>>
): Promise<void> {
  const current = cache.get(reportId);
  const changes: PendingSave['sections'] = {};
  for (const [col, value] of Object.entries(changedSections) as [SectionColumn, unknown][]) {
    if (current && jsonEquivalent((current as any)[col], value)) continue;
    changes[col] = value;
  }
  // site_name follows client_info.siteLocation, as on the phone.
  if (changes.client_info) {
    const ci = changes.client_info as any;
    const name = (ci?.siteLocation || '').trim() || 'Untitled Report';
    if (!current || current.site_name !== name) changes.site_name = name;
  }
  if (Object.keys(changes).length === 0) return;

  queueSave(reportId, changes);
  await flushPendingSaves();
}

function queueSave(reportId: string, changes: PendingSave['sections']) {
  const current = cache.get(reportId);
  if (current) cache.set(reportId, { ...current, ...changes } as Report);
  const existing = pending.get(reportId);
  pending.set(reportId, {
    sections: { ...(existing?.sections || {}), ...changes },
    since: existing?.since || new Date().toISOString(),
    attempts: existing?.attempts || 0,
    error: existing?.error || null,
  });
  publishPending();
}

/** Sends every unsent edit. Safe to call repeatedly; one write at a time. */
export async function flushPendingSaves(): Promise<void> {
  if (flushing) return;
  flushing = true;
  syncingListeners.forEach((cb) => cb(true));
  try {
    for (const [reportId, save] of [...pending.entries()]) {
      // Taken out before sending: edits made during the write queue up afresh.
      pending.delete(reportId);
      const payload: Record<string, unknown> = { ...save.sections, updated_at: new Date().toISOString() };
      if (photoMetaMissing) delete payload.photo_meta;
      let { error } = await supabase.from('reports').update(payload).eq('id', reportId);
      if (error && isMissingPhotoMeta(error)) {
        // Database not migrated yet (see add-photo-meta.sql): the labels
        // can't be stored, but nothing else should be held up by that.
        photoMetaMissing = true;
        delete payload.photo_meta;
        ({ error } = await supabase.from('reports').update(payload).eq('id', reportId));
      }
      if (error) {
        const newer = pending.get(reportId);
        pending.set(reportId, {
          sections: { ...save.sections, ...(newer?.sections || {}) },
          since: save.since,
          attempts: save.attempts + 1,
          error: error.message || 'Save failed',
        });
        scheduleRetry(save.attempts + 1);
      } else {
        const current = cache.get(reportId);
        if (current) cache.set(reportId, { ...current, updated_at: payload.updated_at as string } as Report);
      }
      publishPending();
    }
  } finally {
    flushing = false;
    syncingListeners.forEach((cb) => cb(false));
  }
  // Anything saved while that pass was running.
  if ([...pending.values()].some((p) => !p.error)) await flushPendingSaves();
}

let photoMetaMissing = false;
function isMissingPhotoMeta(error: any): boolean {
  const message = String(error?.message || '');
  return /photo_meta/.test(message) && /column|schema/i.test(message);
}

function scheduleRetry(attempts: number) {
  if (retryTimer) return;
  const delay = Math.min(60_000, 2_000 * 2 ** Math.min(attempts, 5));
  retryTimer = setTimeout(() => {
    retryTimer = null;
    for (const p of pending.values()) p.error = null;
    flushPendingSaves();
  }, delay);
}

setFlushHandler(() => { flushPendingSaves(); });

export function hasUnsavedChanges(): boolean {
  return pending.size > 0 || flushing;
}

if (typeof window !== 'undefined') {
  // Closing the tab with an edit still on its way would lose it.
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  window.addEventListener('online', () => {
    for (const p of pending.values()) p.error = null;
    flushPendingSaves();
  });
}

function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/report-assets\/(.+)$/) || url.match(/\/site-reports\/(.+)$/);
  return match ? match[1] : null;
}

/** Deletes the report and its files, as the phone's sync does once online. */
export async function deleteReportOffline(reportId: string): Promise<{ error: any }> {
  pending.delete(reportId);
  publishPending();
  const { data: report } = await supabase.from('reports').select('*').eq('id', reportId).maybeSingle();
  if (report) {
    const files: string[] = [];
    for (const u of [...(report.photo_urls || []), ...(report.map_urls || [])]) {
      const p = extractStoragePath(u);
      if (p) files.push(p);
    }
    const sigPath = extractStoragePath(report.site_assessor?.signatureUrl || report.site_assessor?.signature_url);
    if (sigPath) files.push(sigPath);
    if (files.length) await supabase.storage.from('site-reports').remove(files).catch(() => {});
  }
  const { error } = await supabase.from('reports').delete().eq('id', reportId);
  if (!error) cache.delete(reportId);
  return { error };
}

export async function completeReportOffline(reportId: string): Promise<{ error: any }> {
  queueSave(reportId, { status: 'completed' });
  await flushPendingSaves();
  return { error: null };
}

// The phone's sync entry points. On the web every read is already fresh and
// every write already sent, so these just send anything outstanding.
export async function pullNewReportsFromServer(): Promise<string[]> {
  return [];
}
export async function syncOneReport(_reportId: string): Promise<{ photosChanged: boolean }> {
  await flushPendingSaves();
  return { photosChanged: false };
}
export async function getDirtyReportIds(): Promise<string[]> {
  return [...pending.keys()];
}
export async function getConflictLog(): Promise<never[]> {
  return [];
}
