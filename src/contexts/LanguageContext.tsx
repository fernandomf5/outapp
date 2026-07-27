import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/i18n/translations';
import { setAutoTranslateLanguage } from '@/lib/autoTranslate';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('language');
      return (saved as Language) || 'pt';
    } catch {
      return 'pt';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('language', language);
    } catch {
      // Ignore localStorage errors
    }
    setAutoTranslateLanguage(language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (lang === language) return;
    setLanguageState(lang);
    // Full remount of translated content is unnecessary — the auto-translator
    // reacts to the language change and re-sweeps the DOM.
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.pt?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
