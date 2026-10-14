import type { Question } from '../types';

export const javascript: Question[] = [
  {
    id: 'js-closures',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'What is a closure? Give a practical use and a common pitfall.',
    keyPoints: [
      'A function together with the lexical scope it was created in; it keeps access to those variables after the outer function returns.',
      'Uses: private state (module pattern, counters), function factories, memoisation, event handlers, debounce; hooks depend heavily on closures.',
      'Pitfalls: stale closures in React (callbacks seeing old state), unintentionally retaining large objects in memory, var in loops.',
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
    id: 'js-event-loop',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'In what order are the numbers logged? Explain using the event loop.',
    codeLang: 'js',
    code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
queueMicrotask(() => console.log('4'));

(async () => {
  console.log('5');
  await null;
  console.log('6');
})();

console.log('7');`,
    keyPoints: [
      'Order: 1, 5, 7, 3, 4, 6, 2.',
      'Synchronous code runs first: 1, then 5 (an async function runs synchronously until the first await), then 7.',
      'Microtasks (promise callbacks, queueMicrotask, code after await) run in FIFO order once the call stack is empty: 3, 4, 6.',
      'The microtask queue is fully drained before the next macrotask (timer) runs: 2 last.',
      'Rendering can happen between macrotasks; a never-ending microtask chain blocks rendering.',
    ],
    sources: [
      { label: 'MDN — Using microtasks', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide' },
      { label: 'javascript.info — Event loop', url: 'https://javascript.info/event-loop' },
      { label: 'Philip Roberts — What the heck is the event loop anyway?', url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ' },
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
      'B: TypeError. The method is detached, so this is undefined in strict mode (in sloppy mode it would be globalThis).',
      'C: "Hi Grace" (explicit binding with bind).',
      'D: "Ada". Arrow functions don’t have their own this; they take it from greetLater’s call.',
      'this is decided by how a function is called: new > explicit (call/apply/bind) > implicit (obj.fn()) > default.',
      'This is why class component methods had to be bound before being passed as event handlers.',
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
      'Use Object.hasOwn to check own properties; never modify built-in prototypes.',
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
      'var: function-scoped, hoisted as undefined, can be redeclared, creates a property on the global object at top level in scripts.',
      'let/const: block-scoped, temporal dead zone, no redeclaration.',
      'const prevents reassigning the binding, not mutating the value: const obj = {}; obj.x = 1 is allowed.',
      'For immutability use Object.freeze (shallow), immutable update patterns, or readonly types in TypeScript.',
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
    prompt: 'Explain == vs === vs Object.is, with a few surprising examples. Which one does React use?',
    keyPoints: [
      '=== compares without type coercion; == coerces first.',
      'Surprises: null == undefined (true), "" == 0 (true), "0" == false (true), [] == false (true).',
      'NaN === NaN is false; Object.is(NaN, NaN) is true; Object.is(0, -0) is false.',
      'Objects and arrays compare by reference, never by content.',
      'React uses Object.is to compare state and hook dependencies.',
    ],
    sources: [
      { label: 'MDN — Equality comparisons and sameness', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness' },
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
      '"string": JSON turns Dates into ISO strings; it also drops undefined and functions, turns NaN into null, loses Map/Set and throws on circular references.',
      'true: structuredClone deep-copies most built-ins (Date, Map, Set, typed arrays, circular references).',
      'structuredClone can’t clone functions or DOM nodes and doesn’t keep class prototypes.',
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
    prompt: 'Promise.all vs Promise.allSettled vs Promise.race vs Promise.any: when would you use each? How do you handle errors?',
    keyPoints: [
      'all: fulfils with all results in order; rejects on the first rejection (the other operations keep running, they are not cancelled).',
      'allSettled: waits for everything and returns { status, value | reason } objects; good for independent requests.',
      'race: settles like the first promise to settle (fulfil or reject); used for timeouts.',
      'any: fulfils with the first success; rejects with AggregateError if all fail; good for redundant sources.',
      'Handle errors with try/await or .catch; real cancellation needs AbortController.',
    ],
    sources: [
      { label: 'MDN — Promise.all()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all' },
      { label: 'MDN — Promise.allSettled()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled' },
      { label: 'MDN — Promise.any()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any' },
    ],
  },
  {
    id: 'js-async-foreach',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'processAll always returns an empty array. Why? Show two fixes and when you’d pick each.',
    codeLang: 'js',
    code: `async function processAll(ids) {
  const results = [];
  ids.forEach(async (id) => {
    const data = await fetchItem(id);
    results.push(data);
  });
  return results;
}`,
    keyPoints: [
      'forEach ignores the promises returned by async callbacks; the function returns before any fetch finishes.',
      'Rejections become unhandled; push order would follow completion, not input order.',
      'Parallel fix: return Promise.all(ids.map(fetchItem)) (keeps input order).',
      'Sequential fix: for (const id of ids) { results.push(await fetchItem(id)); } (rate limits, dependent steps).',
      'For many requests, limit concurrency (a small pool or p-limit).',
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
    prompt: 'When the API fails, the error is never logged and callers get a rejection instead of null. Why?',
    codeLang: 'js',
    code: `async function save(data) {
  try {
    return api.post('/save', data);
  } catch (err) {
    logError(err);
    return null;
  }
}`,
    keyPoints: [
      'The promise is returned without await, so the function exits the try block before the promise rejects; the catch never runs.',
      'Use return await inside try/catch so the rejection is thrown inside the try.',
      'Outside try/catch, return vs return await behaves the same apart from stack traces.',
      'Lint for floating promises (@typescript-eslint/no-floating-promises).',
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
      'Implement `debounce(fn, wait)` in your answer. Then explain how throttle differs, and how you would use a debounced function correctly inside a React component.',
    codeLang: 'js',
    code: `// const debounced = debounce((q) => search(q), 300);
// input.addEventListener('input', (e) => debounced(e.target.value));

function debounce(fn, wait) {
  // your implementation
}`,
    keyPoints: [
      'Keep a timer id in a closure; on each call clearTimeout and set a new timeout that calls fn.apply(this, args).',
      'Debounce: run once activity stops for wait ms (search input, resize end). Throttle: run at most once per wait ms (scroll, pointermove).',
      'Nice to have: leading/trailing options, a cancel() method, returning a flush().',
      'React: create the debounced function once (useMemo/useRef), not on every render, and cancel it in effect cleanup on unmount.',
      'Alternative for rendering cost: useDeferredValue.',
    ],
    sources: [
      { label: 'MDN — Debounce', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Debounce' },
      { label: 'MDN — Throttle', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Throttle' },
      { label: 'javascript.info — Decorators and forwarding, call/apply', url: 'https://javascript.info/call-apply-decorators' },
    ],
  },
  {
    id: 'js-sort',
    category: 'javascript',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'What does each line print? Why can sort() cause bugs in React code?',
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
      'In React, sorting props or state in place mutates data you don’t own; use toSorted() (ES2023) or [...arr].sort().',
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
      '"number": NaN is a number value; use Number.isNaN.',
      'true: [] becomes "" and then 0, false becomes 0. Use ===.',
      '9007199254740992: integers above 2^53 − 1 lose precision; use BigInt, and keep large API ids as strings.',
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
      'options.retries would throw first if options itself were undefined.',
    ],
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
    prompt: 'ES modules vs CommonJS: what are the differences, and why do they matter for frontend tooling?',
    keyPoints: [
      'ESM: static import/export, analysable at build time (enables tree-shaking), live bindings, asynchronous loading, top-level await, native in browsers.',
      'CommonJS: require() is dynamic and synchronous; module.exports is a plain object.',
      'Interop issues: default export differences, dual packages, "type": "module", .mjs/.cjs, the "exports" field in package.json.',
      'Bundlers tree-shake ESM much better than CJS.',
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
    prompt: 'What typically causes memory leaks in front-end apps, and how do you find them?',
    keyPoints: [
      'Listeners, timers, subscriptions and observers that are never removed.',
      'Detached DOM nodes still referenced from JS (closures, caches, arrays).',
      'Unbounded caches/maps (use LRU or WeakMap), global variables, closures retaining large objects, third-party widgets not destroyed.',
      'Find with Chrome DevTools Memory: compare heap snapshots before/after repeating an action, allocation timeline, filter detached elements.',
      'Watch the Performance monitor for a heap that grows and never drops after GC.',
    ],
    sources: [
      { label: 'Chrome DevTools — Fix memory problems', url: 'https://developer.chrome.com/docs/devtools/memory-problems' },
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
      'Plain objects: fixed, known keys (records); keys are strings/symbols; inherited prototype keys can be a trap.',
      'Map: any key type, keeps insertion order, has size, iterable, better for frequent additions/removals and dynamic keys.',
      'WeakMap: object keys held weakly, so entries disappear when the key is garbage collected; not iterable, no size.',
      'WeakMap use cases: metadata/cache per object or DOM node without leaking, private data.',
    ],
    sources: [
      { label: 'MDN — WeakMap', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap' },
      { label: 'javascript.info — WeakMap and WeakSet', url: 'https://javascript.info/weakmap-weakset' },
    ],
  },
  {
    id: 'js-event-delegation',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'Explain event capturing, bubbling and delegation. What is the difference between stopPropagation and preventDefault?',
    keyPoints: [
      'Events travel down (capture phase) to the target and then back up (bubble phase); addEventListener listens in the bubble phase unless { capture: true }.',
      'Delegation: one listener on a parent handles events from many children via event.target.closest(selector); works for elements added later and uses fewer listeners.',
      'stopPropagation stops the event from travelling further; preventDefault cancels the browser’s default action (form submit, link navigation).',
      'React itself uses delegation at the root container.',
    ],
    sources: [
      { label: 'MDN — Event bubbling', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling' },
      { label: 'javascript.info — Event delegation', url: 'https://javascript.info/event-delegation' },
    ],
  },
  {
    id: 'js-immutability',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'Why does immutability matter in React and Redux? How do you update a deeply nested object immutably?',
    keyPoints: [
      'React and selectors detect changes by reference; mutation keeps the same reference, so updates are missed.',
      'Immutable data makes change detection cheap, enables memoisation, undo/time-travel and safe concurrent rendering.',
      'Nested update: copy every level on the path: { ...state, user: { ...state.user, address: { ...state.user.address, city } } }.',
      'Non-mutating array methods: map, filter, concat, toSorted, toSpliced, with.',
      'Object.freeze is shallow; Immer lets you write mutating code that produces immutable updates.',
    ],
    sources: [
      { label: 'react.dev — Updating Objects in State', url: 'https://react.dev/learn/updating-objects-in-state' },
      { label: 'Immer', url: 'https://immerjs.github.io/immer/' },
    ],
  },
  {
    id: 'js-generators',
    category: 'javascript',
    level: 'senior',
    type: 'concept',
    prompt: 'What are generators and iterators? Give real use cases, including async iterators.',
    keyPoints: [
      'function* returns an iterator; yield pauses execution, next() resumes and returns { value, done }.',
      'Iteration protocol: implement [Symbol.iterator] to make an object usable with for...of and spread.',
      'Use cases: lazy or infinite sequences, pipelines over large data, custom traversals (trees).',
      'Async generators with for await...of: paginated APIs, reading streams chunk by chunk.',
      'Historically used by redux-saga for side-effect orchestration.',
    ],
    sources: [
      { label: 'MDN — function*', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*' },
      { label: 'MDN — Iteration protocols', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols' },
      { label: 'javascript.info — Generators', url: 'https://javascript.info/generators' },
    ],
  },
  {
    id: 'js-promise-all-impl',
    category: 'javascript',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement `promiseAll(items)` that behaves like Promise.all. Bonus: implement `runWithLimit(tasks, limit)` that runs async tasks with a maximum concurrency.',
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
    prompt: 'You’ll still meet class components in legacy code. Clicking this button throws. Why? Fix it in two ways and point out a second issue.',
    codeLang: 'jsx',
    code: `class Toggle extends React.Component {
  state = { on: false };

  handleClick() {
    this.setState({ on: !this.state.on });
  }

  render() {
    return <button onClick={this.handleClick}>{String(this.state.on)}</button>;
  }
}`,
    keyPoints: [
      'this.handleClick is passed as a plain function reference, so this is undefined when React calls it: TypeError.',
      'Fix 1: class field arrow function handleClick = () => { ... }.',
      'Fix 2: this.handleClick = this.handleClick.bind(this) in the constructor.',
      'Second issue: the next state depends on the previous one; use this.setState(prev => ({ on: !prev.on })).',
    ],
    sources: [
      { label: 'Legacy React docs — Handling Events', url: 'https://legacy.reactjs.org/docs/handling-events.html' },
      { label: 'MDN — this', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this' },
    ],
  },
  {
    id: 'js-fetch-errors',
    category: 'javascript',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'This helper misreports errors. What is wrong?',
    codeLang: 'js',
    code: `async function getUser(id) {
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    return await res.json();
  } catch (e) {
    throw new Error('Network error');
  }
}`,
    keyPoints: [
      'fetch only rejects on network failure; 404/500 resolve normally, so check res.ok / res.status.',
      'An HTML error page makes res.json() throw a SyntaxError, which is then mislabelled as "Network error".',
      'The original error is lost; use new Error("...", { cause: e }) or rethrow.',
      'No timeout or abort signal; id is not URL-encoded.',
    ],
    sources: [
      {
        label: 'MDN — Using the Fetch API (checking the response)',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
      },
      { label: 'MDN — Error: cause', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause' },
    ],
  },
  {
    id: 'js-array-methods',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'map vs forEach vs filter vs reduce: when do you use each? Which array methods mutate the original array?',
    keyPoints: [
      'map: transform each item into a new array (rendering lists in JSX). forEach: side effects only, returns undefined.',
      'filter: keep items matching a predicate. reduce: fold into one value (sums, grouping); often less readable than a loop or Object.groupBy.',
      'Mutating: push, pop, shift, unshift, splice, sort, reverse, fill, copyWithin.',
      'Non-mutating copies (ES2023): toSorted, toReversed, toSpliced, with.',
    ],
    sources: [
      {
        label: 'MDN — Array: copying methods and mutating methods',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#copying_methods_and_mutating_methods',
      },
    ],
  },
];
