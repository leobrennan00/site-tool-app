// Web build: maps are shown straight from their Supabase URLs — there's no
// need for the phone's offline copies. Exports mirror offlineMaps.ts.

export type LocalMapIndex = Record<string, string>;

/** Remote URLs carry a `?_t=` cache-buster that changes on every load. */
export function mapKey(url: string): string {
  return url.split('?')[0];
}

export async function getLocalMapIndex(_reportId: string): Promise<LocalMapIndex> {
  return {};
}

export async function cacheMapsLocally(_reportId: string, _remoteUrls: string[]): Promise<LocalMapIndex> {
  return {};
}
