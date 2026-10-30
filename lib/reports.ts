// Public report API used by the screens (index.tsx, myReports.tsx, …).
// Every function here is now local-first: it reads/writes the on-device
// SQLite DB immediately and queues a background Supabase sync rather than
// blocking on the network — see lib/offlineReports.ts for the actual
// storage + conflict-resolution logic, and lib/syncProcessor.ts for when
// the queue actually gets flushed. Signatures are unchanged from before so
// existing call sites (loadReport, handleNewReport, MyReportsTab, …) didn't
// need to change.
import {
  createReportOffline,
  deleteReportOffline,
  completeReportOffline,
  listLocalReports,
  getLocalReport,
  saveReportSections,
} from './offlineReports';

export interface Report {
  id: string;
  user_id: string;
  status: 'draft' | 'completed';
  site_name: string | null;
  client_info: any;
  desk_study: any;
  visual_assessment: any;
  trial_hole: any;
  subsurface_perc: any;
  surface_perc: any;
  conclusion: any;
  selected_dwwts: any;
  treatment_systems: any;
  quality_assurance: any;
  site_assessor: any;
  photo_urls: string[];
  map_urls: string[];
  /** What each uploaded photo shows (lib/photoLabels.ts PhotoMeta). */
  photo_meta: Record<string, { label: string; taken_at: string | null }>;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Create a new draft report. Works fully offline — the id is generated on
 *  the device and reused as-is as the Supabase row id once synced, so there
 *  is never a separate "local id" to remap and no risk of duplicates. */
export async function createReport(siteName?: string): Promise<{ data: Report | null; error: any }> {
  return createReportOffline(siteName);
}

/** All reports for the current user, read from the local DB — available
 *  with no connection. Call lib/syncProcessor.ts's syncNow() separately
 *  (e.g. on pull-to-refresh) to pull in reports created on other devices. */
export async function getUserReports(): Promise<{ data: Report[] | null; error: any }> {
  try {
    const data = await listLocalReports();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getReport(reportId: string): Promise<{ data: Report | null; error: any }> {
  try {
    const data = await getLocalReport(reportId);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/** Deletes locally immediately (hidden from the list right away) and queues
 *  the remote delete (including storage cleanup) for when back online. */
export async function deleteReport(reportId: string): Promise<{ error: any }> {
  return deleteReportOffline(reportId);
}

export async function completeReport(reportId: string): Promise<{ error: any }> {
  return completeReportOffline(reportId);
}

// Re-exported for screens that want to save specific sections directly
// without going through useAutoSave (none currently do, but this keeps the
// section-save logic discoverable from the same module screens already
// import from).
export { saveReportSections };
