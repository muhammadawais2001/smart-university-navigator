export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}

export interface Searchable {
  name: string;
  aliases?: string[] | null;
  buildingName?: string | null;
  description?: string | null;
}

/** Score 0 = no match. Case/whitespace/punctuation tolerant; aliases count like names. */
export function scoreMatch(item: Searchable, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const names = [item.name, ...(item.aliases ?? [])].map(normalize);
  let best = 0;
  for (const n of names) {
    if (n === q) best = Math.max(best, 100);
    else if (n.startsWith(q)) best = Math.max(best, 80);
    else if (n.split(' ').some((w) => w.startsWith(q))) best = Math.max(best, 65);
    else if (n.includes(q)) best = Math.max(best, 55);
  }
  const tokens = q.split(' ');
  const hay = names.join(' ');
  if (best === 0 && tokens.every((t) => hay.includes(t))) best = 45;
  const extra = normalize(`${item.buildingName ?? ''} ${item.description ?? ''}`);
  if (best === 0 && tokens.every((t) => extra.includes(t))) best = 20;
  return best;
}

export function searchItems<T extends Searchable>(items: T[], query: string): T[] {
  return items
    .map((it) => ({ it, s: scoreMatch(it, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.it.name.localeCompare(b.it.name))
    .map((x) => x.it);
}
