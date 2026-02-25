// ============================================================================
// Gemba Management System - i18n (Internationalisation)
// ============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import translations from './translations';
import type { TranslationKeys } from './translations';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGE_KEY = 'gemba_language';
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = Object.keys(translations);

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: keyof TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helper – read initial language from localStorage
// ---------------------------------------------------------------------------

function getInitialLanguage(): string {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (SSR, privacy mode, etc.)
  }
  return DEFAULT_LANGUAGE;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(getInitialLanguage);

  const setLanguage = useCallback((lang: string) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      console.warn(`Unsupported language "${lang}". Falling back to "${DEFAULT_LANGUAGE}".`);
      lang = DEFAULT_LANGUAGE;
    }
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: keyof TranslationKeys): string => {
      const bundle = translations[language] ?? translations[DEFAULT_LANGUAGE];
      const value = bundle[key];
      if (value === undefined) {
        // Fallback to English if key is missing in the current language
        const fallback = translations[DEFAULT_LANGUAGE]?.[key];
        return fallback ?? key;
      }
      return value;
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return React.createElement(LanguageContext.Provider, { value }, children);
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export { LanguageContext };
export default LanguageProvider;
