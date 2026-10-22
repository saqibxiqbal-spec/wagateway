/**
 * Central configuration. Every value can be overridden with an env var so the
 * same build runs locally, in Docker and on Railway without code changes.
 */
require('dotenv').config();

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

const config = {
  PORT: num(process.env.PORT, 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Mongo — same cluster the bot already uses, different database.
  MONGODB_URI:
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/?retryWrites=true&w=majority',
  MONGODB_DB: process.env.MONGODB_DB || 'wagateway',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production-please',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',

  // Product limits
  MAX_SESSIONS_PER_USER: num(process.env.MAX_SESSIONS_PER_USER, 10),
  MAX_SESSIONS_TOTAL: num(process.env.MAX_SESSIONS_TOTAL, 500),

  // Pairing
  DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE || '92',
  PAIR_CODE_TTL_MS: num(process.env.PAIR_CODE_TTL_MS, 110000),

  // Outbound network guard
  FETCH_TIMEOUT_MS: num(process.env.FETCH_TIMEOUT_MS, 120000),

  // CORS / frontend
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  SERVE_WEB: String(process.env.SERVE_WEB || 'true') === 'true',
};

if (config.NODE_ENV === 'production' && config.JWT_SECRET.includes('change-me')) {
  console.warn('[config] WARNING: JWT_SECRET is still the default value. Set it before going live.');
}

module.exports = config;
