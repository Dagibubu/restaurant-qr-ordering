import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

const STORAGE_KEY = 'lang';
const LanguageContext = createContext(null);

const readStoredLang = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'am' || v === 'en' ? v : 'en';
  } catch {
    return 'en';
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice just won't persist */
    }
  }, []);

  const value = useMemo(() => {
    const t = (key, vars) => {
      const str = translations[lang][key] ?? translations.en[key] ?? key;
      return vars
        ? str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))
        : str;
    };

    // localized(item, 'name') → item.nameAm in Amharic (if set), else item.name
    const localized = (obj, field) =>
      (lang === 'am' && obj?.[`${field}Am`]) || obj?.[field];

    return { lang, setLang, t, localized };
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
