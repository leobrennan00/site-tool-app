// What a site photo shows. The report lays photos out by this label (see
// site-tool-backend/report_layout.py): overview + test area first, then the
// percolation holes in a grid, then the trial hole, then everything else.
// The label strings are the contract with the backend — keep them identical.

export const PHOTO_LABELS = [
  'Site overview',
  'Test area',
  'Surface percolation hole 1',
  'Surface percolation hole 2',
  'Surface percolation hole 3',
  'Subsurface percolation hole 1',
  'Subsurface percolation hole 2',
  'Subsurface percolation hole 3',
  'Trial hole (portrait)',
  'Trial hole (landscape)',
  'Other',
] as const;

export type PhotoLabel = (typeof PHOTO_LABELS)[number];

export const DEFAULT_PHOTO_LABEL: PhotoLabel = 'Other';

/** A stored label as a known one; anything unknown or empty (older photos) is "Other". */
export function normalizePhotoLabel(raw: string | null | undefined): PhotoLabel {
  return (PHOTO_LABELS as readonly string[]).includes(String(raw)) ? (raw as PhotoLabel) : DEFAULT_PHOTO_LABEL;
}

/** Labels that take a single slot in the report; tagging a second photo with one moves it (see photos.tsx). */
export const isSingleSlot = (label: PhotoLabel) => label !== 'Other';

/** The EXIF capture time of a picked asset as an ISO string, if the picker gave us one. */
export function exifTakenAt(exif: Record<string, any> | null | undefined): string | null {
  const raw = exif?.DateTimeOriginal ?? exif?.DateTimeDigitized ?? exif?.DateTime;
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(raw ?? ''));
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
}

/** What one uploaded photo shows, as stored in the report's photo_meta column. */
export interface PhotoMetaEntry {
  label: PhotoLabel;
  taken_at: string | null;
}
/** photo_meta: keyed by the photo's URL without its query string (see photoKey). */
export type PhotoMeta = Record<string, PhotoMetaEntry>;

/** A photo URL without any query string, so a cache-buster can't hide a match. */
export function photoKey(url: string): string {
  return String(url || '').split('?')[0];
}

/** photo_meta for these photos, in the shape every device reads. */
export function buildPhotoMeta(photos: { url: string; label: string | null; taken_at: string | null }[]): PhotoMeta {
  const meta: PhotoMeta = {};
  for (const p of photos) meta[photoKey(p.url)] = { label: normalizePhotoLabel(p.label), taken_at: p.taken_at ?? null };
  return meta;
}

/** A photo's entry in photo_meta, if it has one. */
export function metaFor(meta: PhotoMeta | null | undefined, url: string): PhotoMetaEntry | null {
  return (meta && meta[photoKey(url)]) || null;
}
