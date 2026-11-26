import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCampusData } from '../contexts/AppContexts';
import { searchItems } from '../utils/search';
import { LocationCard } from '../components/locations/LocationCard';
import { EmptyState, ErrorState, Loading } from '../components/common/ui';
import { hasCoords } from '../utils/format';

export default function ExplorePage() {
  const { locations, categories, loading, error, reload } = useCampusData();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '', category = sp.get('category') ?? '', status = sp.get('status') ?? '', sort = sp.get('sort') ?? 'name';
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };

  const results = useMemo(() => {
    let r = q ? searchItems(locations, q) : [...locations];
    if (category) r = r.filter((l) => l.category?.slug === category);
    if (status) r = r.filter((l) => l.verificationStatus === status);
    if (!q || sort !== 'relevance') r.sort((a, b) => sort === 'verified' ? Number(b.verificationStatus === 'VERIFIED') - Number(a.verificationStatus === 'VERIFIED') || a.name.localeCompare(b.name)
      : sort === 'mapped' ? Number(hasCoords(b)) - Number(hasCoords(a)) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
    return r;
  }, [locations, q, category, status, sort]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Explore campus</h1>
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input sm:col-span-2 lg:col-span-1" type="search" aria-label="Search places" placeholder="Search…" value={q} onChange={(e) => set('q', e.target.value)} />
        <select className="input" aria-label="Category" value={category} onChange={(e) => set('category', e.target.value)}>
          <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="input" aria-label="Verification status" value={status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Any status</option><option value="VERIFIED">Verified</option><option value="NEEDS_CONFIRMATION">Needs confirmation</option><option value="DEMO_ONLY">Demo only</option>
        </select>
        <select className="input" aria-label="Sort" value={sort} onChange={(e) => set('sort', e.target.value)}>
          <option value="name">Sort: Name</option><option value="verified">Sort: Verified first</option><option value="mapped">Sort: On map first</option>
        </select>
      </div>
      <p className="muted" aria-live="polite">{results.length} result{results.length === 1 ? '' : 's'}</p>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : results.length === 0 ?
        <EmptyState title="No places found" text="Try a different spelling, remove filters, or report a missing place." action={<Link className="btn-ghost" to="/report">Report missing place</Link>} /> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((l) => <LocationCard key={l.id} location={l} />)}</div>}
    </div>
  );
}
