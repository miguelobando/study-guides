import type { Question } from '../types';

const NODE_ERRORS = { label: 'Node.js docs — Errors', url: 'https://nodejs.org/api/errors.html' };
const NODE_PROCESS = { label: 'Node.js docs — Process', url: 'https://nodejs.org/api/process.html' };
const NODE_EVENTS = { label: 'Node.js docs — Events', url: 'https://nodejs.org/api/events.html' };
const NODE_CLI = { label: 'Node.js docs — Command-line options', url: 'https://nodejs.org/api/cli.html' };
const NBP_OPERATIONAL = {
  label: 'Node.js Best Practices — Distinguish operational vs programmer errors',
  url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/operationalvsprogrammererror.md',
};

export const errorsDebugging: Question[] = [
  {
    id: 'err-callback-twice',
    category: 'errors-debugging',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This helper sometimes crashes the whole process, and callers report their callback running twice. Find the bugs and fix them.',
    codeLang: 'js',
    code: `const fs = require('node:fs');

function readConfig(path, callback) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      callback(err);
    }
    callback(null, JSON.parse(data));
  });
}

readConfig('./config.json', (err, config) => {
  if (err) return console.error('could not load config', err);
  startServer(config);
});`,
    keyPoints: [
      'Missing return after callback(err): execution continues, so the callback is invoked a second time on the error path.',
      'On that error path data is undefined, and JSON.parse(undefined) throws a SyntaxError inside the fs callback; nothing can catch it there, so it becomes an uncaught exception and the process exits.',
      'Invalid JSON in the file has the same effect: errors thrown inside an async callback are never delivered to the caller via the error-first convention.',
      'Fix: return callback(err); wrap only JSON.parse in try/catch and pass the error to the callback; call the success callback outside the try so an exception thrown by the caller’s own code is not reported as a parse error (or the callback called twice).',
      'Error-first convention: callback(err) on failure, callback(null, result) on success, exactly once.',
      'Modern alternative: const data = await fs.promises.readFile(path, "utf8"); return JSON.parse(data); inside an async function, so both failures become a single rejected promise.',
    ],
    followUps: ['How would you convert a callback API you do not own into a promise API (util.promisify)?'],
    sources: [
      {
        label: 'Node.js Learn — JavaScript Asynchronous Programming and Callbacks',
        url: 'https://nodejs.org/learn/asynchronous-work/javascript-asynchronous-programming-and-callbacks',
      },
      NODE_ERRORS,
    ],
  },
  {
    id: 'err-try-catch-async',
    category: 'errors-debugging',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'What does this print, and what happens to the process? How do you fix it?',
    codeLang: 'js',
    code: `async function loadUser() {
  throw new Error('db down');
}

function main() {
  try {
    loadUser();
    console.log('after loadUser');
  } catch (err) {
    console.log('caught:', err.message);
  }
}

main();
console.log('end');`,
    keyPoints: [
      'Prints "after loadUser" then "end"; "caught:" is never printed. Then Node reports the unhandled rejection (Error: db down with its stack) on stderr and the process exits with code 1.',
      'An async function never throws synchronously: the throw becomes a rejected promise, and nobody awaited or attached .catch to it.',
      'try/catch only catches errors thrown synchronously in the try block, or rejections of promises that are awaited inside it.',
      'Since Node 15 the default --unhandled-rejections mode is throw: an unhandled rejection is raised as an uncaught exception and crashes the process.',
      'Fix: make main async and await loadUser() inside the try (and handle main().catch at the top level), or attach .catch to the promise.',
      'Same trap with callbacks: try { setTimeout(() => { throw err }) } catch {} does not catch anything because the callback runs later on a fresh stack.',
    ],
    followUps: ['How does ESLint’s no-floating-promises rule (typescript-eslint) help here?'],
    sources: [
      { label: 'Node.js docs — CLI: --unhandled-rejections', url: 'https://nodejs.org/api/cli.html' },
      NODE_ERRORS,
      {
        label: 'Node.js Learn — Discover Promises in Node.js',
        url: 'https://nodejs.org/learn/asynchronous-work/discover-promises-in-nodejs',
      },
    ],
  },
  {
    id: 'err-swallowed',
    category: 'errors-debugging',
    level: 'junior',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'A code review lands on this function. What would you flag, and how would you rewrite it?',
    codeLang: 'js',
    code: `async function getUser(id) {
  try {
    const user = await db.users.findById(id);
    if (!user) throw 'User not found';
    return user;
  } catch (e) {
    console.log('error');
  }
}`,
    keyPoints: [
      'Throwing a string: no stack trace, no err.message, instanceof Error fails, and tooling (loggers, APMs, error middleware) cannot handle it properly. Always throw Error instances (or subclasses).',
      'The catch swallows every failure and the function silently resolves to undefined; callers cannot tell "not found" from "database down" and will fail later with a confusing TypeError far from the cause.',
      'The log line has no error object, no id and no context, and console.log is not a structured logger: useless when debugging in production.',
      '"Not found" is an expected outcome, not an exceptional one: return null (or throw a typed NotFoundError) and let real failures propagate.',
      'Only catch what you can handle; otherwise rethrow (optionally wrapped with new Error("...", { cause: err })) and let the central error handler log and respond.',
      'Same smell: empty catch {} blocks and .catch(() => {}) on promises.',
    ],
    sources: [
      {
        label: 'Node.js Best Practices — Use only the built-in Error object',
        url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/useonlythebuiltinerror.md',
      },
      { label: 'MDN — throw', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw' },
      NODE_ERRORS,
    ],
  },
  {
    id: 'err-operational-vs-programmer',
    category: 'errors-debugging',
    level: 'mid',
    type: 'concept',
    prompt:
      'Explain the difference between operational errors and programmer errors. Why do many Node teams prefer to crash the process on a programmer error instead of carrying on?',
    keyPoints: [
      'Operational errors are expected runtime failures in a correct program: network timeouts, ECONNREFUSED, invalid user input, file not found, a 3rd-party API returning 503. Handle them: retry, fall back, return 4xx/5xx.',
      'Programmer errors are bugs: reading a property of undefined, passing the wrong type, calling a callback twice, forgetting to await. The code cannot handle them meaningfully; the fix is a code change.',
      'After an unexpected exception the process may be in an unknown state (half-updated objects, leaked connections or locks, open transactions), so continuing risks corrupting data or serving wrong results.',
      'Crash-and-restart: log the error, stop accepting traffic, exit with a non-zero code, and let the supervisor (Kubernetes, systemd, PM2) start a clean process. Run several instances so one crash is not an outage.',
      'Make the distinction explicit in code: e.g. an isOperational flag or typed error classes, so the central handler knows whether to respond and continue or to shut down.',
      'Crashing is not a substitute for fixing: alert on restarts and track crash loops.',
    ],
    followUps: ['Is a JSON.parse error on a request body operational or a programmer error?'],
    sources: [
      NBP_OPERATIONAL,
      {
        label: 'Node.js Best Practices — Exit the process gracefully when an unknown error occurs',
        url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/shuttingtheprocess.md',
      },
      NODE_PROCESS,
    ],
  },
  {
    id: 'err-process-handlers',
    category: 'errors-debugging',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'Someone added this at the top of index.js "so the server never goes down". What is wrong with it and what would you do instead?',
    codeLang: 'js',
    code: `process.on('uncaughtException', (err) => {
  console.error('Something went wrong', err);
});

process.on('unhandledRejection', () => {});`,
    keyPoints: [
      'The Node docs call uncaughtException a crude last-resort mechanism, not "On Error Resume Next": after an uncaught exception the application is in an undefined state and resuming is unsafe.',
      'Keeping the process alive hides bugs, leaks resources (sockets, DB connections, half-finished requests that never respond) and can corrupt data; the health check still says OK while requests fail.',
      'The empty unhandledRejection handler silently swallows every forgotten rejection and overrides the default (since Node 15) behaviour of crashing.',
      'Correct use: log the error synchronously with full context (stack, cause), optionally start a graceful shutdown with a hard timeout, then process.exit(1) and let the orchestrator restart a clean instance.',
      'For pure observability (sending to an APM) without changing behaviour, use the uncaughtExceptionMonitor event.',
      'Reduce how often this fires: await or .catch every promise, handle error events on emitters and streams, and use a central error handler for requests.',
    ],
    followUps: ['Why should the handler not perform slow asynchronous work before exiting?'],
    sources: [
      NODE_PROCESS,
      {
        label: 'Node.js Best Practices — Catch unhandled promise rejections',
        url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/catchunhandledpromiserejection.md',
      },
      NODE_CLI,
    ],
  },
  {
    id: 'err-custom-errors',
    category: 'errors-debugging',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Design an error hierarchy for an API: a base AppError plus NotFoundError and a DatabaseError that wraps the driver error. Fill in the classes and explain how the HTTP layer uses them.',
    codeLang: 'ts',
    code: `export class AppError extends Error {
  // TODO: code, statusCode, isOperational, cause
}

export class NotFoundError extends AppError {
  // TODO
}

export class DatabaseError extends AppError {
  // TODO: keep the original driver error
}

// Usage
try {
  await pool.query(sql, params);
} catch (err) {
  throw new DatabaseError('Failed to load orders', { cause: err });
}`,
    keyPoints: [
      'Extend Error and call super(message, { cause }) so the standard cause property is set; Node’s util.inspect (and console.error) prints the cause chain.',
      'Set this.name = new.target.name (or the class name) so stacks and logs show NotFoundError instead of Error; V8 captures the stack automatically when the Error is constructed.',
      'Add a stable machine-readable code (e.g. "ORDER_NOT_FOUND", like Node’s own err.code values) that clients and alerts can depend on; never branch on message text.',
      'Carry HTTP-agnostic metadata such as statusCode (404, 503) and isOperational, or map error classes to status codes in the HTTP layer to keep the domain transport-agnostic.',
      'Wrapping preserves the original driver error for logs while the message adds context; the client response gets only the safe message and code, never the internal cause or stack.',
      'The central error handler checks instanceof AppError: operational → respond with its status; anything else → log as a bug, respond 500 and consider restarting.',
    ],
    sources: [
      { label: 'MDN — Error: cause', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause' },
      NODE_ERRORS,
      NBP_OPERATIONAL,
    ],
  },
  {
    id: 'err-emitter-error',
    category: 'errors-debugging',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What does this print? Then explain why a stream emitting "error" in production can take down the whole server.',
    codeLang: 'js',
    code: `const { EventEmitter } = require('node:events');

const bus = new EventEmitter();
bus.on('data', (d) => console.log('data', d));

bus.emit('data', 1);

try {
  bus.emit('error', new Error('disk full'));
} catch (err) {
  console.log('caught:', err.message);
}

console.log('done');`,
    keyPoints: [
      'Prints "data 1", then "caught: disk full", then "done".',
      'emit() is synchronous. When an "error" event is emitted and there is no "error" listener, the emitter throws the error, so here the surrounding try/catch catches it.',
      'In real code a stream, socket or client emits "error" later from an I/O callback, where there is no try/catch on the stack: the throw becomes an uncaught exception and the process exits.',
      'Always attach an "error" listener to emitters you create or receive (streams, sockets, DB clients, child processes); use stream.pipeline() instead of .pipe() so errors propagate and streams are destroyed.',
      'events.errorMonitor lets you observe errors without counting as a handler; events.once(emitter, name) rejects if "error" is emitted, which works with await.',
      'captureRejections: true makes rejected promises returned from async listeners route to the "error" event instead of becoming unhandled rejections.',
    ],
    sources: [
      NODE_EVENTS,
      { label: 'Node.js docs — Stream: stream.pipeline()', url: 'https://nodejs.org/api/stream.html' },
    ],
  },
  {
    id: 'err-centralized-handling',
    category: 'errors-debugging',
    level: 'mid',
    type: 'concept',
    prompt:
      'Every route in our service has its own try/catch and logs errors differently. How would you design centralized error handling for a Node HTTP API?',
    keyPoints: [
      'Routes and services throw (or reject with) typed errors; one error-handling layer turns them into responses: Express error middleware (err, req, res, next), Fastify setErrorHandler, a NestJS exception filter.',
      'Express 5 forwards rejected promises from async handlers to the error middleware; Express 4 does not, so async errors need next(err) or a wrapper, otherwise requests hang or rejections go unhandled.',
      'The handler maps known errors to status codes and a consistent body (e.g. RFC 9457 problem details), returns a generic 500 for unknown errors, and never leaks stack traces or internal messages to clients.',
      'Log once, at the boundary, with request context (request id, route, user id) instead of logging and rethrowing at every layer, which produces duplicate noisy logs.',
      'The same handler (or a shared errorHandler module) is used by non-HTTP entry points: queue consumers, cron jobs, process-level uncaughtException handlers.',
      'Unknown (programmer) errors are reported to error tracking and may trigger a controlled restart; operational errors are counted in metrics.',
    ],
    sources: [
      { label: 'Express — Error handling', url: 'https://expressjs.com/en/guide/error-handling/' },
      {
        label: 'Node.js Best Practices — Handle errors centrally',
        url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/centralizedhandling.md',
      },
    ],
  },
  {
    id: 'err-structured-logging',
    category: 'errors-debugging',
    level: 'mid',
    type: 'concept',
    prompt:
      'Our service logs with console.log and nobody can find anything during incidents. What does good logging look like for a Node service in production?',
    keyPoints: [
      'Structured JSON logs (one object per line) with consistent fields: time, level, msg, service, version, request id, plus contextual keys; this makes logs queryable in Loki, Elasticsearch, CloudWatch and similar.',
      'Use a fast logger such as pino: levels (trace, debug, info, warn, error, fatal) configurable by env, child loggers for bound context, and serializers for errors (stack, cause) and requests.',
      'Write to stdout and let the platform ship logs (12-factor: logs are event streams); do pretty-printing only in development and heavy transports off the main thread.',
      'Correlation: generate or accept a request id (e.g. x-request-id), attach it to every log line, and propagate it to downstream calls; AsyncLocalStorage avoids passing it through every function.',
      'Never log secrets or PII: passwords, tokens, Authorization headers, cookies, card data. Use redaction (pino redact paths) and review what request/response serializers include.',
      'console.log costs: string formatting on the main thread, no levels, and process.stdout writes that are synchronous for files and TTYs on POSIX (and buffer in memory for pipes), which hurts latency under load.',
    ],
    followUps: ['What would you log at info vs debug for a request?', 'How do logs relate to traces (trace_id in log lines)?'],
    sources: [
      { label: 'Pino — documentation', url: 'https://getpino.io/' },
      { label: 'Pino — Redaction', url: 'https://github.com/pinojs/pino/blob/main/docs/redaction.md' },
      { label: 'The Twelve-Factor App — Logs', url: 'https://12factor.net/logs' },
      NODE_PROCESS,
    ],
  },
  {
    id: 'err-request-context',
    category: 'errors-debugging',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement request-scoped logging: every log line written while handling a request (even deep inside services) must include that request’s id, without passing a logger or id through every function.',
    codeLang: 'js',
    code: `const http = require('node:http');
const { randomUUID } = require('node:crypto');
const pino = require('pino');

const baseLogger = pino();

// TODO: export a function getLogger() that returns a logger bound to the current request

const server = http.createServer(async (req, res) => {
  // TODO: establish the request context here
  await handle(req, res);
});

async function handle(req, res) {
  await chargeCustomer();
  res.end('ok');
}

async function chargeCustomer() {
  getLogger().info('charging customer'); // must include the request id
}`,
    keyPoints: [
      'Create one AsyncLocalStorage instance at module scope: const als = new AsyncLocalStorage().',
      'In the request handler: const requestId = req.headers["x-request-id"] ?? randomUUID(); als.run({ logger: baseLogger.child({ requestId }) }, () => handle(req, res)). Everything that runs from that callback, including after awaits, timers and callbacks, sees the same store.',
      'getLogger = () => als.getStore()?.logger ?? baseLogger, so code outside a request still works.',
      'Alternative: pino’s mixin option returns { requestId: als.getStore()?.requestId } for every log call.',
      'Echo the id in the response header and forward it to downstream HTTP calls so logs correlate across services (or use OpenTelemetry trace context, which does this for you).',
      'Prefer run() over enterWith(); keep the store small; libraries such as pino-http (genReqId) or framework request contexts give you this out of the box.',
    ],
    sources: [
      { label: 'Node.js docs — Asynchronous context tracking (AsyncLocalStorage)', url: 'https://nodejs.org/api/async_context.html' },
      { label: 'Pino — API (child loggers, mixin)', url: 'https://github.com/pinojs/pino/blob/main/docs/api.md' },
      { label: 'pino-http', url: 'https://github.com/pinojs/pino-http' },
    ],
  },
  {
    id: 'err-debugging',
    category: 'errors-debugging',
    level: 'mid',
    type: 'concept',
    prompt:
      'You are still debugging with console.log. How do you attach a real debugger to a Node process, locally and in a container, and what precautions do you take?',
    keyPoints: [
      'node --inspect app.js starts the V8 inspector (default 127.0.0.1:9229); --inspect-brk also pauses on the first line, useful for startup code and short scripts.',
      'Clients: Chrome DevTools via chrome://inspect, or the VS Code debugger (launch config or auto-attach), with breakpoints, conditional breakpoints, logpoints, watch expressions and the call stack.',
      'A running process can be switched into inspector mode by sending SIGUSR1 (Linux/macOS), or programmatically via the inspector module.',
      'Inside a container use --inspect=0.0.0.0:9229 only with the port published to localhost or via kubectl port-forward; an exposed inspector gives remote code execution, so never expose it publicly.',
      'Pausing at a breakpoint freezes the event loop for every request, so do not attach breakpoints in production; use logs, metrics, diagnostic reports and heap snapshots there.',
      'For TypeScript, enable source maps so breakpoints and stacks map to .ts files.',
    ],
    sources: [
      { label: 'Node.js Learn — Debugging Node.js', url: 'https://nodejs.org/learn/getting-started/debugging' },
      { label: 'VS Code — Node.js debugging', url: 'https://code.visualstudio.com/docs/nodejs/nodejs-debugging' },
      { label: 'Node.js docs — Debugger', url: 'https://nodejs.org/api/debugger.html' },
    ],
  },
  {
    id: 'err-production-crash',
    category: 'errors-debugging',
    level: 'senior',
    type: 'concept',
    prompt:
      'A service crashes a few times a day in production and restarts. The logs only say "Killed" or show a fatal error with no useful stack. Walk me through how you would diagnose it.',
    keyPoints: [
      'Classify the exit: exit code 137/SIGKILL with OOMKilled in kubectl describe means the container memory limit; "JavaScript heap out of memory" means the V8 heap limit; an uncaught exception prints a JS stack; a segfault points to native code or addons.',
      'Diagnostic reports: run with --report-on-fatalerror and --report-uncaught-exception (and --report-directory) to get a JSON report with JS and native stacks, heap stats, resource usage, libuv handles and env; --report-on-signal or process.report.writeReport() for a live process.',
      'Memory crashes: --heapsnapshot-near-heap-limit=N writes heap snapshots just before the limit; compare snapshots in Chrome DevTools to find what is retained. Check that --max-old-space-size fits the container limit.',
      'Native crashes or hangs: enable core dumps (ulimit -c, --abort-on-uncaught-exception to produce one on JS exceptions) and inspect them with llnode or gdb.',
      'Correlate with metrics and logs around the crash: memory growth, event-loop lag, a deploy, a specific request (last request ids logged), dependency upgrades.',
      'Reproduce in staging with the same inputs and load; keep the fix in place with a test and an alert on restart counts.',
    ],
    followUps: ['How do you ship diagnostic reports and heap snapshots out of an ephemeral container?'],
    sources: [
      { label: 'Node.js docs — Diagnostic report', url: 'https://nodejs.org/api/report.html' },
      NODE_CLI,
      { label: 'Node.js Learn — Using heap snapshots', url: 'https://nodejs.org/learn/diagnostics/memory/using-heap-snapshot' },
      { label: 'llnode', url: 'https://github.com/nodejs/llnode' },
    ],
  },
  {
    id: 'err-async-stack-traces',
    category: 'errors-debugging',
    level: 'senior',
    type: 'concept',
    prompt:
      'Stack traces from production are often useless: they stop at a timer or socket callback, show compiled JavaScript line numbers instead of TypeScript, or are cut off. How do you get better stack traces?',
    keyPoints: [
      'V8 reconstructs async stack traces for async/await chains (frames prefixed with "at async"), at almost no cost; they are lost across callbacks, event emitters, timers and manual .then chains, so prefer await end to end.',
      'Add context where the trace breaks: wrap and rethrow with new Error("Loading invoice 42 failed", { cause: err }) so the cause chain records the path.',
      'Error.stackTraceLimit defaults to 10 frames; raise it with --stack-trace-limit=N or Error.stackTraceLimit (costs CPU on every Error creation).',
      'Error.captureStackTrace(obj, fn) attaches a .stack to any object and omits frames above fn, useful for custom error factories and assertion helpers.',
      '--enable-source-maps (or process.setSourceMapsEnabled(true)) maps stacks of transpiled or bundled code back to the original .ts sources; ship the .map files with the build. Overriding Error.prepareStackTrace can defeat it, and it has a cost when stacks are generated very often.',
      'Never throw non-Error values: a thrown string or object has no stack at all.',
    ],
    sources: [
      { label: 'V8 — Stack trace API', url: 'https://v8.dev/docs/stack-trace-api' },
      { label: 'V8 blog — Faster async functions and promises (zero-cost async stack traces)', url: 'https://v8.dev/blog/fast-async' },
      NODE_ERRORS,
      NODE_CLI,
    ],
  },
  {
    id: 'err-unhandled-in-production',
    category: 'errors-debugging',
    level: 'senior',
    type: 'concept',
    prompt:
      'Define an end-to-end error-handling strategy for a fleet of Node services: what happens from the moment an error is thrown until someone fixes it?',
    keyPoints: [
      'In code: typed errors with codes and causes, operational errors handled close to the source (retries with backoff, timeouts, fallbacks), everything else propagated to a single boundary handler per entry point.',
      'At the process level: uncaughtException/unhandledRejection log a fatal line and trigger a graceful shutdown with a hard timeout; the orchestrator restarts the instance; readiness fails while shutting down.',
      'Observability: structured logs with request and trace ids, error tracking that groups by stack (Sentry, an APM), error-rate metrics per route and error code, and diagnostic reports for fatal errors.',
      'Alerting on symptoms (error rate, SLO burn, restart loops) rather than on every logged error; noisy alerts get ignored.',
      'Feedback loop: each production error gets an owner, a regression test and, where useful, a lint rule (no-floating-promises, no empty catch) or a type that prevents the class of bug.',
      'Client side of the contract: consistent error responses (problem details), safe messages, correlation id returned to the caller for support tickets.',
    ],
    sources: [
      NBP_OPERATIONAL,
      NODE_PROCESS,
      { label: 'Google SRE book — Monitoring Distributed Systems', url: 'https://sre.google/sre-book/monitoring-distributed-systems/' },
    ],
  },
];
