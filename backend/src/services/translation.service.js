// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const crypto = require('crypto');

const { query } = require('../data/db');

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function translateWithLibreTranslate({ text, targetLanguage }) {
  const baseUrl = process.env.LIBRETRANSLATE_URL;

  if (!baseUrl) {
    return null;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'auto',
      target: targetLanguage,
      format: 'text',
      api_key: process.env.LIBRETRANSLATE_API_KEY || undefined,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();

  return payload.translatedText || null;
}

async function translateText({ text, targetLanguage }) {
  const cleanText = String(text || '').trim();
  const safeTargetLanguage = targetLanguage === 'en' ? 'en' : 'fr';

  if (!cleanText) {
    return { text: cleanText, provider: 'none', cached: false };
  }

  const sourceHash = hashText(cleanText);
  const cached = await query(
    `SELECT translated_text, provider
     FROM translation_cache
     WHERE source_hash = $1 AND target_language = $2
     LIMIT 1`,
    [sourceHash, safeTargetLanguage],
  );

  if (cached.rowCount > 0) {
    return { text: cached.rows[0].translated_text, provider: cached.rows[0].provider, cached: true };
  }

  const translatedText =
    (await translateWithLibreTranslate({ text: cleanText, targetLanguage: safeTargetLanguage })) ||
    cleanText;
  const provider = translatedText === cleanText ? 'passthrough' : 'libretranslate';

  await query(
    `INSERT INTO translation_cache (
       source_hash,
       source_text,
       source_language,
       target_language,
       translated_text,
       provider
     )
     VALUES ($1, $2, NULL, $3, $4, $5)
     ON CONFLICT (source_hash, target_language) DO NOTHING`,
    [sourceHash, cleanText, safeTargetLanguage, translatedText, provider],
  );

  return { text: translatedText, provider, cached: false };
}

module.exports = {
  translationService: {
    translateText,
  },
};
