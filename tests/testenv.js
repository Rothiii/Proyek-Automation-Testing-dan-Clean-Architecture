/* istanbul ignore file */
import dotenv from 'dotenv';

// test env: NODE_ENV=test makes config.js read .test.env.
// No override, so explicit shell variables (e.g. PGPORT for a custom local DB) still win.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
dotenv.config({ path: '.test.env' });

// Fallback values keep the suite runnable on a fresh clone and on CI, where
// .test.env is intentionally absent. Real values still win when present.
process.env.ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY || 'test-access-token-key';
process.env.REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY || 'test-refresh-token-key';
process.env.ACCCESS_TOKEN_AGE = process.env.ACCCESS_TOKEN_AGE || '3000';
