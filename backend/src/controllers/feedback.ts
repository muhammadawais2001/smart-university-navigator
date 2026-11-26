import type { Request, Response } from 'express';
import { db } from '../config/supabase.js';
import { audit } from '../services/audit.js';
import { AppError, asyncHandler, ok, paginate, unwrap } from '../utils/http.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (r: any) => ({
  id: r.id, type: r.type, locationId: r.location_id, location: r.location ?? null, description: r.description,
  contact: r.contact, status: r.status, adminNotes: r.admin_notes, reviewedBy: r.reviewed_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body;
  // Honeypot filled => likely a bot; pretend success without storing.
  if (b.website) return ok(res, 'Thank you for your report', null, 201);
  unwrap(await db().from('feedback_reports').insert({
    type: b.type, location_id: b.locationId ?? null, description: b.description, contact: b.contact || null,
  }).select('id').single());
  ok(res, 'Thank you for your report', null, 201);
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const q = res.locals.query as { page: number; pageSize: number; status?: string };
  const { from, to } = paginate(q.page, q.pageSize);
  let query = db().from('feedback_reports').select('*, location:locations(id, name)', { count: 'exact' });
  if (q.status) query = query.eq('status', q.status);
  const result = await query.order('created_at', { ascending: false }).range(from, to);
  ok(res, 'Feedback retrieved successfully', (unwrap(result) as unknown[]).map(map), 200,
    { total: result.count ?? 0, page: q.page, pageSize: q.pageSize });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { status, adminNotes } = req.body;
  const row = unwrap(await db().from('feedback_reports')
    .update({ status, admin_notes: adminNotes ?? null, reviewed_by: req.user!.id })
    .eq('id', req.params.id).select('*, location:locations(id, name)').maybeSingle());
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Feedback report not found');
  await audit(req.user!.id, 'FEEDBACK_UPDATED', 'feedback', req.params.id, { status });
  ok(res, 'Feedback updated successfully', map(row));
});
