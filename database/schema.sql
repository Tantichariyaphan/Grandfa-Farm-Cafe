CREATE TABLE IF NOT EXISTS staff (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  member_uid VARCHAR(32) NOT NULL UNIQUE,
  line_user_id VARCHAR(64) UNIQUE,
  display_name VARCHAR(160) NOT NULL,
  picture_url TEXT,
  phone VARCHAR(30),
  birthday DATE,
  current_stamps INTEGER NOT NULL DEFAULT 0 CHECK (current_stamps >= 0),
  total_stamps_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_stamps_earned >= 0),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  line_followed_at TIMESTAMPTZ,
  line_unfollowed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_members_line_user ON members(line_user_id);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id),
  staff_id BIGINT NOT NULL REFERENCES staff(id),
  drink_quantity INTEGER NOT NULL CHECK (drink_quantity > 0),
  stamps_earned INTEGER NOT NULL CHECK (stamps_earned > 0),
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_member_created ON transactions(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS stamps (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id),
  transaction_id BIGINT NOT NULL UNIQUE REFERENCES transactions(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stamps_member_created ON stamps(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS promotions (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  image TEXT,
  coupon_type VARCHAR(30) NOT NULL CHECK (coupon_type IN ('reward', 'birthday', 'holiday', 'promotion', 'welcome')),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (valid_to > valid_from)
);

-- Coupon templates: reusable coupon definitions that members may claim later.
CREATE TABLE IF NOT EXISTS coupon_templates (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  image TEXT,
  coupon_type VARCHAR(30) NOT NULL CHECK (coupon_type IN ('reward', 'birthday', 'holiday', 'promotion', 'welcome', 'manual')),
  coupon_value NUMERIC DEFAULT NULL,
  point_cost INTEGER DEFAULT NULL,
  claim_start_at TIMESTAMPTZ,
  claim_end_at TIMESTAMPTZ,
  coupon_expire_days INTEGER DEFAULT NULL,
  coupon_expire_at TIMESTAMPTZ DEFAULT NULL,
  quantity_limit BIGINT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  member_id BIGINT NOT NULL REFERENCES members(id),
  promotion_id BIGINT REFERENCES promotions(id),
  type VARCHAR(30) NOT NULL CHECK (type IN ('reward', 'birthday', 'holiday', 'promotion', 'welcome', 'manual')),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  used_by BIGINT REFERENCES staff(id),
  redemption_reference VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((status <> 'used') OR used_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_coupons_member_status ON coupons(member_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON coupons(status, expires_at) WHERE status = 'unused';
CREATE UNIQUE INDEX IF NOT EXISTS idx_birthday_coupon_per_day ON coupons(member_id, type, ((issued_at AT TIME ZONE 'UTC')::date)) WHERE type = 'birthday';

CREATE TABLE IF NOT EXISTS reward_history (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id),
  coupon_id BIGINT NOT NULL UNIQUE REFERENCES coupons(id),
  stamps_used INTEGER NOT NULL CHECK (stamps_used > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reward_history_member_created ON reward_history(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT REFERENCES members(id),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('line_push', 'line_broadcast')),
  type VARCHAR(40) NOT NULL,
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword VARCHAR(200) NOT NULL UNIQUE,
  response_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT NOT NULL UNIQUE REFERENCES coupons(id),
  staff_id BIGINT NOT NULL REFERENCES staff(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_session_id VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS coupon_qr_sessions (
  id VARCHAR(128) PRIMARY KEY,
  coupon_id BIGINT NOT NULL REFERENCES coupons(id),
  member_id BIGINT NOT NULL REFERENCES members(id),
  qr_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (used_at IS NULL OR expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_coupon ON coupon_qr_sessions(coupon_id) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qr_sessions_member ON coupon_qr_sessions(member_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS staff_updated_at ON staff;
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS members_updated_at ON members;
CREATE TRIGGER members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS promotions_updated_at ON promotions;
CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
