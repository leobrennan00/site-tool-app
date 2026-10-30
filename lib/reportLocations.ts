// Where each report's site is, for the reports map (components/ReportsMap.tsx).
//
// Reports save the coordinates the maps were made from in desk_study.siteLat /
// siteLon. Reports made before that have none, so their site location (or the
// client's address) is looked up with the same ArcGIS geocoder the Eircode
// box uses (app/(tabs)/maps.tsx) and the result kept on this device, so each
// one is only looked up once. Those pins are marked approximate.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Report } from './reports';
import { isNearIreland } from './irelandOutline';

export interface SiteCoords { lat: number; lon: number; approx: boolean }

const CACHE_PREFIX = 'geocode:v1:';

/** The coordinates saved on the report, if any (and plausibly in Ireland). */
export function savedCoords(report: Report): SiteCoords | null {
  const ds = report.desk_study || {};
  const lat = parseFloat(ds.siteLat);
  const lon = parseFloat(ds.siteLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !isNearIreland(lon, lat)) return null;
  return { lat, lon, approx: false };
}

/** The text to look a report up by when it has no coordinates. */
export function locationText(report: Report): string {
  const ci = report.client_info || {};
  return String(ci.siteLocation || ci.address || '').trim();
}

async function geocode(text: string): Promise<SiteCoords | null> {
  const key = CACHE_PREFIX + text.toLowerCase();
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return JSON.parse(cached).hit ?? null;
  } catch {}
  const url =
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` +
    `?SingleLine=${encodeURIComponent(text + ', Ireland')}&countryCode=IRL,GBR&maxLocations=1&f=json&outFields=`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoder ${res.status}`);
  const data = await res.json();
  const c = data?.candidates?.[0];
  const hit = c && c.score >= 70 && isNearIreland(c.location.x, c.location.y)
    ? { lat: c.location.y, lon: c.location.x, approx: true }
    : null;
  // Misses are kept too, so an unfindable location isn't asked about on every visit.
  try { await AsyncStorage.setItem(key, JSON.stringify({ hit })); } catch {}
  return hit;
}

/** Each report's site, by report id: saved coordinates straight away, then
 *  looked-up ones as they arrive. Reports that can't be placed are absent. */
export function useReportLocations(reports: Report[]): Map<string, SiteCoords> {
  const [looked, setLooked] = useState<Map<string, SiteCoords | null>>(new Map());

  const needed = reports
    .filter((r) => !savedCoords(r) && locationText(r))
    .map(locationText);
  const neededKey = [...new Set(needed)].sort().join('\n');

  useEffect(() => {
    let cancelled = false;
    const texts = neededKey ? neededKey.split('\n') : [];
    (async () => {
      // One at a time: a handful of old reports, and the geocoder is shared.
      for (const text of texts) {
        if (cancelled) return;
        let hit: SiteCoords | null = null;
        try { hit = await geocode(text); } catch { continue; } // offline: try again next visit
        if (cancelled) return;
        setLooked((prev) => new Map(prev).set(text, hit));
      }
    })();
    return () => { cancelled = true; };
  }, [neededKey]);

  const out = new Map<string, SiteCoords>();
  for (const r of reports) {
    const c = savedCoords(r) ?? looked.get(locationText(r)) ?? null;
    if (c) out.set(r.id, c);
  }
  return out;
}
