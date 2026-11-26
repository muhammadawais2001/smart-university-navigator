import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// Fake Supabase: any chained call resolves to `result`; auth tokens map to roles.
const roles: Record<string, string> = { admin: 'ADMIN', user: 'USER', super: 'SUPER_ADMIN' };
let lastToken = '';
function chain(result: unknown): any {
  const p: any = new Proxy(() => undefined, {
    get: (_t, k) => (k === 'then' ? (res: any) => Promise.resolve(result).then(res) : () => p),
  });
  return p;
}
vi.mock('../src/config/supabase', () => ({
  db: () => ({
    auth: {
      getUser: async (token: string) =>
        (lastToken = token) && roles[token] ? { data: { user: { id: 'u1', email: 'a@b.c' } }, error: null } : { data: { user: null }, error: { message: 'bad' } },
    },
    from: (table: string) => {
      if (table === 'profiles') return chain({ data: { role: roles[lastToken] ?? 'USER' }, error: null });
      return chain({ data: [], error: null, count: 0 });
    },
  }),
}));

import { createApp } from '../src/app.js';
const app = createApp(['http://localhost:5173']);

const validLocation = { name: 'Test Block', aliases: [], verificationStatus: 'NEEDS_CONFIRMATION' };

describe('public API', () => {
  it('health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it('unknown route gives structured 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
  it('lists locations with consistent envelope', async () => {
    const res = await request(app).get('/api/locations');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [] });
  });
  it('rejects empty search query', async () => {
    const res = await request(app).get('/api/locations/search?q=');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('authentication & authorization', () => {
  it('requires a token for admin dashboard', async () => {
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
  });
  it('rejects invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
  it('forbids a normal USER from creating locations', async () => {
    const res = await request(app).post('/api/locations').set('Authorization', 'Bearer user').send(validLocation);
    expect(res.status).toBe(403);
  });
  it('forbids ADMIN from changing roles (SUPER_ADMIN only)', async () => {
    const res = await request(app).put('/api/admin/users/abc/role').set('Authorization', 'Bearer admin').send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });
  it('forbids USER from reading feedback and audit logs', async () => {
    expect((await request(app).get('/api/feedback').set('Authorization', 'Bearer user')).status).toBe(403);
    expect((await request(app).get('/api/admin/audit-logs').set('Authorization', 'Bearer user')).status).toBe(403);
  });
  it('allows ADMIN to create a valid location', async () => {
    const res = await request(app).post('/api/locations').set('Authorization', 'Bearer admin').send(validLocation);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
  it('rejects unauthenticated location creation', async () => {
    expect((await request(app).post('/api/locations').send(validLocation)).status).toBe(401);
  });
});

describe('validation (admin)', () => {
  it('rejects VERIFIED without coordinates', async () => {
    const res = await request(app).post('/api/locations').set('Authorization', 'Bearer admin')
      .send({ ...validLocation, verificationStatus: 'VERIFIED' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
  it('rejects out-of-range coordinates', async () => {
    const res = await request(app).post('/api/locations').set('Authorization', 'Bearer admin')
      .send({ ...validLocation, latitude: 123, longitude: 73 });
    expect(res.status).toBe(400);
  });
  it('rejects lone latitude', async () => {
    const res = await request(app).post('/api/locations').set('Authorization', 'Bearer admin')
      .send({ ...validLocation, latitude: 33.7 });
    expect(res.status).toBe(400);
  });
});

describe('feedback', () => {
  it('rejects too-short description', async () => {
    const res = await request(app).post('/api/feedback').send({ type: 'OTHER', description: 'short' });
    expect(res.status).toBe(400);
  });
  it('accepts valid report', async () => {
    const res = await request(app).post('/api/feedback').send({ type: 'OTHER', description: 'The library hours look wrong.' });
    expect(res.status).toBe(201);
  });
  it('rejects submissions that fill the honeypot field', async () => {
    const res = await request(app).post('/api/feedback').send({ type: 'OTHER', description: 'Spam spam spam spam', website: 'x' });
    expect(res.status).toBe(400); // honeypot field must be empty => validation rejects
  });
});

describe('search util', () => {
  it('matches aliases and is whitespace tolerant', async () => {
    const { searchItems } = await import('../src/utils/search.js');
    const items = [{ name: 'Administration Block', aliases: ['Admin Block'] }, { name: 'Library', aliases: [] }];
    expect(searchItems(items, '  admin   BLOCK ')[0].name).toBe('Administration Block');
    expect(searchItems(items, 'zzz')).toHaveLength(0);
  });
});
