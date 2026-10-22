const { MongoClient } = require('mongodb');
const config = require('./config');

let client = null;
let db = null;

async function connect() {
  if (db) return db;
  client = new MongoClient(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 20,
  });
  await client.connect();
  db = client.db(config.MONGODB_DB);
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(database) {
  // Users
  await database.collection('users').createIndex({ email: 1 }, { unique: true });

  // WhatsApp sessions — one document per linked number
  await database.collection('wa_sessions').createIndex({ userId: 1, createdAt: -1 });
  await database.collection('wa_sessions').createIndex({ userId: 1, number: 1 }, { unique: true });
  await database.collection('wa_sessions').createIndex({ status: 1 });

  // Baileys auth state (creds + signal keys) — Mongo backed so a redeploy
  // never loses a pairing and the app stays stateless on disk.
  await database.collection('wa_auth').createIndex({ sessionId: 1, type: 1, id: 1 });

  // Audit trail of connection events
  await database.collection('wa_events').createIndex({ sessionId: 1, at: -1 });
  await database.collection('wa_events').createIndex({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });
}

function getDb() {
  if (!db) throw new Error('Database not connected yet');
  return db;
}

async function close() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = { connect, getDb, close };
