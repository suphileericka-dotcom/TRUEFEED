// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const { createHttpError } = require('./httpError');

function getString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validate(schema, payload = {}) {
  const errors = {};
  const data = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const rawValue = payload[field];
    const value = rules.type === 'string' ? getString(rawValue) : rawValue;

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = 'required';
      return;
    }

    if (value === undefined || value === null || value === '') {
      return;
    }

    if (rules.type === 'string' && typeof value !== 'string') {
      errors[field] = 'must_be_string';
      return;
    }

    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `min_length_${rules.minLength}`;
      return;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `max_length_${rules.maxLength}`;
      return;
    }

    if (rules.email && !isEmail(value)) {
      errors[field] = 'invalid_email';
      return;
    }

    if (rules.url && !isUrl(value)) {
      errors[field] = 'invalid_url';
      return;
    }

    if (rules.enum && !rules.enum.includes(value)) {
      errors[field] = 'invalid_value';
      return;
    }

    data[field] = value;
  });

  if (Object.keys(errors).length > 0) {
    throw createHttpError(400, 'validation_error', 'Certains champs sont invalides.', errors);
  }

  return data;
}

module.exports = {
  validate,
};
