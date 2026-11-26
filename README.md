# Smart University Navigator — Air University Main Campus (E-9, Islamabad)

> **Independent student project.** Not an official Air University service unless institutional approval is obtained.

A campus navigation web app: search places, view them on an OpenStreetMap/Leaflet map, read details, request **calculated** walking routes, report wrong information, read announcements, and manage everything from an admin dashboard. Installable on phones as a PWA.

## Data honesty rules (built into the app)
- **No building coordinates are invented.** The seed contains 11 *candidate* names from the roadmap (a historical 2019 portfolio report), all `NEEDS_CONFIRMATION`, with **no coordinates**. So the map has **no markers** until an admin enters verified coordinates.
- The only coordinate in the code is the approximate campus-area centre `33.713855, 73.022473` (map start view only, never a marker).
- A record cannot be `VERIFIED` without coordinates (enforced in UI, API and database). Verifier and timestamp are stored.
- Routes are labelled **"Calculated route"** (OSM data), never "campus-verified". Failures show **"Route not verified"** plus a fallback.

## Stack
React 18 · TypeScript · Vite · Tailwind · React Router · React Hook Form + Zod · Leaflet/React-Leaflet · Express + TypeScript · Supabase (Postgres, Auth, Storage, RLS).

## Structure
```
frontend/  React app (PWA: public/manifest.webmanifest, public/sw.js)
backend/   Express REST API (service-role key lives ONLY here)
supabase/  migrations/, seed.sql, tests/rls.sql
docs/      architecture, schema, API, installation, deployment
e2e/       Playwright specs
```

## Quick start
Prerequisites: Node 20+, a free Supabase project.

1. `npm install` (repo root; installs both workspaces)
2. Create `backend/.env` and `frontend/.env` from `.env.example` (see comments in that file).
3. Database: in the Supabase SQL editor run `supabase/migrations/20260101000000_initial_schema.sql`, then `supabase/seed.sql`. (Or with the Supabase CLI: `supabase link` → `supabase db push`.)
4. **First SUPER_ADMIN (secure method):** Supabase Dashboard → Authentication → Users → *Add user* (email + strong password, tick auto-confirm). Then in the SQL editor:
   ```sql
   update public.profiles set role = 'SUPER_ADMIN' where email = 'you@example.com';
   ```
   Nobody is ever promoted automatically; further admins are granted by a SUPER_ADMIN (`PUT /api/admin/users/:id/role`) or the same SQL.
5. Run: `npm run dev:backend` and `npm run dev:frontend` → http://localhost:5173
6. Sign in at `/login`, add locations at `/admin/locations`.

## Scripts
`npm test` · `npm run typecheck` · `npm run build` · `npm run e2e` (needs running stack + Supabase + Playwright browsers: `npx playwright install`)

## Mobile install (PWA)
Deploy over HTTPS, open the site in Chrome (Android) → menu → *Install app*; Safari (iOS) → Share → *Add to Home Screen*. The service worker caches the app shell only; API data and map tiles are never cached.

## Routing
Set `VITE_ROUTING_PROVIDER_URL` / `VITE_ROUTING_PROFILE` (see `.env.example`). Empty = routing disabled. The public FOSSGIS server has no uptime guarantee and its own usage policy; use your own OSRM (foot profile) for production. `frontend/src/services/routing.ts` exposes a `CampusPathProvider` interface for a future verified campus-path dataset.

## Privacy
Geolocation is opt-in per click, used in the browser only, never stored. See `/privacy` in the app.

## Testing status (what was actually executed when this archive was produced)
- Backend: `tsc --noEmit` clean, `vitest` 18/18 passing (Supabase mocked), `tsc` build OK.
- Frontend: `tsc --noEmit` clean, `vitest` 22/22 passing, `vite build` OK.
- **Not executed:** Playwright e2e, `supabase/tests/rls.sql`, any run against a live Supabase project, multi-device/slow-network testing, usability testing. Run these yourself before relying on them.

## Known limitations / not included
Urdu/English, favourites, indoor routing, an in-app UI for granting roles (API exists), category management UI (API exists), image upload for announcements (use image URLs), ESLint/Prettier configs beyond a basic Prettier file.
