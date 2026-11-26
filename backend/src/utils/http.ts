import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function ok(res: Response, message: string, data: unknown, status = 200, meta?: unknown) {
  return res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Unwrap a Supabase result; map Postgres errors to safe API errors (no internals leaked). */
export function unwrap<T>(result: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (result.error) {
    const { code, message } = result.error;
    console.error('[db]', code, message);
    if (code === '23505') throw new AppError(409, 'CONFLICT', 'A record with this unique value already exists');
    if (code === '23503') throw new AppError(400, 'INVALID_REFERENCE', 'Referenced record does not exist');
    if (code === '23514' || code === '22P02')
      throw new AppError(400, 'VALIDATION_ERROR', 'Data violates database rules (e.g. VERIFIED requires coordinates)');
    throw new AppError(500, 'DATABASE_ERROR', 'A database error occurred');
  }
  return result.data as T;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'item'
  );
}

export function paginate(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}
