import * as Crypto from 'expo-crypto';
import { getDb } from './db';
import { supabase } from './supabase';
import { enqueue } from './syncQueue';
import { isOnline } from './network';
import type { Report } from './reports';
import { SECTION_COLUMNS, SectionColumn, emptySection, PHOTO_OWNED_COLUMNS } from './reportColumns';
import { jsonEqual } from './stableJson';

// Local-first report storage + sync. The on-device SQLite row is the source
// of truth for whatever the engineer is looking at; Supabase is a
// destination we push to (and pull from) in the background, never something
// the UI waits on. See lib/db.ts for the schema and lib/syncProcessor.ts for
// how/when sync actually runs.

export { SECTION_COLUMNS, SECTION_KEY_TO_COLUMN } from './reportColumns';
export type { SectionColumn } from './reportColumns';

interface ReportRow {
  id: string;
  user_id: string;
  status: string;
  site_name: string | null;
  client_info: string;
  desk_study: string;
  visual_assessment: string;
  trial_hole: string;
  subsurface_perc: string;
  surface_perc: string;
  conclusion: string;
  selected_dwwts: string;
  treatment_systems: string;
  quality_assurance: string;
  site_assessor: string;
  photo_urls: string;
  map_urls: string;
  photo_meta: string;
  pdf_url: string | null;
  desk_study_cache: string | null;
  desk_study_status: string;
  desk_study_lat: string | null;
  desk_study_lon: string | null;
  field_timestamps: string;
  server_snapshot: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  dirty: number;
  deleted: number;
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    user_id: row.user_id,
    status: (row.status as Report['status']) || 'draft',
    site_name: row.site_name,
    client_info: parseJson(row.client_info, {}),
    desk_study: parseJson(row.desk_study, {}),
    visual_assessment: parseJson(row.visual_assessment, {}),
    trial_hole: parseJson(row.trial_hole, {}),
    subsurface_perc: parseJson(row.subsurface_perc, {}),
    surface_perc: parseJson(row.surface_perc, {}),
    conclusion: parseJson(row.conclusion, {}),
    selected_dwwts: parseJson(row.selected_dwwts, {}),
    treatment_systems: parseJson(row.treatment_systems, {}),
    quality_assurance: parseJson(row.quality_assurance, {}),
    site_assessor: parseJson(row.site_assessor, {}),
    photo_urls: parseJson(row.photo_urls, []),
    map_urls: parseJson(row.map_urls, []),
    photo_meta: parseJson(row.photo_meta, {}),
    pdf_url: row.pdf_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Returns the current user without making a network call — safe offline.
 *  (supabase.auth.getUser() always re-validates against the server and
 *  throws/fails when offline; getSession() just reads the persisted,
 *  SecureStore-backed session.) */
async function getLocalUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function listLocalReports(): Promise<Report[]> {
  const db = await getDb();
  const userId = await getLocalUserId();
  if (!userId) return [];
  const rows = await db.getAllAsync<ReportRow>(
    `SELECT * FROM reports WHERE user_id = ? AND deleted = 0 ORDER BY updated_at DESC`,
    [userId]
  );
  return rows.map(rowToReport);
}

export async function getLocalReport(id: string): Promise<Report | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ReportRow>(`SELECT * FROM reports WHERE id = ?`, [id]);
  return row ? rowToReport(row) : null;
}

export async function createReportOffline(
  siteName?: string
): Promise<{ data: Report | null; error: any }> {
  const userId = await getLocalUserId();
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } };
  }

  const db = await getDb();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const name = siteName || 'Untitled Report';

  await db.runAsync(
    `INSERT INTO reports (
       id, user_id, status, site_name,
       client_info, desk_study, visual_assessment, trial_hole,
       subsurface_perc, surface_perc, conclusion, selected_dwwts,
       treatment_systems, quality_assurance, site_assessor,
       photo_urls, map_urls, pdf_url,
       desk_study_cache, desk_study_status, desk_study_lat, desk_study_lon,
       field_timestamps, server_snapshot,
       created_at, updated_at, synced_at, dirty, deleted
     ) VALUES (?, ?, 'draft', ?, '{}','{}','{}','{}','{}','{}','{}','{}','{}','{}','{}','[]','[]', NULL,
       NULL, 'none', NULL, NULL, '{}', NULL, ?, ?, NULL, 1, 0)`,
    [id, userId, name, now, now]
  );

  await enqueue('report_upsert', {}, id);

  const row = await db.getFirstAsync<ReportRow>(`SELECT * FROM reports WHERE id = ?`, [id]);
  return { data: row ? rowToReport(row) : null, error: null };
}

