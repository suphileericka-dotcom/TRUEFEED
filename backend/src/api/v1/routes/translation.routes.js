// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { translationService } = require('../../../services/translation.service');
const { validate } = require('../../../utils/validation');

const translationV1Router = express.Router();

const translateSchema = {
  text: { type: 'string', required: true, minLength: 1, maxLength: 5000 },
  targetLanguage: { type: 'string', required: true, enum: ['fr', 'en'] },
};

translationV1Router.post('/', async (req, res, next) => {
  try {
    const payload = validate(translateSchema, req.body);
    const result = await translationService.translateText(payload);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  translationV1Router,
};
