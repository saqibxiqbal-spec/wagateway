/**
 * Plugin loader. Each file exports `(def, defMany) => {}` and registers its
 * commands into the shared registry. A failing plugin never takes the bot
 * down \u2014 it is logged and skipped.
 */

const registry = require('../registry');

const FILES = [
  'main',
  'general',
  'tools',
  'owner',
  'text',
  'textmaker',
  'media',
  'download',
  'search',
  'group',
  'admin',
  'fun',
  'game',
  'islamic',
  'ai',
  'converter',
  'crypto',
  'math',
  'time',
  'random',
  'emoji',
  'info',
  'stalk',
  'economy',
  'anime',
  'system',
  'nsfw',
];

let loaded = false;

function load() {
  if (loaded) return registry;
  loaded = true;
  for (const f of FILES) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const plugin = require('./' + f);
      if (typeof plugin === 'function') plugin(registry.def, registry.defMany);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[plugins] ${f} failed to load: ${err.message}`);
    }
  }
  return registry;
}

module.exports = load();
