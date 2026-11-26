import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, LocateFixed } from 'lucide-react';
import { useCampusData } from '../contexts/AppContexts';
import CampusMap from '../components/maps/CampusMap';
import { SearchBox } from '../components/search/SearchBox';
import { ErrorState, Loading } from '../components/common/ui';
import { useGeolocation } from '../hooks/useGeolocation';
import { hasCoords } from '../utils/format';
import type { Location } from '../types';

export default function MapPage() {
  const { locations, categories, loading, error, reload } = useCampusData();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [category, setCategory] = useState('');
  const [focus, setFocus] = useState<Location | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const geo = useGeolocation();
  const [explain, setExplain] = useState(false);

  const filtered = useMemo(() => locations.filter((l) => !category || l.category?.slug === category), [locations, category]);
  const initial = useMemo(() => locations.find((l) => l.slug === sp.get('focus')) ?? null, [locations, sp]);
  const target = focus ?? initial;
  const pinned = filtered.filter(hasCoords);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Campus map</h1>
      <div className="grid gap-2 sm:grid-cols-[1fr_220px_auto]">
        <SearchBox locations={locations} onSelect={(l) => (hasCoords(l) ? setFocus(l) : nav(`/locations/${l.slug}`))} />
        <select className="input !min-h-[52px]" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <button className="btn-ghost !min-h-[52px]" onClick={() => (geo.position ? geo.clear() : setExplain(true))}><LocateFixed className="h-4 w-4" />{geo.position ? 'Hide my location' : 'Show my location'}</button>
      </div>
      {explain && !geo.position && (
        <div className="card flex flex-col gap-2 p-4 text-sm"><p>Your browser will ask for permission. Your position is used only to show a dot on this map. It is not stored or sent to our servers, and GPS does not work reliably indoors.</p>
          <div className="flex gap-2"><button className="btn-primary" onClick={() => { setExplain(false); geo.request(); }}>Continue</button><button className="btn-ghost" onClick={() => setExplain(false)}>Cancel</button></div></div>)}
      {geo.error && <p role="alert" className="text-sm text-red-600">{geo.error}</p>}
      {tilesFailed && <div role="alert" className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" />Map tiles could not be loaded. Check your connection, or use the list below.</div>}
      {pinned.length === 0 && <p className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-navy-900">No verified locations are pinned yet, so there are no markers. The map is centred on the approximate campus area only.</p>}
      <div className="card h-[60vh] overflow-hidden p-1 md:h-[65vh]"><CampusMap locations={filtered} focus={target} userPosition={geo.position} onTilesFailed={() => setTilesFailed(true)} /></div>
      <details open={tilesFailed} className="card p-4"><summary className="cursor-pointer font-semibold">List of places ({filtered.length})</summary>
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-navy-700">{filtered.map((l) => <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm"><Link className="font-medium underline" to={`/locations/${l.slug}`}>{l.name}</Link><span className="muted">{hasCoords(l) ? 'On map' : 'No pin'}</span></li>)}</ul></details>
    </div>
  );
}
