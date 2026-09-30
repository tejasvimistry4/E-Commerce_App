import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "./config";
import { Icon } from "../components/common/Icon";


export interface LanguageSelectorProps {
  variant?: "dropdown" | "compact" | "inline";
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  showGlobeIcon?: boolean;
  showFlag?: boolean;
  showLabel?: boolean;
  direction?: "up" | "down";
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "dropdown",
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  showGlobeIcon = true,
  showFlag = true,
  showLabel = true,
  direction = "down",
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLangCode = (i18n.language?.split("-")[0] || "en") as SupportedLanguage;
  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) ||
    SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (code: SupportedLanguage) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {showGlobeIcon && <Icon name="globe" className="w-3.5 h-3.5 text-slate-400 mr-1" />}
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = lang.code === currentLangCode;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title={lang.label}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center space-x-2 py-2 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer ${
          variant === "compact" ? "!py-1.5 !px-2.5 text-xs" : "text-xs font-bold"
        } ${buttonClassName}`}
        title={`Change language (Current: ${currentLanguage.label})`}
      >
        {showGlobeIcon && (
          <Icon name="globe" className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
        )}
        {showFlag && (
          <span className="text-sm leading-none flex-shrink-0" role="img" aria-label={currentLanguage.label}>
            {currentLanguage.flag}
          </span>
        )}
        {showLabel && (
          <span className="font-bold text-slate-800 tracking-tight">
            {variant === "compact" ? currentLanguage.code.toUpperCase() : currentLanguage.nativeName}
          </span>
        )}
        <Icon
          name="chevron-down"
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 ${
            direction === "up" ? "bottom-full mb-2" : "mt-2"
          } w-48 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Select Language
            </span>
          </div>

          <div className="space-y-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLangCode;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  role="menuitem"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 font-extrabold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base" role="img" aria-label={lang.label}>
                      {lang.flag}
                    </span>
                    <div className="flex flex-col">
                      <span className="leading-tight">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {lang.label}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Icon name="check" className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
