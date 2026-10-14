import type { Question } from '../types';

const EVENT_LOOP_GUIDE = {
  label: 'Node.js — The Node.js Event Loop',
  url: 'https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick',
};
const DONT_BLOCK = {
  label: 'Node.js — Don’t Block the Event Loop (or the Worker Pool)',
  url: 'https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop',
};
const NEXTTICK_VS_MICROTASK = {
  label: 'Node.js docs — When to use queueMicrotask() vs. process.nextTick()',
  url: 'https://nodejs.org/api/process.html#when-to-use-queuemicrotask-vs-processnexttick',
};
const LIBUV_DESIGN = { label: 'libuv — Design overview', url: 'https://docs.libuv.org/en/v1.x/design.html' };

export const eventLoop: Question[] = [
  {
    id: 'el-what-is-event-loop',
    category: 'event-loop',
    level: 'junior',
    type: 'concept',
    prompt:
      'In your API, one route awaits a 2-second database query and another runs a 2-second synchronous `for` loop. Under load, one of them slows down every other request and the other does not. Which one, and why? Explain using the event loop.',
    keyPoints: [
      'JavaScript runs on one main thread. The event loop takes the next ready callback (timer, I/O completion, immediate) and runs it to completion; nothing else runs until the call stack is empty again.',
      'Awaiting the query is non-blocking: the query goes out over a socket, the async function suspends, and the thread serves other requests until the response arrives and the continuation is queued.',
      'The synchronous loop never yields: for 2 seconds no other request, timer or I/O callback can run, so latency grows for every client (head-of-line blocking), including health checks.',
      'Wrapping CPU work in an async function or a Promise does not make it non-blocking; it still runs on the main thread.',
      'Rule: keep every callback short. Move CPU-heavy work to worker_threads, a job queue or another service.',
    ],
    sources: [
      EVENT_LOOP_GUIDE,
      {
        label: 'Node.js — Overview of Blocking vs Non-Blocking',
        url: 'https://nodejs.org/learn/asynchronous-work/overview-of-blocking-vs-non-blocking',
      },
      DONT_BLOCK,
    ],
  },
  {
    id: 'el-basic-order',
    category: 'event-loop',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'In what order are the letters logged? Explain each step.',
    codeLang: 'js',
    code: `console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

(async () => {
  console.log('D');
  await null;
  console.log('E');
})();

console.log('F');`,
    keyPoints: [
      'Output: A, D, F, C, E, B.',
      'Synchronous code runs first: A, then D (an async function runs synchronously until its first await), then F.',
      'When the stack is empty, the microtask queue is drained in FIFO order: the .then callback (C), then the continuation after await (E).',
      'setTimeout(fn, 0) is a macrotask handled in the timers phase of the event loop, so B runs after all microtasks, and the delay is at least 1 ms, not 0.',
    ],
    sources: [
      EVENT_LOOP_GUIDE,
      { label: 'MDN — Using microtasks in JavaScript with queueMicrotask()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide' },
    ],
  },
  {
    id: 'el-error-first',
    category: 'event-loop',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'When config.json is missing, this sometimes calls the callback twice and sometimes crashes the process instead of logging "Could not load config". Find the bugs and fix them.',
    codeLang: 'js',
    code: `const fs = require('node:fs');

function readConfig(file, callback) {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) callback(err);
    try {
      callback(null, JSON.parse(data));
    } catch (e) {
      callback(e);
    }
  });
}

try {
  readConfig('./config.json', (err, config) => {
    if (err) throw err;
    startServer(config);
  });
} catch (err) {
  console.error('Could not load config', err);
}`,
    keyPoints: [
      'Missing return: after callback(err) execution continues, JSON.parse(undefined) throws, and the callback is called a second time. Write return callback(err).',
      'The success callback is invoked inside the try: if the caller’s code throws (startServer fails), the catch calls the callback again with that error. Parse inside try/catch, but call the callback outside it.',
      'The outer try/catch cannot catch errors thrown in an asynchronous callback: readConfig returns immediately and the callback runs later on a different stack, so throw err becomes an uncaught exception and crashes the process.',
      'Error-first convention: callback(err) on failure, callback(null, result) on success, exactly once, and handle err at the top of every callback.',
      'Modern fix: use fs/promises with async/await so errors propagate through rejections: const config = JSON.parse(await readFile(file, \'utf8\')) inside a try/catch.',
    ],
    sources: [
      {
        label: 'Node.js — JavaScript Asynchronous Programming and Callbacks',
        url: 'https://nodejs.org/learn/asynchronous-work/javascript-asynchronous-programming-and-callbacks',
      },
      { label: 'Node.js docs — Error propagation and interception', url: 'https://nodejs.org/api/errors.html#error-propagation-and-interception' },
      { label: 'Node.js docs — fs Promises API', url: 'https://nodejs.org/api/fs.html#promises-api' },
    ],
  },
  {
    id: 'el-phases',
    category: 'event-loop',
    level: 'mid',
    type: 'concept',
    prompt:
      'Describe the phases of the Node.js event loop. Where do setTimeout, setImmediate, I/O callbacks and close handlers run, and where do process.nextTick and promise callbacks fit in?',
    keyPoints: [
      'Each iteration runs phases in order: timers (expired setTimeout/setInterval callbacks), pending callbacks (some deferred system I/O callbacks, such as certain TCP errors), idle/prepare (internal), poll (fetch new I/O events and run their callbacks), check (setImmediate callbacks), close callbacks (e.g. socket \'close\').',
      'Timer delays are a minimum, not a guarantee: a timer runs in the first timers phase after its threshold has passed, and setTimeout(fn, 0) is treated as 1 ms.',
      'Poll phase: if setImmediate callbacks are queued, it does not block and moves on to check; otherwise it waits for I/O, but no longer than the nearest timer threshold.',
      'process.nextTick and microtasks (promise reactions, queueMicrotask, await continuations) are not phases. They are drained after each callback completes: the nextTick queue first, then the microtask queue, repeating until both are empty, before the loop continues (since Node 11 this also happens between individual timers and immediates).',
      'The process exits when there are no more referenced handles or pending requests (servers, sockets, timers). handle.unref() lets a timer or socket stop keeping the process alive.',
    ],
    followUps: ['Why is setImmediate called “immediate” when process.nextTick actually runs sooner?'],
    sources: [EVENT_LOOP_GUIDE, LIBUV_DESIGN],
  },
  {
    id: 'el-nexttick-order',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'Saved as `order.cjs` and run with `node order.cjs`, what does this print? Which parts of the order are guaranteed and which are not?',
    codeLang: 'js',
    code: `setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('microtask'));
console.log('sync');`,
    keyPoints: [
      'Output: sync, nextTick, promise, microtask, then timeout and immediate in either order.',
      'Synchronous code runs first. In CommonJS, once the main script finishes, Node drains the nextTick queue before the promise microtask queue.',
      'Promise.then and queueMicrotask share the same microtask queue, so they run in FIFO order: promise, then microtask.',
      'setTimeout(0) vs setImmediate from the main module is non-deterministic: it depends on whether the 1 ms threshold has passed when the loop first enters the timers phase, which is affected by process performance and system load.',
      'For portable code prefer queueMicrotask; process.nextTick is Node-specific and mostly useful for API contracts such as emitting an event after a constructor has returned.',
    ],
    sources: [
      EVENT_LOOP_GUIDE,
      NEXTTICK_VS_MICROTASK,
      {
        label: 'Node.js — Understanding process.nextTick()',
        url: 'https://nodejs.org/learn/asynchronous-work/understanding-processnexttick',
      },
    ],
  },
  {
    id: 'el-timeout-vs-immediate',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'You run this script 20 times. Which lines can change order between runs and which never do? Explain using the event loop phases.',
    codeLang: 'js',
    code: `const fs = require('node:fs');

setTimeout(() => console.log('main: timeout'), 0);
setImmediate(() => console.log('main: immediate'));

fs.readFile(__filename, () => {
  setTimeout(() => console.log('io: timeout'), 0);
  setImmediate(() => console.log('io: immediate'));
});`,
    keyPoints: [
      'Output: "main: timeout" and "main: immediate" in either order (it varies between runs), followed by "io: immediate" and then "io: timeout", always in that order.',
      'In the main module the order is non-deterministic: setTimeout(0) is really 1 ms, and whether that has elapsed when the loop first checks timers depends on how long startup took.',
      'Inside an I/O callback the order is deterministic: the callback runs in the poll phase, the next phase is check (setImmediate), and timers only come around in the next iteration.',
      'The readFile callback needs several round trips through the thread pool (open, stat, read, close), so the main timer and immediate have already run by then.',
      'Practical takeaway: use setImmediate when you want to run something right after the current I/O phase; never rely on timeout-vs-immediate ordering at the top level.',
    ],
    sources: [
      EVENT_LOOP_GUIDE,
      { label: 'Node.js — Understanding setImmediate()', url: 'https://nodejs.org/learn/asynchronous-work/understanding-setimmediate' },
    ],
  },
  {
    id: 'el-threadpool',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'On an 8-core machine, roughly when does each line appear, and why? What changes if you start the process with `UV_THREADPOOL_SIZE=6`? What else in a real service shares this resource?',
    codeLang: 'js',
    code: `const crypto = require('node:crypto');
const start = Date.now();

for (let i = 1; i <= 6; i++) {
  crypto.pbkdf2('secret', 'salt', 300_000, 64, 'sha512', () => {
    console.log(\`hash \${i} done after \${Date.now() - start} ms\`);
  });
}`,
    keyPoints: [
      'Output: hashes 1–4 finish at roughly the same time T (in any order among themselves), then hashes 5 and 6 at roughly 2T.',
      'Async crypto.pbkdf2 runs on libuv’s thread pool, which has 4 threads by default; jobs 5 and 6 wait in the queue until a thread is free.',
      'With UV_THREADPOOL_SIZE=6 all six run in parallel and finish around T (enough cores). Set it in the environment before the process starts; assigning process.env.UV_THREADPOOL_SIZE in code is not guaranteed to work because the pool may already exist.',
      'Thread pool users: all asynchronous fs APIs except file watchers, dns.lookup (so any HTTP request to a hostname), async crypto such as pbkdf2, scrypt, randomBytes and generateKeyPair, and async zlib. Network sockets and dns.resolve*() do not use it.',
      'Consequence: slow tasks starve unrelated ones; heavy password hashing can delay file reads and DNS lookups for the whole service. Size the pool for the workload, rate-limit expensive operations, or move them to workers.',
      'The *Sync variants (pbkdf2Sync) would run one after another on the main thread and block everything else.',
    ],
    sources: [
      { label: 'Node.js docs — UV_THREADPOOL_SIZE', url: 'https://nodejs.org/api/cli.html#uv_threadpool_sizesize' },
      { label: 'libuv — Thread pool work scheduling', url: 'https://docs.libuv.org/en/v1.x/threadpool.html' },
      DONT_BLOCK,
    ],
  },
  {
    id: 'el-promisify',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'You inherited a codebase full of error-first callbacks. Implement your own `promisify(fn)` so the snippet works, then explain when you would reach for `util.promisify`, `fs/promises` or other built-in promise APIs instead.',
    codeLang: 'js',
    code: `const fs = require('node:fs');

function promisify(fn) {
  // your code
}

const readFileAsync = promisify(fs.readFile);
const text = await readFileAsync('./notes.txt', 'utf8');`,
    keyPoints: [
      'Return a function that forwards its arguments and appends an error-first callback: return function (...args) { return new Promise((resolve, reject) => { fn.call(this, ...args, (err, value) => (err ? reject(err) : resolve(value))); }); };',
      'Use a regular function and fn.call(this, ...) so promisified methods keep their this (or bind the method before promisifying).',
      'The convention assumes the callback is called exactly once, with err first. Functions that call back several times, or event-style APIs, should use streams or events.on/events.once instead.',
      'util.promisify does the same and respects util.promisify.custom, which some core functions define for non-standard callbacks (e.g. setTimeout, or dns.lookup resolving to { address, family }). util.callbackify goes the other way.',
      'Prefer the built-in promise APIs where they exist: node:fs/promises, node:dns/promises, node:stream/promises, node:timers/promises, node:readline/promises.',
    ],
    sources: [
      { label: 'Node.js docs — util.promisify()', url: 'https://nodejs.org/api/util.html#utilpromisifyoriginal' },
      { label: 'Node.js docs — fs Promises API', url: 'https://nodejs.org/api/fs.html#promises-api' },
      { label: 'Node.js docs — Timers Promises API', url: 'https://nodejs.org/api/timers.html#timers-promises-api' },
    ],
  },
  {
    id: 'el-sequential-awaits',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'The dashboard endpoint is slow, and sometimes the orders come back without shipping data. Review the handler and rewrite it.',
    codeLang: 'js',
    code: `app.get('/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = await getUser(userId);
  const orders = await getOrders(userId);
  const recommendations = await getRecommendations(userId);

  const enriched = [];
  orders.forEach(async (order) => {
    enriched.push({ ...order, shipping: await getShipping(order.id) });
  });

  res.json({ user, orders: enriched, recommendations });
});`,
    keyPoints: [
      'The three lookups are independent but awaited one after another, so latency is the sum instead of the slowest one. Start them together: const [user, orders, recommendations] = await Promise.all([getUser(userId), getOrders(userId), getRecommendations(userId)]).',
      'forEach ignores the promises returned by the async callback: res.json runs before getShipping resolves, so enriched is empty or partial, and any rejection there becomes an unhandled rejection that crashes the process.',
      'Use const enriched = await Promise.all(orders.map(async (o) => ({ ...o, shipping: await getShipping(o.id) }))), or a for...of loop with await when the calls must be sequential.',
      'Promise.all rejects on the first failure (the other operations keep running); use Promise.allSettled when partial results are acceptable, e.g. recommendations are optional.',
      'Unbounded fan-out (hundreds of orders → hundreds of concurrent calls) can overwhelm downstream services or the DB pool: limit concurrency, or fix the N+1 with one batched query.',
      'Express 4 does not catch rejected promises from async handlers (Express 5 does), so errors need try/catch or a wrapper that calls next(err).',
    ],
    sources: [
      { label: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
      { label: 'MDN — Promise.allSettled()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled' },
      { label: 'Express — Error handling', url: 'https://expressjs.com/en/guide/error-handling.html' },
    ],
  },
  {
    id: 'el-unhandled-rejection',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What happens when you run this on a current Node LTS? Does "still alive" print?',
    codeLang: 'js',
    code: `async function loadConfig() {
  throw new Error('config missing');
}

loadConfig();

setTimeout(() => console.log('still alive'), 100);
console.log('started');`,
    keyPoints: [
      'Output: started, then the process crashes, printing the Error: config missing stack trace, and exits with code 1; "still alive" never prints.',
      'loadConfig() returns a rejected promise that nobody handles. Since Node 15 the default --unhandled-rejections mode is throw: an unhandled rejection is raised as an uncaught exception (older versions only printed a warning).',
      'Rejections are checked right after the microtask queue drains, so attaching a .catch() later (for example in a timer) is too late.',
      'Fix: await it inside an async main with try/catch, or call loadConfig().catch(handleError). The @typescript-eslint/no-floating-promises lint rule catches this class of bug.',
      'process.on(\'unhandledRejection\') can log context, but treat every occurrence as a bug: log it, then exit and let the process manager restart the service rather than continuing in an unknown state.',
    ],
    sources: [
      { label: 'Node.js docs — --unhandled-rejections', url: 'https://nodejs.org/api/cli.html#--unhandled-rejectionsmode' },
      { label: 'Node.js docs — Event: \'unhandledRejection\'', url: 'https://nodejs.org/api/process.html#event-unhandledrejection' },
      { label: 'Node.js v15.0.0 release notes', url: 'https://nodejs.org/en/blog/release/v15.0.0' },
    ],
  },
  {
    id: 'el-zalgo',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What does this print? What design problem does it reveal, and how would you fix `getUser`?',
    codeLang: 'js',
    code: `const cache = new Map();

function getUser(id, cb) {
  if (cache.has(id)) return cb(null, cache.get(id));
  setTimeout(() => {
    const user = { id };
    cache.set(id, user);
    cb(null, user);
  }, 10);
}

function load(label) {
  console.log(label, 'before');
  getUser(1, () => console.log(label, 'callback'));
  console.log(label, 'after');
}

load('first');
setTimeout(() => load('second'), 50);`,
    keyPoints: [
      'Output: first before, first after, first callback, second before, second callback, second after.',
      'getUser is asynchronous on a cache miss but synchronous on a cache hit, so the same call has two different orderings. This is “releasing Zalgo”: callers cannot reason about what runs first.',
      'Real bugs this causes: the callback runs before the caller has finished setting up state, events fire before listeners are attached, a try/catch around the call suddenly catches errors from the callback, and recursion can blow the stack.',
      'Fix: always be asynchronous, e.g. process.nextTick(cb, null, cache.get(id)) or queueMicrotask on the hit path, or better, make getUser an async function, since promise callbacks always run asynchronously.',
      'The same rule applies to EventEmitters: defer events emitted from a constructor with process.nextTick so callers can attach listeners first.',
    ],
    sources: [
      { label: 'Isaac Z. Schlueter — Designing APIs for Asynchrony', url: 'https://blog.izs.me/2013/08/designing-apis-for-asynchrony/' },
      {
        label: 'Node.js — Understanding process.nextTick()',
        url: 'https://nodejs.org/learn/asynchronous-work/understanding-processnexttick',
      },
    ],
  },
  {
    id: 'el-events-on-abort',
    category: 'event-loop',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This worker consumes messages from an EventEmitter-based client. On shutdown, "consumer stopped" is never logged, and when the broker is down, startup hangs forever instead of failing after 5 seconds. Fix both, using AbortController/AbortSignal.',
    codeLang: 'js',
    code: `import { on, once } from 'node:events';

async function consume(client) {
  for await (const [msg] of on(client, 'message')) {
    await handle(msg);
  }
  console.log('consumer stopped');
}

async function start(client) {
  await once(client, 'ready');
  process.on('SIGTERM', () => client.disconnect());
  await consume(client);
}`,
    keyPoints: [
      'events.on returns an async iterator that never finishes by itself. The loop only ends if you break out, if the emitter emits \'error\' (it throws), if an AbortSignal passed in the options aborts (it throws an AbortError), or when an event listed in the close option is emitted.',
      'Fix: const ac = new AbortController(); iterate on(client, \'message\', { signal: ac.signal, close: [\'close\'] }); call ac.abort() on SIGTERM, and catch the AbortError (err.name === \'AbortError\') so shutdown is not reported as a failure.',
      'events.once resolves with the arguments of the first event and rejects if \'error\' fires first, but without a signal it can wait forever. await once(client, \'ready\', { signal: AbortSignal.timeout(5000) }) rejects with an AbortError after 5 seconds.',
      'AbortSignal.any([shutdown.signal, AbortSignal.timeout(5000)]) combines user cancellation with a timeout. The same signal works across fetch, fs.readFile, child_process, stream.pipeline and setTimeout from node:timers/promises (await setTimeout(1000, undefined, { signal })).',
      'Inside for await, messages are processed one at a time and the rest are buffered; a slow handle() means an ever-growing buffer, and an exception from handle() ends the loop, so decide whether to catch errors per message.',
    ],
    sources: [
      { label: 'Node.js docs — events.on()', url: 'https://nodejs.org/api/events.html#eventsonemitter-eventname-options' },
      { label: 'MDN — AbortSignal.timeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static' },
      { label: 'MDN — for await...of', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of' },
    ],
  },
  {
    id: 'el-nexttick-starvation',
    category: 'event-loop',
    level: 'senior',
    type: 'code',
    challenge: 'output',
    prompt:
      'What does this print? What changes if you replace `process.nextTick(spin)` with `setImmediate(spin)`, and why does the difference matter for a server?',
    codeLang: 'js',
    code: `let count = 0;

setTimeout(() => console.log('timer fired, count =', count), 0);

function spin() {
  count++;
  if (count < 1_000_000) process.nextTick(spin);
}

spin();`,
    keyPoints: [
      'Output: timer fired, count = 1000000.',
      'The nextTick queue is drained completely before the event loop continues, including callbacks queued while it is draining, so the timer (and every I/O callback) waits for all one million iterations. Recursive nextTick starves the event loop.',
      'With setImmediate, each call is queued for the check phase of the next loop iteration, so the timer fires after only a few iterations (a small count that varies between runs) and I/O is serviced in between.',
      'Microtasks behave the same way: an endless promise chain, or an async loop that only awaits already-resolved values, never yields to I/O.',
      'This is the basis of partitioning: process a chunk of work, then yield with setImmediate (or await setImmediate() from node:timers/promises) so other requests can run. For heavy CPU work, worker_threads are usually the better tool.',
    ],
    sources: [
      EVENT_LOOP_GUIDE,
      { label: 'Node.js docs — process.nextTick()', url: 'https://nodejs.org/api/process.html#processnexttickcallback-args' },
      DONT_BLOCK,
    ],
  },
  {
    id: 'el-esm-vs-cjs-order',
    category: 'event-loop',
    level: 'senior',
    type: 'code',
    challenge: 'output',
    prompt:
      'This file prints in a different order when saved as `main.cjs` than as `main.mjs`. Give both outputs and explain the difference.',
    codeLang: 'js',
    code: `async function a() {
  console.log('a1');
  await b();
  console.log('a2');
}
async function b() {
  console.log('b1');
}

console.log('start');
setTimeout(() => console.log('timeout'), 0);
a();
new Promise((resolve) => {
  console.log('p1');
  resolve();
}).then(() => console.log('p2'));
process.nextTick(() => console.log('tick'));
console.log('end');`,
    keyPoints: [
      'CommonJS (main.cjs): start, a1, b1, p1, end, tick, a2, p2, timeout. ESM (main.mjs): start, a1, b1, p1, end, a2, p2, tick, timeout.',
      'a1, b1 and p1 are synchronous: an async function runs synchronously until its first await, and a Promise executor runs immediately.',
      'Awaiting a native promise that is already settled costs one microtask turn, so a2 is queued before p2.',
      'In CommonJS, when the main script finishes Node drains the nextTick queue before the microtask queue, so tick comes first. An ES module is evaluated as part of a promise job, so the microtasks it queues run before Node gets back to the nextTick queue.',
      'Takeaway: do not write code whose correctness depends on nextTick-vs-promise ordering; the Node docs recommend queueMicrotask for portable deferral.',
    ],
    sources: [
      NEXTTICK_VS_MICROTASK,
      { label: 'V8 blog — Faster async functions and promises', url: 'https://v8.dev/blog/fast-async' },
    ],
  },
  {
    id: 'el-async-local-storage',
    category: 'event-loop',
    level: 'senior',
    type: 'code',
    challenge: 'output',
    prompt:
      'You use AsyncLocalStorage to attach request IDs to log lines. What does this print? Then tell me how context gets lost in real applications.',
    codeLang: 'js',
    code: `const { AsyncLocalStorage } = require('node:async_hooks');
const als = new AsyncLocalStorage();

function log(msg) {
  const store = als.getStore();
  console.log(\`[\${store?.requestId ?? '-'}] \${msg}\`);
}

als.run({ requestId: 'A' }, () => {
  setTimeout(() => log('timer'), 10);
  Promise.resolve().then(() => log('promise'));
});

als.run({ requestId: 'B' }, async () => {
  await new Promise((r) => setTimeout(r, 5));
  log('after await');
});

log('outside');`,
    keyPoints: [
      'Output: [-] outside, [A] promise, [B] after await, [A] timer.',
      'als.run(store, fn) makes the store available to fn and to every asynchronous continuation created inside it (timers, promise callbacks, await continuations, I/O callbacks). Outside any run(), getStore() returns undefined.',
      'Contexts follow each async chain, so interleaved requests A and B never see each other’s store. The order itself is ordinary event-loop order: sync log, microtask, 5 ms timer, 10 ms timer.',
      'Context gets lost or leaks when a callback is invoked from a different async context: EventEmitter listeners run synchronously in the context of whoever calls emit(), and libraries that queue callbacks and run them later from a shared pool can do the same. Fix with AsyncLocalStorage.bind(), AsyncLocalStorage.snapshot() or AsyncResource.',
      'enterWith() sets the store for the rest of the current synchronous execution and its continuations, which easily leaks context; prefer run().',
      'Typical uses: request or trace IDs in logs (OpenTelemetry relies on it), tenant IDs, per-request DB transactions. Avoid turning it into a hidden global for business logic.',
    ],
    sources: [
      { label: 'Node.js docs — Asynchronous context tracking', url: 'https://nodejs.org/api/async_context.html' },
      { label: 'Node.js docs — AsyncLocalStorage.snapshot()', url: 'https://nodejs.org/api/async_context.html#static-method-asynclocalstoragesnapshot' },
    ],
  },
  {
    id: 'el-blocking-detect',
    category: 'event-loop',
    level: 'senior',
    type: 'concept',
    prompt:
      'After a release, p99 latency jumps from 80 ms to 2 s. One core is pegged at 100%, the database is idle, and even the health check endpoint is slow. How do you confirm the event loop is blocked, find the culprit and fix it?',
    keyPoints: [
      'Every endpoint slowing down at once, late timers and one busy core with healthy dependencies are the classic signature of a blocked event loop rather than slow I/O.',
      'Measure: perf_hooks.monitorEventLoopDelay() gives a histogram of loop delay (percentiles in nanoseconds) and performance.eventLoopUtilization() shows how busy the loop is; export both as metrics and alert on them.',
      'Find the cause with a CPU profile under realistic load: node --cpu-prof, or --inspect with Chrome DevTools, and flame graphs (0x, clinic.js flame). Look for wide synchronous frames.',
      'Usual culprits: *Sync APIs on the request path (fs, crypto.pbkdf2Sync/scryptSync, zlib), JSON.parse/JSON.stringify of huge payloads, catastrophic regex backtracking (ReDoS) on user input, large sorts or nested loops (accidental O(n²)), heavy template rendering, logging huge objects.',
      'Fixes: use the asynchronous thread-pool versions, stream and paginate instead of building huge JSON bodies, cap request body sizes, rewrite dangerous regexes or validate input length, partition work with setImmediate, and move CPU-bound work to a worker_threads pool (e.g. Piscina) or a separate service.',
      'Prevent regressions: load tests with latency budgets in CI, lint rules against sync APIs in server code, and loop-delay dashboards.',
    ],
    followUps: ['When would you choose worker_threads over partitioning the work with setImmediate?'],
    sources: [
      DONT_BLOCK,
      { label: 'Node.js docs — perf_hooks.monitorEventLoopDelay()', url: 'https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions' },
      { label: 'Node.js — Flame graphs', url: 'https://nodejs.org/learn/diagnostics/flame-graphs' },
    ],
  },
  {
    id: 'el-blocking-route',
    category: 'event-loop',
    level: 'senior',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'Signups occasionally freeze the whole API for several seconds, and a security review flagged this handler. What blocks the event loop here, and how would you rewrite it?',
    codeLang: 'js',
    code: `const NAME_RE = /^(\\w+\\s?)*$/;

app.post('/signup', express.json({ limit: '50mb' }), (req, res) => {
  const { email, password, displayName } = req.body;

  if (!NAME_RE.test(displayName)) {
    return res.status(400).send('invalid name');
  }

  // users: ~2 million records kept in memory
  if (users.find((u) => u.email === email)) {
    return res.status(409).send('email taken');
  }

  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 600_000, 64, 'sha512');
  users.push({ email, displayName, salt, hash });
  res.status(201).end();
});`,
    keyPoints: [
      'ReDoS: the nested quantifier (\\w+\\s?)* backtracks exponentially on near-miss input such as 30 letters followed by \'!\'; one request can freeze the process for seconds or longer. Remove the nested quantifier (e.g. /^\\w+(?: \\w+)*$/), cap the input length first, or use a linear-time engine such as RE2.',
      'pbkdf2Sync with 600,000 iterations burns a large amount of CPU on the main thread per signup, and nothing else runs meanwhile. Use the asynchronous crypto.pbkdf2 or crypto.scrypt (thread pool), rate-limit the endpoint, and consider a worker pool for heavy hashing.',
      'A 50 MB JSON limit lets clients send huge bodies, and JSON.parse is synchronous. A signup needs a few KB: keep the default limit (100 kB) or lower.',
      'users.find over ~2 million records is an O(n) scan on the event loop for every request; use a Map/index or a database with a unique constraint (which also fixes the check-then-insert race).',
      'Other issues: no input validation of email/password types and lengths, and the in-memory store is lost on restart and not shared across instances.',
    ],
    sources: [
      DONT_BLOCK,
      {
        label: 'OWASP — Regular expression Denial of Service (ReDoS)',
        url: 'https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS',
      },
      { label: 'Node.js docs — crypto.pbkdf2()', url: 'https://nodejs.org/api/crypto.html#cryptopbkdf2password-salt-iterations-keylen-digest-callback' },
    ],
  },
  {
    id: 'el-map-concurrency',
    category: 'event-loop',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'You must call a rate-limited API for 10,000 items with at most 5 requests in flight, and return the results in the original order. Implement `mapWithConcurrency` without libraries, then discuss errors and cancellation.',
    codeLang: 'ts',
    code: `async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  // your code
}

const profiles = await mapWithConcurrency(userIds, 5, (id) => fetchProfile(id));`,
    keyPoints: [
      'Worker-pool approach: a shared cursor and min(limit, items.length) async workers, each looping while (next < items.length) { const i = next++; results[i] = await fn(items[i], i); }, then await Promise.all(workers).',
      'next++ is race-free because JavaScript runs on one thread and the read-and-increment happens synchronously between awaits.',
      'Results are written by index, so order is preserved no matter which call finishes first.',
      'Errors: with Promise.all the first rejection rejects the whole call, but the other workers keep starting new items. Add a failed flag (or abort) to stop taking work, or collect per-item outcomes (allSettled style) when partial success is acceptable.',
      'Cancellation: accept an AbortSignal, check signal.aborted before each item, and pass it to fn so in-flight requests (fetch) are cancelled too.',
      'Common mistake: items.map(fn) followed by batching or limiting; the promises have already started, so concurrency must be limited when tasks are created. In production consider p-limit/p-map, a rate limit in requests per second (not just concurrency), and backoff on 429 with Retry-After.',
    ],
    followUps: ['How would you adapt this to a stream of items that does not fit in memory?'],
    sources: [
      { label: 'sindresorhus/p-limit', url: 'https://github.com/sindresorhus/p-limit' },
      { label: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
      { label: 'MDN — AbortSignal', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal' },
    ],
  },
];
