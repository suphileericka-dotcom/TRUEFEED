// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
import { useEffect, useState } from 'react';

import { useLanguage } from '@/hooks/use-language';
import { translationApi } from '@/services/api/translation';

const memoryCache = new Map<string, string>();

export function useTranslatedText(text: string) {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    let cancelled = false;
    const cleanText = String(text || '');
    const cacheKey = `${language}:${cleanText}`;

    if (!cleanText) {
      setTranslatedText(cleanText);
      return undefined;
    }

    if (language === 'fr') {
      setTranslatedText(cleanText);
      return undefined;
    }

    const cached = memoryCache.get(cacheKey);

    if (cached) {
      setTranslatedText(cached);
      return undefined;
    }

    translationApi
      .translate({ text: cleanText, targetLanguage: language })
      .then((response) => {
        if (cancelled) {
          return;
        }

        memoryCache.set(cacheKey, response.text);
        setTranslatedText(response.text);
      })
      .catch(() => {
        if (!cancelled) {
          setTranslatedText(cleanText);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language, text]);

  return translatedText;
}
