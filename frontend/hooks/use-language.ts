// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { useEffect, useState } from 'react';
import i18n from '@/i18n';
import { usersApi } from '@/services/api/users';
import { readStoredSession } from '@/services/session-storage';

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

async function applyLanguage(language: AppLanguage) {
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }
}

export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>('fr');

  useEffect(() => {
    const storedLanguage = readLanguage();

    setLanguageState(storedLanguage);
    applyLanguage(storedLanguage).catch(() => undefined);
    readStoredSession()
      .then((storedSession) => {
        const profileLanguage = storedSession.user?.language;

        if (profileLanguage === 'fr' || profileLanguage === 'en') {
          writeLanguage(profileLanguage);
          setLanguageState(profileLanguage);
          applyLanguage(profileLanguage).catch(() => undefined);
        }
      })
      .catch(() => undefined);

    if (typeof window === 'undefined') {
      return undefined;
    }

    function syncLanguage() {
      const storedLanguage = readLanguage();

      setLanguageState(storedLanguage);
      applyLanguage(storedLanguage).catch(() => undefined);
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
    applyLanguage(nextLanguage).catch(() => undefined);
    usersApi.updateMe({ language: nextLanguage }).catch(() => undefined);
  }

  return { language, setLanguage };
}
