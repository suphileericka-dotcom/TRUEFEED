const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'false'
          ? false
          : {
              rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
            },
    })
  : null;

function getPool() {
  if (!pool) {
    throw new Error('DATABASE_URL is required for database access.');
  }

  return pool;
}

async function query(sql, params = []) {
  return getPool().query(sql, params);
}

module.exports = {
  getPool,
  query,
};
