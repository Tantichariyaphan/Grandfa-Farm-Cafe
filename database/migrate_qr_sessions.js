// database/migrate_qr_sessions.js
// Migration to add QR session and redemption tracking tables

const { query } = require('./db');

async function migrate() {
  console.log('Creating coupon_redemptions table...');
  await query(`
    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id BIGSERIAL PRIMARY KEY,
      coupon_id BIGINT NOT NULL UNIQUE REFERENCES coupons(id),
      staff_id BIGINT NOT NULL REFERENCES staff(id),
      redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      qr_session_id VARCHAR(128)
    )
  `);

  console.log('Creating coupon_qr_sessions table...');
  await query(`
    CREATE TABLE IF NOT EXISTS coupon_qr_sessions (
      id VARCHAR(128) PRIMARY KEY,
      coupon_id BIGINT NOT NULL REFERENCES coupons(id),
      member_id BIGINT NOT NULL REFERENCES members(id),
      qr_token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (used_at IS NULL OR expires_at > created_at)
    )
  `);

  console.log('Creating indexes...');
  await query(`
    CREATE INDEX IF NOT EXISTS idx_qr_sessions_coupon
    ON coupon_qr_sessions(coupon_id) WHERE used_at IS NULL
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_qr_sessions_member
    ON coupon_qr_sessions(member_id, created_at DESC)
  `);

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});