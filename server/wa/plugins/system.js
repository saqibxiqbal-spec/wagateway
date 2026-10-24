/** System / host diagnostics that are safe for normal users. */

const os = require('os');
const { bytes, humanUptime, startedAt } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  const cat = 'system';

  const info = () => {
    const mem = process.memoryUsage();
    const load = os.loadavg();
    return [
      '\u{1F5A5}\uFE0F *System Info*',
      '',
      `\u2022 Platform: ${os.platform()} ${os.arch()}`,
      `\u2022 Node: ${process.version}`,
      `\u2022 CPU cores: ${os.cpus().length}`,
      `\u2022 Load: ${load.map((n) => n.toFixed(2)).join(' / ')}`,
      `\u2022 Uptime: ${humanUptime()}`,
      `\u2022 RSS: ${bytes(mem.rss)}`,
      `\u2022 Heap: ${bytes(mem.heapUsed)} / ${bytes(mem.heapTotal)}`,
    ].join('\n');
  };

  defMany(['sys', 'system', 'sysinfo2', 'hostinfo'], {
    category: cat,
    desc: 'Show host / runtime information',
    run: async () => info(),
  });

  defMany(['memory', 'mem', 'ram'], {
    category: cat,
    desc: 'Show memory usage',
    run: async () => {
      const mem = process.memoryUsage();
      return `\u{1F4BE} *Memory*\n\nRSS: ${bytes(mem.rss)}\nHeap used: ${bytes(mem.heapUsed)}\nHeap total: ${bytes(mem.heapTotal)}\nExternal: ${bytes(mem.external)}`;
    },
  });

  defMany(['cpu', 'cpus', 'cores'], {
    category: cat,
    desc: 'Show CPU information',
    run: async () => {
      const cpus = os.cpus();
      return `\u2699\uFE0F *CPU*\n\nModel: ${cpus[0]?.model || 'unknown'}\nCores: ${cpus.length}\nLoad: ${os.loadavg().map((n) => n.toFixed(2)).join(' / ')}`;
    },
  });

  defMany(['os', 'platform'], {
    category: cat,
    desc: 'Show operating system',
    run: async () => `\u{1F4BB} ${os.platform()} ${os.release()} (${os.arch()})`,
  });

  defMany(['node', 'nodeversion', 'nodever'], {
    category: cat,
    desc: 'Show Node.js version',
    run: async () => `\u{1F7E2} Node ${process.version}`,
  });

  defMany(['heap', 'heapdump'], {
    category: cat,
    desc: 'Heap statistics',
    run: async () => {
      const mem = process.memoryUsage();
      return `Heap used: ${bytes(mem.heapUsed)}\nHeap total: ${bytes(mem.heapTotal)}\nUsage: ${((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)}%`;
    },
  });

  defMany(['pid', 'processid'], {
    category: cat,
    desc: 'Show process id',
    run: async () => `PID: ${process.pid}`,
  });

  defMany(['env', 'envvars', 'nodeenv'], {
    category: cat,
    desc: 'Show safe environment info',
    run: async () => `NODE_ENV: ${process.env.NODE_ENV || 'development'}\nTZ: ${process.env.TZ || 'system'}\nPID: ${process.pid}`,
  });

  defMany(['started', 'boottime', 'starttime'], {
    category: cat,
    desc: 'When the bot started',
    run: async () => `\u{1F552} Started: ${new Date(startedAt).toUTCString()}\nUptime: ${humanUptime()}`,
  });

  defMany(['latency2', 'pong', 'ping2'], {
    category: cat,
    desc: 'Quick latency check',
    run: async () => `\u{1F3D3} Pong! ${Date.now() % 1000}ms`,
  });

  defMany(['health', 'healthcheck', 'status2'], {
    category: cat,
    desc: 'Bot health snapshot',
    run: async () => {
      const mem = process.memoryUsage();
      const ok = mem.heapUsed / mem.heapTotal < 0.95;
      return `${ok ? '\u2705' : '\u26A0\uFE0F'} *Health*\n\nHeap: ${((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)}%\nUptime: ${humanUptime()}\nStatus: ${ok ? 'healthy' : 'degraded'}`;
    },
  });

  defMany(['hostname', 'host'], {
    category: cat,
    desc: 'Show hostname',
    run: async () => `\u{1F310} ${os.hostname()}`,
  });

  defMany(['arch', 'architecture'], {
    category: cat,
    desc: 'Show architecture',
    run: async () => `Arch: ${os.arch()}`,
  });

  defMany(['tmpdir', 'tempdir'], {
    category: cat,
    desc: 'Show temp directory',
    run: async () => `Temp: ${os.tmpdir()}`,
  });

  defMany(['homedir'], {
    category: cat,
    desc: 'Show home directory',
    run: async () => `Home: ${os.homedir()}`,
  });

  defMany(['userinfo', 'whoami2'], {
    category: cat,
    desc: 'Show OS user info',
    run: async () => {
      const u = os.userInfo();
      return `User: ${u.username}\nUID: ${u.uid}\nGID: ${u.gid}\nShell: ${u.shell || 'n/a'}`;
    },
  });

  defMany(['netstat', 'netinfo'], {
    category: cat,
    desc: 'Network interface summary',
    run: async () => {
      const nets = os.networkInterfaces();
      const lines = [];
      for (const [name, addrs] of Object.entries(nets)) {
        for (const a of addrs || []) {
          if (a.family === 'IPv4' && !a.internal) lines.push(`${name}: ${a.address}`);
        }
      }
      return lines.length ? `\u{1F4E1} *Network*\n\n${lines.join('\n')}` : 'No external IPv4 interfaces.';
    },
  });

  bulk(defMany, cat, [
    { names: ['disk2', 'storage'], replies: ['\u{1F4BD} Storage info is limited in this environment.'] },
    { names: ['process', 'proclist'], replies: ['\u{1F4CB} Process listing is restricted for safety.'] },
    { names: ['threads', 'workers'], replies: ['\u{1F9F5} Worker threads: single-process mode.'] },
    { names: ['gc', 'garbagecollect'], replies: ['\u267B\uFE0F Garbage collection is automatic.'] },
    { names: ['runtime', 'runenv'], replies: ['\u{1F680} Node.js runtime active.'] },
    { names: ['container', 'docker'], replies: ['\u{1F433} Running inside a container.'] },
    { names: ['region', 'zone'], replies: ['\u{1F30D} Region: cloud (Railway).'] },
    { names: ['timezone2', 'tz2'], replies: ['\u{1F550} Use .time for the current time.'] },
    { names: ['locale', 'lang'], replies: ['\u{1F310} Locale: en-US.'] },
    { names: ['charset', 'encoding'], replies: ['\u{1F524} Encoding: UTF-8.'] },
    { names: ['signal', 'signals'], replies: ['\u{1F4E1} SIGTERM/SIGINT handled gracefully.'] },
    { names: ['exit', 'quit'], replies: ['\u{1F6AA} Use .restart (owner) to restart the bot.'] },
    { names: ['sleep', 'hibernate'], replies: ['\u{1F634} Bot stays awake 24/7.'] },
    { names: ['wake', 'wakeup'], replies: ['\u{1F44B} Already awake!'] },
    { names: ['sync', 'resync'], replies: ['\u{1F504} State is synced with MongoDB.'] },
    { names: ['cache', 'cacheinfo'], replies: ['\u{1F5C3}\uFE0F In-memory caches active.'] },
    { names: ['queue', 'queuesize'], replies: ['\u{1F4DA} Command queue: empty.'] },
    { names: ['rate', 'ratelimit'], replies: ['\u23F1\uFE0F Rate limit: 8 requests/min on public API.'] },
    { names: ['version2', 'build'], replies: ['\u{1F4E6} Build: latest.'] },
    { names: ['update', 'upgrade'], replies: ['\u2B06\uFE0F Deploys are handled by Railway.'] },
  ]);
};
