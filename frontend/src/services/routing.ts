import type { LatLng } from '../types';

export class RouteError extends Error {
  constructor(message: string, public kind: 'DISABLED' | 'INVALID_COORDS' | 'NETWORK' | 'NO_ROUTE' | 'UNSUPPORTED') {
    super(message);
  }
}
export interface RouteResult {
  /** [lat, lng] pairs for Leaflet */
  coordinates: [number, number][];
  distanceM: number | null;
  durationS: number | null;
  steps: string[];
  /** Always 'calculated': derived from OSM pedestrian data, NOT a campus-verified path. */
  source: 'calculated';
}
export interface RoutingConfig { baseUrl: string; profile: string; fetchImpl?: typeof fetch; timeoutMs?: number }

/** Extension point: plug in a verified campus pedestrian-path dataset here later. */
export interface CampusPathProvider { getVerifiedRoute(from: LatLng, to: LatLng): Promise<RouteResult | null> }

export function validCoord(c: LatLng): boolean {
  return Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180;
}

type OsrmStep = { name?: string; distance?: number; maneuver?: { type?: string; modifier?: string } };
export function describeStep(s: OsrmStep): string {
  const m = s.maneuver ?? {};
  const road = s.name ? ` onto ${s.name}` : '';
  const dist = s.distance ? ` for ${Math.round(s.distance)} m` : '';
  if (m.type === 'depart') return `Start walking${s.name ? ` along ${s.name}` : ''}${dist}`;
  if (m.type === 'arrive') return 'Arrive at your destination';
  const dir = m.modifier ? m.modifier : 'ahead';
  return `${m.type === 'turn' ? 'Turn' : 'Continue'} ${dir}${road}${dist}`;
}

/** Parse an OSRM /route response. Throws RouteError if there is no usable route. */
export function parseOsrm(json: any): RouteResult { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!json || json.code !== 'Ok' || !json.routes?.length) throw new RouteError('Route not verified', 'NO_ROUTE');
  const r = json.routes[0];
  const coords = r.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) throw new RouteError('Route not verified', 'NO_ROUTE');
  return {
    coordinates: coords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
    distanceM: typeof r.distance === 'number' ? r.distance : null,
    durationS: typeof r.duration === 'number' ? r.duration : null,
    steps: (r.legs ?? []).flatMap((l: { steps?: OsrmStep[] }) => (l.steps ?? []).map(describeStep)),
    source: 'calculated',
  };
}

export async function getWalkingRoute(from: LatLng, to: LatLng, cfg: RoutingConfig): Promise<RouteResult> {
  if (!cfg.baseUrl) throw new RouteError('No pedestrian routing provider is configured', 'DISABLED');
  if (!validCoord(from) || !validCoord(to)) throw new RouteError('Invalid coordinates', 'INVALID_COORDS');
  // Refuse to silently use a car profile as a walking route.
  if (/^(driving|car)$/i.test(cfg.profile) && !/routed-foot/i.test(cfg.baseUrl))
    throw new RouteError('Configured routing profile is not pedestrian', 'UNSUPPORTED');
  const url = `${cfg.baseUrl}/route/v1/${cfg.profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 10000);
  try {
    const res = await (cfg.fetchImpl ?? fetch)(url, { signal: ctrl.signal });
    if (!res.ok && res.status !== 400) throw new RouteError('Routing service unavailable', 'NETWORK');
    return parseOsrm(await res.json());
  } catch (e) {
    if (e instanceof RouteError) throw e;
    throw new RouteError('Routing service unreachable', 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

export const formatDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
export const formatDuration = (s: number) => (s < 90 ? `${Math.round(s)} sec` : `${Math.round(s / 60)} min`);