/**
 * Saves whichever sections actually changed (called from the rewritten
 * useAutoSave — see hooks/useAutoSave.ts). Writes to SQLite immediately
 * (synchronous from the engineer's point of view — no network involved) and
 * queues a background push. Per-section edit timestamps are what let the
 * sync step later tell "I changed this on this device" apart from "the
 * server has a newer copy" (see syncOneReport below).
 */
export async function saveReportSections(
  reportId: string,
  changedSections: Partial<Record<SectionColumn, unknown>>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<ReportRow>(`SELECT field_timestamps, site_name, client_info FROM reports WHERE id = ?`, [reportId]);
  if (!existing) return;

  const timestamps = parseJson<Record<string, string>>(existing.field_timestamps, {});
  const setClauses: string[] = [];
  const args: (string | number | null)[] = [];

  for (const [col, value] of Object.entries(changedSections)) {
    setClauses.push(`${col} = ?`);
    args.push(JSON.stringify(value));
    timestamps[col] = now;
  }

  // site_name is derived from client_info.siteLocation, same as the old
  // Supabase-direct autosave did — kept here so My Reports still shows a
  // sensible title without a network round-trip.
  if (changedSections.client_info) {
    const ci = changedSections.client_info as any;
    const derivedName = (ci?.siteLocation || '').trim() || 'Untitled Report';
    setClauses.push('site_name = ?');
    args.push(derivedName);
  }

  setClauses.push('field_timestamps = ?', 'updated_at = ?', 'dirty = 1');
  args.push(JSON.stringify(timestamps), now, reportId);

  await db.runAsync(`UPDATE reports SET ${setClauses.join(', ')} WHERE id = ?`, args);
  await enqueue('report_upsert', {}, reportId);
}

export async function deleteReportOffline(reportId: string): Promise<{ error: any }> {
  const db = await getDb();
  await db.runAsync(`UPDATE reports SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    reportId,
  ]);
  await enqueue('report_delete', {}, reportId);
  return { error: null };
}

export async function completeReportOffline(reportId: string): Promise<{ error: any }> {
  const db = await getDb();
  await db.runAsync(`UPDATE reports SET status = 'completed', dirty = 1, updated_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    reportId,
  ]);
  await enqueue('report_upsert', {}, reportId);
  return { error: null };
}

function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/report-assets\/(.+)$/) || url.match(/\/site-reports\/(.+)$/);
  return match ? match[1] : null;
}

/** Best-effort remote cleanup of a deleted report's files + row. Called by
 *  the sync processor, online only. */
export async function pushReportDelete(reportId: string): Promise<void> {
  const { data: report } = await supabase.from('reports').select('*').eq('id', reportId).maybeSingle();
  if (report) {
    const filesToDelete: string[] = [];
    (report.photo_urls || []).forEach((u: string) => {
      const p = extractStoragePath(u);
      if (p) filesToDelete.push(p);
    });
    (report.map_urls || []).forEach((u: string) => {
      const p = extractStoragePath(u);
      if (p) filesToDelete.push(p);
    });
    const sigUrl = report.site_assessor?.signatureUrl || report.site_assessor?.signature_url;
    const sigPath = extractStoragePath(sigUrl);
    if (sigPath) filesToDelete.push(sigPath);
    if (filesToDelete.length > 0) {
      await supabase.storage.from('site-reports').remove(filesToDelete).catch(() => {});
    }
  }
  await supabase.from('reports').delete().eq('id', reportId);

  const db = await getDb();
  await db.runAsync(`DELETE FROM reports WHERE id = ?`, [reportId]);
  await db.runAsync(`DELETE FROM photos WHERE report_id = ?`, [reportId]);
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

async function logConflict(
  reportId: string,
  section: string,
  localValue: unknown,
  serverValue: unknown,
  resolution: 'kept_local' | 'kept_server'
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO conflict_log (id, report_id, section, local_value, server_value, resolution, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      Crypto.randomUUID(),
      reportId,
      section,
      JSON.stringify(localValue),
      JSON.stringify(serverValue),
      resolution,
      new Date().toISOString(),
    ]
  );
}

