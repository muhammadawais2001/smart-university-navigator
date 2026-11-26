import type { Request, Response } from 'express';
import { db } from '../config/supabase.js';
import { audit } from '../services/audit.js';
import { isAdmin } from '../middleware/auth.js';
import { AppError, asyncHandler, ok, paginate, unwrap } from '../utils/http.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (r: any) => ({
  id: r.id, title: r.title, description: r.description, category: r.category, imageUrl: r.image_url,
  publishedAt: r.published_at, expiresAt: r.expires_at, isPublished: r.is_published,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
const FIELDS: Record<string, string> = {
  title: 'title', description: 'description', category: 'category', imageUrl: 'image_url',
  publishedAt: 'published_at', expiresAt: 'expires_at', isPublished: 'is_published',
};
function toRow(input: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const [k, c] of Object.entries(FIELDS)) if (input[k] !== undefined) row[c] = input[k];
  return row;
}

function isLive(r: { is_published: boolean; published_at: string; expires_at: string | null }) {
  const now = Date.now();
  return r.is_published && new Date(r.published_at).getTime() <= now && (!r.expires_at || new Date(r.expires_at).getTime() > now);
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = res.locals.query as { includeAll?: boolean; page: number; pageSize: number };
  const { from, to } = paginate(q.page, q.pageSize);
  let query = db().from('announcements').select('*', { count: 'exact' });
  if (!(isAdmin(req) && q.includeAll)) {
    const nowIso = new Date().toISOString();
    query = query.eq('is_published', true).lte('published_at', nowIso).or(`expires_at.is.null,expires_at.gt.${nowIso}`);
  }
  const result = await query.order('published_at', { ascending: false }).range(from, to);
  const rows = unwrap(result);
  ok(res, 'Announcements retrieved successfully', (rows as unknown[]).map(map), 200,
    { total: result.count ?? 0, page: q.page, pageSize: q.pageSize });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const row = unwrap(await db().from('announcements').select('*').eq('id', req.params.id).maybeSingle()) as
    | (Parameters<typeof isLive>[0] & Record<string, unknown>) | null;
  if (!row || (!isLive(row) && !isAdmin(req))) throw new AppError(404, 'NOT_FOUND', 'Announcement not found');
  ok(res, 'Announcement retrieved successfully', map(row));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const row = unwrap(await db().from('announcements').insert({ ...toRow(req.body), created_by: req.user!.id }).select().single());
  await audit(req.user!.id, 'ANNOUNCEMENT_CREATED', 'announcement', (row as unknown as { id: string }).id, { title: req.body.title });
  ok(res, 'Announcement created successfully', map(row), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const patch = toRow(req.body);
  if (!Object.keys(patch).length) throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
  const row = unwrap(await db().from('announcements').update(patch).eq('id', req.params.id).select().maybeSingle());
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Announcement not found');
  await audit(req.user!.id, 'ANNOUNCEMENT_UPDATED', 'announcement', req.params.id, { fields: Object.keys(patch) });
  ok(res, 'Announcement updated successfully', map(row));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const gone = unwrap(await db().from('announcements').delete().eq('id', req.params.id).select('id, title'));
  if (!(gone as unknown[]).length) throw new AppError(404, 'NOT_FOUND', 'Announcement not found');
  await audit(req.user!.id, 'ANNOUNCEMENT_DELETED', 'announcement', req.params.id, { title: (gone as { title: string }[])[0].title });
  ok(res, 'Announcement deleted successfully', null);
});
