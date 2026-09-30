import i18n, {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  LanguageOption,
  LANGUAGE_STORAGE_KEY,
} from "./config";
import { useTranslation, Trans } from "react-i18next";
import { LanguageSelector, LanguageSelectorProps } from "./LanguageSelector";

export {
  i18n,
  useTranslation,
  Trans,
  SUPPORTED_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  LanguageSelector,
};
export type { SupportedLanguage, LanguageOption, LanguageSelectorProps };
export default i18n;

