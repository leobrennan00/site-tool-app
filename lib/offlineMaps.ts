// expo-file-system v19 keeps the classic promise API under /legacy.
import * as FileSystem from 'expo-file-system/legacy';
import { getDb } from './db';

// Desk-study maps are generated server-side and stored in Supabase Storage,
// so on site with no signal their https URLs simply don't load. When maps are
// generated ("Prepare for site"), each one is also downloaded into the app's
// own storage and the remote→local mapping kept in the report's
// desk_study_cache column, so the maps screen can show the local copy offline.
// The remote URLs are still what's sent for PDF generation (the backend
// can't read files on the phone).

const MAPS_DIR = FileSystem.documentDirectory + 'site_maps/';

export type LocalMapIndex = Record<string, string>; // remote URL (no query) → local file URI

/** Remote URLs carry a `?_t=` cache-buster that changes on every load. */
export function mapKey(url: string): string {
  return url.split('?')[0];
}

export async function getLocalMapIndex(reportId: string): Promise<LocalMapIndex> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ desk_study_cache: string | null }>(
    `SELECT desk_study_cache FROM reports WHERE id = ?`,
    [reportId]
  );
  if (!row?.desk_study_cache) return {};
  try {
    const parsed = JSON.parse(row.desk_study_cache);
    return parsed?.maps ?? {};
  } catch {
    return {};
  }
}

async function saveLocalMapIndex(reportId: string, index: LocalMapIndex): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE reports SET desk_study_cache = ? WHERE id = ?`, [
    JSON.stringify({ maps: index }),
    reportId,
  ]);
}

/**
 * Downloads any of `remoteUrls` not already stored locally for this report.
 * Best-effort per map: one failed download doesn't stop the rest, and the
 * already-cached ones are kept. Returns the full index after downloading.
 */
export async function cacheMapsLocally(reportId: string, remoteUrls: string[]): Promise<LocalMapIndex> {
  const dir = `${MAPS_DIR}${reportId}/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const index = await getLocalMapIndex(reportId);

  for (const url of remoteUrls) {
    if (!/^https?:\/\//.test(url)) continue;
    const key = mapKey(url);
    const existing = index[key];
    if (existing && (await FileSystem.getInfoAsync(existing)).exists) continue;

    const filename = key.split('/').pop() || `map_${Date.now()}.png`;
    try {
      const res = await FileSystem.downloadAsync(url, dir + filename);
      if (res.status === 200) index[key] = res.uri;
    } catch (err) {
      console.warn('Map download failed (will retry next time online):', key, err);
    }
  }

  await saveLocalMapIndex(reportId, index);
  return index;
}
