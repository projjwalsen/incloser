-- Optional seed for `public.avatars` after `avatars.sql` is applied.
--
-- Prereqs:
-- 1. Run `supabase/storage_onboarding_avatars_bucket.sql` (creates public bucket + read policy).
-- 2. Upload PNGs to that bucket (F2.png … F8.png, M2.png … M8.png). Easiest:
--      cd admin-backend && npm run upload-seed-avatars
--    (uses `../assets/images/` and service role from `.env`).
--
-- Project URL: https://nmbocuxqsoemaigfywcm.supabase.co

insert into public.avatars (id, image_url, image_path, gender_type, title, category, sort_order, is_active)
values
  ('seed_f2', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/F2.png', 'F2.png', 'female', 'Female F2', 'Onboarding', 10, true),
  ('seed_f3', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/F3.png', 'F3.png', 'female', 'Female F3', 'Onboarding', 20, true),
  ('seed_f4', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/F4.png', 'F4.png', 'female', 'Female F4', 'Onboarding', 30, true),
  ('seed_f5', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/F5.png', 'F5.png', 'female', 'Female F5', 'Onboarding', 40, true),
  ('seed_f6', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/F6.png', 'F6.png', 'female', 'Female F6', 'Onboarding', 50, true),
  ('seed_f7', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/F7.png', 'F7.png', 'female', 'Female F7', 'Onboarding', 60, true),
  ('seed_f8', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/F8.png', 'F8.png', 'female', 'Female F8', 'Onboarding', 70, true),
  ('seed_m2', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/M2.png', 'M2.png', 'male', 'Male M2', 'Onboarding', 110, true),
  ('seed_m3', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/M3.png', 'M3.png', 'male', 'Male M3', 'Onboarding', 120, true),
  ('seed_m4', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/M4.png', 'M4.png', 'male', 'Male M4', 'Onboarding', 130, true),
  ('seed_m5', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/M5.png', 'M5.png', 'male', 'Male M5', 'Onboarding', 140, true),
  ('seed_m6', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/M6.png', 'M6.png', 'male', 'Male M6', 'Onboarding', 150, true),
  ('seed_m7', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/M7.png', 'M7.png', 'male', 'Male M7', 'Onboarding', 160, true),
  ('seed_m8', 'https://nmbocuxqsoemaigfywcm.supabase.co/storage/v1/object/public/onboarding-avatars/M8.png', 'M8.png', 'male', 'Male M8', 'Onboarding', 170, true)
on conflict (id) do update set
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  gender_type = excluded.gender_type,
  title = excluded.title,
  category = excluded.category,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
