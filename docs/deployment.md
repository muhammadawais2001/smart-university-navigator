# Deployment
1. **Supabase**: apply the migration and seed; create the first SUPER_ADMIN (README). In Auth settings, disable public sign-ups (admins are created by invitation) and set the Site URL to the frontend URL.
2. **Backend** (Render/Railway/Fly): root `backend`, build `npm install && npm run build`, start `npm start`, health check `/api/health`. Set env vars; `FRONTEND_URL` = exact frontend origin(s), comma-separated.
3. **Frontend** (Vercel/Netlify): root `frontend`, build `npm run build`, output `dist`, SPA fallback rewrite `/* → /index.html`. Set `VITE_API_URL=https://<backend>/api` plus Supabase and routing variables.
4. Serve over HTTPS (required for PWA install and geolocation). Never commit `.env`; the service-role key must exist only on the backend host.
5. Tile policy: the default OSM tile server is for light use; for real traffic use a commercial/self-hosted tile provider.
