/**
 * MongoDB-backed Baileys auth state.
 *
 * The default `useMultiFileAuthState` writes creds to disk, which breaks on
 * every ephemeral host (Railway, Render, Fly) and cannot be shared between
 * instances. Storing creds + signal keys in Mongo makes the app stateless:
 * a redeploy, a crash or a second replica all resume the same pairing.
 */
const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');
const { getDb } = require('../db');

const COLL = 'wa_auth';
const key = (sessionId, type, id) => `${sessionId}:${type}:${id}`;

// Baileys values contain Buffers — BufferJSON keeps them round-trippable.
const enc = (v) => JSON.parse(JSON.stringify(v, BufferJSON.replacer));
const dec = (v) => JSON.parse(JSON.stringify(v), BufferJSON.reviver);

async function useMongoAuthState(sessionId) {
  const col = getDb().collection(COLL);

  const readCreds = async () => {
    const doc = await col.findOne({ _id: key(sessionId, 'creds', 'creds') });
    return doc ? dec(doc.value) : null;
  };

  const writeCreds = async (creds) => {
    await col.updateOne(
      { _id: key(sessionId, 'creds', 'creds') },
      { $set: { sessionId, type: 'creds', id: 'creds', value: enc(creds), updatedAt: new Date() } },
      { upsert: true }
    );
  };

  let creds = await readCreds();
  if (!creds) {
    creds = initAuthCreds();
    await writeCreds(creds);
  }

  const state = {
    creds,
    keys: {
      get: async (type, ids) => {
        const docs = await col
          .find({ sessionId, type, id: { $in: ids } })
          .project({ id: 1, value: 1 })
          .toArray();
        const found = new Map(docs.map((d) => [d.id, dec(d.value)]));
        const out = {};
        for (const id of ids) out[id] = found.get(id); // undefined when missing
        return out;
      },

      set: async (data) => {
        // Baileys passes { [type]: { [id]: value } }
        const ops = [];
        for (const [type, items] of Object.entries(data || {})) {
          for (const [id, value] of Object.entries(items || {})) {
            if (value === null || value === undefined) {
              ops.push({ deleteOne: { filter: { _id: key(sessionId, type, id) } } });
            } else {
              ops.push({
                updateOne: {
                  filter: { _id: key(sessionId, type, id) },
                  update: {
                    $set: { sessionId, type, id, value: enc(value), updatedAt: new Date() },
                  },
                  upsert: true,
                },
              });
            }
          }
        }
        if (ops.length) await col.bulkWrite(ops, { ordered: false });
      },
    },
  };

  const saveCreds = async () => {
    await writeCreds(state.creds);
  };

  return { state, saveCreds };
}

async function clearAuth(sessionId) {
  await getDb().collection(COLL).deleteMany({ sessionId });
}

module.exports = { useMongoAuthState, clearAuth };
