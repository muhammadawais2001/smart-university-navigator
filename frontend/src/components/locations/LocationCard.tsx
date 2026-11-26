import { Link } from 'react-router-dom';
import { Map as MapIcon, MapPin } from 'lucide-react';
import type { Location } from '../../types';
import { hasCoords } from '../../utils/format';
import { StatusBadge } from '../common/ui';

export function LocationCard({ location: l }: { location: Location }) {
  return (
    <article className="card flex flex-col overflow-hidden">
      {l.imageUrl && <img src={l.imageUrl} alt={`${l.name}`} loading="lazy" className="h-36 w-full object-cover" />}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{l.name}</h3>
          <StatusBadge status={l.verificationStatus} />
        </div>
        <p className="muted flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{l.category?.name ?? 'Uncategorised'}{l.buildingName ? ` · ${l.buildingName}` : ''}</p>
        {l.description && <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{l.description}</p>}
        <div className="mt-auto flex gap-2 pt-2">
          <Link className="btn-primary flex-1" to={`/locations/${l.slug}`}>Details</Link>
          {hasCoords(l)
            ? <Link className="btn-ghost" to={`/map?focus=${l.slug}`} aria-label={`View ${l.name} on map`}><MapIcon className="h-4 w-4" />Map</Link>
            : <span className="btn-ghost cursor-default opacity-60" title="No verified coordinates yet">No pin</span>}
        </div>
      </div>
    </article>
  );
}
