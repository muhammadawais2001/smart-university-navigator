import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/http.js';

export const validate =
  (schema: ZodTypeAny, source: 'body' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request data', issues));
    }
    if (source === 'body') req.body = parsed.data;
    else res.locals.query = parsed.data;
    next();
  };