export interface ConflictLogEntry {
  id: string;
  report_id: string;
  section: string;
  local_value: string;
  server_value: string;
  resolution: string;
  occurred_at: string;
}

export async function getConflictLog(limit = 50): Promise<ConflictLogEntry[]> {
  const db = await getDb();
  return db.getAllAsync<ConflictLogEntry>(`SELECT * FROM conflict_log ORDER BY occurred_at DESC LIMIT ?`, [limit]);
}

// Builds before photo_meta existed in Supabase would have every sync
// rejected if we sent it to a database that hasn't had the column added
// yet, so a "column does not exist" error drops it and tries again.
function isMissingPhotoMeta(error: any): boolean {
  const message = String(error?.message || '');
  return /photo_meta/.test(message) && /column|schema/i.test(message);
}
function withoutPhotoMeta(payload: Record<string, any>): Record<string, any> {
  const { photo_meta: _omit, ...rest } = payload;
  return rest;
}

/** A section's value from a server row, or its empty value. */
function serverSection(row: Record<string, any>, col: SectionColumn): unknown {
  return row[col] ?? emptySection(col);
}

/** Whether a sync brought the photo columns down from the server, so the
 *  caller can bring the device's photo list into line (see
 *  reconcilePhotosFromServer in lib/offlinePhotos.ts). */
export interface SyncResult {
  photosChanged: boolean;
}

/**
 * Pushes/merges a single report with Supabase. Section-level last-write-wins:
 * for each form section we compare the server's current value against what
 * we last knew the server to have (server_snapshot) to see if the *other*
 * side (another phone, or the website) changed it, and against our local
 * field_timestamps to see if *this device* changed it since the last sync.
 * Only when both sides changed the same section do we log a conflict and
 * pick a winner by comparing the local edit time to the server row's
 * updated_at — every other case is a clean pull or push with nothing to
 * resolve. site_name and status are simple convenience fields and always
 * take the local value on push rather than going through per-field
 * conflict tracking.
 */
