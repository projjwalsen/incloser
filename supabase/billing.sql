-- Billing: per-minute male charges, model payout on session end, admin rates, mock top-ups.
-- Run in Supabase SQL Editor after schema.sql, call_sessions.sql, chat_sessions.sql.

-- Extend transaction sources (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'transaction_source' AND e.enumlabel = 'text_charge'
  ) THEN
    ALTER TYPE public.transaction_source ADD VALUE 'text_charge';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'transaction_source' AND e.enumlabel = 'voice_charge'
  ) THEN
    ALTER TYPE public.transaction_source ADD VALUE 'voice_charge';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'transaction_source' AND e.enumlabel = 'video_charge'
  ) THEN
    ALTER TYPE public.transaction_source ADD VALUE 'video_charge';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'transaction_source' AND e.enumlabel = 'topup'
  ) THEN
    ALTER TYPE public.transaction_source ADD VALUE 'topup';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'transaction_source' AND e.enumlabel = 'model_earning'
  ) THEN
    ALTER TYPE public.transaction_source ADD VALUE 'model_earning';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.app_billing_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  text_rate_inr numeric(10, 2) NOT NULL DEFAULT 2,
  voice_rate_inr numeric(10, 2) NOT NULL DEFAULT 5,
  video_rate_inr numeric(10, 2) NOT NULL DEFAULT 10,
  model_share_percent numeric(5, 2) NOT NULL DEFAULT 85,
  reserve_minutes int NOT NULL DEFAULT 3,
  disconnect_minutes int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_billing_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.wallet_topup_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr > 0),
  bonus_inr numeric(12, 2) NOT NULL DEFAULT 0 CHECK (bonus_inr >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.wallet_topup_packages (title, amount_inr, bonus_inr, sort_order)
SELECT v.title, v.amount_inr, v.bonus_inr, v.sort_order
FROM (
  VALUES
    ('Starter', 100::numeric, 0::numeric, 1),
    ('Popular', 500::numeric, 50::numeric, 2),
    ('Value', 1000::numeric, 150::numeric, 3)
) AS v(title, amount_inr, bonus_inr, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.wallet_topup_packages LIMIT 1);

ALTER TABLE public.call_sessions
  ADD COLUMN IF NOT EXISTS billing_charged_minutes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_total_debited_inr numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_model_credited_inr numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_finalized boolean NOT NULL DEFAULT false;

ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS billing_charged_minutes int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_total_debited_inr numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_model_credited_inr numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_finalized boolean NOT NULL DEFAULT false;

ALTER TABLE public.app_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_topup_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_billing_settings_read ON public.app_billing_settings;
CREATE POLICY app_billing_settings_read ON public.app_billing_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS wallet_topup_packages_read ON public.wallet_topup_packages;
CREATE POLICY wallet_topup_packages_read ON public.wallet_topup_packages
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Helpers
CREATE OR REPLACE FUNCTION public.billing_get_settings()
RETURNS public.app_billing_settings
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.app_billing_settings WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.billing_rate_for_mode(p_mode text, p_call_type text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  s public.app_billing_settings;
BEGIN
  SELECT * INTO s FROM public.app_billing_settings WHERE id = 1;
  IF p_mode = 'text' THEN
    RETURN s.text_rate_inr;
  END IF;
  IF p_mode = 'video' OR p_call_type = 'video' THEN
    RETURN s.video_rate_inr;
  END IF;
  RETURN s.voice_rate_inr;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_wallet_row(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  w_id uuid;
BEGIN
  SELECT id INTO w_id FROM public.wallets WHERE user_id = p_user_id;
  IF w_id IS NOT NULL THEN
    RETURN w_id;
  END IF;
  INSERT INTO public.wallets (user_id, token_balance, rupee_balance)
  VALUES (p_user_id, 0, 0)
  RETURNING id INTO w_id;
  RETURN w_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_wallet_balance_inr(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  bal numeric;
BEGIN
  PERFORM public.ensure_wallet_row(p_user_id);
  SELECT rupee_balance INTO bal FROM public.wallets WHERE user_id = p_user_id;
  RETURN COALESCE(bal, 0);
END;
$$;

-- Public read helpers (mobile)
CREATE OR REPLACE FUNCTION public.get_billing_settings_public()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'textRateInrPerMin', text_rate_inr,
    'voiceRateInrPerMin', voice_rate_inr,
    'videoRateInrPerMin', video_rate_inr,
    'modelSharePercent', model_share_percent,
    'reserveMinutes', reserve_minutes,
    'disconnectMinutes', disconnect_minutes
  )
  FROM public.app_billing_settings
  WHERE id = 1;
$$;

CREATE OR REPLACE FUNCTION public.get_wallet_balance_public(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'balanceInr', public.get_wallet_balance_inr(p_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_topup_packages_public()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'amountInr', amount_inr,
        'bonusInr', bonus_inr
      )
      ORDER BY sort_order, amount_inr
    ),
    '[]'::jsonb
  )
  FROM public.wallet_topup_packages
  WHERE is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.check_wallet_can_start_session(
  p_user_id uuid,
  p_mode text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.app_billing_settings;
  rate numeric;
  bal numeric;
  required numeric;
BEGIN
  SELECT * INTO s FROM public.app_billing_settings WHERE id = 1;
  rate := public.billing_rate_for_mode(p_mode, CASE WHEN p_mode = 'video' THEN 'video' ELSE 'voice' END);
  bal := public.get_wallet_balance_inr(p_user_id);
  required := rate * s.reserve_minutes;
  RETURN jsonb_build_object(
    'ok', bal >= required,
    'balanceInr', bal,
    'rateInrPerMin', rate,
    'requiredInr', required,
    'reserveMinutes', s.reserve_minutes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_wallet_topup_mock(
  p_user_id uuid,
  p_package_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg public.wallet_topup_packages;
  w_id uuid;
  credit numeric;
  new_bal numeric;
BEGIN
  SELECT * INTO pkg FROM public.wallet_topup_packages WHERE id = p_package_id AND is_active = true;
  IF pkg IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Package not found');
  END IF;
  w_id := public.ensure_wallet_row(p_user_id);
  credit := pkg.amount_inr + pkg.bonus_inr;
  UPDATE public.wallets
  SET rupee_balance = rupee_balance + credit
  WHERE id = w_id
  RETURNING rupee_balance INTO new_bal;
  INSERT INTO public.wallet_transactions (
    wallet_id, transaction_type, source, amount_tokens, amount_rupees, reference_id, meta
  ) VALUES (
    w_id, 'credit', 'topup', 0, credit, p_package_id::text,
    jsonb_build_object('title', pkg.title, 'mock', true)
  );
  RETURN jsonb_build_object('ok', true, 'balanceInr', new_bal, 'creditedInr', credit);
END;
$$;

CREATE OR REPLACE FUNCTION public.charge_session_minute(
  p_session_kind text,
  p_session_id uuid,
  p_caller_user_id uuid,
  p_minute_index int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.app_billing_settings;
  rate numeric;
  w_id uuid;
  bal numeric;
  call_row public.call_sessions;
  chat_row public.chat_sessions;
  mode text;
  txn_source public.transaction_source;
  charged int;
BEGIN
  IF p_minute_index < 1 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid minute');
  END IF;

  SELECT * INTO s FROM public.app_billing_settings WHERE id = 1;

  IF p_session_kind = 'call' THEN
    SELECT * INTO call_row FROM public.call_sessions WHERE id = p_session_id;
    IF call_row IS NULL OR call_row.caller_user_id <> p_caller_user_id THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Invalid call session');
    END IF;
    IF call_row.status NOT IN ('connecting', 'active') THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Call not active');
    END IF;
    charged := call_row.billing_charged_minutes;
    mode := CASE WHEN call_row.call_type = 'video' THEN 'video' ELSE 'voice' END;
  ELSIF p_session_kind = 'chat' THEN
    SELECT * INTO chat_row FROM public.chat_sessions WHERE id = p_session_id;
    IF chat_row IS NULL OR chat_row.caller_user_id <> p_caller_user_id THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Invalid chat session');
    END IF;
    IF chat_row.status NOT IN ('connecting', 'active') OR chat_row.text_unlocked IS NOT TRUE THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Chat not billable yet');
    END IF;
    charged := chat_row.billing_charged_minutes;
    mode := 'text';
  ELSE
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid session kind');
  END IF;

  IF charged >= p_minute_index THEN
    bal := public.get_wallet_balance_inr(p_caller_user_id);
    rate := public.billing_rate_for_mode(mode, mode);
    RETURN jsonb_build_object(
      'ok', true,
      'alreadyCharged', true,
      'balanceInr', bal,
      'rateInrPerMin', rate
    );
  END IF;

  IF p_minute_index <> charged + 1 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Minute out of order');
  END IF;

  rate := public.billing_rate_for_mode(mode, mode);
  w_id := public.ensure_wallet_row(p_caller_user_id);
  SELECT rupee_balance INTO bal FROM public.wallets WHERE id = w_id FOR UPDATE;

  IF bal < rate THEN
    RETURN jsonb_build_object(
      'ok', false,
      'insufficient', true,
      'balanceInr', bal,
      'rateInrPerMin', rate,
      'message', 'You have not enough balance please add fund'
    );
  END IF;

  txn_source := CASE
    WHEN mode = 'text' THEN 'text_charge'::public.transaction_source
    WHEN mode = 'video' THEN 'video_charge'::public.transaction_source
    ELSE 'voice_charge'::public.transaction_source
  END;

  UPDATE public.wallets
  SET rupee_balance = rupee_balance - rate
  WHERE id = w_id
  RETURNING rupee_balance INTO bal;

  INSERT INTO public.wallet_transactions (
    wallet_id, transaction_type, source, amount_tokens, amount_rupees, reference_id, meta
  ) VALUES (
    w_id, 'debit', txn_source, 0, rate, p_session_id::text,
    jsonb_build_object('sessionKind', p_session_kind, 'minuteIndex', p_minute_index, 'mode', mode)
  );

  IF p_session_kind = 'call' THEN
    UPDATE public.call_sessions
    SET
      billing_charged_minutes = billing_charged_minutes + 1,
      billing_total_debited_inr = billing_total_debited_inr + rate
    WHERE id = p_session_id;
  ELSE
    UPDATE public.chat_sessions
    SET
      billing_charged_minutes = billing_charged_minutes + 1,
      billing_total_debited_inr = billing_total_debited_inr + rate
    WHERE id = p_session_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'balanceInr', bal,
    'rateInrPerMin', rate,
    'minuteIndex', p_minute_index
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_session_billing(
  p_session_kind text,
  p_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.app_billing_settings;
  call_row public.call_sessions;
  chat_row public.chat_sessions;
  started timestamptz;
  ended timestamptz;
  secs int;
  model_mins int;
  rate numeric;
  mode text;
  model_user uuid;
  model_earn numeric;
  w_id uuid;
  new_bal numeric;
BEGIN
  SELECT * INTO s FROM public.app_billing_settings WHERE id = 1;

  IF p_session_kind = 'call' THEN
    SELECT * INTO call_row FROM public.call_sessions WHERE id = p_session_id;
    IF call_row IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Session not found');
    END IF;
    IF call_row.billing_finalized THEN
      RETURN jsonb_build_object('ok', true, 'alreadyFinalized', true);
    END IF;
    started := COALESCE(call_row.connected_at, call_row.created_at);
    ended := COALESCE(call_row.ended_at, now());
    model_user := call_row.receiver_user_id;
    mode := CASE WHEN call_row.call_type = 'video' THEN 'video' ELSE 'voice' END;
    secs := GREATEST(0, EXTRACT(EPOCH FROM (ended - started))::int);
    model_mins := GREATEST(0, FLOOR(secs / 60.0)::int);
    rate := public.billing_rate_for_mode(mode, mode);
    model_earn := ROUND((model_mins * rate * s.model_share_percent / 100.0)::numeric, 2);

    UPDATE public.call_sessions
    SET billing_model_credited_inr = model_earn, billing_finalized = true
    WHERE id = p_session_id;
  ELSIF p_session_kind = 'chat' THEN
    SELECT * INTO chat_row FROM public.chat_sessions WHERE id = p_session_id;
    IF chat_row IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'message', 'Session not found');
    END IF;
    IF chat_row.billing_finalized THEN
      RETURN jsonb_build_object('ok', true, 'alreadyFinalized', true);
    END IF;
    started := COALESCE(chat_row.timer_started_at, chat_row.connected_at, chat_row.created_at);
    ended := COALESCE(chat_row.ended_at, now());
    model_user := chat_row.receiver_user_id;
    mode := 'text';
    secs := GREATEST(0, EXTRACT(EPOCH FROM (ended - started))::int);
    model_mins := GREATEST(0, FLOOR(secs / 60.0)::int);
    rate := s.text_rate_inr;
    model_earn := ROUND((model_mins * rate * s.model_share_percent / 100.0)::numeric, 2);

    UPDATE public.chat_sessions
    SET billing_model_credited_inr = model_earn, billing_finalized = true
    WHERE id = p_session_id;
  ELSE
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid session kind');
  END IF;

  IF model_earn > 0 AND model_user IS NOT NULL THEN
    w_id := public.ensure_wallet_row(model_user);
    UPDATE public.wallets
    SET rupee_balance = rupee_balance + model_earn
    WHERE id = w_id
    RETURNING rupee_balance INTO new_bal;
    INSERT INTO public.wallet_transactions (
      wallet_id, transaction_type, source, amount_tokens, amount_rupees, reference_id, meta
    ) VALUES (
      w_id, 'credit', 'model_earning', 0, model_earn, p_session_id::text,
      jsonb_build_object(
        'sessionKind', p_session_kind,
        'modelMinutes', model_mins,
        'rateInrPerMin', rate,
        'sharePercent', s.model_share_percent
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'modelMinutes', model_mins,
    'modelEarningInr', model_earn,
    'durationSeconds', secs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_billing_settings_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_balance_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_topup_packages_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_wallet_can_start_session(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_wallet_topup_mock(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_session_minute(text, uuid, uuid, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_session_billing(text, uuid) TO anon, authenticated;
