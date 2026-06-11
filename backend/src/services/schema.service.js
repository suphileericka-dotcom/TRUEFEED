// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
const { dataSchema } = require('../data/schema');

const schemaService = {
  getDataSchema() {
    return dataSchema;
  },
};

module.exports = {
  schemaService,
};
