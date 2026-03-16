import { createContext, useContext, useState, useEffect } from 'react';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [translations, setTranslations] = useState({});
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedIdioma = localStorage.getItem('idioma') || 'es';
    setIdioma(savedIdioma);
    setLoading(false);
  }, []);

  const loadTranslations = async (lang) => {
    try {
      const res = await fetch(`/api/i18n/${lang}`);
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
      }
    } catch (e) {
      console.error('Error loading translations:', e);
    } finally {
      setLoading(false);
    }
  };

  const changeIdioma = (newIdioma) => {
    setIdioma(newIdioma);
    localStorage.setItem('idioma', newIdioma);
  };

  const t = (key) => {
    if (!translations) return key;
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <I18nContext.Provider value={{ t, idioma, changeIdioma, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
