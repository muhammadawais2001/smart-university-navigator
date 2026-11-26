import type { NextFunction, Request, Response } from 'express';
import { db } from '../config/supabase.js';
import { AppError } from '../utils/http.js';
import type { Role } from '../types/index.js';

async function resolveUser(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired session');
  // Role always comes from the database, never from the client.
  const { data: profile } = await db().from('profiles').select('role').eq('id', data.user.id).single();
  return { id: data.user.id, email: data.user.email ?? null, role: (profile?.role ?? 'USER') as Role };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    req.user = user;
    next();
  } catch (e) { next(e); }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (user) req.user = user;
    next();
  } catch (e) { next(e); }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
    next();
  };

export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');
export const isAdmin = (req: Request) => req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