export async function syncOneReport(reportId: string): Promise<SyncResult> {
  const none: SyncResult = { photosChanged: false };
  if (!isOnline()) return none;
  const db = await getDb();
  const local = await db.getFirstAsync<ReportRow>(`SELECT * FROM reports WHERE id = ?`, [reportId]);
  if (!local) return none;

  if (local.deleted) {
    await pushReportDelete(reportId);
    return none;
  }

  const { data: serverRow } = await supabase.from('reports').select('*').eq('id', reportId).maybeSingle();
  const fieldTimestamps = parseJson<Record<string, string>>(local.field_timestamps, {});
  const serverSnapshot = local.server_snapshot ? parseJson<Record<string, any>>(local.server_snapshot, {}) : null;

  if (!serverRow) {
    // Never synced (or deleted remotely) — insert fresh with everything we have locally.
    const insertPayload: Record<string, any> = {
      id: local.id,
      user_id: local.user_id,
      status: local.status,
      site_name: local.site_name,
      created_at: local.created_at,
      updated_at: local.updated_at,
    };
    for (const col of SECTION_COLUMNS) {
      insertPayload[col] = parseJson((local as any)[col], emptySection(col));
    }

    const insert = async (payload: Record<string, any>) => {
      let { error } = await supabase.from('reports').insert([payload]);
      if (error && String(error.message || '').toLowerCase().includes('foreign key')) {
        await ensureProfileExists(local.user_id);
        ({ error } = await supabase.from('reports').insert([payload]));
      }
      return error;
    };
    let error = await insert(insertPayload);
    if (error && isMissingPhotoMeta(error)) error = await insert(withoutPhotoMeta(insertPayload));
    if (error) throw error;

    const snapshot: Record<string, any> = { ...insertPayload };
    await db.runAsync(
      `UPDATE reports SET server_snapshot = ?, field_timestamps = '{}', dirty = 0, synced_at = ? WHERE id = ?`,
      [JSON.stringify(snapshot), new Date().toISOString(), reportId]
    );
    return none;
  }

  // Both sides exist — resolve section by section.
  const resolved: Record<string, any> = {};
  const localUpdates: Record<string, any> = {};

  for (const col of SECTION_COLUMNS) {
    const localVal = parseJson((local as any)[col], emptySection(col));
    const serverVal = serverSection(serverRow, col);
    const knownServerVal = serverSnapshot && col in serverSnapshot ? serverSnapshot[col] : localVal;

    // Key order is ignored: jsonb hands objects back in its own order, which
    // otherwise makes every section look changed on the server.
    const serverChanged = !jsonEqual(serverVal, knownServerVal);
    const locallyChanged = col in fieldTimestamps;

    if (serverChanged && locallyChanged) {
      const localTime = new Date(fieldTimestamps[col]).getTime();
      const serverTime = new Date(serverRow.updated_at).getTime();
      if (localTime >= serverTime) {
        resolved[col] = localVal;
        await logConflict(reportId, col, localVal, serverVal, 'kept_local');
      } else {
        resolved[col] = serverVal;
        localUpdates[col] = serverVal;
        await logConflict(reportId, col, localVal, serverVal, 'kept_server');
      }
    } else if (serverChanged && !locallyChanged) {
      resolved[col] = serverVal;
      localUpdates[col] = serverVal;
    } else {
      // either locally changed only, or neither changed — local value is correct either way
      resolved[col] = localVal;
    }
  }

  const updatePayload: Record<string, any> = {
    ...resolved,
    site_name: local.site_name,
    status: local.status,
    updated_at: new Date().toISOString(),
  };

  let { error: updateError } = await supabase.from('reports').update(updatePayload).eq('id', reportId);
  if (updateError && isMissingPhotoMeta(updateError)) {
    ({ error: updateError } = await supabase.from('reports').update(withoutPhotoMeta(updatePayload)).eq('id', reportId));
  }
  if (updateError) throw updateError;

  const { data: freshServerRow } = await supabase.from('reports').select('*').eq('id', reportId).maybeSingle();
  const newSnapshot: Record<string, any> = {};
  for (const col of SECTION_COLUMNS) newSnapshot[col] = resolved[col];
  newSnapshot.site_name = local.site_name;
  newSnapshot.status = local.status;

  const localSetClauses = Object.keys(localUpdates).map((col) => `${col} = ?`);
  const localArgs = Object.keys(localUpdates).map((col) => JSON.stringify(localUpdates[col]));

  await db.runAsync(
    `UPDATE reports SET ${localSetClauses.length ? localSetClauses.join(', ') + ',' : ''} server_snapshot = ?, field_timestamps = '{}', dirty = 0, synced_at = ?, updated_at = ? WHERE id = ?`,
    [...localArgs, JSON.stringify(newSnapshot), new Date().toISOString(), freshServerRow?.updated_at || local.updated_at, reportId]
  );
  return { photosChanged: PHOTO_OWNED_COLUMNS.some((col) => col in localUpdates) };
}

/**
 * Brings the device up to date with the server: inserts reports that exist
 * there but not here (started on another phone or on the website), and
 * pulls in sections another device changed on reports already here.
 * Reports with unsynced edits on this device are left alone — their queued
 * upsert (syncOneReport) merges section by section instead. Does not push.
 * Returns the ids of reports whose photos changed, for the caller to
 * reconcile the device's photo list.
 */
