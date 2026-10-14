import type { Question } from '../types';

const CJS_DOCS = { label: 'Node.js docs — Modules: CommonJS modules', url: 'https://nodejs.org/api/modules.html' };
const ESM_DOCS = { label: 'Node.js docs — Modules: ECMAScript modules', url: 'https://nodejs.org/api/esm.html' };
const PACKAGES_DOCS = { label: 'Node.js docs — Modules: Packages', url: 'https://nodejs.org/api/packages.html' };
const PACKAGE_JSON_DOCS = { label: 'npm Docs — package.json', url: 'https://docs.npmjs.com/cli/v11/configuring-npm/package-json' };
const RELEASES = { label: 'Node.js — Node.js Releases', url: 'https://nodejs.org/en/about/previous-releases' };

export const nodeFundamentals: Question[] = [
  {
    id: 'nf-what-is-node',
    category: 'node-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt:
      'What is Node.js, really? Explain how a runtime that runs your JavaScript on a single thread can serve thousands of concurrent connections, and give examples of workloads where you would and would not choose Node.',
    keyPoints: [
      'A JavaScript runtime: Google’s V8 engine compiles and runs the JS, libuv provides the event loop, asynchronous I/O and a thread pool, and C++ bindings expose OS features (fs, net, crypto, child processes).',
      'Your JavaScript runs on one main thread. I/O is non-blocking: sockets are handed to the OS (epoll, kqueue, IOCP), some work goes to libuv’s thread pool, and your callback runs when the result is ready.',
      'Concurrency comes from not waiting: while one request awaits the database, the same thread serves other requests. It is not parallel execution of your JS code.',
      'Good fit: I/O-bound services such as APIs and BFFs, real-time apps (WebSockets, chat), streaming and proxies, CLIs and tooling, and sharing code and types with a JS/TS frontend.',
      'Poor fit as-is: CPU-heavy work on the main thread (image/video processing, heavy number crunching, ML inference) blocks every request. Offload it to worker_threads, a job queue or a service in another language.',
      '“Single-threaded” describes JS execution only: the process also has libuv pool threads and V8 GC/compiler threads, and worker_threads or cluster add more.',
    ],
    followUps: ['What happens to the other requests if one handler runs a 2-second synchronous loop?'],
    sources: [
      { label: 'Node.js — Introduction to Node.js', url: 'https://nodejs.org/learn/getting-started/introduction-to-nodejs' },
      {
        label: 'Node.js — Overview of Blocking vs Non-Blocking',
        url: 'https://nodejs.org/learn/asynchronous-work/overview-of-blocking-vs-non-blocking',
      },
      { label: 'libuv — Design overview', url: 'https://docs.libuv.org/en/v1.x/design.html' },
    ],
  },
  {
    id: 'nf-cjs-vs-esm',
    category: 'node-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt:
      'A new teammate asks why some files in the repo use `require()` and others use `import`. Explain CommonJS vs ES modules in Node, and how Node decides which module system a given file uses.',
    keyPoints: [
      'CommonJS: require() and module.exports, loaded synchronously and resolved at runtime (a require can be conditional or computed). Each file is wrapped in a function that provides require, module, exports, __filename and __dirname.',
      'ESM: import/export, the JavaScript standard shared with browsers. Imports are static and linked before the code runs (live bindings, tree shaking), loading is asynchronous, top-level await is allowed, and code is always strict mode.',
      'Node decides per file: .mjs is ESM, .cjs is CommonJS, and .js follows the nearest package.json "type" field ("module" → ESM, "commonjs" or absent → CommonJS). Newer versions also detect ESM syntax in ambiguous .js files, but setting "type" explicitly is clearer and faster.',
      'ESM differences that bite: relative imports need the full extension (./utils.js), and there is no require, __dirname or __filename (use import.meta.dirname / import.meta.filename, or createRequire).',
      'Interop: ESM can import CommonJS (module.exports becomes the default export; named exports are detected on a best-effort basis). CommonJS can load ESM with dynamic import(), and in current LTS lines with require() as long as the ES module graph has no top-level await.',
      'New projects generally start as ESM; plenty of older packages and codebases are still CommonJS.',
    ],
    followUps: ['What would you check before converting an existing CommonJS service to ESM?'],
    sources: [
      { label: 'Node.js docs — Determining module system', url: 'https://nodejs.org/api/packages.html#determining-module-system' },
      ESM_DOCS,
      CJS_DOCS,
    ],
  },
  {
    id: 'nf-esm-migration',
    category: 'node-fundamentals',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'You added `"type": "module"` to package.json and now the server will not start. Find every problem in this file and fix it.',
    codeLang: 'js',
    code: `// src/server.js
import express from 'express';
import { loadRoutes } from './routes';
import config from './config.json';

const publicDir = __dirname + '/public';
const pkg = require('../package.json');

const app = express();
app.use(express.static(publicDir));
loadRoutes(app);

app.listen(config.port, () => {
  console.log(\`\${pkg.name} listening on \${config.port}\`);
});`,
    keyPoints: [
      'import from \'./routes\' fails with ERR_MODULE_NOT_FOUND: ESM does not guess extensions or index files. Write \'./routes.js\' (or \'./routes/index.js\').',
      'JSON imports need an import attribute: import config from \'./config.json\' with { type: \'json\' }; (or read the file and JSON.parse it).',
      '__dirname is not defined in ESM. Use import.meta.dirname (or path.dirname(fileURLToPath(import.meta.url)) on older versions) and build the path with path.join(import.meta.dirname, \'public\') instead of string concatenation.',
      'require is not defined in ESM. Use an import with the JSON attribute, or createRequire(import.meta.url) from node:module when you really need require.',
      'Also check the rest of the codebase: module.exports/exports must become export statements, top-level this is undefined, and every file is now strict mode.',
    ],
    followUps: ['Could you have kept this single file as CommonJS while the rest of the project moves to ESM? How?'],
    sources: [
      { label: 'Node.js docs — ESM: mandatory file extensions', url: 'https://nodejs.org/api/esm.html#mandatory-file-extensions' },
      { label: 'Node.js docs — ESM: import.meta.dirname', url: 'https://nodejs.org/api/esm.html#importmetadirname' },
      { label: 'Node.js docs — ESM: JSON modules', url: 'https://nodejs.org/api/esm.html#json-modules' },
    ],
  },
  {
    id: 'nf-package-deps',
    category: 'node-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt:
      'Walk me through a package.json: what belongs in dependencies, devDependencies and peerDependencies, and what exactly do `^1.4.2` and `~1.4.2` allow npm to install?',
    keyPoints: [
      'dependencies: needed at runtime in production (express, pg, zod). They are also installed for anyone who installs your package.',
      'devDependencies: only needed to build, test or lint (typescript, vitest, eslint). They are not installed when your package is someone else’s dependency, and are skipped by npm install --omit=dev.',
      'peerDependencies: “the host project must provide this”. Used by plugins and libraries that must share one instance with the app (react for a component library, eslint for an eslint plugin). npm 7+ installs peers automatically and fails on conflicting ranges (ERESOLVE) unless you use --legacy-peer-deps.',
      'Semver is MAJOR.MINOR.PATCH. ^1.4.2 means >=1.4.2 <2.0.0 (new minors and patches); ~1.4.2 means >=1.4.2 <1.5.0 (patches only). For 0.x versions the caret is stricter: ^0.4.2 means <0.5.0.',
      'Ranges say what is acceptable; the lockfile records what was actually installed, which is what makes installs reproducible.',
    ],
    followUps: ['Why do libraries often list the same package in both peerDependencies and devDependencies?'],
    sources: [
      PACKAGE_JSON_DOCS,
      { label: 'npm Docs — About semantic versioning', url: 'https://docs.npmjs.com/about-semantic-versioning' },
      { label: 'node-semver — README (ranges)', url: 'https://github.com/npm/node-semver' },
    ],
  },
  {
    id: 'nf-env-strings',
    category: 'node-fundamentals',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt:
      'The service is started with `PORT=8080 node app.js --verbose -n 3`. What does it print, and what does that tell you about `process.env` and `process.argv`?',
    codeLang: 'js',
    code: `// app.js
const port = process.env.PORT || 3000;
console.log(port + 1);

process.env.DEBUG = false;
if (process.env.DEBUG) console.log('debug on');

process.env.TIMEOUT = undefined;
console.log(typeof process.env.TIMEOUT, process.env.TIMEOUT);

console.log(process.argv.slice(2));`,
    keyPoints: [
      'Output: 80801, then debug on, then string undefined, then [ \'--verbose\', \'-n\', \'3\' ].',
      'Every value in process.env is a string: \'8080\' + 1 is string concatenation. Parse and validate explicitly, e.g. Number(process.env.PORT ?? 3000).',
      'Assigning to process.env converts the value to a string, so false becomes \'false\' (truthy) and undefined becomes \'undefined\'. Use delete process.env.X to unset, and compare flags against explicit values such as \'true\' or \'1\'.',
      'process.argv[0] is the node executable and argv[1] the script path; user arguments start at index 2. util.parseArgs is the built-in way to parse them.',
      'Good practice: read and validate configuration once at startup (a schema with zod or envalid), fail fast with a clear message, and pass a typed config object around instead of reading process.env all over the code.',
    ],
    sources: [
      { label: 'Node.js docs — process.env', url: 'https://nodejs.org/api/process.html#processenv' },
      { label: 'Node.js docs — process.argv', url: 'https://nodejs.org/api/process.html#processargv' },
      {
        label: 'Node.js — How to read environment variables from Node.js',
        url: 'https://nodejs.org/learn/command-line/how-to-read-environment-variables-from-nodejs',
      },
    ],
  },
  {
    id: 'nf-node-prefix',
    category: 'node-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt:
      'Why do modern codebases write `import fs from \'node:fs\'` instead of `from \'fs\'`? Is there any case where the prefix is mandatory?',
    keyPoints: [
      'node: always resolves to the built-in module: it never looks in node_modules and bypasses the require cache, so a package or local file with the same name cannot shadow it.',
      'It makes core imports obvious to readers and tools (bundlers, linters, other runtimes such as Deno and Bun that support node: specifiers).',
      'Some newer built-ins are only available with the prefix, to avoid clashing with existing npm packages: node:test, node:sqlite and node:sea, for example. require(\'test\') would load the npm package called test.',
      'It works with both require() and import in all supported Node versions; lint rules such as unicorn/prefer-node-protocol can enforce it.',
      'module.builtinModules lists the built-in modules, including the prefix-only ones.',
    ],
    sources: [
      { label: 'Node.js docs — Built-in modules', url: 'https://nodejs.org/api/modules.html#built-in-modules' },
      {
        label: 'Node.js docs — Built-in modules with mandatory node: prefix',
        url: 'https://nodejs.org/api/modules.html#built-in-modules-with-mandatory-node-prefix',
      },
    ],
  },
  {
    id: 'nf-release-schedule',
    category: 'node-fundamentals',
    level: 'junior',
    type: 'concept',
    prompt:
      'Your team is choosing a Node version for a new production service. Explain Current vs LTS releases and how you would make sure laptops, CI and production all run the same version.',
    keyPoints: [
      'Every new major starts in the Current phase for about six months. Historically (up to Node 26) a new major shipped every six months: even-numbered majors were promoted to LTS and odd-numbered ones reached end of life after a few months. From Node 27 the project moves to one major per year, and every major becomes LTS.',
      'LTS lines go through Active LTS (fixes and backported features) and then Maintenance (critical bugs and security fixes), for roughly 30 months of support in total.',
      'Production should run Active or Maintenance LTS only. Use Current to try new features and test your code early; never run an end-of-life version, because it no longer gets security fixes.',
      'Pin the version everywhere: a .nvmrc or .node-version file for nvm/fnm/Volta, the same major in the Docker base image (e.g. node:24-slim) and in CI (actions/setup-node can read node-version-file).',
      '"engines": { "node": ">=24" } in package.json documents the requirement; npm only warns by default unless engine-strict is set.',
      'Plan major upgrades as routine work: run the test suite on the next LTS early and read the release notes for breaking changes and deprecations.',
    ],
    followUps: ['How would you roll out a Node major upgrade across 20 services safely?'],
    sources: [
      RELEASES,
      { label: 'nodejs/Release — Release schedule', url: 'https://github.com/nodejs/Release' },
      { label: 'npm Docs — package.json: engines', url: 'https://docs.npmjs.com/cli/v11/configuring-npm/package-json#engines' },
    ],
  },
  {
    id: 'nf-npm-ci',
    category: 'node-fundamentals',
    level: 'mid',
    type: 'concept',
    prompt:
      'A CI build broke overnight because a transitive dependency published a bad patch release, even though nobody touched package.json. Explain what lockfiles guarantee, the difference between `npm install` and `npm ci`, and how you would set up installs for CI and Docker images.',
    keyPoints: [
      'package.json holds version ranges; package-lock.json records the exact resolved version, source and integrity hash of every package in the tree, including transitive ones. Applications must commit it.',
      'npm install resolves from package.json, adds or updates packages and may rewrite the lockfile. It is the development command.',
      'npm ci installs exactly what the lockfile says, fails if package.json and the lockfile disagree, never writes to package.json or the lockfile, and removes an existing node_modules first. Use it in CI and Docker builds: reproducible and usually faster.',
      'Production images: npm ci --omit=dev (or a multi-stage build), and copy package.json and package-lock.json before the source so the dependency layer is cached.',
      'A library’s package-lock.json is not published and has no effect on consumers, so libraries should also be tested against freshly resolved dependencies.',
      'Supply chain: integrity hashes catch tampered tarballs; combine with npm audit, automated and reviewed upgrades (Renovate, Dependabot) and --ignore-scripts where install scripts are not needed.',
      'npx runs a package binary, preferring the local node_modules/.bin and otherwise downloading it temporarily. For project tooling prefer a pinned devDependency plus an npm script.',
    ],
    followUps: ['A developer’s lockfile changes on every npm install. What could cause that?'],
    sources: [
      { label: 'npm Docs — npm ci', url: 'https://docs.npmjs.com/cli/v11/commands/npm-ci' },
      { label: 'npm Docs — package-lock.json', url: 'https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json' },
      { label: 'npm Docs — npx', url: 'https://docs.npmjs.com/cli/v11/commands/npx' },
    ],
  },
  {
    id: 'nf-exports-field',
    category: 'node-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'You released v2.1.0 of an internal library with this manifest. Now one service fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` on `import { slugify } from \'@acme/utils/strings\'`, and an older CommonJS service fails on `require(\'@acme/utils\')`. What happened and how would you fix the manifest?',
    codeLang: 'json',
    code: `{
  "name": "@acme/utils",
  "version": "2.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "exports": "./dist/index.js",
  "files": ["dist"]
}`,
    keyPoints: [
      'Once "exports" is defined, it wins over "main" and is the complete public API: only the listed entry points can be imported, so the deep import @acme/utils/strings now throws ERR_PACKAGE_PATH_NOT_EXPORTED.',
      '"main" is ignored, so require() resolves ./dist/index.js, an ES module. Node versions without require(esm) throw ERR_REQUIRE_ESM; newer ones load it unless the graph uses top-level await (ERR_REQUIRE_ASYNC_MODULE).',
      'Fix with conditional and subpath exports, e.g. ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" }, plus "./strings": { ... } and "./package.json": "./package.json" if tools read it.',
      'Conditions are matched in object order, first match wins: put "types" first and "default" last.',
      'Adding or narrowing "exports" is a breaking change and belongs in a major release, not a minor. Validate the package with tools such as publint or arethetypeswrong before publishing.',
      'Shipping both ESM and CJS builds risks the dual package hazard (two copies of module state); consider ESM-only, or one build wrapping the other.',
    ],
    sources: [
      { label: 'Node.js docs — Package entry points', url: 'https://nodejs.org/api/packages.html#package-entry-points' },
      { label: 'Node.js docs — Conditional exports', url: 'https://nodejs.org/api/packages.html#conditional-exports' },
      { label: 'Node.js docs — ERR_PACKAGE_PATH_NOT_EXPORTED', url: 'https://nodejs.org/api/errors.html#err_package_path_not_exported' },
    ],
  },
  {
    id: 'nf-circular-require',
    category: 'node-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'Given these three CommonJS files, what does `node main.js` print? Explain module caching and what goes wrong with the cycle.',
    codeLang: 'js',
    code: `// a.js
const b = require('./b');
module.exports = { name: 'a', hello: () => 'hi from a' };
console.log('a sees', b.name);

// b.js
const a = require('./a');
console.log('b sees', a.name);
module.exports = { name: 'b', callA: () => a.hello() };

// main.js
const a = require('./a');
const b = require('./b');
console.log(a.hello());
console.log(b.callA());`,
    keyPoints: [
      'Output: b sees undefined, a sees b, hi from a, then the process crashes with TypeError: a.hello is not a function (thrown from b.callA).',
      'Modules are cached by resolved filename after the first require: each file runs once, and main’s require(\'./b\') returns the cached b without running it again.',
      'In a cycle, require returns the unfinished exports object of the module that is still loading, so b receives a’s initial, empty exports object.',
      'a then replaces module.exports with a new object, but b still holds the old empty one, so a.name is undefined and a.hello does not exist. Adding properties to exports instead of reassigning it, or requiring lazily inside callA, would hide the problem.',
      'Real fix: break the cycle by moving the shared code into a third module or injecting the dependency. ESM handles cycles with live bindings but still throws a ReferenceError if a binding is used before its module has run.',
      'Tools such as madge or the import/no-cycle lint rule detect cycles in CI.',
    ],
    sources: [
      { label: 'Node.js docs — CommonJS: Cycles', url: 'https://nodejs.org/api/modules.html#cycles' },
      { label: 'Node.js docs — CommonJS: Caching', url: 'https://nodejs.org/api/modules.html#caching' },
    ],
  },
  {
    id: 'nf-process-exit',
    category: 'node-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'This nightly export script reports success, but some mornings the last few hundred rows are missing from report.csv. What is wrong with how it finishes, and how would you rewrite the ending?',
    codeLang: 'js',
    code: `import { createWriteStream } from 'node:fs';

const out = createWriteStream('report.csv');

async function main() {
  const rows = await fetchRows();
  for (const row of rows) out.write(toCsv(row) + '\\n');
  console.log(\`exported \${rows.length} rows\`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});`,
    keyPoints: [
      'process.exit() terminates the process as soon as possible, even with pending asynchronous work, so data still buffered in the write stream (and sometimes in stdout/stderr) is lost.',
      'Writes are asynchronous: end the stream and wait for it (out.end(); await finished(out) from node:stream/promises, or use pipeline()). Large loops should also respect backpressure: when write() returns false, wait for \'drain\'.',
      'Let the process exit naturally once the event loop is empty, and set process.exitCode = 1 on failure instead of calling process.exit(1).',
      'If the process does not exit by itself, something is still open (DB pool, timer, socket). Close it explicitly rather than masking the leak with process.exit.',
      'process.exit is reasonable in narrow cases: after logging in an uncaughtException handler, or as a hard timeout during shutdown. \'exit\' listeners can only run synchronous code.',
      'Exit codes are a contract with shells, CI and orchestrators: 0 is success; Node uses 1 for an uncaught exception and 128 + signal number when killed by a fatal signal.',
    ],
    sources: [
      { label: 'Node.js docs — process.exit()', url: 'https://nodejs.org/api/process.html#processexitcode' },
      { label: 'Node.js docs — process.exitCode', url: 'https://nodejs.org/api/process.html#processexitcode-1' },
      { label: 'Node.js docs — Exit codes', url: 'https://nodejs.org/api/process.html#exit-codes' },
    ],
  },
  {
    id: 'nf-emitter-leak',
    category: 'node-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'After a few hours this service logs `MaxListenersExceededWarning: Possible EventEmitter memory leak detected` and its memory keeps growing. Once in a while it also crashes outright when the price feed restarts. Find the bugs.',
    codeLang: 'js',
    code: `import { EventEmitter } from 'node:events';
import http from 'node:http';
import net from 'node:net';

const bus = new EventEmitter(); // shared by the whole app

const feed = net.connect(9000, 'prices.internal');
feed.on('data', (chunk) => bus.emit('price', JSON.parse(chunk)));

http.createServer((req, res) => {
  if (req.url === '/next-price') {
    bus.on('price', (price) => res.end(JSON.stringify(price)));
  }
}).listen(3000);`,
    keyPoints: [
      'Every /next-price request adds a \'price\' listener that is never removed. The closures keep req/res alive (memory leak), and each new price calls res.end() on responses that finished long ago. Node warns when an event has more than 10 listeners (the default maxListeners).',
      'Fix: register with bus.once(\'price\', handler) and remove it if the client disconnects first (res.on(\'close\', () => bus.off(\'price\', handler))), or await events.once(bus, \'price\', { signal }).',
      'Raising setMaxListeners() only silences the warning; it is a leak detector, not a limit.',
      'When an EventEmitter emits \'error\' and nobody listens for it, the error is thrown and the process crashes. The socket emits \'error\' on ECONNRESET or ECONNREFUSED: add feed.on(\'error\', ...) with logging and a reconnect strategy.',
      'emit() calls listeners synchronously in registration order, so the JSON.parse throw happens inside the data handler. TCP chunks are not messages: frame them (newline-delimited with readline, or a length prefix) before parsing.',
      'Other requests never get a response at all; every route needs to end the response (404 by default).',
    ],
    sources: [
      { label: 'Node.js docs — Events: error events', url: 'https://nodejs.org/api/events.html#error-events' },
      { label: 'Node.js docs — events.defaultMaxListeners', url: 'https://nodejs.org/api/events.html#eventsdefaultmaxlisteners' },
      { label: 'Node.js docs — events.once()', url: 'https://nodejs.org/api/events.html#eventsonceemitter-name-options' },
    ],
  },
  {
    id: 'nf-modern-builtins',
    category: 'node-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'This internal CLI pulls in six packages. On a current LTS release, which ones can you replace with Node built-ins? Rewrite the entry point and the npm scripts without them, and tell me the trade-offs.',
    codeLang: 'ts',
    code: `// package.json (excerpt)
// "scripts": { "dev": "nodemon src/cli.ts", "start": "ts-node src/cli.ts", "test": "jest" }
// "dependencies": { "dotenv": "^16", "minimist": "^1", "node-fetch": "^3" }
// "devDependencies": { "nodemon": "^3", "ts-node": "^10", "jest": "^29" }

// src/cli.ts
import 'dotenv/config';
import minimist from 'minimist';
import fetch from 'node-fetch';

const args = minimist(process.argv.slice(2), {
  boolean: ['dry-run'],
  string: ['env'],
});

const res = await fetch(\`\${process.env.API_URL}/deploys?env=\${args.env}\`);
console.log(await res.json());`,
    keyPoints: [
      'node-fetch → global fetch (built on undici, no longer experimental since Node 21). Same API as browsers: check res.ok, and add a timeout with { signal: AbortSignal.timeout(5000) }.',
      'minimist → parseArgs from node:util: parseArgs({ options: { \'dry-run\': { type: \'boolean\' }, env: { type: \'string\', short: \'e\' } } }). It is strict by default, so unknown flags throw instead of being silently accepted.',
      'dotenv → node --env-file=.env (or --env-file-if-exists), or process.loadEnvFile() in code. Variables already set in the real environment take precedence over the file.',
      'nodemon → node --watch (plus --watch-path); jest → node:test with node:assert, run with node --test (mocking, watch mode and coverage are built in).',
      'ts-node → run the .ts file directly: type stripping is on by default in current LTS lines. Only erasable syntax works (no enum, namespaces with values or parameter properties), type-only imports need import type, relative imports need .ts extensions, tsconfig is ignored, and there is no type checking, so keep tsc --noEmit in CI.',
      'Scripts become e.g. "dev": "node --env-file=.env --watch src/cli.ts", "start": "node --env-file=.env src/cli.ts", "test": "node --test". Trade-offs: fewer dependencies and less supply-chain risk, but behaviour now depends on the Node version (pin it), and some built-ins are still not fully stable (check each API’s stability index, e.g. node:sqlite).',
    ],
    sources: [
      { label: 'Node.js docs — util.parseArgs()', url: 'https://nodejs.org/api/util.html#utilparseargsconfig' },
      { label: 'Node.js docs — --env-file', url: 'https://nodejs.org/api/cli.html#--env-filefile' },
      { label: 'Node.js docs — Modules: TypeScript', url: 'https://nodejs.org/api/typescript.html' },
      { label: 'Node.js docs — Test runner', url: 'https://nodejs.org/api/test.html' },
    ],
  },
  {
    id: 'nf-path-url',
    category: 'node-fundamentals',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'On Linux or macOS, what does this print? Which of these lines would worry you in a file-download endpoint or an HTTP client?',
    codeLang: 'js',
    code: `const path = require('node:path');

console.log(path.join('/srv/app', '../data', 'users.json'));
console.log(path.resolve('/srv/app', '/etc', 'passwd'));
console.log(path.join('/srv/app', '/etc', 'passwd'));
console.log(path.join('uploads', '../../etc/passwd'));

console.log(new URL('../public/logo.png', 'file:///srv/app/src/server.js').pathname);
console.log(new URL('users', 'https://api.example.com/v1').href);
console.log(new URL('users', 'https://api.example.com/v1/').href);`,
    keyPoints: [
      'Output: /srv/data/users.json, /etc/passwd, /srv/app/etc/passwd, ../etc/passwd, /srv/app/public/logo.png, https://api.example.com/users, https://api.example.com/v1/users.',
      'path.join concatenates all segments and normalises the result (.., duplicate slashes). path.resolve processes segments right to left until it has an absolute path: an absolute segment discards everything before it, and a relative result is prefixed with process.cwd().',
      'Neither prevents traversal: joining user input such as \'../../etc/passwd\' escapes the base directory. Resolve the path, then check it is still inside the base (e.g. path.relative(base, target) must not start with \'..\' or be absolute), or better, map IDs to files.',
      'new URL(relative, base) follows browser rules: without a trailing slash the last segment of the base is replaced, so the /v1 prefix is silently lost. Keep base URLs with a trailing slash.',
      'In ESM, new URL(\'./file.txt\', import.meta.url) resolves relative to the module file instead of the current working directory; fs APIs accept file: URLs, and fileURLToPath converts them to paths.',
    ],
    sources: [
      { label: 'Node.js docs — Path', url: 'https://nodejs.org/api/path.html' },
      { label: 'Node.js docs — URL', url: 'https://nodejs.org/api/url.html' },
      { label: 'MDN — URL() constructor', url: 'https://developer.mozilla.org/en-US/docs/Web/API/URL/URL' },
    ],
  },
  {
    id: 'nf-dual-publishing',
    category: 'node-fundamentals',
    level: 'senior',
    type: 'concept',
    prompt:
      'You maintain a widely used library that ships CommonJS today. Users want ESM, but many consumers are still CommonJS apps on various Node versions. How do you publish it? Discuss require(esm), the dual package hazard and the design of the exports field.',
    keyPoints: [
      'require(esm) is enabled by default in current LTS lines (it left the flag in v22.12 and v20.19): a CommonJS app can require() an ES module as long as its module graph has no top-level await (otherwise ERR_REQUIRE_ASYNC_MODULE). If you only support those versions, ESM-only publishing becomes realistic.',
      'require() returns the module namespace object, so a default export lives under .default unless the module exports the value under the string name "module.exports".',
      'A dual build (ESM + CJS selected through "import"/"require" conditions) reaches older consumers but risks the dual package hazard: the package can be loaded twice, once per format, giving two copies of module state, broken instanceof checks and duplicated singletons or registries.',
      'Mitigations: ship ESM only and drop end-of-life Node versions in a major release; or keep one format as the source of truth and make the other a thin wrapper, keeping state in one place; the "module-sync" condition targets environments that can require() ESM.',
      'Design exports deliberately: list each public subpath, "types" first and "default" last, consider exposing "./package.json", and treat any change to exports as semver-major. Validate with publint and arethetypeswrong, and test real consumers (CJS app, ESM app, TypeScript with node16/nodenext resolution, bundlers).',
      'Communicate it: raise "engines", write a migration guide, and keep a maintenance branch for the old major for a while if consumers need it.',
    ],
    followUps: ['How would you detect, in a consumer app, that two copies of the same package are loaded?'],
    sources: [
      {
        label: 'Node.js docs — Loading ECMAScript modules using require()',
        url: 'https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require',
      },
      { label: 'Node.js docs — Dual CommonJS/ES module packages', url: 'https://nodejs.org/api/packages.html#dual-commonjses-module-packages' },
      PACKAGES_DOCS,
    ],
  },
  {
    id: 'nf-signals-shutdown',
    category: 'node-fundamentals',
    level: 'senior',
    type: 'concept',
    prompt:
      'Every Kubernetes rollout causes a burst of 502s and leaves some background jobs half-finished. The container runs `CMD ["npm", "start"]`. Explain how signals reach your Node process, what Node does with them by default, and how you would make shutdown graceful.',
    keyPoints: [
      'On a rollout the kubelet sends SIGTERM, waits terminationGracePeriodSeconds (30 seconds by default), then sends SIGKILL, which cannot be caught.',
      'With npm start as PID 1, npm (or a shell wrapper) may not forward SIGTERM to the node child, so Node never hears it and is killed mid-request. Run node directly (CMD ["node", "server.js"]) and use an init such as tini (docker run --init) because PID 1 gets no default signal handling.',
      'Node’s default for SIGTERM and SIGINT with no listener is to exit with 128 + the signal number (143 or 130). Adding process.on(\'SIGTERM\', ...) removes that default, so your handler is responsible for eventually exiting.',
      'Graceful sequence: fail the readiness probe, stop accepting connections (server.close()), close idle keep-alive connections (server.closeIdleConnections()), let in-flight requests and jobs finish, close DB pools and queue consumers, flush logs, then exit with process.exitCode.',
      'Add a hard timeout shorter than the grace period (setTimeout(() => process.exit(1), 25_000).unref()) and make the handler idempotent so a second signal does not start a second shutdown.',
      'Design for SIGKILL and OOM kills anyway: idempotent jobs, acknowledge queue messages only after completion, and keep retries safe.',
    ],
    followUps: ['Why might requests still fail briefly even after server.close() is called, and how does a preStop hook help?'],
    sources: [
      { label: 'Node.js docs — Signal events', url: 'https://nodejs.org/api/process.html#signal-events' },
      { label: 'Node.js docs — server.close()', url: 'https://nodejs.org/api/http.html#serverclosecallback' },
      {
        label: 'nodejs/docker-node — Docker and Node.js best practices',
        url: 'https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md',
      },
    ],
  },
];
