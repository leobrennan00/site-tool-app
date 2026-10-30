import * as Crypto from 'expo-crypto';
// expo-file-system v19 split its API: the classic promise-based functions
// (documentDirectory, copyAsync, getInfoAsync, makeDirectoryAsync) now live
// under the /legacy subpath rather than the package root.
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { getDb } from './db';
import { enqueue } from './syncQueue';
import { uploadPhoto, uploadFile } from './storage';
import { saveReportSections } from './offlineReports';
import { notifyLocalChange } from './syncQueue';
import { normalizePhotoLabel, PhotoLabel, PhotoMeta, buildPhotoMeta, metaFor, photoKey } from './photoLabels';

// Local-first photo capture: the full image + its GPS/timestamp is written
// to the device immediately (survives app close / phone dying), and the
// actual Supabase Storage upload is just another queued background job —
// see syncPhotoUpload() below, invoked by lib/syncProcessor.ts once online.

export interface LocalPhoto {
  id: string;
  report_id: string;
  local_uri: string;
  remote_url: string | null;
  latitude: number | null;
  longitude: number | null;
  taken_at: string;
  kind: 'photo' | 'signature';
  /** What the photo shows (lib/photoLabels.ts); null on photos taken before labels existed. */
  label: string | null;
  uploaded: number;
  deleted: number;
  created_at: string;
}

const PHOTOS_DIR = FileSystem.documentDirectory + 'site_photos/';

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/** Best-effort current GPS fix. Never blocks/throws the photo save — a
 *  photo with no location is far better than a lost photo. */
async function captureGps(): Promise<{ lat: number | null; lon: number | null }> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== 'granted') return { lat: null, lon: null };
    }
    const pos = await Location.getLastKnownPositionAsync({});
    const fix = pos ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: fix?.coords.latitude ?? null, lon: fix?.coords.longitude ?? null };
  } catch {
    return { lat: null, lon: null };
  }
}

export async function capturePhotoOffline(
  reportId: string,
  pickerUri: string,
  kind: 'photo' | 'signature' = 'photo',
  opts: { label?: PhotoLabel | null; takenAt?: string | null } = {}
): Promise<LocalPhoto> {
  await ensurePhotosDir();
  const db = await getDb();
  const id = Crypto.randomUUID();
  const ext = (pickerUri.split('.').pop() || 'jpg').split('?')[0];
  const destUri = `${PHOTOS_DIR}${id}.${ext}`;

  // Copy out of the picker's cache into our own permanent file — the cache
  // URI expo-image-picker hands back is not guaranteed to survive.
  await FileSystem.copyAsync({ from: pickerUri, to: destUri });

  // The moment the photo was taken (EXIF, when the picker passes it on), not
  // the moment it was added to the report.
  const takenAt = opts.takenAt || new Date().toISOString();
  const createdAt = new Date().toISOString();
  const { lat, lon } = await captureGps();

  await db.runAsync(
    `INSERT INTO photos (id, report_id, local_uri, remote_url, latitude, longitude, taken_at, kind, label, uploaded, deleted, created_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 0, 0, ?)`,
    [id, reportId, destUri, lat, lon, takenAt, kind, opts.label ?? null, createdAt]
  );

  await enqueue('photo_upload', { photoId: id }, reportId);

  return {
    id, report_id: reportId, local_uri: destUri, remote_url: null,
    latitude: lat, longitude: lon, taken_at: takenAt, kind, label: opts.label ?? null, uploaded: 0, deleted: 0, created_at: createdAt,
  };
}

export async function getLocalPhotosForReport(
  reportId: string,
  kind: 'photo' | 'signature' = 'photo'
): Promise<LocalPhoto[]> {
  const db = await getDb();
  return db.getAllAsync<LocalPhoto>(
    `SELECT * FROM photos WHERE report_id = ? AND kind = ? AND deleted = 0 ORDER BY created_at ASC`,
    [reportId, kind]
  );
}

export async function getUploadedPhotoUrls(
  reportId: string,
  kind: 'photo' | 'signature' = 'photo'
): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ remote_url: string }>(
    `SELECT remote_url FROM photos WHERE report_id = ? AND kind = ? AND deleted = 0 AND uploaded = 1 ORDER BY created_at ASC`,
    [reportId, kind]
  );
  return rows.map((r) => r.remote_url);
}

export interface PhotoEntry {
  url: string;
  label: PhotoLabel;
  taken_at: string;
}

/** Uploaded photos with what they show and when they were taken — the shape the
 *  report generator wants (site-tool-backend/report_layout.py: normalise_photos). */
export async function getUploadedPhotoEntries(reportId: string): Promise<PhotoEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ remote_url: string; label: string | null; taken_at: string }>(
    `SELECT remote_url, label, taken_at FROM photos WHERE report_id = ? AND kind = 'photo' AND deleted = 0 AND uploaded = 1 ORDER BY created_at ASC`,
    [reportId]
  );
  return rows.map((r) => ({ url: r.remote_url, label: normalizePhotoLabel(r.label), taken_at: r.taken_at }));
}

/** Change what a photo shows (works offline — it's only metadata). An
 *  uploaded photo's label goes to the server with the report's photo_meta. */
