// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const express = require('express');

const { schemaService } = require('../../services/schema.service');

const schemaRouter = express.Router();

schemaRouter.get('/', (_req, res) => {
  res.json(schemaService.getDataSchema());
});

module.exports = {
  schemaRouter,
};
