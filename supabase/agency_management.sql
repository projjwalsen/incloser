-- Agency management: agencies, model linkage, commission ledger, agency payouts, settings.
-- Run after female_onboarding.sql and billing.sql.

-- ---------------------------------------------------------------------------
-- Settings (singleton)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_agency_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_agency_commission_percent numeric(5, 2) NOT NULL DEFAULT 12
    CHECK (default_agency_commission_percent >= 0 AND default_agency_commission_percent <= 100),
  platform_withdrawal_charge_percent numeric(5, 2) NOT NULL DEFAULT 1
    CHECK (platform_withdrawal_charge_percent >= 0 AND platform_withdrawal_charge_percent <= 100),
  tds_threshold_inr numeric(12, 2) NOT NULL DEFAULT 30000
    CHECK (tds_threshold_inr >= 0),
  tds_percent numeric(5, 2) NOT NULL DEFAULT 1
    CHECK (tds_percent >= 0 AND tds_percent <= 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_agency_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Agencies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE
    CHECK (code ~ '^[A-Z0-9]{6}$'),
  password_hash text NOT NULL,
  commission_percent numeric(5, 2) NOT NULL DEFAULT 12
    CHECK (commission_percent >= 0 AND commission_percent <= 100),
  available_balance_inr numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (available_balance_inr >= 0),
  lifetime_commission_inr numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (lifetime_commission_inr >= 0),
  fy_paid_out_inr numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (fy_paid_out_inr >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agencies_code ON public.agencies (code);
CREATE INDEX IF NOT EXISTS idx_agencies_created ON public.agencies (created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_agencies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agencies_updated_at ON public.agencies;
CREATE TRIGGER trg_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.touch_agencies_updated_at();

-- ---------------------------------------------------------------------------
-- Link models to agencies
-- ---------------------------------------------------------------------------
ALTER TABLE public.female_profiles
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_female_profiles_agency_id
  ON public.female_profiles (agency_id)
  WHERE agency_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Commission ledger (credited when a model withdrawal is finalized)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.female_profiles(id) ON DELETE CASCADE,
  model_withdrawal_id uuid,
  gross_withdrawal_inr numeric(12, 2) NOT NULL CHECK (gross_withdrawal_inr > 0),
  commission_percent numeric(5, 2) NOT NULL,
  commission_inr numeric(12, 2) NOT NULL CHECK (commission_inr >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_commission_ledger_agency
  ON public.agency_commission_ledger (agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agency_commission_ledger_model
  ON public.agency_commission_ledger (model_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Agency withdrawal / transfer requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  requested_amount_inr numeric(12, 2) NOT NULL CHECK (requested_amount_inr > 0),
  agency_commission_deduction_inr numeric(12, 2) NOT NULL DEFAULT 0,
  platform_charge_inr numeric(12, 2) NOT NULL DEFAULT 0,
  tds_inr numeric(12, 2) NOT NULL DEFAULT 0,
  net_payout_inr numeric(12, 2) NOT NULL CHECK (net_payout_inr >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  payout_method text,
  bank_masked text,
  upi_id text,
  finance_note text,
  paid_txn_id text,
  paid_via text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_withdrawal_requests_agency
  ON public.agency_withdrawal_requests (agency_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_agency_withdrawal_requests_status
  ON public.agency_withdrawal_requests (status, requested_at DESC);

CREATE OR REPLACE FUNCTION public.touch_agency_withdrawal_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agency_withdrawal_requests_updated_at ON public.agency_withdrawal_requests;
CREATE TRIGGER trg_agency_withdrawal_requests_updated_at
BEFORE UPDATE ON public.agency_withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.touch_agency_withdrawal_requests_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: service role only (admin backend / edge). No client access.
-- ---------------------------------------------------------------------------
ALTER TABLE public.app_agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_agency_settings_no_client ON public.app_agency_settings;
CREATE POLICY app_agency_settings_no_client ON public.app_agency_settings
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS agencies_no_client ON public.agencies;
CREATE POLICY agencies_no_client ON public.agencies
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS agency_commission_ledger_no_client ON public.agency_commission_ledger;
CREATE POLICY agency_commission_ledger_no_client ON public.agency_commission_ledger
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS agency_withdrawal_requests_no_client ON public.agency_withdrawal_requests;
CREATE POLICY agency_withdrawal_requests_no_client ON public.agency_withdrawal_requests
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Helper: resolve agency by public code (for registration)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_agency_by_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aid uuid;
  normalized text;
BEGIN
  normalized := upper(trim(COALESCE(p_code, '')));
  IF normalized = '' OR length(normalized) <> 6 THEN
    RETURN NULL;
  END IF;
  SELECT id INTO aid
  FROM public.agencies
  WHERE code = normalized AND is_active = true;
  RETURN aid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_agency_by_code(text) TO anon, authenticated;
