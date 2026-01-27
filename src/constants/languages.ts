/**
 * Language options for call language selection
 */

export interface LanguageOption {
  id: string;
  nameEnglish: string;
  nameNative: string;
}

export const LANGUAGES: LanguageOption[] = [
  {
    id: "bengali",
    nameEnglish: "Bengali",
    nameNative: "বাংলা",
  },
  {
    id: "hindi",
    nameEnglish: "Hindi",
    nameNative: "हिंदी",
  },
  {
    id: "gujarati",
    nameEnglish: "Gujarati",
    nameNative: "ગુજરાતી",
  },
  {
    id: "kannada",
    nameEnglish: "Kannada",
    nameNative: "ಕನ್ನಡ",
  },
  {
    id: "tamil",
    nameEnglish: "Tamil",
    nameNative: "தமிழ்",
  },
  {
    id: "malayalam",
    nameEnglish: "Malayalam",
    nameNative: "മലയാളം",
  },
];
