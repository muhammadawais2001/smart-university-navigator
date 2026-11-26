import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/http.js';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false, message: err.message,
      error: { code: err.code, ...(err.details ? { details: err.details } : {}) },
    });
  }
  const e = err as { type?: string };
  if (e?.type === 'entity.parse.failed')
    return res.status(400).json({ success: false, message: 'Malformed JSON body', error: { code: 'BAD_REQUEST' } });
  if (e?.type === 'entity.too.large')
    return res.status(413).json({ success: false, message: 'Request body too large', error: { code: 'PAYLOAD_TOO_LARGE' } });
  console.error('[unhandled]', err instanceof Error ? err.message : 'unknown error');
  res.status(500).json({ success: false, message: 'Internal server error', error: { code: 'INTERNAL_ERROR' } });
}
