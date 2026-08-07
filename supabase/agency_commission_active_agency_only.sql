-- Ensure agency commission (e.g. 12%) applies ONLY when the linked agency is active.
-- Safe to re-run in Supabase SQL Editor.
-- Models under a deactivated agency keep their agency_id but pay no agency cut on withdrawal.

CREATE OR REPLACE FUNCTION public.preview_model_withdrawal(
  p_user_id uuid,
  p_amount_inr numeric
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof public.female_profiles;
  agency_rec public.agencies;
  settings public.app_agency_settings;
  bal numeric(12, 2);
  agency_pct numeric(5, 2) := 0;
  agency_inr numeric(12, 2) := 0;
  platform_pct numeric(5, 2) := 1;
  platform_inr numeric(12, 2) := 0;
  tds_pct numeric(5, 2) := 1;
  tds_threshold numeric(12, 2) := 30000;
  tds_inr numeric(12, 2) := 0;
  fy_start date;
  fy_paid numeric(12, 2) := 0;
  after_agency numeric(12, 2);
  after_platform numeric(12, 2);
  net_inr numeric(12, 2);
  min_amount numeric(12, 2) := 500;
BEGIN
  IF p_amount_inr IS NULL OR p_amount_inr <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Amount must be greater than 0');
  END IF;

  SELECT * INTO prof FROM public.female_profiles WHERE user_id = p_user_id;
  IF prof.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Model profile not found');
  END IF;

  SELECT * INTO settings FROM public.app_agency_settings WHERE id = 1;
  IF settings.id IS NOT NULL THEN
    platform_pct := settings.platform_withdrawal_charge_percent;
    tds_pct := settings.tds_percent;
    tds_threshold := settings.tds_threshold_inr;
  END IF;

  bal := public.get_wallet_balance_inr(p_user_id);

  IF prof.agency_id IS NOT NULL THEN
    SELECT * INTO agency_rec FROM public.agencies WHERE id = prof.agency_id AND is_active = true;
    IF agency_rec.id IS NOT NULL THEN
      agency_pct := agency_rec.commission_percent;
    END IF;
  END IF;

  agency_inr := ROUND((p_amount_inr * agency_pct) / 100.0, 2);
  after_agency := GREATEST(0, p_amount_inr - agency_inr);
  platform_inr := ROUND((p_amount_inr * platform_pct) / 100.0, 2);
  after_platform := GREATEST(0, after_agency - platform_inr);

  fy_start := public.india_fy_start(now());
  SELECT COALESCE(SUM(amount), 0) INTO fy_paid
  FROM public.withdrawals
  WHERE model_id = prof.id
    AND status = 'paid'
    AND requested_at >= fy_start::timestamptz;

  IF (fy_paid + p_amount_inr) > tds_threshold THEN
    tds_inr := ROUND((
      GREATEST(0, after_platform - GREATEST(0, tds_threshold - fy_paid))
      * tds_pct
    ) / 100.0, 2);
  END IF;

  net_inr := GREATEST(0, ROUND(after_platform - tds_inr, 2));

  RETURN jsonb_build_object(
    'ok', true,
    'amountInr', p_amount_inr,
    'balanceInr', bal,
    'minAmountInr', min_amount,
    'hasUpi', COALESCE(NULLIF(trim(prof.upi_id), ''), NULL) IS NOT NULL,
    'agencyId', prof.agency_id,
    'agencyCode', agency_rec.code,
    'agencyCommissionPercent', agency_pct,
    'agencyCommissionInr', agency_inr,
    'platformChargePercent', platform_pct,
    'platformChargeInr', platform_inr,
    'tdsPercent', tds_pct,
    'tdsInr', tds_inr,
    'netToModelInr', net_inr
  );
END;
$$;

COMMENT ON FUNCTION public.preview_model_withdrawal IS
  'Withdrawal preview. Agency commission applies only when agencies.is_active = true.';
