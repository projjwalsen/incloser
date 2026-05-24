# InCloser Supabase Setup

## 1) Create Supabase project

- Create a new project in Supabase.
- Copy:
  - Project URL
  - Anon key
  - Service role key (backend only, never mobile app)

## 2) Run schema

- Open **SQL Editor** in Supabase.
- Run `supabase/schema.sql`.
- Run `supabase/otp_schema.sql`.
- Run `supabase/female_onboarding.sql`.
- Run `supabase/audio_verifications.sql` (required for admin audio verification queue).
- Run **each** of these as a **separate** SQL Editor query (PostgreSQL requires committing new enum values before use):
  1. `supabase/female_online_status_01_enum.sql`
  2. `supabase/female_online_status_02_apply.sql`
  3. `supabase/female_online_status_busy.sql` (`busy` during active calls)
  4. `supabase/female_online_status_before_busy.sql` (restore snapshot when call ends)
  5. `supabase/female_presence.sql` (heartbeat column for 10s ping / 15s stale offline)
  6. `supabase/call_sessions_restore_model_status.sql` (**required** — restores model from `busy` when call ends)
- **Text chat** (separate queries):
  1. `supabase/chat_sessions.sql`
  2. `supabase/chat_messages.sql`
  3. `supabase/chat_storage.sql`
  4. `supabase/chat_sessions_restore_model_status.sql`
- Enable **Realtime** for `chat_messages`, `call_sessions`, and `chat_sessions` in Supabase Dashboard → Database → Replication (incoming calls/chats and live messages).
- See `supabase/female_online_status.sql` for the full label list and legacy mapping.
- Run `supabase/call_sessions.sql` (call signaling for Agora).
- Run `supabase/billing.sql` (wallet per-minute rates, top-up packages, charge/finalize RPCs — **after** `schema.sql`, `call_sessions.sql`, `chat_sessions.sql`).
- Deploy edge function `generate-agora-token` and set secrets `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`.

Male home lists read `female_profiles` where `verification_status = approved` and `online_status` matches the tab (Call → voice / voice+video; Chat → text).

## 3) Configure Expo app

Update `app.json`:

```json
"extra": {
  "authApiBaseUrl": "https://your-backend-domain.com",
  "authSendOtpPath": "/auth/send-otp",
  "authVerifyOtpPath": "/auth/verify-otp",
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
}
```

## 4) Deploy Edge Functions (OTP)

Install Supabase CLI and login, then in project root:

```bash
supabase functions deploy send-otp --project-ref nmbocuxqsoemaigfywcm
supabase functions deploy verify-otp --project-ref nmbocuxqsoemaigfywcm
```

Set function secrets (never commit these):

```bash
supabase secrets set \
  OTP_SECRET="replace-with-random-secret" \
  SMS_USER="Incloser_sms" \
  SMS_PASS="12345" \
  SMS_SENDER="UTSHAB" \
  --project-ref nmbocuxqsoemaigfywcm
```

## 5) OTP architecture (important)

Do **not** call SMS vendor APIs directly from React Native app, because credentials will leak.

Use backend endpoints:

- `POST /auth/send-otp`
  - body: `{ "phone": "+918754452410" }`
  - backend calls SMS gateway and stores OTP hash + expiry in DB
- `POST /auth/verify-otp`
  - body: `{ "phone": "+918754452410", "otp": "123456", "sessionId": "..." }`
  - backend verifies hash + expiry
  - issues JWT/session token
  - returns user payload

## 6) SMS gateway integration (backend only)

You shared this vendor format:

`https://bhashsms.com/api/sendmsg.php?...`

Keep these creds in backend env vars only:

- `SMS_USER`
- `SMS_PASS`
- `SMS_SENDER`

Never place them in mobile app code or `app.json`.

## 7) AWS migration-ready path

Later migration can keep app contract same:

- Replace Supabase DB with AWS RDS/Aurora
- Replace Supabase storage with S3
- Replace auth issuer with Cognito/custom
- Keep `POST /auth/send-otp` and `POST /auth/verify-otp` API contract unchanged for mobile app

