import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { DashboardStats } from '../../types';
import { ErrorState, Loading } from '../../components/common/ui';

export default function AdminDashboard() {
  const [s, setS] = useState<DashboardStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.dashboard().then((r) => setS(r.data)).catch((e: Error) => setErr(e.message)); }, []);
  if (err) return <ErrorState message={err} />;
  if (!s) return <Loading />;
  const cards: [string, number][] = [['Total locations', s.totalLocations], ['Published locations', s.publishedLocations], ['Verified locations', s.verifiedLocations],
    ['Unverified locations', s.unverifiedLocations], ['Pending feedback', s.pendingFeedback], ['Published announcements', s.publishedAnnouncements]];
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map(([l, n]) => <div key={l} className="card p-4"><p className="muted">{l}</p><p className="text-3xl font-extrabold">{n}</p></div>)}</div>;
}
