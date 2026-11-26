# Architecture
Browser (React PWA) → REST `/api` (Express) → Supabase Postgres via the **service-role** client (server only).
- Public reads go through the API, which filters `is_published`; RLS additionally protects direct access.
- The browser uses Supabase **anon** key only for sign-in and admin photo upload (storage policies require `is_admin()`).
- Auth: frontend gets a Supabase JWT; backend verifies it with `auth.getUser(token)` and loads the role from `profiles` (never trusts client-supplied roles).
- Roles: USER < ADMIN < SUPER_ADMIN. ADMIN manages locations/announcements/feedback; only SUPER_ADMIN changes roles.
- Hardening: helmet, CORS allow-list (`FRONTEND_URL`), JSON body limit, global + per-endpoint rate limits (feedback 5/hour/IP), Zod validation, centralized errors (no stack traces), append-only audit log.
- Routing: browser → configured OSRM-compatible provider. No key is exposed; none is required for the OSRM public servers.
