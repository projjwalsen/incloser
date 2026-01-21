import { create } from "zustand";

export type Gender = "male" | "female" | null;

export type Language =
  | "bengali"
  | "hindi"
  | "gujarati"
  | "kannada"
  | "tamil"
  | "malayalam"
  | null;

export type Dob = {
  dd: string; // "07"
  mm: string; // "10"
  yyyy: string; // "1992"
};

interface OnboardingState {
  /* =========================
     AUTH
     ========================= */
  phone: string;
  countryCode: string;
  otpVerified: boolean;

  /* =========================
     COMMON PROFILE
     ========================= */
  gender: Gender;
  nickname: string;
  isAdultConfirmed: boolean;

  // Avatar (used by both male & female, but avatar set differs by screen)
  avatarId: string | null;

  /* =========================
     FEMALE EXTRA PROFILE FIELDS
     (Safe to keep for all, even if male doesn’t use them)
     ========================= */
  dob: Dob; // dd/mm/yyyy
  city: string;
  state: string;

  /* =========================
     LANGUAGE PREFERENCES
     ========================= */
  language: Language; // primary
  secondaryLanguages: Exclude<Language, null>[]; // multi-select

  /* =========================
     AUDIO VERIFICATION (female flow)
     ========================= */
  audioVerificationUri: string | null;
  audioVerificationDurationSec: number;

  /* =========================
     ACTIONS
     ========================= */
  setPhone: (phone: string) => void;
  setCountryCode: (code: string) => void;
  setOtpVerified: (verified: boolean) => void;

  setGender: (gender: Gender) => void;
  setNickname: (name: string) => void;
  setAdultConfirmed: (confirmed: boolean) => void;

  setAvatarId: (id: string | null) => void;

  setDob: (dob: Partial<Dob>) => void;
  setCity: (city: string) => void;
  setState: (state: string) => void;

  setLanguage: (language: Language) => void;

  toggleSecondaryLanguage: (lang: Exclude<Language, null>) => void;
  clearSecondaryLanguages: () => void;

  setAudioVerification: (payload: {
    uri: string | null;
    durationSec?: number;
  }) => void;

  reset: () => void;
}

const initialDob: Dob = { dd: "", mm: "", yyyy: "" };

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  /* AUTH */
  phone: "",
  countryCode: "+91",
  otpVerified: false,

  /* COMMON PROFILE */
  gender: null,
  nickname: "",
  isAdultConfirmed: false,
  avatarId: null,

  /* FEMALE EXTRA PROFILE */
  dob: initialDob,
  city: "",
  state: "",

  /* LANGUAGES */
  language: null,
  secondaryLanguages: [],

  /* AUDIO VERIFICATION */
  audioVerificationUri: null,
  audioVerificationDurationSec: 0,

  /* ACTIONS */
  setPhone: (phone) => set({ phone }),
  setCountryCode: (countryCode) => set({ countryCode }),
  setOtpVerified: (otpVerified) => set({ otpVerified }),

  setGender: (gender) => set({ gender }),
  setNickname: (nickname) => set({ nickname }),
  setAdultConfirmed: (isAdultConfirmed) => set({ isAdultConfirmed }),

  setAvatarId: (avatarId) => set({ avatarId }),

  setDob: (dobPatch) =>
    set((state) => ({
      dob: { ...state.dob, ...dobPatch },
    })),

  setCity: (city) => set({ city }),
  setState: (stateName) => set({ state: stateName }),

  setLanguage: (language) => set({ language }),

  toggleSecondaryLanguage: (lang) => {
    const current = get().secondaryLanguages;
    const exists = current.includes(lang);
    set({
      secondaryLanguages: exists
        ? current.filter((x) => x !== lang)
        : [...current, lang],
    });
  },

  clearSecondaryLanguages: () => set({ secondaryLanguages: [] }),

  setAudioVerification: ({ uri, durationSec }) =>
    set((state) => ({
      audioVerificationUri: uri,
      audioVerificationDurationSec:
        typeof durationSec === "number"
          ? durationSec
          : state.audioVerificationDurationSec,
    })),

  reset: () =>
    set({
      phone: "",
      countryCode: "+91",
      otpVerified: false,

      gender: null,
      nickname: "",
      isAdultConfirmed: false,
      avatarId: null,

      dob: initialDob,
      city: "",
      state: "",

      language: null,
      secondaryLanguages: [],

      audioVerificationUri: null,
      audioVerificationDurationSec: 0,
    }),
}));
