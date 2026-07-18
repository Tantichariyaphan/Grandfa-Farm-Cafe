// config/index.js
// Single source of truth for environment configuration.
// Fails fast at startup if required variables are missing.

require('dotenv').config();

const REQUIRED_VARS = [
  'DATABASE_URL',
  'LINE_LOGIN_CHANNEL_ID',
  'LINE_LOGIN_CHANNEL_SECRET',
  'LINE_CHANNEL_ID',
  'LINE_CHANNEL_SECRET',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'LIFF_ID_MEMBER',
  'LIFF_ID_STAFF',
  'JWT_SECRET',
  'QR_SIGNING_SECRET',
  'MAINTENANCE_TOKEN',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key] || process.env[key].trim() === '');

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('FATAL: Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error('Copy .env.example to .env and fill in all values before starting the server.');
    process.exit(1);
  }
}

// Database maintenance commands do not initialise LINE or serve HTTP,
// so they must validate only the database connection they actually use.
if (process.env.NODE_ENV !== 'test') {
  validateEnv(process.env.CONFIG_SCOPE === 'database' ? ['DATABASE_URL'] : REQUIRED_VARS);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 3000,
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true',
  },

  line: {
    login: {
      channelId: process.env.LINE_LOGIN_CHANNEL_ID,
      channelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET,
    },
    messaging: {
      channelId: process.env.LINE_CHANNEL_ID,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    },
  },

  liff: {
    memberId: process.env.LIFF_ID_MEMBER,
    staffId: process.env.LIFF_ID_STAFF,
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    staffJwtExpiresIn: process.env.STAFF_JWT_EXPIRES_IN || '12h',
    qrSigningSecret: process.env.QR_SIGNING_SECRET,
  },

  ownerInit: {
    username: process.env.OWNER_INIT_USERNAME || 'owner',
    password: process.env.OWNER_INIT_PASSWORD || null,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  maintenanceToken: process.env.MAINTENANCE_TOKEN,

  loyalty: {
    stampsRequiredForReward: 10,
    couponExpiryDays: 90,
  },
};
