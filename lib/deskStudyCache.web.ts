// Web build: the phone keeps "has the desk study been fetched for this
// report" on the device so it can retry when back in signal. The website is
// always online, so the status only needs to last for this tab.
export type DeskStudyStatus = 'none' | 'pending' | 'ready';

const statuses = new Map<string, { status: DeskStudyStatus; lat: string | null; lon: string | null }>();

export async function getDeskStudyStatus(reportId: string): Promise<{
  status: DeskStudyStatus;
  lat: string | null;
  lon: string | null;
}> {
  return statuses.get(reportId) ?? { status: 'none', lat: null, lon: null };
}

export async function markDeskStudyPending(reportId: string, lat: string, lon: string): Promise<void> {
  statuses.set(reportId, { status: 'pending', lat, lon });
}

export async function markDeskStudyReady(reportId: string, lat: string, lon: string): Promise<void> {
  statuses.set(reportId, { status: 'ready', lat, lon });
}

export async function getPendingDeskStudyReports(): Promise<{ id: string; lat: string; lon: string }[]> {
  return [];
}
