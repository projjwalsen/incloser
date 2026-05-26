import { getSupabase } from "../../lib/supabase";

/**
 * Assumes table public.users with columns:
 * id, phone, country_code, gender, role (user_role enum includes 'model'), is_onboarding_completed
 */
export type RegisterFemaleUserPayload = {
  userId: string;
  phone: string;
  countryCode: string;
};

export async function registerFemaleUser(payload: RegisterFemaleUserPayload): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const normalizedPhone = `${payload.countryCode}${payload.phone}`.replace(/\s+/g, "");

  const { error } = await supabase
    .from("users")
    .update({
      phone: normalizedPhone,
      country_code: payload.countryCode,
      gender: "female",
      role: "model",
    })
    .eq("id", payload.userId);

  if (error) {
    throw new Error(error.message || "Failed to update user for model registration.");
  }
}

/**
 * Assumes table public.female_profiles (see supabase/female_onboarding.sql).
 * Upsert on user_id.
 */
export type UpsertFemaleProfilePayload = {
  userId: string;
  nickname: string;
  avatarId: string | null;
  dobDd: string;
  dobMm: string;
  dobYyyy: string;
  city: string;
  state: string;
  primaryLanguage: string;
  secondaryLanguages: string[];
  isAdultConfirmed: boolean;
  audioVerificationUrl: string;
  audioVerificationDurationSec: number;
};

export async function upsertFemaleProfile(payload: UpsertFemaleProfilePayload): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const row = {
    user_id: payload.userId,
    nickname: payload.nickname,
    avatar_id: payload.avatarId,
    dob_dd: payload.dobDd,
    dob_mm: payload.dobMm,
    dob_yyyy: payload.dobYyyy,
    city: payload.city,
    state: payload.state,
    primary_language: payload.primaryLanguage,
    secondary_languages: payload.secondaryLanguages,
    is_adult_confirmed: payload.isAdultConfirmed,
    audio_verification_url: payload.audioVerificationUrl,
    audio_verification_duration_sec: payload.audioVerificationDurationSec,
    verification_status: "pending" as const,
  };

  const { error } = await supabase.from("female_profiles").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    throw new Error(error.message || "Failed to save female profile.");
  }
}

/** Enqueue uploaded audio for admin review (requires `audio_verifications` table). */
export async function enqueueAudioVerification(payload: {
  userId: string;
  audioUrl: string;
  durationSec: number;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: profile, error: profileError } = await supabase
    .from("female_profiles")
    .select("id")
    .eq("user_id", payload.userId)
    .maybeSingle<{ id: string }>();
  if (profileError || !profile?.id) return;

  const { error } = await supabase.from("audio_verifications").insert({
    model_id: profile.id,
    audio_url: payload.audioUrl,
    duration_seconds: payload.durationSec,
    status: "pending",
  });
  if (error) {
    console.warn("[onboarding] enqueueAudioVerification:", error.message);
  }
}

export type CompleteFemaleOnboardingPayload = {
  userId: string;
};

export async function completeFemaleOnboarding(
  payload: CompleteFemaleOnboardingPayload
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("users")
    .update({ is_onboarding_completed: true })
    .eq("id", payload.userId);

  if (error) {
    throw new Error(error.message || "Failed to mark onboarding complete.");
  }
}

export type FemaleProfileDb = {
  user_id: string;
  nickname: string | null;
  avatar_id: string | null;
  primary_language: string | null;
  secondary_languages: string[] | null;
  interests: string[] | null;
  upi_id: string | null;
  pan_number: string | null;
  pan_name: string | null;
};

export async function getFemaleProfileByUserId(userId: string): Promise<FemaleProfileDb | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("female_profiles")
    .select(
      "user_id,nickname,avatar_id,primary_language,secondary_languages,interests,upi_id,pan_number,pan_name"
    )
    .eq("user_id", userId)
    .maybeSingle<FemaleProfileDb>();

  if (error) {
    throw new Error(error.message || "Failed to load female profile.");
  }

  return data ?? null;
}

export async function saveFemaleProfileLanguages(
  userId: string,
  primaryLanguage: string | null,
  secondaryLanguages: string[]
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("female_profiles").upsert(
    {
      user_id: userId,
      primary_language: primaryLanguage,
      secondary_languages: secondaryLanguages,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message || "Failed to save languages.");
  }
}

export async function saveFemaleProfileUpiDetails(payload: {
  userId: string;
  upiId: string;
  panNumber: string;
  panName: string;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("female_profiles").upsert(
    {
      user_id: payload.userId,
      upi_id: payload.upiId,
      pan_number: payload.panNumber,
      pan_name: payload.panName,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message || "Failed to save UPI details.");
  }
}

export type MaleProfileDb = {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  primary_language: string | null;
};

/**
 * Mark a user as a male caller in `public.users`.
 * Mirrors `registerFemaleUser` — sets phone, country_code, gender = 'male',
 * role = 'user'. Run this BEFORE `upsertMaleProfile`.
 */
export type RegisterMaleUserPayload = {
  userId: string;
  phone: string;
  countryCode: string;
};

export async function registerMaleUser(payload: RegisterMaleUserPayload): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const normalizedPhone = `${payload.countryCode}${payload.phone}`.replace(/\s+/g, "");

  const { error } = await supabase
    .from("users")
    .update({
      phone: normalizedPhone,
      country_code: payload.countryCode,
      gender: "male",
      role: "user",
    })
    .eq("id", payload.userId);

  if (error) {
    throw new Error(error.message || "Failed to update user for male registration.");
  }
}

/** Set `users.is_onboarding_completed = true` once the male has a profile + language. */
export async function completeMaleOnboarding(payload: { userId: string }): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("users")
    .update({ is_onboarding_completed: true })
    .eq("id", payload.userId);

  if (error) {
    throw new Error(error.message || "Failed to mark male onboarding complete.");
  }
}

export async function upsertMaleProfile(payload: {
  userId: string;
  nickname: string;
  avatarId: string | null;
  primaryLanguage: string | null;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const trimmed = payload.nickname.trim();
  if (!trimmed) {
    throw new Error("Nickname is required.");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: payload.userId,
      nickname: trimmed,
      gender: "male",
      avatar_url: payload.avatarId,
      primary_language: payload.primaryLanguage,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message || "Failed to save male profile.");
  }
}

export async function getMaleProfileByUserId(userId: string): Promise<MaleProfileDb | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,nickname,avatar_url,primary_language")
    .eq("user_id", userId)
    .maybeSingle<MaleProfileDb>();

  if (error) {
    console.warn("[onboarding] getMaleProfileByUserId:", error.message);
    return null;
  }

  return data ?? null;
}

export async function saveFemaleProfileInterests(
  userId: string,
  interests: string[]
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("female_profiles").upsert(
    {
      user_id: userId,
      interests,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message || "Failed to save interests.");
  }
}