export async function pullNewReportsFromServer(): Promise<string[]> {
  if (!isOnline()) return [];
  const userId = await getLocalUserId();
  if (!userId) return [];

  const db = await getDb();
  const { data: serverReports, error } = await supabase.from('reports').select('*').eq('user_id', userId);
  if (error || !serverReports) return [];

  const localRows = new Map(
    (await db.getAllAsync<ReportRow>(`SELECT * FROM reports WHERE user_id = ?`, [userId])).map((r) => [r.id, r])
  );
  const photosChanged: string[] = [];

  for (const sr of serverReports) {
    const snapshot: Record<string, any> = {};
    for (const col of SECTION_COLUMNS) snapshot[col] = serverSection(sr, col);
    snapshot.site_name = sr.site_name;
    snapshot.status = sr.status;

    const local = localRows.get(sr.id);
    if (local) {
      if (local.dirty || local.deleted) continue;
      const known = local.server_snapshot ? parseJson<Record<string, any>>(local.server_snapshot, {}) : null;
      const changed = SECTION_COLUMNS.filter((col) => {
        const knownVal = known && col in known ? known[col] : parseJson((local as any)[col], emptySection(col));
        return !jsonEqual(serverSection(sr, col), knownVal);
      });
      const metaChanged = sr.site_name !== local.site_name || sr.status !== local.status || sr.pdf_url !== local.pdf_url;
      if (!changed.length && !metaChanged) continue;

      const setClauses = changed.map((col) => `${col} = ?`);
      const args = changed.map((col) => JSON.stringify(serverSection(sr, col)));
      // `dirty = 0` again in the WHERE: an edit made on this device while
      // the server copy was being fetched wins, and is merged on its next sync.
      await db.runAsync(
        `UPDATE reports SET ${setClauses.length ? setClauses.join(', ') + ',' : ''} site_name = ?, status = ?, pdf_url = ?,
           server_snapshot = ?, updated_at = ?, synced_at = ? WHERE id = ? AND dirty = 0`,
        [...args, sr.site_name, sr.status, sr.pdf_url, JSON.stringify(snapshot), sr.updated_at, new Date().toISOString(), sr.id]
      );
      if (changed.some((col) => PHOTO_OWNED_COLUMNS.includes(col))) photosChanged.push(sr.id);
      continue;
    }

    await db.runAsync(
      `INSERT INTO reports (
         id, user_id, status, site_name,
         client_info, desk_study, visual_assessment, trial_hole,
         subsurface_perc, surface_perc, conclusion, selected_dwwts,
         treatment_systems, quality_assurance, site_assessor,
         photo_urls, map_urls, photo_meta, pdf_url,
         desk_study_cache, desk_study_status, desk_study_lat, desk_study_lon,
         field_timestamps, server_snapshot,
         created_at, updated_at, synced_at, dirty, deleted
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'none', NULL, NULL, '{}', ?, ?, ?, ?, 0, 0)`,
      [
        sr.id, sr.user_id, sr.status, sr.site_name,
        JSON.stringify(sr.client_info || {}), JSON.stringify(sr.desk_study || {}),
        JSON.stringify(sr.visual_assessment || {}), JSON.stringify(sr.trial_hole || {}),
        JSON.stringify(sr.subsurface_perc || {}), JSON.stringify(sr.surface_perc || {}),
        JSON.stringify(sr.conclusion || {}), JSON.stringify(sr.selected_dwwts || {}),
        JSON.stringify(sr.treatment_systems || {}), JSON.stringify(sr.quality_assurance || {}),
        JSON.stringify(sr.site_assessor || {}), JSON.stringify(sr.photo_urls || []),
        JSON.stringify(sr.map_urls || []), JSON.stringify(sr.photo_meta || {}), sr.pdf_url,
        JSON.stringify(snapshot), sr.created_at, sr.updated_at, new Date().toISOString(),
      ]
    );
    if ((sr.photo_urls || []).length) photosChanged.push(sr.id);
  }
  return photosChanged;
}

export async function getDirtyReportIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM reports WHERE dirty = 1`);
  return rows.map((r) => r.id);
}
