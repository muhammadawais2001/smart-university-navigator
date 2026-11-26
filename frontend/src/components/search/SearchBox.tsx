import { useId, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Location } from '../../types';
import { searchItems } from '../../utils/search';

interface Props { locations: Location[]; onSelect: (l: Location) => void; onSubmit?: (q: string) => void; placeholder?: string }

export function SearchBox({ locations, onSelect, onSubmit, placeholder = 'Search buildings, departments, facilities…' }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const results = useMemo(() => (q.trim() ? searchItems(locations, q).slice(0, 8) : []), [locations, q]);
  const choose = (l: Location) => { setOpen(false); setQ(''); onSelect(l); };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        role="combobox" aria-label="Search campus" aria-expanded={open && q.trim().length > 0} aria-controls={listId} aria-autocomplete="list"
        className="input !min-h-[52px] pl-10 pr-10 text-base shadow-sm" placeholder={placeholder} value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) choose(results[active]); else if (q.trim()) onSubmit?.(q.trim()); }
          else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
      {open && q.trim() && (
        <ul id={listId} role="listbox" className="card absolute z-50 mt-1 max-h-80 w-full overflow-auto p-1">
          {results.length === 0 && <li className="muted px-3 py-3">No places found for “{q}”.</li>}
          {results.map((l, i) => (
            <li key={l.id} role="option" aria-selected={i === active} onMouseDown={() => choose(l)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${i === active ? 'bg-teal-50 dark:bg-navy-800' : 'hover:bg-slate-100 dark:hover:bg-navy-800'}`}>
              <span className="font-medium">{l.name}</span>
              <span className="muted ml-2">{l.category?.name ?? 'Uncategorised'}</span>
            </li>
          ))}
          {results.length > 0 && <li className="muted px-3 py-1 text-xs">{results.length} match{results.length === 1 ? '' : 'es'}</li>}
        </ul>
      )}
    </div>
  );
}
