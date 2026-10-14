import type { Question } from '../types';

export const javascript: Question[] = [
  {
    id: 'js-closures',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'What is a closure? Give a practical use in backend code and a common pitfall.',
    keyPoints: [
      'A function together with the lexical scope it was created in; it keeps access to those variables after the outer function returns.',
      'Uses: private state (module pattern, counters), function factories (makeLogger(prefix), middleware factories like rateLimit({ max })), memoisation, debounce, callbacks that remember request context.',
      'Pitfalls: closures retaining large objects (a whole req/res or a big buffer) for as long as the callback lives, which in a long-running process is a memory leak; var in loops sharing one binding.',
      'Module-level variables are closed over by every request handler, so they are shared across all requests in the process; never keep per-request data there.',
    ],
    sources: [
      { label: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' },
      { label: 'javascript.info — Variable scope, closure', url: 'https://javascript.info/closure' },
    ],
  },
  {
    id: 'js-var-loop',
    category: 'javascript',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'What does this print, and why? How do you make it print 0, 1, 2?',
    codeLang: 'js',
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
    keyPoints: [
      'It prints 3, 3, 3.',
      'var is function-scoped: there is a single i shared by all callbacks, and the callbacks run after the loop has finished.',
      'let creates a new binding per iteration → 0, 1, 2.',
      'Older fix: an IIFE or passing i as an argument to capture the value.',
    ],
    sources: [
      {
        label: 'MDN — Creating closures in loops: a common mistake',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#creating_closures_in_loops_a_common_mistake',
      },
      { label: 'MDN — let', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let' },
    ],
  },
  {
    id: 'js-microtask-order',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'In what order are the letters logged? Explain it purely in terms of the JavaScript job (microtask) queue; no timers are involved.',
    codeLang: 'js',
    code: `console.log('A');

Promise.resolve()
  .then(() => console.log('B'))
  .then(() => console.log('C'));

queueMicrotask(() => console.log('D'));

(async () => {
  console.log('E');
  await null;
  console.log('F');
})();

console.log('G');`,
    keyPoints: [
      'Order: A, E, G, B, D, F, C.',
      'Synchronous code runs first: A, then E (an async function runs synchronously until its first await), then G.',
      'When the stack empties, the queue holds three jobs in FIFO order: the first then callback (B), the queueMicrotask callback (D) and the continuation after await (F).',
      'C is queued only when the promise returned by the first then resolves, i.e. after B runs, so it lands behind D and F.',
      'The microtask queue is drained completely before the host does anything else; Node’s own queues (process.nextTick, timers, I/O phases) are a separate topic layered on top of this.',
    ],
    followUps: [
      'What happens if a microtask keeps queueing new microtasks forever?',
      'How many ticks does `return await somePromise` add compared with `return somePromise`?',
    ],
    sources: [
      { label: 'MDN — Using microtasks', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide' },
      { label: 'javascript.info — Microtasks', url: 'https://javascript.info/microtask-queue' },
      { label: 'MDN — await', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await' },
    ],
  },
  {
    id: 'js-this',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'This runs as an ES module (strict mode). What does each line A–D produce? Evaluate each one independently.',
    codeLang: 'js',
    code: `const user = {
  name: 'Ada',
  greet() {
    return \`Hi \${this.name}\`;
  },
  greetLater() {
    setTimeout(() => console.log(this.name), 0);
  },
};

const greet = user.greet;

console.log(user.greet());                      // A
console.log(greet());                           // B
console.log(user.greet.bind({ name: 'Grace' })()); // C
user.greetLater();                              // D`,
    keyPoints: [
      'A: "Hi Ada" (implicit binding: called as a method of user).',
      'B: TypeError. The method is detached, so this is undefined in strict mode (in sloppy-mode CommonJS it would be globalThis).',
      'C: "Hi Grace" (explicit binding with bind).',
      'D: "Ada". Arrow functions don’t have their own this; they take it from greetLater’s call.',
      'this is decided by how a function is called: new > explicit (call/apply/bind) > implicit (obj.fn()) > default.',
      'This is why methods passed as callbacks (route handlers, setTimeout, array.map, promise .then) must be bound or wrapped in an arrow.',
    ],
    sources: [
      { label: 'MDN — this', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this' },
      { label: 'MDN — Arrow function expressions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions' },
      { label: 'javascript.info — Function binding', url: 'https://javascript.info/bind' },
    ],
  },
  {
    id: 'js-prototypes',
    category: 'javascript',
    level: 'mid',
    type: 'concept',
    prompt: 'Explain prototypal inheritance. How does the `class` keyword relate to it?',
    keyPoints: [
      'Every object has an internal [[Prototype]] link; property lookup walks the chain until it finds the property or reaches null.',
      'Object.create(proto) creates an object with a given prototype; constructor functions put shared methods on Fn.prototype.',
      'class is mostly syntax over the same mechanism, with differences: must be called with new, body is strict mode, methods are non-enumerable, private #fields, TDZ for the class binding.',
      'Use Object.hasOwn to check own properties; never modify built-in prototypes. Object.create(null) gives a prototype-less dictionary, which avoids prototype-pollution surprises with user-controlled keys.',
    ],
    sources: [
      { label: 'MDN — Inheritance and the prototype chain', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain' },
      { label: 'javascript.info — Prototypal inheritance', url: 'https://javascript.info/prototype-inheritance' },
    ],
  },
  {
    id: 'js-hoisting',
    category: 'javascript',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'What happens on each console.log line? Evaluate each one independently as if the others were not there.',
    codeLang: 'js',
    code: `console.log(a);
console.log(b);
console.log(sayHi());
console.log(sayBye());

var a = 1;
let b = 2;
function sayHi() { return 'hi'; }
var sayBye = function () { return 'bye'; };`,
    keyPoints: [
      'a → undefined: var declarations are hoisted and initialised to undefined.',
      'b → ReferenceError: let/const are hoisted but not initialised (temporal dead zone).',
      'sayHi() → "hi": function declarations are hoisted with their body.',
      'sayBye() → TypeError: sayBye is not a function (the var exists but is still undefined).',
    ],
    sources: [
      { label: 'MDN — Hoisting', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Hoisting' },
      {
        label: 'MDN — Temporal dead zone',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz',
      },
    ],
  },
  {
    id: 'js-scope-const',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'Compare var, let and const. Does const make an object immutable?',
    keyPoints: [
      'var: function-scoped, hoisted as undefined, can be redeclared, creates a property on the global object at top level in classic scripts (not in modules).',
      'let/const: block-scoped, temporal dead zone, no redeclaration.',
      'const prevents reassigning the binding, not mutating the value: const config = {}; config.port = 1 is allowed.',
      'For immutability use Object.freeze (shallow), copy-on-write update patterns, or readonly types in TypeScript.',
      'Default to const, use let when reassignment is needed, avoid var.',
    ],
    sources: [
      { label: 'MDN — const', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const' },
      { label: 'MDN — var', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var' },
    ],
  },
  {
    id: 'js-equality',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'Explain == vs === vs Object.is, with a few surprising examples. How do you compare two objects by content in Node?',
    keyPoints: [
      '=== compares without type coercion; == coerces first.',
      'Surprises: null == undefined (true), "" == 0 (true), "0" == false (true), [] == false (true).',
      'NaN === NaN is false; Object.is(NaN, NaN) is true; Object.is(0, -0) is false.',
      'Objects and arrays compare by reference, never by content.',
      'Node’s assert.strictEqual uses Object.is; for content use assert.deepStrictEqual in tests or util.isDeepStrictEqual in application code.',
    ],
    sources: [
      { label: 'MDN — Equality comparisons and sameness', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness' },
      { label: 'Node.js — assert.strictEqual()', url: 'https://nodejs.org/api/assert.html#assertstrictequalactual-expected-message' },
      { label: 'Node.js — util.isDeepStrictEqual()', url: 'https://nodejs.org/api/util.html#utilisdeepstrictequalval1-val2-options' },
    ],
  },
  {
    id: 'js-copy',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What do the three console.log calls print? Explain the difference between the three copies.',
    codeLang: 'js',
    code: `const original = {
  name: 'Ada',
  tags: ['math'],
  meta: { born: new Date(1815, 11, 10) },
};

const a = { ...original };
const b = JSON.parse(JSON.stringify(original));
const c = structuredClone(original);

a.tags.push('poetry');

console.log(original.tags);
console.log(typeof b.meta.born);
console.log(c.meta.born instanceof Date);`,
    keyPoints: [
      '["math", "poetry"]: spread is a shallow copy, so a.tags is the same array as original.tags.',
      '"string": JSON turns Dates into ISO strings; it also drops undefined and functions, turns NaN into null, loses Map/Set, throws on BigInt and on circular references.',
      'true: structuredClone (a global in Node and browsers) deep-copies most built-ins (Date, Map, Set, typed arrays, circular references).',
      'structuredClone throws on functions and doesn’t keep class prototypes (instances come back as plain objects). The same algorithm is used when posting messages to worker threads.',
    ],
    sources: [
      { label: 'MDN — structuredClone()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone' },
      { label: 'javascript.info — Object references and copying', url: 'https://javascript.info/object-copy' },
    ],
  },
  {
    id: 'js-promise-combinators',
    category: 'javascript',
    level: 'mid',
    type: 'concept',
    prompt:
      'Promise.all vs Promise.allSettled vs Promise.race vs Promise.any: when would you use each in a backend service? How do you handle errors and timeouts?',
    keyPoints: [
      'all: fulfils with all results in order; rejects on the first rejection (the other operations keep running, they are not cancelled). Good for parallel lookups that are all required.',
      'allSettled: waits for everything and returns { status, value | reason } objects; good for fan-out to independent services where partial results are acceptable.',
      'race: settles like the first promise to settle (fulfil or reject); the classic timeout pattern, but the losing operation keeps running.',
      'any: fulfils with the first success; rejects with AggregateError if all fail; good for redundant replicas or mirrors.',
      'Real cancellation needs AbortController/AbortSignal (e.g. fetch(url, { signal: AbortSignal.timeout(2000) })); unbounded Promise.all over thousands of items can exhaust a DB pool or hit rate limits.',
    ],
    sources: [
      { label: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
      { label: 'MDN — Promise.allSettled()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled' },
      { label: 'MDN — Promise.any()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any' },
      { label: 'MDN — AbortSignal.timeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static' },
    ],
  },
  {
    id: 'js-async-foreach',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'loadOrders always returns an empty array. Why? Show two fixes and when you’d pick each.',
    codeLang: 'js',
    code: `async function loadOrders(ids) {
  const orders = [];
  ids.forEach(async (id) => {
    const order = await db.orders.findById(id);
    orders.push(order);
  });
  return orders;
}`,
    keyPoints: [
      'forEach ignores the promises returned by async callbacks; the function returns before any query finishes.',
      'Rejections become unhandled (which crashes the process by default in modern Node); push order would follow completion, not input order.',
      'Parallel fix: return Promise.all(ids.map((id) => db.orders.findById(id))) (keeps input order).',
      'Sequential fix: for (const id of ids) { orders.push(await db.orders.findById(id)); } (rate limits, dependent steps, transactions on one connection).',
      'Better still for a DB: one query (WHERE id IN (...)) instead of N; for many remote calls, limit concurrency (a small pool or p-limit).',
    ],
    sources: [
      { label: 'MDN — Array.prototype.forEach()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach' },
      { label: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
    ],
  },
  {
    id: 'js-return-await',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'When the payment provider fails, the error is never logged and callers get a rejection instead of null. Why?',
    codeLang: 'js',
    code: `async function charge(order) {
  try {
    return paymentsClient.charge(order.id, order.amount);
  } catch (err) {
    logger.error({ err, orderId: order.id }, 'charge failed');
    return null;
  }
}`,
    keyPoints: [
      'The promise is returned without await, so the function exits the try block before the promise rejects; the catch never runs.',
      'Use return await inside try/catch so the rejection is thrown inside the try.',
      'Outside try/catch, return vs return await behaves the same apart from async stack traces (the awaiting frame shows up with await).',
      'Lint for it: @typescript-eslint/return-await and no-floating-promises.',
    ],
    sources: [
      { label: 'Jake Archibald — await vs return vs return await', url: 'https://jakearchibald.com/2017/await-vs-return-vs-return-await/' },
      { label: 'MDN — async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function' },
    ],
  },
  {
    id: 'js-debounce',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement `debounce(fn, wait)` in your answer. Then explain how throttle differs, and what you need to watch out for when using timers like this in a long-running Node process.',
    codeLang: 'js',
    code: `// fs.watch can fire several events for a single save:
// const reload = debounce(() => loadConfig(), 200);
// fs.watch('./config', reload);

function debounce(fn, wait) {
  // your implementation
}`,
    keyPoints: [
      'Keep a timer id in a closure; on each call clearTimeout and set a new timeout that calls fn.apply(this, args).',
      'Debounce: run once activity stops for wait ms (file-watch reloads, coalescing cache invalidations). Throttle: run at most once per wait ms (progress logs, metrics flushes).',
      'Nice to have: leading/trailing options, a cancel() method, a flush() for graceful shutdown so pending work isn’t lost.',
      'A pending timer keeps the process alive; call timer.unref() for best-effort work, and clear timers on shutdown.',
      'Not to be confused with rate limiting incoming requests, which needs per-client counters (often shared via Redis) rather than a local timer.',
    ],
    sources: [
      { label: 'MDN — Debounce', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Debounce' },
      { label: 'MDN — Throttle', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Throttle' },
      { label: 'Node.js — timeout.unref()', url: 'https://nodejs.org/api/timers.html#timeoutunref' },
    ],
  },
  {
    id: 'js-sort',
    category: 'javascript',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'What does each line print? Why can sort() cause bugs in a server that keeps data in memory?',
    codeLang: 'js',
    code: `console.log([10, 1, 5, 100].sort());
console.log(['b', 'a', 'C'].sort());

const nums = [3, 1, 2];
const sorted = nums.sort((a, b) => a - b);
console.log(nums, sorted === nums);`,
    keyPoints: [
      '[1, 10, 100, 5]: without a comparator, elements are compared as strings.',
      '["C", "a", "b"]: compares UTF-16 code units, so uppercase comes first; use localeCompare or Intl.Collator for human sorting.',
      '[1, 2, 3] true: sort mutates the array in place and returns the same array.',
      'Sorting a cached or module-level array inside a request handler changes it for every later request (and for concurrent ones); use toSorted() (ES2023) or [...arr].sort().',
    ],
    sources: [
      { label: 'MDN — Array.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort' },
      { label: 'MDN — Array.prototype.toSorted()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted' },
    ],
  },
  {
    id: 'js-quirks',
    category: 'javascript',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'Quick fire: what does each line print, and what is the practical lesson behind each?',
    codeLang: 'js',
    code: `console.log(0.1 + 0.2 === 0.3);
console.log(typeof null);
console.log(typeof NaN);
console.log([] == false);
console.log(Number.MAX_SAFE_INTEGER + 2);`,
    keyPoints: [
      'false: IEEE-754 floating point; compare with a tolerance (Number.EPSILON) and store money as integer cents.',
      '"object": a historical bug; check for null explicitly.',
      '"number": NaN is a number value; use Number.isNaN (Number("abc") from a query string gives NaN).',
      'true: [] becomes "" and then 0, false becomes 0. Use ===.',
      '9007199254740992: integers above 2^53 − 1 lose precision; use BigInt, and keep large ids (database BIGINT, snowflake ids) as strings in JSON.',
    ],
    sources: [
      { label: 'MDN — Number.EPSILON', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON' },
      { label: 'MDN — typeof', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof' },
      { label: 'MDN — Number.MAX_SAFE_INTEGER', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER' },
    ],
  },
  {
    id: 'js-nullish',
    category: 'javascript',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'What does setup return (or throw) for this input? Fix the bugs.',
    codeLang: 'js',
    code: `function setup(options) {
  const retries = options.retries || 3;
  const timeout = options?.timeout ?? 1000;
  const name = options.user?.profile.name;
  return { retries, timeout, name };
}

setup({ retries: 0, timeout: 0, user: {} });`,
    keyPoints: [
      'It throws a TypeError on the name line: user exists, so user?.profile is undefined, and .name is read from undefined.',
      'Optional chaining only short-circuits when the value right before ?. is null/undefined; use user?.profile?.name.',
      'retries would be 3 instead of 0: || falls back on any falsy value (0, "", false, NaN). Use ??.',
      'timeout is 0 as expected (?? only falls back on null/undefined).',
      'options.retries would throw first if options itself were undefined; a default parameter (options = {}) fixes that.',
    ],
    followUps: ['process.env values are always strings or undefined. What goes wrong with `Number(process.env.RETRIES) || 3` when RETRIES is "0"?'],
    sources: [
      { label: 'MDN — Nullish coalescing operator (??)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing' },
      { label: 'MDN — Optional chaining (?.)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining' },
    ],
  },
  {
    id: 'js-modules',
    category: 'javascript',
    level: 'mid',
    type: 'concept',
    prompt: 'ES modules vs CommonJS at the language level: what are the differences, and why do they matter?',
    keyPoints: [
      'ESM: static import/export, analysable before execution (enables tree-shaking and early errors for missing named exports), live bindings, asynchronous loading, top-level await, always strict mode.',
      'CommonJS: require() is dynamic and synchronous; module.exports is a plain object, so destructuring a require copies values at that moment.',
      'ESM has no require, module, __dirname or __filename; use import.meta (import.meta.url, and import.meta.dirname/filename in recent Node) and import() for dynamic loading.',
      'In Node the format is chosen by "type" in package.json or the .mjs/.cjs extension; interop (default exports, dual packages, require of ESM) is its own topic.',
    ],
    sources: [
      { label: 'MDN — JavaScript modules', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules' },
      { label: 'Node.js — ECMAScript modules', url: 'https://nodejs.org/api/esm.html' },
    ],
  },
  {
    id: 'js-memory-leaks',
    category: 'javascript',
    level: 'senior',
    type: 'concept',
    prompt: 'What typically causes memory leaks in a long-running Node.js service, and how do you find them?',
    keyPoints: [
      'Unbounded module-level caches/maps keyed by request data (use an LRU with max size/TTL, or a WeakMap when keyed by objects).',
      'Listeners added per request to long-lived emitters and never removed (MaxListenersExceededWarning is a hint), intervals never cleared, closures retaining large req/res objects or buffers, promises that never settle.',
      'Confirm it first: heapUsed/RSS from process.memoryUsage() that keeps climbing under steady load rather than a sawtooth after GC; also check external/arrayBuffers for off-heap Buffers.',
      'Find it with heap snapshots: node --inspect + Chrome DevTools, v8.writeHeapSnapshot(), --heapsnapshot-signal, or --heapsnapshot-near-heap-limit to capture one before an OOM crash.',
      'Compare snapshots taken before and after repeating the suspect action under load, sort by retained size and follow the retainers path back to the root that holds the objects.',
    ],
    sources: [
      { label: 'Node.js — Using heap snapshots', url: 'https://nodejs.org/learn/diagnostics/memory/using-heap-snapshot' },
      { label: 'Node.js — v8.writeHeapSnapshot()', url: 'https://nodejs.org/api/v8.html#v8writeheapsnapshotfilenameoptions' },
      { label: 'Node.js — events.defaultMaxListeners', url: 'https://nodejs.org/api/events.html#eventsdefaultmaxlisteners' },
      { label: 'MDN — Memory management', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management' },
    ],
  },
  {
    id: 'js-map-weakmap',
    category: 'javascript',
    level: 'senior',
    type: 'concept',
    prompt: 'Object vs Map vs WeakMap: when do you use each?',
    keyPoints: [
      'Plain objects: fixed, known keys (records, JSON payloads); keys are strings/symbols; inherited prototype keys and "__proto__" are a trap with user-controlled keys.',
      'Map: any key type, keeps insertion order, has size, iterable, better for frequent additions/removals and dynamic keys; not JSON-serialisable without conversion.',
      'WeakMap: object keys held weakly, so entries disappear when the key is garbage collected; not iterable, no size.',
      'WeakMap use cases: metadata or memoised results per object (e.g. per request or socket object) without leaking, private data.',
      'A Map used as a cache keeps every key alive forever unless you bound it; that is a common leak.',
    ],
    sources: [
      { label: 'MDN — WeakMap', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap' },
      { label: 'javascript.info — WeakMap and WeakSet', url: 'https://javascript.info/weakmap-weakset' },
    ],
  },
  {
    id: 'js-money-precision',
    category: 'javascript',
    level: 'senior',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'A payment provider calls this webhook with the body shown in the comment. Some valid payments are rejected and others mark the wrong order as paid. What is going on, and how should numbers like these be handled?',
    codeLang: 'js',
    code: `// Body: {"orderId": 1234567890123456789, "items": [{"price": 1.10, "qty": 3}], "paid": 3.30}
app.post('/webhooks/payment', express.json(), async (req, res) => {
  const { orderId, items, paid } = req.body;

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (total !== paid) {
    return res.status(400).send('Amount mismatch');
  }

  await orders.markPaid(orderId, total);
  res.sendStatus(204);
});`,
    keyPoints: [
      'Floating point: 1.10 * 3 is 3.3000000000000003, so total !== paid and a valid payment is rejected. Decimal fractions are not exactly representable in IEEE-754 doubles.',
      'Precision loss: JSON.parse turns 1234567890123456789 into 1234567890123456800 (above Number.MAX_SAFE_INTEGER), so the wrong order id reaches the database.',
      'Money: use integer minor units (cents) or a decimal library, round only at defined boundaries, and format with Intl.NumberFormat; never compare money floats with ===.',
      'Large ids: have producers send them as strings; otherwise parse with a big-number aware parser or a JSON.parse reviver that reads context.source (in engines that support it) and converts to BigInt.',
      'Same issue with databases: drivers such as node-postgres return BIGINT/NUMERIC as strings by default precisely to avoid this; don’t blindly convert them with Number().',
    ],
    sources: [
      { label: 'MDN — Number encoding', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#number_encoding' },
      { label: 'MDN — BigInt', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt' },
      { label: 'MDN — JSON.parse() (reviver and source text)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse' },
      { label: 'node-postgres — Data types', url: 'https://node-postgres.com/features/types' },
    ],
  },
  {
    id: 'js-immutability',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'This helper builds options for outgoing HTTP calls. After a while, unrelated requests start sending the wrong x-request-id and retries: 0. Why, and how would you fix it?',
    codeLang: 'js',
    code: `const DEFAULT_OPTIONS = {
  retries: 3,
  headers: { 'user-agent': 'billing-service' },
};

function buildRequestOptions(overrides) {
  const options = Object.assign(DEFAULT_OPTIONS, overrides);
  options.headers['x-request-id'] = overrides.requestId;
  return options;
}`,
    keyPoints: [
      'Object.assign mutates and returns its first argument, so every call writes into DEFAULT_OPTIONS; one caller’s retries: 0 leaks to every later call in the process.',
      'Module-level objects live as long as the process and are shared by all concurrent requests; here it can even leak one tenant’s headers (or tokens) into another’s request.',
      'Even { ...DEFAULT_OPTIONS, ...overrides } is not enough: the copy is shallow, so headers is still the shared object. Copy every level you change: headers: { ...DEFAULT_OPTIONS.headers, ...overrides.headers, "x-request-id": id }, or start from structuredClone(DEFAULT_OPTIONS).',
      'Freeze shared defaults (deeply, since Object.freeze is shallow): in strict-mode code a write then throws a TypeError instead of silently corrupting state.',
      'The same bug makes tests order-dependent, because test files that share a process share the mutated module.',
    ],
    sources: [
      { label: 'MDN — Object.assign()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign' },
      { label: 'MDN — Object.freeze()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze' },
      { label: 'javascript.info — Object references and copying', url: 'https://javascript.info/object-copy' },
    ],
  },
  {
    id: 'js-generators',
    category: 'javascript',
    level: 'senior',
    type: 'concept',
    prompt: 'What are generators and async iterators? Give real backend use cases.',
    keyPoints: [
      'function* returns an iterator; yield pauses execution, next() resumes and returns { value, done }.',
      'Iteration protocol: implement [Symbol.iterator] (or [Symbol.asyncIterator]) to make an object usable with for...of / for await...of and spread.',
      'Async generators: paginate a third-party API or a DB cursor lazily (yield each page or row), so callers just write for await (const row of allRows()).',
      'Node readable streams are async iterable (for await (const chunk of stream)), events.on() returns an async iterator of events, and Readable.from(asyncGenerator) turns a generator into a stream.',
      'Pull-based consumption gives natural backpressure; breaking out of for await calls return(), so put cleanup (closing cursors, destroying streams) in finally.',
    ],
    sources: [
      { label: 'MDN — function*', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*' },
      { label: 'MDN — for await...of', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of' },
      { label: 'Node.js — readable[Symbol.asyncIterator]()', url: 'https://nodejs.org/api/stream.html#readablesymbolasynciterator' },
      { label: 'javascript.info — Async iteration and generators', url: 'https://javascript.info/async-iterators-generators' },
    ],
  },
  {
    id: 'js-promise-all-impl',
    category: 'javascript',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement `promiseAll(items)` that behaves like Promise.all. Bonus: implement `runWithLimit(tasks, limit)` that runs async tasks with a maximum concurrency (e.g. to avoid exhausting a connection pool).',
    codeLang: 'js',
    code: `function promiseAll(items) {
  // items may contain promises and plain values
}

// tasks: Array<() => Promise<T>>
async function runWithLimit(tasks, limit) {
  // resolve with results in the original order
}`,
    keyPoints: [
      'Return a new Promise; handle the empty array by resolving [] immediately.',
      'Wrap each item with Promise.resolve(item) so plain values work.',
      'Store each result at its index (not push) and count completions; resolve when count === length.',
      'Reject on the first rejection.',
      'Concurrency pool: start `limit` workers that each take the next index from a shared counter until tasks run out; await Promise.all(workers).',
    ],
    sources: [
      { label: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
      { label: 'javascript.info — Promise API', url: 'https://javascript.info/promise-api' },
    ],
  },
  {
    id: 'js-class-this',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Every request to this route fails. Why? Fix it in two ways and point out a second issue.',
    codeLang: 'js',
    code: `class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async getUser(req, res) {
    const user = await this.userService.findById(req.params.id);
    res.json(user);
  }
}

const controller = new UserController(userService);
router.get('/users/:id', controller.getUser);`,
    keyPoints: [
      'controller.getUser is passed as a plain function reference; Express calls it without a receiver, and class bodies are strict mode, so this is undefined: TypeError "Cannot read properties of undefined (reading \'userService\')".',
      'Fix 1: bind or wrap at registration: controller.getUser.bind(controller) or (req, res) => controller.getUser(req, res).',
      'Fix 2: declare it as a class field arrow function (getUser = async (req, res) => { ... }), which captures this per instance (it lives on the instance, not the prototype).',
      'Second issue: a missing user sends 200 with null instead of a 404, and in Express 4 a rejected promise from an async handler is not passed to the error middleware (Express 5 does forward it), so wrap it or call next(err).',
    ],
    sources: [
      { label: 'MDN — this', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this' },
      { label: 'MDN — Classes', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes' },
      { label: 'Express — Error handling', url: 'https://expressjs.com/en/guide/error-handling/' },
    ],
  },
  {
    id: 'js-fetch-errors',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'This helper calls another internal service with the global fetch. It misreports errors and can hang your own API. What is wrong?',
    codeLang: 'js',
    code: `async function getUser(id) {
  try {
    const res = await fetch(\`\${process.env.USERS_URL}/users/\${id}\`);
    return await res.json();
  } catch (e) {
    throw new Error('Users service unavailable');
  }
}`,
    keyPoints: [
      'fetch only rejects on network failure; 404/500 resolve normally, so check res.ok / res.status and map them deliberately (404 → null or NotFound, 5xx → upstream error / 502 to your own client).',
      'An HTML error page from a proxy or gateway makes res.json() throw a SyntaxError, which is then mislabelled as "unavailable".',
      'The original error is lost; use new Error("...", { cause: e }) or rethrow so logs keep the real reason.',
      'No timeout: if the upstream hangs, your request hangs too; pass signal: AbortSignal.timeout(ms) and consider retries with backoff only for idempotent calls.',
      'id is not encoded (encodeURIComponent), so a value like "../admin" changes the path; on error paths consume or cancel the body so the connection can be reused.',
    ],
    sources: [
      {
        label: 'MDN — Using the Fetch API (checking the response)',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
      },
      { label: 'MDN — Error: cause', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause' },
      { label: 'MDN — AbortSignal.timeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static' },
    ],
  },
  {
    id: 'js-array-methods',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'map vs forEach vs filter vs reduce: when do you use each? Which array methods mutate the original array?',
    keyPoints: [
      'map: transform each item into a new array (e.g. DB rows → response DTOs). forEach: side effects only, returns undefined (and doesn’t await async callbacks).',
      'filter: keep items matching a predicate. reduce: fold into one value (sums, indexes by id); often less readable than a loop or Object.groupBy (ES2024).',
      'Mutating: push, pop, shift, unshift, splice, sort, reverse, fill, copyWithin.',
      'Non-mutating copies (ES2023): toSorted, toReversed, toSpliced, with.',
    ],
    sources: [
      {
        label: 'MDN — Array: copying methods and mutating methods',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#copying_methods_and_mutating_methods',
      },
      { label: 'MDN — Object.groupBy()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy' },
    ],
  },
];
