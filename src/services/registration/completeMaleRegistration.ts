import { env } from "../../config/env";
import { useAuthStore } from "../../store/authStore";
import {
  completeMaleOnboarding,
  registerMaleUser,
  upsertMaleProfile,
} from "../supabase/onboarding.service";
import { persistLocalUserSession } from "../supabase/session.service";

export type CompleteMaleRegistrationInput = {
  phone: string;
  countryCode: string;
  gender: string | null;
  nickname: string;
  avatarId: string | null;
  isAdultConfirmed: boolean;
  language: string | null;
};

export type CompleteMaleRegistrationResult = {
  userId: string;
  mock: boolean;
};

function randomUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function validate(input: CompleteMaleRegistrationInput): void {
  const errors: string[] = [];
  if (!input.phone?.trim()) errors.push("Phone is required.");
  if (!input.countryCode?.trim()) errors.push("Country code is required.");
  if (input.gender !== "male") errors.push("Gender must be male for this flow.");
  if (!input.nickname?.trim()) errors.push("Nickname is required.");
  if (!input.isAdultConfirmed) errors.push("Adult confirmation is required.");
  if (!input.language) errors.push("Primary language is required.");

  if (errors.length) throw new Error(errors.join(" "));
}

/**
 * Orchestrates the male signup tail: tag the user row, upsert into `profiles`,
 * mark onboarding complete, and persist a local session.
 *
 * Mirrors `completeFemaleRegistration`. Falls back to a mock session when
 * `EXPO_PUBLIC_SUPABASE_URL` is unset, so registration still navigates locally
 * in dev / demo builds.
 */
export async function completeMaleRegistration(
  input: CompleteMaleRegistrationInput,
): Promise<CompleteMaleRegistrationResult> {
  validate(input);

  const sessionUserId = useAuthStore.getState().session?.userId;
  const trimmedNickname = input.nickname.trim();

  if (!env.isSupabaseConfigured) {
    const userId = sessionUserId ?? randomUuid();
    await persistLocalUserSession({
      userId,
      phone: input.phone.trim(),
      role: "user",
      onboardingCompleted: true,
      maleOnboardingCompleted: true,
      displayName: trimmedNickname,
    });
    return { userId, mock: true };
  }

  if (!sessionUserId) {
    throw new Error("Please verify your phone number before completing registration.");
  }

  const userId = sessionUserId;

  try {
    await registerMaleUser({
      userId,
      phone: input.phone.trim(),
      countryCode: input.countryCode.trim(),
    });

    await upsertMaleProfile({
      userId,
      nickname: trimmedNickname,
      avatarId: input.avatarId?.trim() || null,
      primaryLanguage: input.language,
    });

    await completeMaleOnboarding({ userId });

    await persistLocalUserSession({
      userId,
      phone: input.phone.trim(),
      role: "user",
      onboardingCompleted: true,
      maleOnboardingCompleted: true,
      displayName: trimmedNickname,
    });

    const session = useAuthStore.getState().session;
    if (session) {
      useAuthStore.getState().setSession({ ...session, displayName: trimmedNickname });
    }

    return { userId, mock: false };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed.";
    throw new Error(message);
  }
}
