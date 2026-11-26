-- Smart University Navigator: initial schema, RLS and storage policies.
create extension if not exists pg_trgm with schema extensions;

create type public.app_role as enum ('USER', 'ADMIN', 'SUPER_ADMIN');
create type public.verification_status as enum ('VERIFIED', 'NEEDS_CONFIRMATION', 'DEMO_ONLY');
create type public.public_access as enum ('PUBLIC', 'RESTRICTED', 'UNKNOWN');
create type public.feedback_status as enum ('PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED');
create type public.feedback_type as enum
  ('INCORRECT_LOCATION', 'MISSING_LOCATION', 'INCORRECT_BUILDING_INFO',
   'INACCESSIBLE_ROUTE', 'INCORRECT_OPENING_HOURS', 'OTHER');

-- ---------- shared helpers ----------
create function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- profiles (user + role assignment) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user becomes a plain USER. Nobody is auto-promoted.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.app_current_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.app_current_role() in ('ADMIN', 'SUPER_ADMIN'), false)
$$;
create function public.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.app_current_role() = 'SUPER_ADMIN', false)
$$;

-- Role changes are blocked for any end-user JWT unless the caller is SUPER_ADMIN.
-- (SQL editor / service role have no auth.uid(); the backend enforces SUPER_ADMIN itself.)
create function public.guard_role_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_super_admin() then
    raise exception 'Only SUPER_ADMIN can change roles';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_role_change();

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------- locations ----------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 2000),
  category_id uuid references public.categories (id) on delete set null,
  building_name text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  entrance_latitude double precision check (entrance_latitude between -90 and 90),
  entrance_longitude double precision check (entrance_longitude between -180 and 180),
  aliases text[] not null default '{}',
  image_url text,
  opening_hours text,
  accessibility_notes text,
  public_access public.public_access not null default 'UNKNOWN',
  verification_status public.verification_status not null default 'NEEDS_CONFIRMATION',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  constraint coords_paired check ((latitude is null) = (longitude is null)),
  constraint entrance_paired check ((entrance_latitude is null) = (entrance_longitude is null)),
  -- A record can only be VERIFIED if it has coordinates and a verification stamp.
  constraint verified_requires_data check (
    verification_status <> 'VERIFIED'
    or (latitude is not null and last_verified_at is not null)
  )
);
create index locations_category_idx on public.locations (category_id);
create index locations_status_idx on public.locations (verification_status);
create index locations_published_idx on public.locations (is_published);
create index locations_aliases_gin on public.locations using gin (aliases);
create index locations_name_trgm on public.locations using gin (name extensions.gin_trgm_ops);
create trigger locations_updated before update on public.locations
  for each row execute function public.set_updated_at();

-- ---------- announcements ----------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 200),
  description text not null check (char_length(description) <= 5000),
  category text,
  image_url text,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expiry_after_publish check (expires_at is null or expires_at > published_at)
);
create index announcements_pub_idx on public.announcements (is_published, published_at desc);
create trigger announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();

-- ---------- feedback ----------
create table public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  type public.feedback_type not null,
  location_id uuid references public.locations (id) on delete set null,
  description text not null check (char_length(description) between 10 and 2000),
  contact text check (char_length(contact) <= 200),
  status public.feedback_status not null default 'PENDING',
  admin_notes text check (char_length(admin_notes) <= 2000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index feedback_status_idx on public.feedback_reports (status, created_at desc);
create trigger feedback_updated before update on public.feedback_reports
  for each row execute function public.set_updated_at();

-- ---------- audit log (append-only) ----------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_created_idx on public.audit_logs (created_at desc);
create function public.audit_immutable() returns trigger
language plpgsql as $$ begin raise exception 'audit_logs is append-only'; end $$;
create trigger audit_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_immutable();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.announcements enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: super admin updates" on public.profiles
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin insert" on public.categories for insert with check (public.is_admin());
create policy "categories: admin update" on public.categories for update
  using (public.is_admin()) with check (public.is_admin());

create policy "locations: public read published" on public.locations
  for select using (is_published = true);
create policy "locations: admin read all" on public.locations for select using (public.is_admin());
create policy "locations: admin insert" on public.locations for insert with check (public.is_admin());
create policy "locations: admin update" on public.locations for update
  using (public.is_admin()) with check (public.is_admin());
create policy "locations: admin delete" on public.locations for delete using (public.is_admin());

create policy "announcements: public read live" on public.announcements
  for select using (
    is_published = true and published_at <= now() and (expires_at is null or expires_at > now())
  );
create policy "announcements: admin read all" on public.announcements
  for select using (public.is_admin());
create policy "announcements: admin insert" on public.announcements
  for insert with check (public.is_admin());
create policy "announcements: admin update" on public.announcements
  for update using (public.is_admin()) with check (public.is_admin());
create policy "announcements: admin delete" on public.announcements
  for delete using (public.is_admin());

create policy "feedback: anyone can submit pending" on public.feedback_reports
  for insert to anon, authenticated
  with check (status = 'PENDING' and reviewed_by is null and admin_notes is null);
create policy "feedback: admin read" on public.feedback_reports for select using (public.is_admin());
create policy "feedback: admin update" on public.feedback_reports for update
  using (public.is_admin()) with check (public.is_admin());

create policy "audit: admin read" on public.audit_logs for select using (public.is_admin());
-- No insert/update/delete policies: only the backend (service role) writes audit rows.
revoke insert, update, delete on public.audit_logs from anon, authenticated;

-- ---------- Storage: location photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('location-images', 'location-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "location images: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'location-images' and public.is_admin());
create policy "location images: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'location-images' and public.is_admin());
create policy "location images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'location-images' and public.is_admin());
