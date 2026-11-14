// ============================================================
// LanguageContext.tsx — Reactive i18n Provider & Hook
// Outpost Commander — NASA Space Apps Multi-Language Architecture
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type {
  SupportedLanguage,
  LanguageMeta,
  TranslationSchema,
} from "./types";
import { SUPPORTED_LANGUAGES } from "./types";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { de } from "./locales/de";
import { ja } from "./locales/ja";
import { pt } from "./locales/pt";

const LOCAL_STORAGE_KEY = "outpost_commander_language_v1";

const DICTIONARIES: Record<SupportedLanguage, TranslationSchema> = {
  en,
  es,
  fr,
  de,
  ja,
  pt,
};

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languages: LanguageMeta[];
  currentLanguage: LanguageMeta;
  t: (path: string, params?: Record<string, string | number>) => string;
  dict: TranslationSchema;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && saved in DICTIONARIES) {
      return saved;
    }
  } catch {
    // LocalStorage unavailable
  }

  try {
    const navLangs = navigator.languages || [navigator.language];
    for (const raw of navLangs) {
      const code = raw.toLowerCase().split("-")[0] as SupportedLanguage;
      if (code in DICTIONARIES) {
        return code;
      }
    }
  } catch {
    // Navigator unavailable
  }

  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(detectInitialLanguage);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (newLang in DICTIONARIES) {
      setLanguageState(newLang);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, newLang);
      } catch {
        // Storage failure ignored
      }
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLang;
      }
    }
  }, []);

  // Sync document.documentElement.lang on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const currentLanguage = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const dict = useMemo(() => DICTIONARIES[language] || en, [language]);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const segments = path.split(".");

      // 1. Traverse current language dictionary
      let current: unknown = dict;
      for (const seg of segments) {
        if (current && typeof current === "object" && seg in current) {
          current = (current as Record<string, unknown>)[seg];
        } else {
          current = undefined;
          break;
        }
      }

      // 2. Fallback to English dictionary if not found
      if (current === undefined || typeof current !== "string") {
        let fallback: unknown = en;
        for (const seg of segments) {
          if (fallback && typeof fallback === "object" && seg in fallback) {
            fallback = (fallback as Record<string, unknown>)[seg];
          } else {
            fallback = undefined;
            break;
          }
        }
        if (fallback !== undefined && typeof fallback === "string") {
          current = fallback;
        } else {
          return path; // Return raw key as last resort
        }
      }

      let result = String(current);

      // 3. Interpolate params {name} -> value
      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          result = result.replace(
            new RegExp(`\\{${paramKey}\\}`, "g"),
            String(paramVal)
          );
        });
      }

      return result;
    },
    [dict]
  );

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      languages: SUPPORTED_LANGUAGES,
      currentLanguage,
      t,
      dict,
    }),
    [language, setLanguage, currentLanguage, t, dict]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
