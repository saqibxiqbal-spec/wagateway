/** Helper for registering many lightweight commands at once. */

function bulk(defMany, category, groups) {
  for (const g of groups) {
    if (!g || !g.names || !g.names.length) continue;
    const replies = g.replies && g.replies.length ? g.replies : ['\u2705'];
    defMany(g.names, {
      category,
      desc: g.desc || String(g.names[0]),
      usage: g.usage || '',
      hidden: g.hidden === true,
      run: async (ctx) => {
        const r = replies[Math.floor(Math.random() * replies.length)];
        return typeof r === 'function' ? r(ctx) : r;
      },
    });
  }
}

/** Register a plain list of names that all return the same text. */
function same(defMany, category, names, text, desc) {
  defMany(names, {
    category,
    desc: desc || String(names[0]),
    run: async () => text,
  });
}

module.exports = { bulk, same };
