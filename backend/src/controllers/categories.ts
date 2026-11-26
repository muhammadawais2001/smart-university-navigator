import type { Request, Response } from 'express';
import { db } from '../config/supabase.js';
import { audit } from '../services/audit.js';
import { AppError, asyncHandler, ok, slugify, unwrap } from '../utils/http.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (r: any) => ({ id: r.id, name: r.name, slug: r.slug, icon: r.icon, sortOrder: r.sort_order });

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const rows = unwrap(await db().from('categories').select('*').order('sort_order').order('name'));
  ok(res, 'Categories retrieved successfully', (rows as unknown[]).map(map));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body;
  const row = unwrap(await db().from('categories')
    .insert({ name: b.name, slug: b.slug ?? slugify(b.name), icon: b.icon ?? null, sort_order: b.sortOrder }).select().single());
  await audit(req.user!.id, 'CATEGORY_CREATED', 'category', (row as unknown as { id: string }).id, { name: b.name });
  ok(res, 'Category created successfully', map(row), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body;
  const patch: Record<string, unknown> = {};
  if (b.name !== undefined) patch.name = b.name;
  if (b.slug !== undefined) patch.slug = b.slug;
  if (b.icon !== undefined) patch.icon = b.icon;
  if (b.sortOrder !== undefined) patch.sort_order = b.sortOrder;
  if (!Object.keys(patch).length) throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
  const row = unwrap(await db().from('categories').update(patch).eq('id', req.params.id).select().maybeSingle());
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  await audit(req.user!.id, 'CATEGORY_UPDATED', 'category', req.params.id, { fields: Object.keys(patch) });
  ok(res, 'Category updated successfully', map(row));
});
