import { describe, expect, it, vi } from 'vitest';
import { getWalkingRoute, parseOsrm, RouteError, validCoord } from '../src/services/routing';

const a = { lat: 33.7138, lng: 73.0224 }, b = { lat: 33.714, lng: 73.023 };
const okJson = { code: 'Ok', routes: [{ distance: 120, duration: 90, geometry: { coordinates: [[73.0224, 33.7138], [73.023, 33.714]] },
  legs: [{ steps: [{ name: 'Path', distance: 120, maneuver: { type: 'depart' } }, { maneuver: { type: 'arrive' } }] }] }] };

describe('routing', () => {
  it('validates coordinate ranges', () => { expect(validCoord(a)).toBe(true); expect(validCoord({ lat: 95, lng: 0 })).toBe(false); expect(validCoord({ lat: NaN, lng: 0 })).toBe(false); });
  it('parses OSRM geometry into [lat,lng]', () => { const r = parseOsrm(okJson); expect(r.coordinates[0]).toEqual([33.7138, 73.0224]); expect(r.distanceM).toBe(120); expect(r.source).toBe('calculated'); expect(r.steps).toHaveLength(2); });
  it('treats NoRoute as "Route not verified"', () => expect(() => parseOsrm({ code: 'NoRoute', routes: [] })).toThrow('Route not verified'));
  it('is disabled when no provider configured', async () => { await expect(getWalkingRoute(a, b, { baseUrl: '', profile: 'foot' })).rejects.toMatchObject({ kind: 'DISABLED' }); });
  it('rejects invalid coordinates before any request', async () => {
    const f = vi.fn(); await expect(getWalkingRoute({ lat: 999, lng: 0 }, b, { baseUrl: 'https://x', profile: 'foot', fetchImpl: f as never })).rejects.toBeInstanceOf(RouteError); expect(f).not.toHaveBeenCalled(); });
  it('refuses a car profile on an unknown server', async () => { await expect(getWalkingRoute(a, b, { baseUrl: 'https://x', profile: 'driving' })).rejects.toMatchObject({ kind: 'UNSUPPORTED' }); });
  it('maps network failure', async () => { await expect(getWalkingRoute(a, b, { baseUrl: 'https://x', profile: 'foot', fetchImpl: (() => Promise.reject(new Error('down'))) as never })).rejects.toMatchObject({ kind: 'NETWORK' }); });
  it('returns a route on success', async () => { const r = await getWalkingRoute(a, b, { baseUrl: 'https://x', profile: 'foot', fetchImpl: (async () => ({ ok: true, status: 200, json: async () => okJson })) as never }); expect(r.coordinates).toHaveLength(2); });
});