export async function setPhotoLabel(photoId: string, label: PhotoLabel): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE photos SET label = ? WHERE id = ?`, [label, photoId]);
  const photo = await db.getFirstAsync<LocalPhoto>(`SELECT * FROM photos WHERE id = ?`, [photoId]);
  if (photo?.uploaded) await resyncPhotoUrlsColumn(photo.report_id, photo.kind);
  notifyLocalChange();
}

export async function getPendingPhotoCount(reportId?: string): Promise<number> {
  const db = await getDb();
  const row = reportId
    ? await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM photos WHERE report_id = ? AND deleted = 0 AND uploaded = 0`,
        [reportId]
      )
    : await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM photos WHERE deleted = 0 AND uploaded = 0`);
  return row?.c ?? 0;
}

async function resyncPhotoUrlsColumn(reportId: string, kind: 'photo' | 'signature' = 'photo'): Promise<void> {
  if (kind !== 'photo') return; // only plain site photos feed report.photo_urls
  const entries = await getUploadedPhotoEntries(reportId);
  await saveReportSections(reportId, {
    photo_urls: entries.map((e) => e.url),
    photo_meta: buildPhotoMeta(entries),
  });
}

/**
 * Brings this device's photo list for a report into line with the report's
 * photo_urls / photo_meta after they came down from the server (photos added,
 * removed or re-tagged on another device or on the website). Photos taken
 * here and not uploaded yet are left alone.
 */
export async function reconcilePhotosFromServer(reportId: string): Promise<void> {
  const db = await getDb();
  const report = await db.getFirstAsync<{ photo_urls: string; photo_meta: string }>(
    `SELECT photo_urls, photo_meta FROM reports WHERE id = ?`,
    [reportId]
  );
  if (!report) return;
  let urls: string[] = [];
  let meta: PhotoMeta = {};
  try { urls = JSON.parse(report.photo_urls || '[]'); } catch {}
  try { meta = JSON.parse(report.photo_meta || '{}'); } catch {}

  const rows = await db.getAllAsync<LocalPhoto>(
    `SELECT * FROM photos WHERE report_id = ? AND kind = 'photo' AND uploaded = 1`,
    [reportId]
  );
  const byKey = new Map(rows.map((r) => [photoKey(r.remote_url || ''), r]));
  const wanted = new Set(urls.map(photoKey));

  for (const row of rows) {
    if (!row.deleted && !wanted.has(photoKey(row.remote_url || ''))) {
      await db.runAsync(`UPDATE photos SET deleted = 1 WHERE id = ?`, [row.id]);
    }
  }
  const base = Date.now();
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const entry = metaFor(meta, url);
    const existing = byKey.get(photoKey(url));
    if (existing) {
      await db.runAsync(`UPDATE photos SET deleted = 0, label = COALESCE(?, label) WHERE id = ?`, [entry?.label ?? null, existing.id]);
      continue;
    }
    // Added elsewhere: shown straight from its URL (Image loads https).
    await db.runAsync(
      `INSERT INTO photos (id, report_id, local_uri, remote_url, latitude, longitude, taken_at, kind, label, uploaded, deleted, created_at)
       VALUES (?, ?, ?, ?, NULL, NULL, ?, 'photo', ?, 1, 0, ?)`,
      [Crypto.randomUUID(), reportId, url, url, entry?.taken_at || new Date(base + i).toISOString(), entry?.label ?? null, new Date(base + i).toISOString()]
    );
  }
  notifyLocalChange();
}

/** Reports whose uploaded photos were tagged before labels were synced get
 *  their photo_meta written once, so the website sees the tags. */
export async function backfillPhotoMeta(): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT DISTINCT r.id FROM reports r JOIN photos p ON p.report_id = r.id
     WHERE r.deleted = 0 AND (r.photo_meta IS NULL OR r.photo_meta = '{}')
       AND p.kind = 'photo' AND p.uploaded = 1 AND p.deleted = 0`
  );
  for (const r of rows) await resyncPhotoUrlsColumn(r.id, 'photo');
}

export async function deletePhotoLocal(photoId: string): Promise<void> {
  const db = await getDb();
  const photo = await db.getFirstAsync<LocalPhoto>(`SELECT * FROM photos WHERE id = ?`, [photoId]);
  if (!photo) return;
  await db.runAsync(`UPDATE photos SET deleted = 1 WHERE id = ?`, [photoId]);
  if (photo.uploaded) {
    await resyncPhotoUrlsColumn(photo.report_id, photo.kind);
  }
}

/** Queue handler — uploads one captured photo to Supabase Storage, then
 *  folds its URL into the owning report's photo_urls so report sync and
 *  PDF generation pick it up. Reuses the existing uploadPhoto()/uploadFile()
 *  Storage logic unchanged; the only thing that changed is *when* it runs
 *  (from the queue, once we know we're online) and *what* it reads from
 *  (a permanent local file instead of a transient picker cache URI). */
export async function syncPhotoUpload(photoId: string): Promise<void> {
  const db = await getDb();
  const photo = await db.getFirstAsync<LocalPhoto>(`SELECT * FROM photos WHERE id = ?`, [photoId]);
  if (!photo || photo.deleted || photo.uploaded) return;

  const { url, error } = photo.kind === 'signature'
    ? await uploadFile(photo.local_uri, 'site-reports', 'signatures')
    : await uploadPhoto(photo.local_uri);

  if (error || !url) {
    throw new Error(error?.message || 'Photo upload failed');
  }

  await db.runAsync(`UPDATE photos SET remote_url = ?, uploaded = 1 WHERE id = ?`, [url, photoId]);
  await resyncPhotoUrlsColumn(photo.report_id, photo.kind);
}
