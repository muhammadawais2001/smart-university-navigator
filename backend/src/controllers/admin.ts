import type { Request, Response } from 'express';
import { db } from '../config/supabase.js';
import { audit } from '../services/audit.js';
import { AppError, asyncHandler, ok, paginate, unwrap } from '../utils/http.js';

async function count(table: string, filter?: (q: any) => any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const base = db().from(table).select('id', { count: 'exact', head: true });
  const { count: n, error } = await (filter ? filter(base) : base);
  if (error) throw new AppError(500, 'DATABASE_ERROR', 'A database error occurred');
  return n ?? 0;
}

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const nowIso = new Date().toISOString();
  const [totalLocations, publishedLocations, verifiedLocations, unverifiedLocations, pendingFeedback, publishedAnnouncements] =
    await Promise.all([
      count('locations'),
      count('locations', (q) => q.eq('is_published', true)),
      count('locations', (q) => q.eq('verification_status', 'VERIFIED')),
      count('locations', (q) => q.neq('verification_status', 'VERIFIED')),
      count('feedback_reports', (q) => q.eq('status', 'PENDING')),
      count('announcements', (q) => q.eq('is_published', true).or(`expires_at.is.null,expires_at.gt.${nowIso}`)),
    ]);
  ok(res, 'Dashboard retrieved successfully', {
    totalLocations, publishedLocations, verifiedLocations, unverifiedLocations, pendingFeedback, publishedAnnouncements,
  });
});

export const auditLogs = asyncHandler(async (_req: Request, res: Response) => {
  const q = res.locals.query as { page: number; pageSize: number };
  const { from, to } = paginate(q.page, q.pageSize);
  const result = await db().from('audit_logs').select('*, actor:profiles(email)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(from, to);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (unwrap(result) as any[]).map((r) => ({
    id: r.id, actorId: r.actor_id, actorEmail: r.actor?.email ?? null, action: r.action,
    entityType: r.entity_type, entityId: r.entity_id, details: r.details, createdAt: r.created_at,
  }));
  ok(res, 'Audit logs retrieved successfully', rows, 200, { total: result.count ?? 0, page: q.page, pageSize: q.pageSize });
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const rows = unwrap(await db().from('profiles').select('id, email, role, created_at').order('created_at', { ascending: false }).limit(200));
  ok(res, 'Users retrieved successfully', rows);
});

export const setRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  if (req.params.id === req.user!.id) throw new AppError(400, 'VALIDATION_ERROR', 'You cannot change your own role');
  const row = unwrap(await db().from('profiles').update({ role }).eq('id', req.params.id).select('id, email, role').maybeSingle());
  if (!row) throw new AppError(404, 'NOT_FOUND', 'User not found');
  await audit(req.user!.id, 'ROLE_CHANGED', 'profile', req.params.id, { role });
  ok(res, 'Role updated successfully', row);
});
