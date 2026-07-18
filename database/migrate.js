// database/migrate.js
// Applies schema.sql to the configured database. Safe to run multiple
// times since the schema uses IF NOT EXISTS / idempotent statements.

const fs = require('fs');
const path = require('path');
process.env.CONFIG_SCOPE = 'database';
const { pool } = require('./db');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Applying database schema...');
  try {
    await pool.query(schemaSql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
