import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { useCampusData } from '../contexts/AppContexts';
import { SearchBox } from '../components/search/SearchBox';
import { Loading, ErrorState } from '../components/common/ui';
import { LocationCard } from '../components/locations/LocationCard';
import CampusMap from '../components/maps/CampusMap';
import { api } from '../services/api';
import type { Announcement } from '../types';
import { fmtDate } from '../utils/format';

export default function HomePage() {
  const { locations, categories, loading, error, reload } = useCampusData();
  const nav = useNavigate();
  const [news, setNews] = useState<Announcement[]>([]);
  useEffect(() => { api.announcements({ pageSize: 3 }).then((r) => setNews(r.data)).catch(() => setNews([])); }, []);
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-600 p-6 text-white shadow-lg sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-400">Air University · Main Campus · Sector E-9, Islamabad</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Find your way around campus</h1>
        <p className="mt-2 max-w-xl text-slate-200">Search buildings, departments and facilities, see them on the map, and get walking directions where reliable paths exist.</p>
        <div className="mt-5 max-w-xl text-slate-900"><SearchBox locations={locations} onSelect={(l) => nav(`/locations/${l.slug}`)} onSubmit={(q) => nav(`/explore?q=${encodeURIComponent(q)}`)} /></div>
        <Link to="/explore" className="btn-accent mt-4">Explore campus <ArrowRight className="h-4 w-4" /></Link>
      </section>

      <div role="note" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>This is an <strong>independent student project</strong>, not an official university service. Records marked “Needs confirmation” or “Demo only” have not been verified on site; map pins appear only for verified coordinates.</p>
      </div>

      <section aria-labelledby="cats"><h2 id="cats" className="mb-3 text-xl font-bold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => <Link key={c.id} className="btn-ghost !min-h-[40px] rounded-full" to={`/explore?category=${c.slug}`}>{c.name}</Link>)}
        </div>
      </section>

      <section aria-labelledby="map"><h2 id="map" className="mb-3 text-xl font-bold">Campus map</h2>
        <div className="card overflow-hidden p-1"><CampusMap locations={locations} height="320px" /></div>
        <p className="muted mt-2">{locations.filter((l) => l.latitude !== null).length === 0 ? 'No verified locations have been pinned yet. The map is centred on the approximate campus area.' : 'Tap a pin for details.'} <Link className="underline" to="/map">Open full map</Link></p>
      </section>

      <section aria-labelledby="pop"><h2 id="pop" className="mb-3 text-xl font-bold">Campus places</h2>
        {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> :
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{locations.slice(0, 6).map((l) => <LocationCard key={l.id} location={l} />)}</div>}
      </section>

      <section aria-labelledby="news"><div className="mb-3 flex items-center justify-between"><h2 id="news" className="text-xl font-bold">Latest announcements</h2><Link className="text-sm underline" to="/announcements">All</Link></div>
        {news.length === 0 ? <p className="muted">No announcements at the moment.</p> :
          <ul className="space-y-3">{news.map((a) => <li key={a.id} className="card p-4"><h3 className="font-semibold">{a.title}</h3><p className="muted">{fmtDate(a.publishedAt)}</p><p className="mt-1 line-clamp-2 text-sm">{a.description}</p></li>)}</ul>}
      </section>
    </div>
  );
}
