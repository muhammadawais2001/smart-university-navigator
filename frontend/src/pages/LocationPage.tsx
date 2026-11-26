import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flag, Navigation } from 'lucide-react';
import { api, ApiError } from '../services/api';
import type { Location } from '../types';
import { ACCESS_LABEL, fmtDate, hasCoords } from '../utils/format';
import { ErrorState, Loading, StatusBadge } from '../components/common/ui';
import CampusMap from '../components/maps/CampusMap';

const Row = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="py-2"><dt className="muted">{label}</dt><dd className={value ? 'font-medium' : 'italic text-slate-400'}>{value || 'Not available / needs confirmation'}</dd></div>
);

export default function LocationPage() {
  const { slug = '' } = useParams();
  const [loc, setLoc] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setLoc(null); setError(null);
    api.location(slug).then((r) => setLoc(r.data)).catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'This location was not found.' : 'Could not load this location.'));
  }, [slug]);
  if (error) return <ErrorState message={error} />;
  if (!loc) return <Loading />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{loc.name}</h1><StatusBadge status={loc.verificationStatus} /></div>
      {loc.verificationStatus !== 'VERIFIED' && <p role="note" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">This record has not been verified. Details may be incomplete or out of date.</p>}
      {loc.imageUrl && <img src={loc.imageUrl} alt={loc.name} className="max-h-72 w-full rounded-2xl object-cover" />}
      <div className="grid gap-4 md:grid-cols-2">
        <dl className="card divide-y divide-slate-200 p-4 dark:divide-navy-700">
          <Row label="Category" value={loc.category?.name} />
          <Row label="Description" value={loc.description} />
          <Row label="Building" value={loc.buildingName} />
          <Row label="Coordinates" value={hasCoords(loc) ? `${loc.latitude}, ${loc.longitude}` : null} />
          <Row label="Entrance coordinates" value={loc.entranceLatitude !== null ? `${loc.entranceLatitude}, ${loc.entranceLongitude}` : null} />
          <Row label="Public access" value={ACCESS_LABEL[loc.publicAccess]} />
          <Row label="Accessibility" value={loc.accessibilityNotes} />
          <Row label="Opening hours" value={loc.openingHours} />
          <Row label="Last verified" value={fmtDate(loc.lastVerifiedAt)} />
          {loc.aliases.length > 0 && <Row label="Also known as" value={loc.aliases.join(', ')} />}
        </dl>
        <div className="space-y-3">
          {hasCoords(loc) ? <div className="card h-72 p-1"><CampusMap locations={[loc]} focus={loc} linkMarkers={false} /></div>
            : <div className="card p-4 text-sm">No verified map position is available for this place yet, so no marker is shown.</div>}
          <div className="flex flex-wrap gap-2">
            <Link className="btn-primary" to={`/directions?to=${loc.slug}`}><Navigation className="h-4 w-4" />Directions</Link>
            <Link className="btn-ghost" to={`/report?location=${loc.id}`}><Flag className="h-4 w-4" />Report incorrect information</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
