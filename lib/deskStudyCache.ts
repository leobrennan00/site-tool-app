import { getDb } from './db';

// Tracks whether the desk study (GSI/EPA lookups + generated maps) for a
// report has been fetched in advance ("Prepare for site", while there's
// signal) or is still outstanding. The actual desk study *data* — soil
// type, subsoil, bedrock, aquifer, vulnerability etc. — is cached simply by
// being saved into the report's desk_study section like any other field
// (see hooks/useAutoSave.ts), so it's available offline once fetched. This
// just tracks the "have we fetched it yet" status so the UI can show
// "Desk study pending" and the app can retry automatically on reconnect.
export type DeskStudyStatus = 'none' | 'pending' | 'ready';

export async function getDeskStudyStatus(reportId: string): Promise<{
  status: DeskStudyStatus;
  lat: string | null;
  lon: string | null;
}> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ desk_study_status: string; desk_study_lat: string | null; desk_study_lon: string | null }>(
    `SELECT desk_study_status, desk_study_lat, desk_study_lon FROM reports WHERE id = ?`,
    [reportId]
  );
  return {
    status: (row?.desk_study_status as DeskStudyStatus) || 'none',
    lat: row?.desk_study_lat ?? null,
    lon: row?.desk_study_lon ?? null,
  };
}

export async function markDeskStudyPending(reportId: string, lat: string, lon: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE reports SET desk_study_status = 'pending', desk_study_lat = ?, desk_study_lon = ? WHERE id = ?`,
    [lat, lon, reportId]
  );
}

export async function markDeskStudyReady(reportId: string, lat: string, lon: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE reports SET desk_study_status = 'ready', desk_study_lat = ?, desk_study_lon = ? WHERE id = ?`,
    [lat, lon, reportId]
  );
}

/** Reports whose desk study is still pending and has coordinates to retry
 *  with — used to auto-fetch as soon as the connection comes back. */
export async function getPendingDeskStudyReports(): Promise<{ id: string; lat: string; lon: string }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; desk_study_lat: string; desk_study_lon: string }>(
    `SELECT id, desk_study_lat, desk_study_lon FROM reports
     WHERE desk_study_status = 'pending' AND deleted = 0
       AND desk_study_lat IS NOT NULL AND desk_study_lon IS NOT NULL`
  );
  return rows.map((r) => ({ id: r.id, lat: r.desk_study_lat, lon: r.desk_study_lon }));
}
