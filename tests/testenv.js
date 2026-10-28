/* istanbul ignore file */
import dotenv from 'dotenv';

// test env: NODE_ENV=test makes config.js read .test.env.
// No override, so explicit shell variables (e.g. PGPORT for a custom local DB) still win.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
dotenv.config({ path: '.test.env' });
