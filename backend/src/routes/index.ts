import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, optionalAuth, requireAdmin, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as S from '../validators/schemas.js';
import * as locations from '../controllers/locations.js';
import * as categories from '../controllers/categories.js';
import * as announcements from '../controllers/announcements.js';
import * as feedback from '../controllers/feedback.js';
import * as admin from '../controllers/admin.js';
import { ok } from '../utils/http.js';

const limiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs, limit, standardHeaders: true, legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ success: false, message, error: { code: 'RATE_LIMITED' } }),
  });
const feedbackLimiter = limiter(60 * 60 * 1000, 5, 'Too many reports submitted. Please try again later.');
const adminLimiter = limiter(60 * 1000, 120, 'Too many requests. Please slow down.');

const r = Router();

r.get('/health', (_req, res) => ok(res, 'OK', { status: 'up', time: new Date().toISOString() }));
r.get('/auth/me', authenticate, (req, res) => ok(res, 'Current user', req.user));

r.get('/locations', optionalAuth, validate(S.locationQuery, 'query'), locations.list);
r.get('/locations/search', validate(S.searchQuery, 'query'), locations.search);
r.get('/locations/:id', optionalAuth, locations.getOne);
r.post('/locations', adminLimiter, authenticate, requireAdmin, validate(S.locationCreate), locations.create);
r.put('/locations/:id', adminLimiter, authenticate, requireAdmin, validate(S.locationUpdate), locations.update);
r.delete('/locations/:id', adminLimiter, authenticate, requireAdmin, locations.remove);

r.get('/categories', categories.list);
r.post('/categories', adminLimiter, authenticate, requireAdmin, validate(S.categoryCreate), categories.create);
r.put('/categories/:id', adminLimiter, authenticate, requireAdmin, validate(S.categoryUpdate), categories.update);

r.get('/announcements', optionalAuth, validate(S.announcementQuery, 'query'), announcements.list);
r.get('/announcements/:id', optionalAuth, announcements.getOne);
r.post('/announcements', adminLimiter, authenticate, requireAdmin, validate(S.announcementCreate), announcements.create);
r.put('/announcements/:id', adminLimiter, authenticate, requireAdmin, validate(S.announcementUpdate), announcements.update);
r.delete('/announcements/:id', adminLimiter, authenticate, requireAdmin, announcements.remove);

r.post('/feedback', feedbackLimiter, validate(S.feedbackCreate), feedback.submit);
r.get('/feedback', authenticate, requireAdmin, validate(S.pageQuery, 'query'), feedback.list);
r.put('/feedback/:id', adminLimiter, authenticate, requireAdmin, validate(S.feedbackUpdate), feedback.update);

r.get('/admin/dashboard', authenticate, requireAdmin, admin.dashboard);
r.get('/admin/audit-logs', authenticate, requireAdmin, validate(S.pageQuery, 'query'), admin.auditLogs);
r.get('/admin/users', authenticate, requireRole('SUPER_ADMIN'), admin.listUsers);
r.put('/admin/users/:id/role', adminLimiter, authenticate, requireRole('SUPER_ADMIN'), validate(S.roleUpdate), admin.setRole);

export default r;
