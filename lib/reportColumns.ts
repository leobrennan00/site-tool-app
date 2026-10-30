// The report's form sections as stored in Supabase (and, on the phone, in the
// on-device SQLite copy). Shared by the phone's local-first store
// (offlineReports.ts) and the website's direct one (offlineReports.web.ts).

export const SECTION_COLUMNS = [
  'client_info',
  'desk_study',
  'visual_assessment',
  'trial_hole',
  'subsurface_perc',
  'surface_perc',
  'conclusion',
  'selected_dwwts',
  'treatment_systems',
  'quality_assurance',
  'site_assessor',
  'photo_urls',
  'map_urls',
  // What each uploaded photo shows and when it was taken, keyed by its URL
  // (see lib/photoLabels.ts), so a report started on one device can be
  // finished on another with its photos still tagged.
  'photo_meta',
] as const;
export type SectionColumn = (typeof SECTION_COLUMNS)[number];

/** Columns that hold a list rather than an object. */
export const ARRAY_COLUMNS: readonly SectionColumn[] = ['photo_urls', 'map_urls'];

/** The empty value of a section column. */
export function emptySection(col: SectionColumn): unknown {
  return ARRAY_COLUMNS.includes(col) ? [] : {};
}

// Maps the camelCase section keys used by the app's ReportData shape
// (hooks/useAutoSave.ts, app/(tabs)/index.tsx) to the snake_case columns.
export const SECTION_KEY_TO_COLUMN: Record<string, SectionColumn> = {
  clientInfo: 'client_info',
  deskStudy: 'desk_study',
  visualAssessment: 'visual_assessment',
  trialHole: 'trial_hole',
  subsurfacePerc: 'subsurface_perc',
  surfacePerc: 'surface_perc',
  conclusion: 'conclusion',
  selectedDwwts: 'selected_dwwts',
  treatmentSystems: 'treatment_systems',
  qualityAssurance: 'quality_assurance',
  siteAssessor: 'site_assessor',
  photoUrls: 'photo_urls',
  mapUrls: 'map_urls',
  photoMeta: 'photo_meta',
};

/** Columns written only by the photo store, never from the form's state by autosave. */
export const PHOTO_OWNED_COLUMNS: readonly SectionColumn[] = ['photo_urls', 'photo_meta'];
