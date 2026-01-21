export type Gender = "male" | "female";

export type Language =
  | "bengali"
  | "hindi"
  | "gujarati"
  | "kannada"
  | "tamil"
  | "malayalam";

export type AuthStackParamList = {
  // Auth
  Welcome: undefined;
  Phone: undefined;
  Otp: { phone: string };
  Gender: undefined;

  /* =====================
     MALE ONBOARDING FLOW
     ===================== */
  CreateProfile: undefined;
  SelectAvatar: { from?: "createProfile" | "other" } | undefined;
  SelectLanguage: undefined;

  /* =====================
     MALE HOME (after onboarding)
     ===================== */
  MaleHome: undefined;

  /* =======================
     FEMALE ONBOARDING FLOW
     ======================= */
  FemaleCreateProfile: undefined;
  FemaleSelectAvatar: { from?: "femaleCreateProfile" } | undefined;
  SelectSecondaryLanguage: undefined;

  AudioVerificationRecord: undefined;
  AudioVerificationSubmit: {
    audioUri: string;
    durationSec: number;
  };

  // Temporary / next phase
  NextStepPlaceholder: undefined;
};
