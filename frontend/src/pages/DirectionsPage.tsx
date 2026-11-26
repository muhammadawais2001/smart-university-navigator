import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, LocateFixed, X } from 'lucide-react';
import { useCampusData } from '../contexts/AppContexts';
import CampusMap from '../components/maps/CampusMap';
import { Loading } from '../components/common/ui';
import { useGeolocation } from '../hooks/useGeolocation';
import { ROUTING_PROFILE, ROUTING_URL } from '../config';
import { formatDistance, formatDuration, getWalkingRoute, RouteError, type RouteResult } from '../services/routing';
import { hasCoords } from '../utils/format';
import type { LatLng, Location } from '../types';

const MY = '__me__';

export default function DirectionsPage() {
  const { locations, loading } = useCampusData();
  const [sp] = useSearchParams();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [explain, setExplain] = useState(false);
  const geo = useGeolocation();

  useEffect(() => { const t = locations.find((l) => l.slug === sp.get('to')); if (t) setTo(t.id); }, [locations, sp]);
  useEffect(() => { if (geo.position && !from) setFrom(MY); }, [geo.position, from]);

  const byId = (id: string) => locations.find((l) => l.id === id);
  const point = (id: string): LatLng | null => {
    if (id === MY) return geo.position;
    const l = byId(id);
    return l && hasCoords(l) ? { lat: l.entranceLatitude ?? l.latitude, lng: l.entranceLongitude ?? l.longitude } : null;
  };
  const dest = byId(to);
  const mapLocs = useMemo(() => [byId(from), byId(to)].filter(Boolean) as Location[], [from, to, locations]); // eslint-disable-line react-hooks/exhaustive-deps

  const clear = () => { setRoute(null); setFailure(null); };
  const swap = () => { if (from === MY) return; setFrom(to); setTo(from); clear(); };

  async function go() {
    clear();
    const a = point(from), b = point(to);
    if (!a || !b) { setFailure('Route not verified: one of the places has no verified coordinates.'); return; }
    setBusy(true);
    try { setRoute(await getWalkingRoute(a, b, { baseUrl: ROUTING_URL, profile: ROUTING_PROFILE })); }
    catch (e) {
      const k = e instanceof RouteError ? e.kind : 'NETWORK';
      setFailure(k === 'DISABLED' ? 'Route not verified: no pedestrian routing provider is configured.'
        : k === 'NETWORK' ? 'Route not verified: the routing service could not be reached.'
        : k === 'INVALID_COORDS' ? 'Route not verified: invalid coordinates.' : 'Route not verified: no walking route is available.');
    } finally { setBusy(false); }
  }

  if (loading) return <Loading />;
  const options = (exclude?: string) => locations.map((l) => <option key={l.id} value={l.id} disabled={l.id === exclude}>{l.name}{hasCoords(l) ? '' : ' (no verified pin)'}</option>);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Walking directions</h1>
      <div className="card space-y-3 p-4">
        <label className="block"><span className="label">From</span>
          <select className="input" value={from} onChange={(e) => { setFrom(e.target.value); clear(); }}>
            <option value="">Choose a starting point…</option>{geo.position && <option value={MY}>My current location</option>}{options(to)}
          </select></label>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setExplain(true)} disabled={geo.loading}><LocateFixed className="h-4 w-4" />Use my location</button>
          <button className="btn-ghost" onClick={swap} aria-label="Swap start and destination"><ArrowUpDown className="h-4 w-4" />Swap</button>
        </div>
        {explain && !geo.position && <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-navy-800"><p>Your location is used only to start a route, in your browser. It is not stored. GPS is not reliable indoors.</p>
          <div className="mt-2 flex gap-2"><button className="btn-primary" onClick={() => { setExplain(false); geo.request(); }}>Allow</button><button className="btn-ghost" onClick={() => setExplain(false)}>Not now</button></div></div>}
        {geo.error && <p role="alert" className="text-sm text-red-600">{geo.error}</p>}
        <label className="block"><span className="label">To</span>
          <select className="input" value={to} onChange={(e) => { setTo(e.target.value); clear(); }}><option value="">Choose a destination…</option>{options(from)}</select></label>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={!from || !to || busy} onClick={go}>{busy ? 'Finding route…' : 'Get walking route'}</button>
          <button className="btn-ghost" onClick={() => { clear(); setFrom(''); setTo(''); }}><X className="h-4 w-4" />Clear</button>
        </div>
      </div>

      {failure && (
        <div role="alert" className="card space-y-2 border-amber-300 p-4 text-sm dark:border-amber-700">
          <p className="font-semibold">{failure}</p>
          {dest ? <p>Fallback: use the destination marker and details for <Link className="underline" to={`/locations/${dest.slug}`}>{dest.name}</Link>.{dest.buildingName ? ` Building: ${dest.buildingName}.` : ''} {dest.accessibilityNotes ? `Access: ${dest.accessibilityNotes}` : 'No verified text guidance is available yet.'}</p> : null}
        </div>)}

      {route && (
        <div className="card space-y-2 p-4 text-sm">
          <p className="rounded-lg bg-amber-50 p-2 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><strong>Calculated route</strong> from OpenStreetMap pedestrian data. It is not campus-verified and may cross areas that are closed or restricted. Follow signs and security instructions.</p>
          <p>{route.distanceM !== null && <>Distance: <strong>{formatDistance(route.distanceM)}</strong> </>}{route.durationS !== null && <>· About <strong>{formatDuration(route.durationS)}</strong></>}</p>
          <ol className="list-decimal space-y-1 pl-5">{route.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>)}

      <div className="card h-[50vh] p-1"><CampusMap locations={mapLocs} route={route?.coordinates ?? null} userPosition={geo.position} linkMarkers={false} /></div>
    </div>
  );
}
