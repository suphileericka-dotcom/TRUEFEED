const { dataSchema } = require('../data/schema');

const schemaService = {
  getDataSchema() {
    return dataSchema;
  },
};

module.exports = {
  schemaService,
};
