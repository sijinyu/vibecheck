"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { type Locale, type TranslationKey, t } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "ko",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with "ko" to match server rendering and avoid hydration mismatch
  const [locale, setLocaleState] = useState<Locale>("ko");

  // Sync from localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem("vibecheck-locale") as Locale | null;
    if (stored && stored !== "ko") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("vibecheck-locale", newLocale);
  }, []);

  const translate = useCallback(
    (key: TranslationKey) => t(key, locale),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
