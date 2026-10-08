import * as SQLite from 'expo-sqlite';

// Single on-device database backing all offline work: local-first report
// drafts, captured photos awaiting upload, the background sync queue, and a
// log of any field-level conflicts found during sync. Everything here is
// per-device — it is not synced itself, it is what *drives* syncing to
// Supabase (see lib/syncQueue.ts).
const DB_NAME = 'sitereport.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      site_name TEXT,
      client_info TEXT NOT NULL DEFAULT '{}',
      desk_study TEXT NOT NULL DEFAULT '{}',
      visual_assessment TEXT NOT NULL DEFAULT '{}',
      trial_hole TEXT NOT NULL DEFAULT '{}',
      subsurface_perc TEXT NOT NULL DEFAULT '{}',
      surface_perc TEXT NOT NULL DEFAULT '{}',
      conclusion TEXT NOT NULL DEFAULT '{}',
      selected_dwwts TEXT NOT NULL DEFAULT '{}',
      treatment_systems TEXT NOT NULL DEFAULT '{}',
      quality_assurance TEXT NOT NULL DEFAULT '{}',
      site_assessor TEXT NOT NULL DEFAULT '{}',
      photo_urls TEXT NOT NULL DEFAULT '[]',
      map_urls TEXT NOT NULL DEFAULT '[]',
      pdf_url TEXT,
      desk_study_cache TEXT,
      desk_study_status TEXT NOT NULL DEFAULT 'none',
      desk_study_lat TEXT,
      desk_study_lon TEXT,
      field_timestamps TEXT NOT NULL DEFAULT '{}',
      server_snapshot TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      dirty INTEGER NOT NULL DEFAULT 1,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY NOT NULL,
      report_id TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      remote_url TEXT,
      latitude REAL,
      longitude REAL,
      taken_at TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'photo',
      uploaded INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_photos_report_id ON photos(report_id);

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      report_id TEXT,
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

    CREATE TABLE IF NOT EXISTS conflict_log (
      id TEXT PRIMARY KEY NOT NULL,
      report_id TEXT NOT NULL,
      section TEXT NOT NULL,
      local_value TEXT,
      server_value TEXT,
      resolution TEXT NOT NULL,
      occurred_at TEXT NOT NULL
    );
  `);
}
