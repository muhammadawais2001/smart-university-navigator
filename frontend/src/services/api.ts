import { API_URL } from '../config';
import { supabase } from './supabase';
import type { Announcement, AuditLog, Category, DashboardStats, FeedbackReport, Location, Meta } from '../types';

export class ApiError extends Error {
  constructor(message: string, public code: string, public status: number, public details?: { path: string; message: string }[]) {
    super(message);
  }
}

interface Opts { method?: string; body?: unknown; query?: Record<string, string | number | boolean | undefined>; auth?: boolean }

async function request<T>(path: string, opts: Opts = {}): Promise<{ data: T; meta?: Meta }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== '') qs.set(k, String(v));
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth && supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${qs.size ? `?${qs}` : ''}`, {
      method: opts.method ?? 'GET', headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 'NETWORK_ERROR', 0);
  }
  let json: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || !json?.success)
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, json?.error?.code ?? 'UNKNOWN', res.status, json?.error?.details);
  return { data: json.data as T, meta: json.meta };
}

export const api = {
  me: () => request<{ id: string; email: string | null; role: import('../types').Role }>('/auth/me', { auth: true }),
  locations: (query?: Opts['query'], auth = false) => request<Location[]>('/locations', { query, auth }),
  location: (id: string) => request<Location>(`/locations/${encodeURIComponent(id)}`, { auth: true }),
  saveLocation: (body: unknown, id?: string) =>
    request<Location>(id ? `/locations/${id}` : '/locations', { method: id ? 'PUT' : 'POST', body, auth: true }),
  deleteLocation: (id: string) => request<null>(`/locations/${id}`, { method: 'DELETE', auth: true }),
  categories: () => request<Category[]>('/categories'),
  announcements: (query?: Opts['query'], auth = false) => request<Announcement[]>('/announcements', { query, auth }),
  saveAnnouncement: (body: unknown, id?: string) =>
    request<Announcement>(id ? `/announcements/${id}` : '/announcements', { method: id ? 'PUT' : 'POST', body, auth: true }),
  deleteAnnouncement: (id: string) => request<null>(`/announcements/${id}`, { method: 'DELETE', auth: true }),
  submitFeedback: (body: unknown) => request<null>('/feedback', { method: 'POST', body }),
  feedback: (query?: Opts['query']) => request<FeedbackReport[]>('/feedback', { query, auth: true }),
  updateFeedback: (id: string, body: unknown) => request<FeedbackReport>(`/feedback/${id}`, { method: 'PUT', body, auth: true }),
  dashboard: () => request<DashboardStats>('/admin/dashboard', { auth: true }),
  auditLogs: (query?: Opts['query']) => request<AuditLog[]>('/admin/audit-logs', { query, auth: true }),
};
