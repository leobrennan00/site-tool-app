import { useEffect, useRef } from 'react';
import { saveReportSections } from '../lib/offlineReports';
import { SECTION_KEY_TO_COLUMN, SectionColumn, PHOTO_OWNED_COLUMNS } from '../lib/reportColumns';

interface ReportData {
  clientInfo?: any;
  deskStudy?: any;
  visualAssessment?: any;
  trialHole?: any;
  subsurfacePerc?: any;
  surfacePerc?: any;
  conclusion?: any;
  selectedDwwts?: any;
  treatmentSystems?: any;
  qualityAssurance?: any;
  siteAssessor?: any;
  photoUrls?: string[];
  mapUrls?: string[];
}

/**
 * Saves report data as the engineer types. Previously this wrote straight to
 * Supabase (a 2s-debounced whole-record overwrite) which required a
 * connection and clobbered every section on every save. Now it writes
 * straight to the on-device DB — instant, no network needed, nothing typed
 * on site is ever lost even if the app is killed a second later — and only
 * queues a background sync for the sections that actually changed. The
 * Supabase push itself (and any conflict resolution against edits made on
 * another device) happens later in lib/syncProcessor.ts.
 */
export function useAutoSave(
  reportId: string | null,
  data: ReportData,
  enabled: boolean = true
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the last-saved JSON for each section so we only touch (and
  // timestamp) sections that actually changed, not the whole record.
  const previousSectionsRef = useRef<Partial<Record<SectionColumn, string>>>({});
  const previousReportIdRef = useRef<string | null>(null);
  // Holds whatever save is currently debounced, so it can be flushed
  // immediately instead of discarding it — both on unmount (see the second
  // effect below) and on demand via the returned flush() (see generateReport
  // in app/(tabs)/index.tsx, which flushes before building the report so the
  // last few keystrokes before tapping "Generate Report" are never missed).
  // Re-created on every render that has a pending change; cleared once run.
  const pendingFlushRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!enabled || !reportId) return;

    // Loading a different report resets the "last saved" baseline so we
    // don't try to diff this report's fields against the previous report's.
    if (previousReportIdRef.current !== reportId) {
      previousReportIdRef.current = reportId;
      previousSectionsRef.current = {};
    }

    const changed: Partial<Record<SectionColumn, unknown>> = {};
    for (const [key, column] of Object.entries(SECTION_KEY_TO_COLUMN) as [string, SectionColumn][]) {
      // photo_urls / photo_meta are owned by lib/offlinePhotos.ts — it writes
      // them itself as each photo finishes uploading or is re-tagged, since
      // photo_urls must only ever contain *uploaded* remote URLs (report
      // generation downloads them from Supabase). Writing them here too, from
      // whatever's in React state, could race with that and would briefly
      // include not-yet-uploaded photos.
      if (PHOTO_OWNED_COLUMNS.includes(column)) continue;
      const value = (data as any)[key] ?? (column === 'photo_urls' || column === 'map_urls' ? [] : {});
      const serialized = JSON.stringify(value);
      if (previousSectionsRef.current[column] !== serialized) {
        changed[column] = value;
      }
    }

    if (Object.keys(changed).length === 0) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    let flushed = false;
    const doSave = async () => {
      if (flushed) return;
      flushed = true;
      try {
        await saveReportSections(reportId, changed);
        for (const column of Object.keys(changed) as SectionColumn[]) {
          previousSectionsRef.current[column] = JSON.stringify(changed[column]);
        }
      } catch (err) {
        console.error('Local auto-save failed:', err);
      }
    };

    // Short debounce so we're not hitting SQLite on every keystroke, while
    // keeping the window where an in-progress edit could be lost small and
    // purely local — unlike the old 2s network debounce, nothing here is
    // waiting on a connection.
    timeoutRef.current = setTimeout(doSave, 600);
    pendingFlushRef.current = doSave;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, reportId, enabled]);

  // Unmount only (empty deps) — flushes whatever save was last left pending
  // (e.g. the engineer navigated away less than 600ms after typing) instead
  // of letting the debounce timer get cleared with nothing saved.
  useEffect(() => {
    return () => {
      pendingFlushRef.current?.();
    };
  }, []);

  // Callable on demand (e.g. right before "Generate Report" builds its
  // payload) to force-save whatever's still sitting in the debounce window,
  // rather than waiting up to 600ms for it to land on its own.
  return async function flush() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingFlushRef.current) {
      await pendingFlushRef.current();
      pendingFlushRef.current = null;
    }
  };
}
