# REST API (`/api`)
Envelope: `{success:true,message,data,meta?}` / `{success:false,message,error:{code,details?}}`.
| Method & path | Access |
|---|---|
| GET /health | public |
| GET /auth/me | signed in |
| GET /locations?q&category&status&page&pageSize&includeUnpublished | public (unpublished only for admins with `includeUnpublished=true`) |
| GET /locations/search?q&category&limit | public |
| GET /locations/:idOrSlug | public (published) |
| POST/PUT/DELETE /locations[/:id] | ADMIN+ |
| GET /categories | public; POST/PUT ADMIN+ |
| GET /announcements[/:id] | public (live only); admins `includeAll=true` |
| POST/PUT/DELETE /announcements[/:id] | ADMIN+ |
| POST /feedback | public, 5/hour/IP, honeypot field `website` must be empty |
| GET /feedback, PUT /feedback/:id | ADMIN+ |
| GET /admin/dashboard, /admin/audit-logs | ADMIN+ |
| GET /admin/users, PUT /admin/users/:id/role | SUPER_ADMIN |
Error codes: VALIDATION_ERROR 400, UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, RATE_LIMITED 429, INTERNAL_ERROR 500.
