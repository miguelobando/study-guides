import type { Question } from '../types';

const DONT_BLOCK = {
  label: 'Node.js Learn — Don’t Block the Event Loop (or the Worker Pool)',
  url: 'https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop',
};
const WORKER_THREADS = { label: 'Node.js docs — Worker threads', url: 'https://nodejs.org/api/worker_threads.html' };
const PERF_HOOKS = { label: 'Node.js docs — Performance measurement APIs (perf_hooks)', url: 'https://nodejs.org/api/perf_hooks.html' };
const HEAP_SNAPSHOT = {
  label: 'Node.js Learn — Using heap snapshots',
  url: 'https://nodejs.org/learn/diagnostics/memory/using-heap-snapshot',
};
const TRASH_TALK = { label: 'V8 blog — Trash talk: the Orinoco garbage collector', url: 'https://v8.dev/blog/trash-talk' };

export const performance: Question[] = [
  {
    id: 'perf-concurrency-model',
    category: 'performance',
    level: 'junior',
    type: 'concept',
    prompt:
      'Node runs your JavaScript on a single thread. How can one Node process serve thousands of concurrent connections, and what kind of workload is it a poor fit for?',
    keyPoints: [
      'JavaScript runs on one main thread driven by the event loop; I/O is non-blocking: network sockets are handled by the OS (epoll, kqueue, IOCP) through libuv, and the thread is free while waiting.',
      'Some operations without a non-blocking OS API (fs, dns.lookup, parts of crypto and zlib) run on libuv’s thread pool (4 threads by default, UV_THREADPOOL_SIZE).',
      'So Node excels at I/O-bound work: APIs that mostly wait on databases and other services, proxies/gateways, real-time apps with many idle connections.',
      'CPU-bound work (image/video processing, large JSON parsing, synchronous crypto, heavy computation, complex regexes) blocks the single thread, and every other request waits behind it.',
      'One process uses roughly one core for JavaScript; to use more cores run more processes (containers, cluster) and move CPU-heavy tasks to worker_threads or another service.',
    ],
    sources: [
      DONT_BLOCK,
      {
        label: 'Node.js Learn — The Node.js Event Loop',
        url: 'https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick',
      },
      { label: 'libuv — Design overview', url: 'https://docs.libuv.org/en/v1.x/design.html' },
    ],
  },
  {
    id: 'perf-promise-all',
    category: 'performance',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What does this print (times rounded to the nearest 100 ms)? What does it tell you about writing fast async code?',
    codeLang: 'js',
    code: `const sleep = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

async function sequential() {
  const a = await sleep(100, 'a');
  const b = await sleep(100, 'b');
  return a + b;
}

async function parallel() {
  const [a, b] = await Promise.all([sleep(100, 'a'), sleep(100, 'b')]);
  return a + b;
}

async function withForEach() {
  const out = [];
  ['a', 'b'].forEach(async (v) => out.push(await sleep(100, v)));
  return out.length;
}

async function time(label, fn) {
  const start = Date.now();
  const result = await fn();
  const ms = Math.round((Date.now() - start) / 100) * 100;
  console.log(label, result, ms);
}

(async () => {
  await time('sequential', sequential);
  await time('parallel', parallel);
  await time('forEach', withForEach);
})();`,
    keyPoints: [
      'Prints "sequential ab 200", then "parallel ab 100", then "forEach 0 0".',
      'Sequential awaits on independent operations add their latencies; starting both and awaiting Promise.all overlaps them, so total time is the slowest one.',
      'forEach ignores the promises returned by async callbacks: the function returns before anything finished (and rejections there would be unhandled). Use for...of for sequential, Promise.all(items.map(...)) for parallel.',
      'Promise.all rejects on the first failure (others keep running); Promise.allSettled when you need every result.',
      'Unbounded parallelism over large lists can overwhelm the DB pool or a downstream API: limit concurrency (p-limit, batches) instead of mapping 10,000 items at once.',
      'Only parallelize independent work; keep awaits sequential when a later call needs the earlier result or ordering matters.',
    ],
    followUps: ['What happens if you start two promises, then await them one after another, and the second rejects first?'],
    sources: [
      { label: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
      {
        label: 'Node.js Learn — Discover Promises in Node.js',
        url: 'https://nodejs.org/learn/asynchronous-work/discover-promises-in-nodejs',
      },
    ],
  },
  {
    id: 'perf-blocking-cpu',
    category: 'performance',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'During a login spike, p99 latency of every endpoint (even /health) jumps to several seconds and Kubernetes starts restarting pods because liveness probes time out. Traffic to other endpoints is normal. What is going on?',
    codeLang: 'js',
    code: `const crypto = require('node:crypto');

app.post('/login', async (req, res) => {
  const user = await users.findByEmail(req.body.email);
  const hash = crypto.pbkdf2Sync(req.body.password, user.salt, 600_000, 32, 'sha256');
  if (!crypto.timingSafeEqual(hash, user.passwordHash)) {
    return res.sendStatus(401);
  }
  res.json({ token: issueToken(user) });
});

app.get('/health', (req, res) => res.send('ok'));`,
    keyPoints: [
      'pbkdf2Sync with 600k iterations takes on the order of hundreds of milliseconds of CPU and runs on the main thread, blocking the event loop; every other request, including /health, queues behind it.',
      'Under concurrent logins the waits add up, so all endpoints see the latency, probes time out and pods get restarted, which makes the overload worse.',
      'Fix: use the async crypto.pbkdf2 (or crypto.scrypt), which runs on the libuv thread pool; consider raising UV_THREADPOOL_SIZE since the default 4 threads are shared with fs and dns.lookup.',
      'For heavier or custom CPU work use a worker_threads pool (e.g. piscina) or a separate service; also rate-limit login attempts.',
      'Other bugs: user may be null (TypeError → 500 and a user-enumeration signal); keep the work constant for unknown emails.',
      'Detect this class of problem with event-loop delay metrics (perf_hooks.monitorEventLoopDelay) and CPU profiles.',
    ],
    sources: [
      DONT_BLOCK,
      { label: 'Node.js docs — Crypto', url: 'https://nodejs.org/api/crypto.html' },
      { label: 'libuv — Thread pool work scheduling', url: 'https://docs.libuv.org/en/v1.x/threadpool.html' },
    ],
  },
  {
    id: 'perf-workers-vs-cluster',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt:
      'Compare worker_threads, child_process and cluster. Which would you use to resize uploaded images, and why do most teams not use cluster in Kubernetes?',
    keyPoints: [
      'worker_threads: threads in the same process, each with its own V8 isolate and event loop; communicate via postMessage (structured clone), transferable ArrayBuffers or SharedArrayBuffer + Atomics. Best for CPU-bound JavaScript tasks.',
      'Workers are not free to start (memory and startup time), so use a fixed-size pool (piscina or similar) sized around the available cores.',
      'child_process: separate OS processes (spawn/exec/fork); use to run other programs or isolate risky native code; higher memory and IPC cost.',
      'cluster: forks N copies of the server sharing a listening port; the primary distributes connections round-robin by default (except on Windows). It scales request handling across cores but does not speed up a single CPU-heavy task.',
      'Image resizing: libraries like sharp already do the work in native threads off the main thread; for pure-JS CPU work use a worker pool, or move it to a queue and separate workers if it is slow.',
      'In containers the usual pattern is one Node process per container and more replicas: the orchestrator handles restarts, scaling and load balancing, metrics stay per process, and it plays well with CPU limits. PM2 cluster mode is the equivalent on plain VMs.',
    ],
    sources: [
      WORKER_THREADS,
      { label: 'Node.js docs — Cluster', url: 'https://nodejs.org/api/cluster.html' },
      { label: 'Node.js docs — Child process', url: 'https://nodejs.org/api/child_process.html' },
      { label: 'piscina — worker thread pool', url: 'https://github.com/piscinajs/piscina' },
    ],
  },
  {
    id: 'perf-memory-leak',
    category: 'performance',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This service’s memory grows steadily until the container is OOM-killed, and logs show MaxListenersExceededWarning. Find the leaks and fix them.',
    codeLang: 'js',
    code: `const cache = new Map();

app.get('/products/:id', async (req, res) => {
  const key = req.originalUrl;
  if (!cache.has(key)) {
    cache.set(key, await db.getProduct(req.params.id));
  }

  priceFeed.on('update', (update) => {
    if (update.productId === req.params.id) {
      cache.get(key).price = update.price;
    }
  });

  res.json(cache.get(key));
});`,
    keyPoints: [
      'Unbounded cache: entries are never evicted, and the key is req.originalUrl, so every distinct query string (?utm=..., cache busters, attackers) creates a new entry.',
      'A new listener is added to the long-lived priceFeed emitter on every request and never removed; each closure retains req (and the key and cache entry), so memory grows per request. MaxListenersExceededWarning (default 10 per event) is the hint.',
      'Each price update also runs every accumulated listener, so CPU grows over time too.',
      'Fix the cache: key by product id and use a bounded LRU with TTL (lru-cache with max and ttl) or an external cache.',
      'Fix the listener: subscribe once at startup and update the cache by product id, or remove the listener (off/AbortSignal) when the request finishes.',
      'Other common leak sources: global arrays used as queues, timers/intervals never cleared, closures capturing large objects, per-request data stored on long-lived objects.',
    ],
    sources: [
      { label: 'Node.js docs — Events (emitter.setMaxListeners)', url: 'https://nodejs.org/api/events.html' },
      { label: 'Node.js Learn — Memory diagnostics', url: 'https://nodejs.org/learn/diagnostics/memory' },
      { label: 'lru-cache', url: 'https://github.com/isaacs/node-lru-cache' },
    ],
  },
  {
    id: 'perf-pooling',
    category: 'performance',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'Under load this endpoint becomes slow and Postgres starts rejecting connections with "too many clients". What is wrong and how would you fix it?',
    codeLang: 'js',
    code: `const { Client } = require('pg');

app.get('/orders/:id', async (req, res) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  await client.end();
  res.json(rows[0]);
});`,
    keyPoints: [
      'A new connection per request pays TCP + TLS + authentication handshakes every time, often more than the query itself.',
      'Each concurrent request holds its own connection, so traffic spikes exceed the database’s max_connections; Postgres connections are processes and expensive.',
      'If the query throws, client.end() never runs and the connection leaks; there is no try/finally.',
      'Fix: create one pg.Pool at startup and use pool.query() (or pool.connect() + client.release() in finally); set max, idleTimeoutMillis and connectionTimeoutMillis so requests fail fast instead of waiting forever.',
      'Size pools for the whole fleet: pool max × replicas must stay below the DB limit; use PgBouncer or RDS Proxy when replicas autoscale or in serverless.',
      'Same idea for outbound HTTP: reuse connections with keep-alive (Node’s global http agent has keepAlive on by default since Node 19, and fetch/undici pools connections); do not create a new agent per request.',
    ],
    sources: [
      { label: 'node-postgres — Pooling', url: 'https://node-postgres.com/features/pooling' },
      { label: 'node-postgres — pg.Pool API', url: 'https://node-postgres.com/apis/pool' },
      { label: 'Node.js docs — HTTP (Agent and keepAlive)', url: 'https://nodejs.org/api/http.html' },
    ],
  },
  {
    id: 'perf-caching',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt:
      'Our read-heavy product API hits the database on every request. Where would you add caching, and how do you choose between an in-process cache and Redis?',
    keyPoints: [
      'Cache at the cheapest layer that is correct: HTTP caching and a CDN (Cache-Control, ETag) for public data, then an application cache, then DB-side options (indexes, read replicas).',
      'In-process LRU (lru-cache with max and ttl): fastest (no network, no serialization) but per instance: N copies, inconsistent between replicas, lost on restart, and it adds heap and GC pressure.',
      'Redis/Memcached: shared across instances and deploys, but a network hop plus serialization per read, and another critical dependency that must be highly available (and must fail open).',
      'Two-tier caches combine both: a small short-TTL local cache in front of Redis.',
      'Invalidation: cache-aside with a TTL as a safety net; delete or update on write, publish invalidation events (Redis pub/sub) for local caches, or use versioned keys. Add jitter to TTLs.',
      'Watch for stampedes on hot keys, never cache per-user data under a shared key, and measure hit rate and latency before and after.',
    ],
    followUps: ['A hot key expires and the database falls over. What happened and how do you prevent it?'],
    sources: [
      { label: 'lru-cache', url: 'https://github.com/isaacs/node-lru-cache' },
      { label: 'Redis docs — Client-side caching', url: 'https://redis.io/docs/latest/develop/reference/client-side-caching/' },
      {
        label: 'Express — Production best practices: performance',
        url: 'https://expressjs.com/en/advanced/best-practice-performance/',
      },
    ],
  },
  {
    id: 'perf-payload',
    category: 'performance',
    level: 'mid',
    type: 'concept',
    prompt:
      'A list endpoint returns ~2 MB JSON responses and the service’s CPU is high while p99 latency is poor. Where does the time go, and what would you change? Should the Node app gzip responses?',
    keyPoints: [
      'JSON.stringify (and JSON.parse on the way in) is synchronous, proportional to payload size, and blocks the event loop; it also allocates a large string, adding GC pressure.',
      'First reduce the payload: pagination, field selection, no over-fetching from the DB.',
      'Schema-based serialization (fast-json-stringify, used by Fastify response schemas) is faster than generic JSON.stringify and only outputs declared fields, which also prevents leaking internal properties.',
      'For large exports, stream the response (NDJSON or chunked JSON from a DB cursor with stream.pipeline) instead of building it in memory.',
      'Compression trades CPU for bandwidth; doing gzip/brotli inside Node spends the service’s CPU. Prefer the reverse proxy or CDN (nginx, Envoy, CloudFront), which can also cache compressed output.',
      'Skip compression for tiny responses and already-compressed content; avoid high brotli levels for dynamic responses; be aware of BREACH when compressing secrets alongside attacker-controlled input.',
    ],
    sources: [
      {
        label: 'Fastify — Validation and Serialization',
        url: 'https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/',
      },
      { label: 'fast-json-stringify', url: 'https://github.com/fastify/fast-json-stringify' },
      DONT_BLOCK,
      { label: 'nginx — ngx_http_gzip_module', url: 'https://nginx.org/en/docs/http/ngx_http_gzip_module.html' },
    ],
  },
  {
    id: 'perf-profiling',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt:
      'After a deploy, CPU is pegged and p99 latency has doubled while traffic is flat. Walk me through how you would find the cause.',
    keyPoints: [
      'Mitigate first if users are hurting (roll back), then investigate. Diff the deploy: code, dependencies, Node version, config, data volume.',
      'Confirm the shape with metrics: CPU per instance, event-loop delay and utilization, GC time, heap, downstream latency. High CPU + high loop delay with flat downstream latency points at JavaScript on the main thread.',
      'Reproduce in staging with a load test, then CPU-profile: node --cpu-prof writes a .cpuprofile you open in Chrome DevTools; or attach DevTools via --inspect and record; --prof + node --prof-process for V8’s tick profiler.',
      'Read flame graphs (0x, clinic flame, Linux perf with --perf-basic-prof): wide plateaus are where CPU time goes. clinic doctor helps triage between CPU, event-loop, I/O and GC problems.',
      'Typical culprits: serializing big objects, catastrophic regex backtracking, synchronous crypto/zlib/fs, verbose logging, N² loops over growing data, a dependency upgrade.',
      'Fix, then verify with the same benchmark and production metrics; keep an alert on event-loop delay.',
    ],
    sources: [
      { label: 'Node.js Learn — Profiling Node.js applications', url: 'https://nodejs.org/learn/getting-started/profiling' },
      { label: 'Node.js Learn — Flame graphs', url: 'https://nodejs.org/learn/diagnostics/flame-graphs' },
      { label: 'Clinic.js', url: 'https://clinicjs.org/' },
      { label: '0x — flame graph profiling', url: 'https://github.com/davidmarkclements/0x' },
    ],
  },
  {
    id: 'perf-heap-leak-hunt',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt:
      'Heap usage grows by ~50 MB per hour until pods are OOM-killed, then the cycle repeats. Nobody knows why. How do you find the leak?',
    keyPoints: [
      'Confirm it is a leak: heapUsed after GC keeps rising (a staircase), not a sawtooth that returns to a baseline or a cache warming up to its cap.',
      'process.memoryUsage() tells you where: heapUsed/heapTotal (JS objects) vs external/arrayBuffers (Buffers, native) vs rss (everything, including native leaks and fragmentation).',
      'Heap snapshot comparison: take a snapshot, apply load, take another, repeat; in Chrome DevTools compare snapshots, sort by retained size and follow the retainers path to the code holding references.',
      'Getting snapshots: --inspect + DevTools Memory tab, v8.writeHeapSnapshot(), --heapsnapshot-signal, or --heapsnapshot-near-heap-limit to capture automatically before an OOM. Snapshots block the process and need about twice the heap size in memory, so take them on an instance out of rotation.',
      'Allocation sampling (--heap-prof or DevTools allocation sampling) shows which code allocates what survives.',
      'Size the heap to the container: --max-old-space-size (or --max-old-space-size-percentage) below the memory limit leaving headroom for Buffers and native memory; periodic restarts only hide the leak.',
    ],
    sources: [
      HEAP_SNAPSHOT,
      {
        label: 'Node.js Learn — Understanding and tuning memory',
        url: 'https://nodejs.org/learn/diagnostics/memory/understanding-and-tuning-memory',
      },
      { label: 'Chrome DevTools — Record heap snapshots', url: 'https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots' },
      { label: 'Node.js docs — v8 module', url: 'https://nodejs.org/api/v8.html' },
    ],
  },
  {
    id: 'perf-gc',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt:
      'Explain at a high level how V8’s garbage collector works and how GC shows up in the latency and memory profile of a Node service.',
    keyPoints: [
      'Generational hypothesis: most objects die young. The heap is split into a small young generation and a large old generation.',
      'Young generation: frequent, cheap scavenges (parallel copying between semi-spaces); objects that survive a couple of scavenges are promoted to the old generation.',
      'Old generation: mark-sweep-compact (major GC). V8’s Orinoco GC does much of the marking incrementally and concurrently, and sweeping concurrently, but some phases still pause the main thread.',
      'High allocation rates mean frequent scavenges; medium-lived objects (buffered request bodies, large caches) get promoted and make major GCs more expensive.',
      'Near the heap limit, V8 runs GC repeatedly while reclaiming little: CPU spikes, latency spikes, then "heap out of memory".',
      'Observe with --trace-gc, PerformanceObserver "gc" entries or prom-client GC metrics; reduce allocations, stream instead of buffering, and tune --max-old-space-size / --max-semi-space-size only after measuring.',
    ],
    sources: [
      TRASH_TALK,
      { label: 'Node.js Learn — Tracing garbage collection', url: 'https://nodejs.org/learn/diagnostics/memory/using-gc-traces' },
      { label: 'Node.js docs — Command-line options', url: 'https://nodejs.org/api/cli.html' },
    ],
  },
  {
    id: 'perf-cache-stampede',
    category: 'performance',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Every minute, when this hot key expires, hundreds of concurrent requests miss the cache at the same moment and the database CPU spikes to 100%. Change getProduct so this cannot happen.',
    codeLang: 'js',
    code: `// redis is an ioredis client; db.loadProduct takes ~300 ms
async function getProduct(id) {
  const key = \`product:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const product = await db.loadProduct(id);
  await redis.set(key, JSON.stringify(product), 'EX', 60);
  return product;
}`,
    keyPoints: [
      'Diagnosis: cache stampede (thundering herd / dog-pile): all concurrent misses recompute the same value at once.',
      'Per instance: coalesce requests with a Map<key, Promise>. If a load for the key is in flight return that promise; otherwise start it, store it, and delete it in finally so a rejection is not cached forever.',
      'Across instances: a short-lived lock with SET lock:key token NX PX 5000; the winner recomputes, others wait briefly and re-read or serve the stale value; release the lock only if the token matches.',
      'Avoid synchronized expiry: stale-while-revalidate (store a soft expiry inside the value, serve stale while one request refreshes), probabilistic early refresh, and TTL jitter.',
      'Also cache misses for absent ids (negative caching) and make the cache fail open with timeouts if Redis is slow.',
      'Measure: DB QPS per key, cache hit rate and p99 before/after.',
    ],
    followUps: ['How would you warm the cache after a deploy or a Redis failover?'],
    sources: [
      { label: 'Wikipedia — Cache stampede', url: 'https://en.wikipedia.org/wiki/Cache_stampede' },
      { label: 'Redis docs — SET (NX, PX options)', url: 'https://redis.io/docs/latest/commands/set/' },
    ],
  },
  {
    id: 'perf-scaling',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt:
      'We need to handle 10x the traffic next quarter. How do you scale a Node API horizontally, and what has to be true about the code for that to work?',
    keyPoints: [
      'Processes must be stateless and disposable (12-factor): no sessions, uploads, rate-limit counters, WebSocket room membership or job state held only in memory or on local disk. Move them to Redis, the DB or object storage.',
      'Sticky sessions are a workaround with costs (uneven load, lost state on restart); avoid relying on them.',
      'Run one process per container with a CPU request around one core, and autoscale replicas (Kubernetes HPA) on CPU or better-suited custom metrics such as RPS, event-loop delay or queue depth.',
      'The bottleneck moves downstream: DB connections multiply with replicas (pool × replicas), so add poolers, caching, read replicas, and backpressure or rate limits.',
      'Singleton work (cron jobs, migrations, queue consumers) must not run in every replica: separate deployments, leader election or a job scheduler.',
      'Load test to find per-instance capacity and the knee of the latency curve, then plan headroom and cost.',
    ],
    sources: [
      { label: 'The Twelve-Factor App — Processes', url: 'https://12factor.net/processes' },
      {
        label: 'Kubernetes — Horizontal Pod Autoscaling',
        url: 'https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/',
      },
      { label: 'The Twelve-Factor App — Disposability', url: 'https://12factor.net/disposability' },
    ],
  },
  {
    id: 'perf-load-testing',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt:
      'How do you load test a Node API before a launch, and how do you read the results? What do p50, p95 and p99 tell you that the average does not?',
    keyPoints: [
      'Tools: autocannon for quick HTTP benchmarks from Node, k6 for scripted scenarios, ramping stages and pass/fail thresholds in CI (e.g. http_req_duration p(95)<300).',
      'Test a production-like environment (same instance sizes, data volume, dependencies), warm up first (JIT, caches, pools), and run long enough to see GC and leaks.',
      'Closed-model tools with a fixed number of connections slow down when the server slows (coordinated omission) and hide tail latency; use an open model / arrival-rate executor to model real traffic.',
      'p50 is the typical request, p95/p99 the tail. Averages hide the slow requests that real users hit, especially when one page fans out to many calls. Do not average percentiles across instances; aggregate histograms.',
      'Watch the server during the test: CPU, event-loop delay (monitorEventLoopDelay), event-loop utilization, GC, heap, DB pool wait time, error rate.',
      'Find the knee where latency climbs sharply: that is the per-instance capacity; plan replicas and headroom from it.',
    ],
    sources: [
      { label: 'autocannon', url: 'https://github.com/mcollina/autocannon' },
      { label: 'Grafana k6 — Thresholds', url: 'https://grafana.com/docs/k6/latest/using-k6/thresholds/' },
      {
        label: 'Grafana k6 — Open and closed models',
        url: 'https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/',
      },
      PERF_HOOKS,
    ],
  },
  {
    id: 'perf-v8-shapes',
    category: 'performance',
    level: 'senior',
    type: 'concept',
    prompt:
      'A function on the hot path runs millions of times per second. Which V8-level details might matter, and how do you decide whether micro-optimizing is worth it?',
    keyPoints: [
      'V8 gives objects hidden classes (shapes/maps); objects created with the same properties in the same order share one, which makes property access fast via inline caches.',
      'Call sites that see one shape are monomorphic (fastest), a few shapes polymorphic, many shapes megamorphic (slow generic lookup). Initialize all fields in the constructor, in the same order, with consistent types.',
      'delete obj.prop can push an object into slow dictionary mode; set the property to undefined, or use a Map for dynamic key sets.',
      'Keep arrays dense and homogeneous (no holes, do not mix small integers, doubles and objects) to keep fast elements kinds.',
      'Measure first: most Node latency is I/O, algorithms and allocations. Profile with --cpu-prof, benchmark the change in isolation, and only then reshape code; V8 internals change between versions.',
    ],
    sources: [
      { label: 'V8 blog — Fast properties in V8', url: 'https://v8.dev/blog/fast-properties' },
      { label: 'V8 docs — Maps (hidden classes)', url: 'https://v8.dev/docs/hidden-classes' },
      { label: 'V8 blog — Elements kinds in V8', url: 'https://v8.dev/blog/elements-kinds' },
    ],
  },
];
