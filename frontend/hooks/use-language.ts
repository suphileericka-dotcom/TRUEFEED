import { useEffect, useState } from 'react';

export type AppLanguage = 'fr' | 'en';

function readLanguage(): AppLanguage {
  if (typeof localStorage === 'undefined') {
    return 'fr';
  }

  return localStorage.getItem('truefeed:language') === 'en' ? 'en' : 'fr';
}

function writeLanguage(language: AppLanguage) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem('truefeed:language', language);
  window.dispatchEvent(new Event('truefeed-language-change'));
}

export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>('fr');

  useEffect(() => {
    setLanguageState(readLanguage());

    if (typeof window === 'undefined') {
      return undefined;
    }

    function syncLanguage() {
      setLanguageState(readLanguage());
    }

    window.addEventListener('storage', syncLanguage);
    window.addEventListener('truefeed-language-change', syncLanguage);

    return () => {
      window.removeEventListener('storage', syncLanguage);
      window.removeEventListener('truefeed-language-change', syncLanguage);
    };
  }, []);

  function setLanguage(nextLanguage: AppLanguage) {
    writeLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  }

  return { language, setLanguage };
}
