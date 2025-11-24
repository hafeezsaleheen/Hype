import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { en } from '../locales/en';
import { id } from '../locales/id';

type Locale = 'en' | 'id';

export interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

const translations = { en, id };

// Helper to access nested keys like 'header.title'
const getNestedTranslation = (obj: any, key: string): string => {
  return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const savedLocale = localStorage.getItem('locale');
    return (savedLocale === 'en' || savedLocale === 'id') ? savedLocale : 'id';
  });

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = useCallback((key: string): string => {
    const translation = getNestedTranslation(translations[locale], key);
    if (translation === undefined) {
      // Fallback to English if translation is missing
      const fallback = getNestedTranslation(translations.en, key);
      if (fallback === undefined) {
        console.warn(`Translation key not found in both locales: ${key}`);
        return key;
      }
      return fallback;
    }
    return translation;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
