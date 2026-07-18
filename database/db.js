// database/db.js
// Single shared PostgreSQL connection pool for the whole application.

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Run a single query against the pool.
 * @param {string} text - SQL text with $1, $2... placeholders
 * @param {Array} params
 */
async function query(text, params = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  if (!config.isProduction) {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log('executed query', { text, duration, rows: result.rowCount });
  }
  return result;
}

/**
 * Run a callback inside a single transaction using a dedicated client.
 * Automatically commits on success and rolls back on error.
 * Use this for any operation that must be atomic (e.g. adding a stamp
 * and conditionally generating a reward coupon).
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
};