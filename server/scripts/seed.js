/**
 * Seed a demo account so the dashboard can be explored immediately.
 *   node server/scripts/seed.js
 * Prints the credentials it created (or says they already exist).
 */
const db = require('../db');
const { register } = require('../auth');

const DEMO = {
  email: process.env.SEED_EMAIL || 'demo@wagateway.local',
  password: process.env.SEED_PASSWORD || 'demo12345',
  name: 'Demo User',
};

(async () => {
  try {
    await db.connect();
    const out = await register(DEMO);
    console.log('[seed] created demo user');
    console.log('  email   :', DEMO.email);
    console.log('  password:', DEMO.password);
    console.log('  userId  :', out.user.id);
  } catch (err) {
    if (err.status === 409) {
      console.log('[seed] demo user already exists:', DEMO.email);
    } else {
      console.error('[seed] failed:', err.message);
      process.exitCode = 1;
    }
  } finally {
    await db.close();
  }
})();
