-- CMS onboarding avatars (admin-backend `avatarsService`, admin-web `/cms/avatars`).
-- Run in Supabase SQL Editor or via migration tooling.

create table if not exists public.avatars (
  id text primary key,
  image_url text not null,
  image_path text,
  gender_type text not null check (gender_type in ('male', 'female')),
  title text not null default '',
  category text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists avatars_gender_type_active_idx
  on public.avatars (gender_type, is_active, sort_order);

comment on table public.avatars is 'Curated default avatars for onboarding (CMS-managed).';

alter table public.avatars enable row level security;

-- PostgREST with anon/authenticated: only active rows (admin-backend uses service role and bypasses RLS).
create policy "avatars_select_active"
  on public.avatars for select
  using (is_active = true);

-- This script only creates the table (empty). Rows appear after you upload in Admin → CMS → Avatars,
-- or after you upload PNGs to the `onboarding-avatars` storage bucket and run `avatars_seed.sql`.
-- If PostgREST still errors on `avatars`, Dashboard → Settings → API → Reload schema.
