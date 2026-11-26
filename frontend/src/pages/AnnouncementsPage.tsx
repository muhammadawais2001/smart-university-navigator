import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Announcement } from '../types';
import { EmptyState, ErrorState, Loading } from '../components/common/ui';
import { fmtDate } from '../utils/format';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setError(null); api.announcements().then((r) => setItems(r.data)).catch((e: Error) => setError(e.message)); };
  useEffect(load, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Announcements</h1>
      {error ? <ErrorState message={error} onRetry={load} /> : !items ? <Loading /> : items.length === 0 ? <EmptyState title="No announcements" text="Nothing has been published yet." /> :
        <ul className="space-y-4">{items.map((a) => (
          <li key={a.id} className="card overflow-hidden">
            {a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" className="h-44 w-full object-cover" />}
            <div className="p-4"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{a.title}</h2>{a.category && <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">{a.category}</span>}</div>
              <p className="muted">Published {fmtDate(a.publishedAt)}{a.expiresAt && ` · Expires ${fmtDate(a.expiresAt)}`}</p>
              <p className="mt-2 whitespace-pre-line text-sm">{a.description}</p></div>
          </li>))}</ul>}
    </div>
  );
}
