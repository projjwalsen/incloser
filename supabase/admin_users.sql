-- =============================================================================
-- admin_users — CMS admin accounts (separate from app end-users)
-- Run in Supabase → SQL Editor. Admin API uses SUPABASE_SERVICE_ROLE_KEY only.
-- =============================================================================

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  full_name text not null default '',
  role text not null default 'super_admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_role_allowed check (
    role in (
      'super_admin',
      'moderator',
      'verification_admin',
      'finance_admin',
      'support_admin'
    )
  )
);

comment on table public.admin_users is 'InCloser admin panel users. password_hash must be bcrypt, never plain text.';
comment on column public.admin_users.password_hash is 'bcrypt hash only (e.g. bcryptjs cost 12, or pgcrypto crypt(..., gen_salt(''bf'',12))).';

-- -----------------------------------------------------------------------------
-- 2) Recommended indexes
-- -----------------------------------------------------------------------------

-- Login lookup: app normalizes email to lowercase before querying.
create unique index if not exists admin_users_email_lower_uidx on public.admin_users (lower(email));

-- Optional: list/filter active admins by role (dashboards, future admin UI).
create index if not exists admin_users_active_role_idx on public.admin_users (is_active, role);

-- Optional: recent accounts (audit / support).
create index if not exists admin_users_created_at_idx on public.admin_users (created_at desc);

-- -----------------------------------------------------------------------------
-- RLS: no policies → anon/authenticated cannot access via PostgREST.
-- Service role used by admin-backend bypasses RLS.
-- -----------------------------------------------------------------------------

alter table public.admin_users enable row level security;

-- =============================================================================
-- 3) & 4) First admin — seed guidance (read before inserting)
-- =============================================================================
--
-- SECURITY: Never put a plain-text password in this column. Store ONLY a bcrypt
-- hash (e.g. 60-char modular crypt format starting with $2a$ / $2b$). The
-- admin-backend compares logins with bcrypt.compare against password_hash.
--
-- --- Option A (recommended) — repo script hashes for you ---
-- From machine with admin-backend/.env (SUPABASE_URL + SERVICE_ROLE_KEY):
--
--   cd admin-backend
--   npm run create-admin -- admin@yourdomain.com 'YourLongSecurePass' 'Full Name' super_admin
--
-- --- Option B — Node one-liner, then paste hash into SQL ---
--
--   node -e "console.log(require('bcryptjs').hashSync('YourLongSecurePass', 12))"
--
-- Then run (replace EMAIL, FULL_NAME, ROLE, and the hash string):
--
--   insert into public.admin_users (email, password_hash, full_name, role, is_active)
--   values (
--     lower('admin@yourdomain.com'),
--     '<paste bcrypt hash from Node here>',
--     'Full Name',
--     'super_admin',
--     true
--   );
--
-- --- Option C — pure SQL (Supabase usually has pgcrypto) ---
-- Hashes at insert time; still not plain text in the table.
--
--   create extension if not exists pgcrypto;
--
--   insert into public.admin_users (email, password_hash, full_name, role, is_active)
--   values (
--     lower('admin@yourdomain.com'),
--     crypt('OneTimeStrongPassword!', gen_salt('bf', 12)),
--     'Full Name',
--     'super_admin',
--     true
--   );
--
-- Use lower(...) for email so it matches login normalization and the unique index.
--
-- =============================================================================
