-- Add username login + operations_admin role for agency/verification staff.
-- Run in Supabase SQL Editor after admin_users.sql.

alter table public.admin_users
  add column if not exists username text;

-- Backfill username from email local-part for existing rows (optional, safe to re-run).
update public.admin_users
set username = lower(split_part(email, '@', 1))
where username is null or trim(username) = '';

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
