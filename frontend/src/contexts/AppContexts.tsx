import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { api, ApiError } from '../services/api';
import { supabase } from '../services/supabase';
import type { Category, Location, Role } from '../types';

/* ---------- Toasts ---------- */
interface Toast { id: number; kind: 'success' | 'error'; text: string }
const ToastCtx = createContext<{ toast: (kind: Toast['kind'], text: string) => void }>({ toast: () => undefined });
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, kind, text }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[2000] flex flex-col items-center gap-2 px-3" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} role="status"
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === 'success' ? 'bg-teal-700' : 'bg-red-600'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Theme ---------- */
const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => undefined });
export const useTheme = () => useContext(ThemeCtx);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => {
    try { const s = localStorage.getItem('theme'); if (s) return s === 'dark'; } catch { /* storage blocked */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);
  return <ThemeCtx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</ThemeCtx.Provider>;
}

/* ---------- Auth ---------- */
interface AuthState {
  session: Session | null; role: Role | null; loading: boolean; configured: boolean; isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void>;
}
const AuthCtx = createContext<AuthState | null>(null);
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error('AuthProvider missing'); return c; };
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  const loadRole = useCallback(async (s: Session | null) => {
    if (!s) { setRole(null); return; }
    try { setRole((await api.me()).data.role); } catch { setRole(null); }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => { setSession(data.session); await loadRole(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); void loadRole(s); });
    return () => sub.subscription.unsubscribe();
  }, [loadRole]);

  const value = useMemo<AuthState>(() => ({
    session, role, loading, configured: !!supabase,
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    async signIn(email, password) {
      if (!supabase) throw new Error('Authentication is not configured (missing Supabase environment variables).');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Invalid email or password');
    },
    async signOut() { await supabase?.auth.signOut(); setRole(null); },
  }), [session, role, loading]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/* ---------- Campus data ---------- */
interface DataState { locations: Location[]; categories: Category[]; loading: boolean; error: string | null; reload: () => void }
const DataCtx = createContext<DataState | null>(null);
export const useCampusData = () => { const c = useContext(DataCtx); if (!c) throw new Error('DataProvider missing'); return c; };
export function DataProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true); setError(null);
    Promise.all([api.locations({ pageSize: 500 }), api.categories()])
      .then(([l, c]) => { if (live) { setLocations(l.data); setCategories(c.data); } })
      .catch((e: unknown) => { if (live) setError(e instanceof ApiError ? e.message : 'Failed to load campus data'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [tick]);
  return <DataCtx.Provider value={{ locations, categories, loading, error, reload: () => setTick((t) => t + 1) }}>{children}</DataCtx.Provider>;
}
