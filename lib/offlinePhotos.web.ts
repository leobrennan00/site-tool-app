import { supabase } from './supabase';
import { saveReportSections, getCachedReport, getLocalReport } from './offlineReports';
import { notifyLocalChange } from './syncQueue';
import { normalizePhotoLabel, PhotoLabel, PhotoMeta, metaFor, photoKey } from './photoLabels';

// Web build of the photo store. A photo added on the website is uploaded
// straight away, and the report's photo_urls / photo_meta are the photo list,
// so photos taken on the phone (once synced) show here with their tags, and
// photos added here show on the phone. Exports mirror offlinePhotos.ts.

export interface LocalPhoto {
  id: string;
  report_id: string;
  local_uri: string;
  remote_url: string | null;
  latitude: number | null;
  longitude: number | null;
  taken_at: string;
  kind: 'photo' | 'signature';
  label: string | null;
  uploaded: number;
  deleted: number;
  created_at: string;
}

export interface PhotoEntry {
  url: string;
  label: PhotoLabel;
  taken_at: string;
}

// Longest side of an uploaded photo. Desktop files can be 10 MB+; the report
// prints them a few inches wide, and the phone uploads at a similar size.
const MAX_SIDE = 2400;

async function reportPhotos(reportId: string): Promise<{ urls: string[]; meta: PhotoMeta }> {
  const report = getCachedReport(reportId) ?? (await getLocalReport(reportId));
  return {
    urls: [...((report?.photo_urls as string[]) || [])],
    meta: { ...((report?.photo_meta as PhotoMeta) || {}) },
  };
}

// The screens address a photo by id alone, so the id carries its report.
const SEP = '|';
function photoId(reportId: string, url: string): string {
  return `${reportId}${SEP}${photoKey(url)}`;
}
function parsePhotoId(id: string): { reportId: string; key: string } {
  const i = id.indexOf(SEP);
  return { reportId: id.slice(0, i), key: id.slice(i + 1) };
}

function toLocalPhoto(reportId: string, url: string, meta: PhotoMeta, index: number): LocalPhoto {
  const entry = metaFor(meta, url);
  return {
    id: photoId(reportId, url),
    report_id: reportId,
    local_uri: url,
    remote_url: url,
    latitude: null,
    longitude: null,
    taken_at: entry?.taken_at || '',
    kind: 'photo',
    label: entry?.label ?? null,
    uploaded: 1,
    deleted: 0,
    created_at: String(index).padStart(6, '0'),
  };
}

/** A picked image as a JPEG no larger than MAX_SIDE on its longest side. */
async function shrink(blob: Blob): Promise<Blob> {
  if (!blob.type.startsWith('image/') || blob.type === 'image/gif') return blob;
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && blob.type === 'image/jpeg') return blob;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return out ?? blob;
  } catch {
    return blob; // e.g. HEIC the browser can't decode: upload as picked
  }
}

async function uploadBlob(blob: Blob, folder: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not signed in');
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : (blob.type.split('/')[1] || 'jpg');
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const { error } = await supabase.storage.from('site-reports').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from('site-reports').getPublicUrl(path).data.publicUrl;
}

export async function capturePhotoOffline(
  reportId: string,
  pickerUri: string,
  kind: 'photo' | 'signature' = 'photo',
  opts: { label?: PhotoLabel | null; takenAt?: string | null } = {}
): Promise<LocalPhoto> {
  const picked = await (await fetch(pickerUri)).blob();
  const blob = kind === 'photo' ? await shrink(picked) : picked;
  const url = await uploadBlob(blob, kind === 'signature' ? 'signatures' : 'photos');
  const takenAt = opts.takenAt || new Date().toISOString();

  if (kind === 'photo') {
    const { urls, meta } = await reportPhotos(reportId);
    urls.push(url);
    meta[photoKey(url)] = { label: normalizePhotoLabel(opts.label ?? null), taken_at: takenAt };
    await saveReportSections(reportId, { photo_urls: urls, photo_meta: meta });
    notifyLocalChange();
    return toLocalPhoto(reportId, url, meta, urls.length - 1);
  }
  return { ...toLocalPhoto(reportId, url, {}, 0), kind, taken_at: takenAt };
}

export async function getLocalPhotosForReport(
  reportId: string,
  kind: 'photo' | 'signature' = 'photo'
): Promise<LocalPhoto[]> {
  if (kind !== 'photo') return [];
  const { urls, meta } = await reportPhotos(reportId);
  return urls.map((url, i) => toLocalPhoto(reportId, url, meta, i));
}

export async function getUploadedPhotoUrls(reportId: string, kind: 'photo' | 'signature' = 'photo'): Promise<string[]> {
  if (kind !== 'photo') return [];
  return (await reportPhotos(reportId)).urls;
}

export async function getUploadedPhotoEntries(reportId: string): Promise<PhotoEntry[]> {
  const { urls, meta } = await reportPhotos(reportId);
  return urls.map((url) => {
    const entry = metaFor(meta, url);
    return { url, label: normalizePhotoLabel(entry?.label ?? null), taken_at: entry?.taken_at || '' };
  });
}

export async function setPhotoLabel(id: string, label: PhotoLabel): Promise<void> {
  const { reportId, key } = parsePhotoId(id);
  const { urls, meta } = await reportPhotos(reportId);
  const url = urls.find((u) => photoKey(u) === key);
  if (!url) return;
  meta[key] = { label, taken_at: metaFor(meta, url)?.taken_at ?? null };
  await saveReportSections(reportId, { photo_meta: meta });
  notifyLocalChange();
}

export async function deletePhotoLocal(id: string): Promise<void> {
  const { reportId, key } = parsePhotoId(id);
  const { urls, meta } = await reportPhotos(reportId);
  delete meta[key];
  await saveReportSections(reportId, {
    photo_urls: urls.filter((u) => photoKey(u) !== key),
    photo_meta: meta,
  });
  notifyLocalChange();
}

export async function getPendingPhotoCount(): Promise<number> {
  return 0;
}
export async function syncPhotoUpload(_photoId: string): Promise<void> {}
export async function reconcilePhotosFromServer(_reportId: string): Promise<void> {}
export async function backfillPhotoMeta(): Promise<void> {}
