# Database schema (see supabase/migrations)
`profiles(id→auth.users, email, role)` · `categories` · `locations` (nullable coords, `aliases text[]`, verification fields, CHECKs: coords paired, VERIFIED ⇒ coords + last_verified_at) · `announcements` · `feedback_reports` · `audit_logs` (append-only via trigger).
Indexes: category, status, published, GIN(aliases), trigram(name).
RLS: public reads published locations / live announcements / categories; admins read+write all; anyone may insert a PENDING feedback report; only admins read/update feedback; audit readable by admins, writable only by service role; role changes blocked for end-user JWTs unless SUPER_ADMIN.
