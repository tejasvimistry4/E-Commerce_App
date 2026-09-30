import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en.json";
import hiTranslation from "./locales/hi.json";
import frTranslation from "./locales/fr.json";

export const LANGUAGE_STORAGE_KEY = "app_language";

export type SupportedLanguage = "en" | "hi" | "fr";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    label: "English",
    nativeName: "English",
    flag: "🇺🇸",
  },
  {
    code: "hi",
    label: "Hindi",
    nativeName: "हिंदी",
    flag: "🇮🇳",
  },
  {
    code: "fr",
    label: "French",
    nativeName: "Français",
    flag: "🇫🇷",
  },
];

const getInitialLanguage = (): SupportedLanguage => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "hi" || stored === "fr") {
      return stored;
    }
  } catch {
    // Fallback if localStorage is inaccessible
  }
  return "en";
};

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    hi: { translation: hiTranslation },
    fr: { translation: frTranslation },
  },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values safely
  },
});

// Update localStorage whenever language changes
i18n.on("languageChanged", (lng: string) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    document.documentElement.lang = lng;
  } catch {
    // Ignore storage errors
  }
});

// Set initial html lang attribute
if (typeof document !== "undefined") {
  document.documentElement.lang = initialLang;
}

export default i18n;
