// database/seed.js
// Creates the initial owner account (from .env) and default settings.
// Safe to run multiple times: uses ON CONFLICT DO NOTHING.

const bcrypt = require('bcryptjs');
process.env.CONFIG_SCOPE = 'database';
const { pool, query } = require('./db');
const config = require('../config');

async function seed() {
  try {
    if (!config.ownerInit.password) {
      console.warn('OWNER_INIT_PASSWORD not set in .env — skipping owner seed.');
    } else {
      const passwordHash = await bcrypt.hash(config.ownerInit.password, 12);
      const result = await query(
        `INSERT INTO staff (username, password_hash, display_name, role)
         VALUES ($1, $2, $3, 'owner')
         ON CONFLICT (username) DO NOTHING
         RETURNING id`,
        [config.ownerInit.username, passwordHash, 'Grandfa Cafe Owner']
      );
      if (result.rowCount > 0) {
        console.log(`Owner account created: ${config.ownerInit.username}`);
      } else {
        console.log(`Owner account "${config.ownerInit.username}" already exists — skipped.`);
      }
    }

    const defaultSettings = [
      ['store_name', { value: 'Grandfa Cafe' }],
      ['business_hours', { value: 'Mon-Sun 07:00 - 18:00' }],
      ['location', { value: 'Grandfa Cafe, Thailand' }],
      ['contact_phone', { value: '' }],
    ];

    for (const [key, value] of defaultSettings) {
      await query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }
    console.log('Default settings seeded.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
