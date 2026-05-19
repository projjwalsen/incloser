-- Public bucket for onboarding avatar images (admin upload + seed URLs).
-- Run in Supabase SQL Editor once, then: `cd admin-backend && npm run upload-seed-avatars`

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'onboarding-avatars',
  'onboarding-avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "onboarding_avatars_select_public" on storage.objects;

create policy "onboarding_avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'onboarding-avatars');

-- Service role (admin-backend) bypasses Storage RLS for uploads; anon only needs the SELECT policy above.
