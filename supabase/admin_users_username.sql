-- Add username login + operations_admin role for agency/verification staff.
-- Run in Supabase SQL Editor after admin_users.sql.

alter table public.admin_users
  add column if not exists username text;

-- Backfill username from email local-part for existing rows (optional, safe to re-run).
update public.admin_users
set username = lower(split_part(email, '@', 1))
where username is null or trim(username) = '';

-- If multiple rows share the same login name (e.g. admin@domain.com + admin@incloser.internal),
-- keep the oldest account's username and suffix the rest so the unique index can be created.
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(trim(username))
      order by created_at asc, id asc
    ) as rn
  from public.admin_users
  where username is not null and trim(username) <> ''
)
update public.admin_users u
set username = left(trim(u.username), 24) || '-' || left(replace(u.id::text, '-', ''), 6)
from ranked r
where u.id = r.id
  and r.rn > 1;

create unique index if not exists admin_users_username_lower_uidx
  on public.admin_users (lower(username))
  where username is not null and trim(username) <> '';

alter table public.admin_users drop constraint if exists admin_users_role_allowed;

alter table public.admin_users
  add constraint admin_users_role_allowed check (
    role in (
      'super_admin',
      'operations_admin',
      'moderator',
      'verification_admin',
      'finance_admin',
      'support_admin'
    )
  );

comment on column public.admin_users.username is 'Login username (unique, lowercase). Used with password for CMS sign-in.';
