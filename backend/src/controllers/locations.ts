import type { Request, Response } from 'express';
import { db } from '../config/supabase.js';
import { audit } from '../services/audit.js';
import { isAdmin } from '../middleware/auth.js';
import { AppError, asyncHandler, ok, paginate, slugify, unwrap } from '../utils/http.js';
import { searchItems } from '../utils/search.js';
import { coordinateRuleError } from '../validators/schemas.js';

const SELECT = '*, category:categories(id, name, slug, icon)';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLocation(r: any) {
  return {
    id: r.id, name: r.name, slug: r.slug, description: r.description,
    categoryId: r.category_id, category: r.category ?? null, buildingName: r.building_name,
    latitude: r.latitude, longitude: r.longitude,
    entranceLatitude: r.entrance_latitude, entranceLongitude: r.entrance_longitude,
    aliases: r.aliases ?? [], imageUrl: r.image_url, openingHours: r.opening_hours,
    accessibilityNotes: r.accessibility_notes, publicAccess: r.public_access,
    verificationStatus: r.verification_status, isPublished: r.is_published,
    createdAt: r.created_at, updatedAt: r.updated_at,
    lastVerifiedAt: r.last_verified_at, verifiedBy: r.verified_by,
  };
}

const FIELD_MAP: Record<string, string> = {
  name: 'name', slug: 'slug', description: 'description', categoryId: 'category_id',
  buildingName: 'building_name', latitude: 'latitude', longitude: 'longitude',
  entranceLatitude: 'entrance_latitude', entranceLongitude: 'entrance_longitude',
  aliases: 'aliases', imageUrl: 'image_url', openingHours: 'opening_hours',
  accessibilityNotes: 'accessibility_notes', publicAccess: 'public_access',
  verificationStatus: 'verification_status', isPublished: 'is_published',
};
function toRow(input: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const [k, col] of Object.entries(FIELD_MAP)) if (input[k] !== undefined) row[col] = input[k];
  return row;
}

async function loadPublished() {
  const rows = unwrap(await db().from('locations').select(SELECT).eq('is_published', true).order('name'));
  return (rows as unknown[]).map(mapLocation);
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = res.locals.query as { q?: string; category?: string; status?: string; includeUnpublished?: boolean; page: number; pageSize: number };
  const admin = isAdmin(req) && q.includeUnpublished;
  let query = db().from('locations').select(SELECT, { count: 'exact' });
  if (!admin) query = query.eq('is_published', true);
  if (q.status) query = query.eq('verification_status', q.status);
  if (q.category) {
    const cat = unwrap(await db().from('categories').select('id').eq('slug', q.category).maybeSingle());
    if (!cat) return ok(res, 'Locations retrieved successfully', [], 200, { total: 0, page: q.page, pageSize: q.pageSize });
    query = query.eq('category_id', (cat as { id: string }).id);
  }
  if (q.q) {
    // Alias/whitespace tolerant search is done in-process on the (small) candidate set.
    const all = unwrap(await query.order('name'));
    const found = searchItems((all as unknown[]).map(mapLocation), q.q);
    const { from } = paginate(q.page, q.pageSize);
    return ok(res, 'Locations retrieved successfully', found.slice(from, from + q.pageSize), 200,
      { total: found.length, page: q.page, pageSize: q.pageSize });
  }
  const { from, to } = paginate(q.page, q.pageSize);
  const result = await query.order('name').range(from, to);
  const rows = unwrap(result);
  ok(res, 'Locations retrieved successfully', (rows as unknown[]).map(mapLocation), 200,
    { total: result.count ?? 0, page: q.page, pageSize: q.pageSize });
});

export const search = asyncHandler(async (_req: Request, res: Response) => {
  const { q, category, limit } = res.locals.query as { q: string; category?: string; limit: number };
  let items = await loadPublished();
  if (category) items = items.filter((l) => l.category?.slug === category);
  const found = searchItems(items, q);
  ok(res, 'Search completed', found.slice(0, limit), 200, { total: found.length });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.id;
  const base = db().from('locations').select(SELECT);
  const row = unwrap(await (UUID.test(key) ? base.eq('id', key) : base.eq('slug', key)).maybeSingle());
  if (!row || (!(row as { is_published: boolean }).is_published && !isAdmin(req)))
    throw new AppError(404, 'NOT_FOUND', 'Location not found');
  ok(res, 'Location retrieved successfully', mapLocation(row));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const row = toRow({ ...body, slug: body.slug ?? slugify(body.name) });
  if (body.verificationStatus === 'VERIFIED') {
    row.verified_by = req.user!.id;
    row.last_verified_at = new Date().toISOString();
  }
  const created = unwrap(await db().from('locations').insert(row).select(SELECT).single());
  const loc = mapLocation(created);
  await audit(req.user!.id, 'LOCATION_CREATED', 'location', loc.id, { name: loc.name, status: loc.verificationStatus });
  ok(res, 'Location created successfully', loc, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const existing = unwrap(await db().from('locations').select('*').eq('id', req.params.id).maybeSingle()) as Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Location not found');
  const patch = req.body as Record<string, unknown>;
  const merged = {
    latitude: 'latitude' in patch ? patch.latitude : existing.latitude,
    longitude: 'longitude' in patch ? patch.longitude : existing.longitude,
    entranceLatitude: 'entranceLatitude' in patch ? patch.entranceLatitude : existing.entrance_latitude,
    entranceLongitude: 'entranceLongitude' in patch ? patch.entranceLongitude : existing.entrance_longitude,
    verificationStatus: (patch.verificationStatus ?? existing.verification_status) as string,
  };
  const problem = coordinateRuleError(merged as never);
  if (problem) throw new AppError(400, 'VALIDATION_ERROR', problem);

  const row = toRow(patch);
  const newStatus = patch.verificationStatus as string | undefined;
  if (newStatus === 'VERIFIED') {
    row.verified_by = req.user!.id;
    row.last_verified_at = new Date().toISOString();
  } else if (newStatus && newStatus !== existing.verification_status) {
    row.verified_by = null;
    row.last_verified_at = null;
  }
  if (Object.keys(row).length === 0) throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
  const updated = mapLocation(unwrap(await db().from('locations').update(row).eq('id', req.params.id).select(SELECT).single()));
  const changed = Object.keys(patch);
  await audit(req.user!.id, newStatus && newStatus !== existing.verification_status ? 'LOCATION_STATUS_CHANGED' : 'LOCATION_UPDATED',
    'location', updated.id, { fields: changed, from: existing.verification_status, to: updated.verificationStatus });
  ok(res, 'Location updated successfully', updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const gone = unwrap(await db().from('locations').delete().eq('id', req.params.id).select('id, name'));
  if (!(gone as unknown[]).length) throw new AppError(404, 'NOT_FOUND', 'Location not found');
  await audit(req.user!.id, 'LOCATION_DELETED', 'location', req.params.id, { name: (gone as { name: string }[])[0].name });
  ok(res, 'Location deleted successfully', null);
});
