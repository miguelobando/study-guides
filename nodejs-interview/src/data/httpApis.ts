import type { Question } from '../types';

const EXPRESS_ERRORS = { label: 'Express — Error handling', url: 'https://expressjs.com/en/guide/error-handling/' };
const EXPRESS_MIDDLEWARE = { label: 'Express — Using middleware', url: 'https://expressjs.com/en/guide/using-middleware/' };
const MS_API_DESIGN = {
  label: 'Microsoft Azure — Web API design best practices',
  url: 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design',
};
const MDN_CORS = { label: 'MDN — Cross-Origin Resource Sharing (CORS)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS' };

export const httpApis: Question[] = [
  {
    id: 'api-node-http-server',
    category: 'http-apis',
    level: 'junior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Without any framework, implement this server using only node:http. Explain what the req and res objects are along the way.',
    codeLang: 'js',
    code: `import { createServer } from 'node:http';

const server = createServer(async (req, res) => {
  // TODO
  // GET  /health  -> 200 {"status":"ok"}
  // POST /echo    -> 200 echoing the parsed JSON body
  //                  400 on invalid JSON, 413 if the body is larger than 1 MB
  // anything else -> 404 {"error":"Not found"}
});

server.listen(3000);`,
    keyPoints: [
      'Route on req.method and the pathname: new URL(req.url, \'http://localhost\').pathname, because req.url also contains the query string.',
      'req is an http.IncomingMessage, a Readable stream: the body is not parsed for you. Collect it with for await (const chunk of req), tracking the total byte count.',
      'Enforce the limit while reading: once over 1 MB respond 413 and stop (e.g. close the connection) instead of buffering the rest.',
      'Buffer.concat(chunks).toString(\'utf8\') then JSON.parse inside try/catch, returning 400 on a SyntaxError.',
      'res is an http.ServerResponse, a Writable: res.writeHead(status, { \'Content-Type\': \'application/json\' }) then res.end(JSON.stringify(body)), exactly once per request.',
      'createServer ignores the promise returned by an async listener: wrap the body in try/catch and send 500, or a rejection becomes an unhandled rejection that crashes the process.',
    ],
    followUps: ['What does express.json() do that you just did by hand?'],
    sources: [
      { label: 'Node.js Learn — Anatomy of an HTTP Transaction', url: 'https://nodejs.org/learn/http/anatomy-of-an-http-transaction' },
      { label: 'Node.js docs — http.createServer()', url: 'https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener' },
    ],
  },
  {
    id: 'api-methods-idempotency',
    category: 'http-apis',
    level: 'junior',
    type: 'concept',
    prompt:
      'Which HTTP methods are safe and which are idempotent? Why does the distinction matter in practice, for example when a request times out and the client retries?',
    keyPoints: [
      'Safe means read-only semantics (no intended state change): GET, HEAD, OPTIONS, TRACE.',
      'Idempotent means sending the same request N times has the same intended effect as sending it once: all safe methods plus PUT and DELETE. POST is neither, and PATCH is not idempotent in general (e.g. "append" or "increment" operations).',
      'Idempotency is about server state, not identical responses: a second DELETE may return 404 and is still idempotent.',
      'Retries: clients, proxies and HTTP libraries can safely retry idempotent requests after a network error; blindly retrying a POST can create duplicate orders or payments, which is why idempotency keys exist.',
      'Caches, crawlers and link prefetchers assume GET is safe: never change state on GET (GET /orders/1/delete).',
      'PUT replaces the resource at a known URI; POST creates a subordinate resource or triggers processing; PATCH applies a partial update.',
    ],
    sources: [
      { label: 'MDN — Idempotent', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Idempotent' },
      { label: 'MDN — Safe (HTTP methods)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP' },
      { label: 'RFC 9110 — Idempotent Methods', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2' },
    ],
  },
  {
    id: 'api-status-codes',
    category: 'http-apis',
    level: 'junior',
    type: 'concept',
    prompt:
      'When would you return 400, 401, 403, 404, 409, 422 and 429? Which 5xx codes do you see in production, and what does each usually tell you?',
    keyPoints: [
      '400 Bad Request: the request is malformed (unparseable JSON, wrong types). 422 Unprocessable Content: well-formed but semantically invalid (validation rules fail). Many APIs use 400 for both; pick one and be consistent.',
      '401 Unauthorized really means unauthenticated: missing, invalid or expired credentials (should include WWW-Authenticate). 403 Forbidden: authenticated but not allowed.',
      '404 Not Found: the resource does not exist, or you hide its existence from callers who may not see it (instead of 403).',
      '409 Conflict: the request conflicts with the current state, e.g. a duplicate unique value or an invalid state transition. (A failed If-Match precondition is 412.)',
      '429 Too Many Requests: rate limited, ideally with a Retry-After header.',
      '5xx: 500 an unhandled server bug; 502 Bad Gateway, a proxy got no valid response from upstream (crashed process, keep-alive race); 503 Service Unavailable, overloaded or in maintenance; 504 Gateway Timeout, upstream too slow. 4xx says "change the request", 5xx says "retrying may help". Never leak stack traces.',
    ],
    sources: [
      { label: 'MDN — HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status' },
      { label: 'RFC 9110 — Client Error 4xx: 401 Unauthorized', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2' },
      { label: 'RFC 6585 — Additional HTTP Status Codes (429)', url: 'https://www.rfc-editor.org/rfc/rfc6585.html' },
    ],
  },
  {
    id: 'api-rest-design',
    category: 'http-apis',
    level: 'junior',
    type: 'concept',
    prompt:
      'Design the REST endpoints for a blog with users, posts and comments. How do you name resources, handle nesting, filtering and sorting, and how would you version the API later?',
    keyPoints: [
      'Resources are plural nouns and HTTP methods are the verbs: GET/POST /posts, GET/PATCH/DELETE /posts/{id}; not /getPosts or /createPost.',
      'Nest only to express ownership, and keep it shallow: GET/POST /posts/{id}/comments, but GET/PATCH /comments/{id} instead of /users/1/posts/2/comments/3.',
      'Filtering, sorting, field selection and pagination go in the query string: GET /posts?author=42&status=published&sort=-createdAt&limit=20.',
      'Consistency: one JSON casing, ISO 8601 timestamps, 201 Created with a Location header on creation, one error format everywhere.',
      'Operations that do not fit CRUD can be modelled as sub-resources or state changes (POST /posts/{id}/publish); be pragmatic.',
      'Versioning: URL path (/v1) is simple and visible; header or media-type versioning keeps URLs stable; date-based versions (Stripe) pin each client to a version. Prefer additive, backwards-compatible changes, version only for breaking ones, and announce removals (e.g. the Sunset header).',
    ],
    followUps: ['How would you evolve a field’s type without breaking existing mobile clients?'],
    sources: [
      MS_API_DESIGN,
      { label: 'Stripe — APIs as infrastructure: future-proofing Stripe with versioning', url: 'https://stripe.com/blog/api-versioning' },
      { label: 'RFC 8594 — The Sunset HTTP Header Field', url: 'https://www.rfc-editor.org/rfc/rfc8594.html' },
    ],
  },
  {
    id: 'api-headers-sent',
    category: 'http-apis',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'Two symptoms in production: some authenticated requests hang forever, and the logs are full of "Cannot set headers after they are sent to the client". Find the bugs.',
    codeLang: 'js',
    code: `function requireAuth(req, res, next) {
  const user = verifyToken(req.headers.authorization);
  if (user) {
    req.user = user;
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.use(requireAuth);

app.get('/orders/:id', async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
  }
  if (order.userId !== req.user.id) {
    res.status(403).json({ error: 'Forbidden' });
  }
  res.json(order);
});`,
    keyPoints: [
      'requireAuth never calls next() on success, so every authenticated request stops there and hangs until a timeout. A middleware must either end the response or call next(), exactly once.',
      'res.status().json() sends the response but does not stop the function: without return, execution continues and a second response is attempted → ERR_HTTP_HEADERS_SENT "Cannot set headers after they are sent to the client".',
      'In the 403 branch the handler sends 403 and then res.json(order) throws. In the 404 branch order is null, so order.userId throws a TypeError after the 404 was already sent.',
      'Fix: return res.status(404).json(...) (early returns, or an if/else chain) on every branch, and call next() in the middleware.',
      'Error handlers should check res.headersSent and delegate with next(err) so Express closes the connection instead of trying to respond twice.',
      'Better still, scope the query to the user (findOne({ id, userId: req.user.id })) so other users’ orders are a 404 and existence is not leaked.',
    ],
    sources: [
      { label: 'Express — Writing middleware', url: 'https://expressjs.com/en/guide/writing-middleware/' },
      EXPRESS_ERRORS,
      { label: 'Node.js docs — ERR_HTTP_HEADERS_SENT', url: 'https://nodejs.org/api/errors.html#err_http_headers_sent' },
    ],
  },
  {
    id: 'api-express-async-errors',
    category: 'http-apis',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'A client calls GET /users/999 and that user does not exist. What does the client receive when this runs on Express 4, and on Express 5? Assume default Node.js settings and no process-level handlers.',
    codeLang: 'js',
    code: `import express from 'express';
const app = express();

app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id); // resolves to null
  if (!user) throw new NotFoundError('User not found'); // err.status = 404
  res.json(user);
});

app.use((err, req, res, next) => {
  res.status(err.status ?? 500).json({ error: err.message });
});

app.listen(3000);`,
    keyPoints: [
      'Express 5: the client receives 404 {"error":"User not found"}. Express 4: the error handler never runs; the rejection is unhandled, which by default crashes the Node process, so the client gets a connection reset / socket hang up (or a 502 from a proxy), along with every other in-flight request.',
      'Express 4 only catches errors thrown synchronously in a handler; it ignores the promise an async function returns.',
      'Express 5 calls next(err) automatically when a handler or middleware throws or returns a rejected promise.',
      'Node’s default --unhandled-rejections mode is throw (since Node 15): an unhandled rejection is raised as an uncaught exception.',
      'Express 4 fixes: try/catch with next(err), a wrapper such as const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next), or the express-async-errors package. Adding process.on(\'unhandledRejection\', log) only turns the crash into a hanging request.',
      'Neither version catches errors thrown later inside callbacks or timers (setTimeout, event emitters); those still need explicit handling.',
    ],
    sources: [
      {
        label: 'Express — Migrating to 5: rejected promises handled',
        url: 'https://expressjs.com/en/guide/migrating-5/#rejected-promises-handled-from-middleware-and-handlers',
      },
      EXPRESS_ERRORS,
      { label: 'Node.js docs — --unhandled-rejections', url: 'https://nodejs.org/api/cli.html#--unhandled-rejectionsmode' },
    ],
  },
  {
    id: 'api-middleware-order',
    category: 'http-apis',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'POST /orders always fails because req.body is undefined, and when it fails the client gets an HTML error page instead of our JSON error. Explain the Express middleware model and fix the app.',
    codeLang: 'js',
    code: `const app = express();

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal error' });
});

app.post('/orders', async (req, res) => {
  const order = await orders.create(req.body);
  res.status(201).json(order);
});

app.use(express.json());

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(3000);`,
    keyPoints: [
      'Middleware and routes run in registration order for each request; each one must call next() or end the response.',
      'express.json() is registered after the route, so the body has not been parsed when the handler runs. In Express 5 req.body is undefined when no parser ran (Express 4 defaulted it to {}). Move body parsing and other global middleware (logging, security headers, CORS, auth) to the top.',
      'Error-handling middleware is recognised by having four parameters and is only reached by errors raised in middleware registered before it. Registered first, it never sees route errors, which fall through to Express’s default handler (HTML, with a stack trace unless NODE_ENV=production).',
      'Correct order: global middleware → routers/routes → 404 catch-all → error handler(s) last.',
      'Express detects error handlers by function arity: keep all four parameters even if next is unused (a linter removing it silently breaks the handler).',
      'The 404 handler is correctly placed after the routes; it is a normal three-argument middleware, not an error handler.',
    ],
    sources: [
      EXPRESS_MIDDLEWARE,
      EXPRESS_ERRORS,
      { label: 'Express — Migrating to 5: req.body', url: 'https://expressjs.com/en/guide/migrating-5/#reqbody' },
    ],
  },
  {
    id: 'api-pagination',
    category: 'http-apis',
    level: 'mid',
    type: 'concept',
    prompt:
      'GET /events can return millions of rows. Compare offset pagination with cursor (keyset) pagination. Which would you choose for an infinite-scroll feed, and which for an admin table with page numbers?',
    keyPoints: [
      'Offset/limit (?page=3&limit=50 → OFFSET 100 LIMIT 50) is simple and lets users jump to page N and show total pages.',
      'Offset gets slower with depth: the database still reads and discards all skipped rows, so page 10,000 is expensive.',
      'Offset is unstable under writes: inserts or deletes shift rows between requests, so items are duplicated or skipped.',
      'Keyset/cursor: WHERE (created_at, id) < ($lastCreatedAt, $lastId) ORDER BY created_at DESC, id DESC LIMIT 50. It uses an index, costs the same on every page and is stable under concurrent inserts.',
      'Cursors need a unique, deterministic sort (add a tie-breaker such as id) with a matching composite index; return an opaque encoded cursor plus hasMore/next link. Downsides: no random page access, and total counts are expensive (often omitted or estimated).',
      'Choice: feeds, public APIs, syncs and exports → cursor; small admin tables with page numbers → offset is fine (cap the maximum page).',
    ],
    sources: [
      { label: 'Use The Index, Luke — We need tool support for keyset pagination', url: 'https://use-the-index-luke.com/no-offset' },
      { label: 'Stripe API — Pagination', url: 'https://docs.stripe.com/api/pagination' },
      { label: 'Google AIP-158 — Pagination', url: 'https://google.aip.dev/158' },
    ],
  },
  {
    id: 'api-problem-details',
    category: 'http-apis',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement an Express error-handling middleware that returns RFC 9457 "problem details". ValidationError should map to 422 with the field errors; unknown errors must not leak internals.',
    codeLang: 'ts',
    code: `import type { ErrorRequestHandler } from 'express';

export class AppError extends Error {
  constructor(public status: number, public title: string, message?: string) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(public issues: { path: string; message: string }[]) {
    super(422, 'Validation failed');
  }
}

export const problemDetails: ErrorRequestHandler = (err, req, res, next) => {
  // TODO
};`,
    keyPoints: [
      'If res.headersSent, return next(err) so Express closes the connection; you cannot send a second response.',
      'Respond with Content-Type: application/problem+json and the standard members: type (a URI identifying the problem type, "about:blank" by default), title (short, stable per type), status (same as the HTTP status), detail (this occurrence), instance (URI of this occurrence, e.g. the request path).',
      'Extension members are allowed: errors: err.issues for validation failures, and a traceId/requestId to correlate with logs.',
      'Known AppError → its status, title and message; ValidationError → 422 with the issues list.',
      'Unknown errors → log the full error (with request id) server-side, but respond 500 with a generic title and no stack, SQL or file paths.',
      'Register it last, with all four parameters, and reuse the same format for 404s (a catch-all that calls next(new AppError(404, \'Not Found\'))). RFC 9457 obsoletes RFC 7807.',
    ],
    sources: [
      { label: 'RFC 9457 — Problem Details for HTTP APIs', url: 'https://www.rfc-editor.org/rfc/rfc9457.html' },
      EXPRESS_ERRORS,
    ],
  },
  {
    id: 'api-validation',
    category: 'http-apis',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Review these two handlers. What is risky about them, and how would you validate input properly?',
    codeLang: 'js',
    code: `app.patch('/users/:id', async (req, res) => {
  const user = await db.users.update(req.params.id, req.body);
  res.json(user);
});

app.get('/products', async (req, res) => {
  const products = await db.products
    .find({ category: req.query.category })
    .limit(req.query.limit);
  res.json(products);
});`,
    keyPoints: [
      'Mass assignment: req.body goes straight to the database, so a client can set role: "admin", balance or ownerId. Accept only an explicit allowlist of fields.',
      'No type checks: query values are strings (or arrays for ?limit=1&limit=2), so limit may be "abc" or unbounded; with an extended query parser ?category[$ne]=x becomes an object → NoSQL operator injection. (Express 5 switched the default query parser from "extended" to "simple".)',
      'Validate at the boundary with a schema (zod, JSON Schema with ajv, or Fastify route schemas): parse params, query and body; coerce and bound values, e.g. z.coerce.number().int().min(1).max(100).default(20).',
      'Strip or reject unknown keys (zod objects strip them by default; z.strictObject rejects them) and return 400/422 with field-level errors.',
      'Pass the parsed result, not req.body, down to the service layer; with zod, z.infer gives you the matching TypeScript type for free.',
      'Validation is not authorization: also check the caller may modify :id, and authorize by ownership in the query.',
    ],
    sources: [
      { label: 'Zod — Defining schemas', url: 'https://zod.dev/api' },
      { label: 'OWASP — Mass Assignment Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html' },
      { label: 'Express — Migrating to 5: req.query', url: 'https://expressjs.com/en/guide/migrating-5/#reqquery' },
    ],
  },
  {
    id: 'api-cors',
    category: 'http-apis',
    level: 'mid',
    type: 'concept',
    prompt:
      'Your SPA at https://app.example.com calls https://api.example.com with cookies. The browser shows a CORS error, but the same request works in curl. Explain how CORS works, including preflight, and why Access-Control-Allow-Origin: * does not help here.',
    keyPoints: [
      'CORS is enforced by browsers: the server declares which other origins may read its responses. curl, Postman and server-to-server calls ignore it. It is not authentication, and it does not stop a simple request from reaching the server.',
      'Simple requests (GET/HEAD/POST with only safelisted headers and form or text/plain content types) are sent directly; the browser just hides the response if the headers do not allow it.',
      'Anything else (PUT/PATCH/DELETE, Content-Type: application/json, an Authorization header) triggers a preflight OPTIONS with Access-Control-Request-Method/-Headers; the server must answer with Access-Control-Allow-Methods/-Headers, and Access-Control-Max-Age caches the result.',
      'With credentials (fetch credentials: \'include\'), the response needs Access-Control-Allow-Credentials: true and Access-Control-Allow-Origin set to the exact origin; the * wildcard is rejected for credentialed requests.',
      'Echo the Origin only if it is on an allowlist (never reflect any origin with credentials) and send Vary: Origin so caches do not serve one origin’s headers to another.',
      'In Express, configure the cors middleware with an origin allowlist and credentials: true before the routes. Alternatively serve the API under the same origin (reverse proxy/BFF) and avoid CORS entirely.',
    ],
    followUps: ['These two hosts are cross-origin but same-site. Why does that matter for SameSite cookies?'],
    sources: [
      MDN_CORS,
      {
        label: 'MDN — CORS: Credentialed requests and wildcards',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#credentialed_requests_and_wildcards',
      },
      { label: 'Express — cors middleware', url: 'https://expressjs.com/en/resources/middleware/cors/' },
    ],
  },
  {
    id: 'api-caching-etag',
    category: 'http-apis',
    level: 'mid',
    type: 'concept',
    prompt:
      'How would you make GET /products/:id cheap for browsers and CDNs to re-fetch, and safe to update concurrently? Explain ETags, conditional requests and the Cache-Control directives you would use.',
    keyPoints: [
      'An ETag identifies a version of a representation (content hash or a version column); W/ marks a weak validator.',
      'Revalidation: the client sends If-None-Match with the ETag; if unchanged the server answers 304 Not Modified with no body. Last-Modified/If-Modified-Since is the date-based alternative.',
      'Optimistic concurrency: PUT/PATCH with If-Match; if someone else changed the resource the server returns 412 Precondition Failed instead of silently overwriting (lost update).',
      'Cache-Control: max-age (browser freshness), s-maxage (shared caches/CDN), private (per-user data, browser only), no-cache (store but revalidate every time), no-store (never store, for sensitive data), stale-while-revalidate, immutable for fingerprinted assets.',
      'Vary lists request headers that change the response (Accept-Encoding, Accept-Language, Authorization) so caches key correctly.',
      'Express generates weak ETags for res.send() and answers 304 automatically when the request is fresh, but computing the body to hash it still costs work; deriving the ETag from a version column lets you skip the query. Invalidation (short TTLs, CDN purges) is the hard part.',
    ],
    sources: [
      { label: 'MDN — HTTP caching', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching' },
      { label: 'MDN — HTTP conditional requests', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests' },
      { label: 'RFC 9111 — HTTP Caching', url: 'https://www.rfc-editor.org/rfc/rfc9111.html' },
    ],
  },
  {
    id: 'api-fastify-vs-express',
    category: 'http-apis',
    level: 'mid',
    type: 'concept',
    prompt:
      'Your team is starting a new Node.js API and debating Express 5 versus Fastify. What are the meaningful differences, and how would you decide?',
    keyPoints: [
      'Express: minimal, ubiquitous, huge middleware ecosystem; a linear (req, res, next) stack. Express 5 forwards rejected promises to error handlers, but has no built-in validation or serialization.',
      'Fastify is schema-first: JSON Schema per route for body, querystring, params and headers (validated with ajv), and response schemas compiled into fast serializers that also drop undeclared fields, so internal properties do not leak.',
      'Plugins with encapsulation: register() creates a child context, and decorators, hooks and plugins added inside stay scoped to it unless wrapped with fastify-plugin. This keeps large apps modular and testable (fastify.inject()).',
      'Lifecycle hooks (onRequest, preHandler, onSend, onResponse…), first-class async/await, and built-in pino logging with request ids.',
      'Performance: Fastify shows much higher throughput in framework benchmarks thanks to its router and compiled serialization, but in most services the database and network dominate, so measure your workload.',
      'Decide on team experience, ecosystem needs, TypeScript support (Fastify type providers for TypeBox/Zod), OpenAPI generation from schemas, and real performance requirements.',
    ],
    sources: [
      { label: 'Fastify — Validation and Serialization', url: 'https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/' },
      { label: 'Fastify — Encapsulation', url: 'https://fastify.dev/docs/latest/Reference/Encapsulation/' },
      { label: 'Fastify — Benchmarks', url: 'https://fastify.dev/benchmarks/' },
    ],
  },
  {
    id: 'api-file-uploads',
    category: 'http-apis',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Review this avatar upload endpoint. List the problems in order of severity and describe a better design.',
    codeLang: 'js',
    code: `import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const upload = multer({ storage: multer.memoryStorage() });

app.post('/avatars', upload.single('avatar'), async (req, res) => {
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Images only' });
  }
  const dest = path.join('/srv/uploads', req.file.originalname);
  await fs.promises.writeFile(dest, req.file.buffer);
  res.status(201).json({ url: \`/uploads/\${req.file.originalname}\` });
});`,
    keyPoints: [
      'Memory storage with no limits buffers the whole file in RAM: one huge upload, or a few concurrent ones, can take the process down. Set limits (fileSize, files, fields, parts) and stream to disk or object storage.',
      'originalname is attacker-controlled: path traversal (../../), overwriting other users’ files, odd characters. Generate a random name (UUID) and keep the original name only as metadata.',
      'mimetype comes from the client and can be forged: check the real content (magic bytes) and re-encode images to strip embedded payloads and metadata.',
      'Serving uploads from the API origin risks stored XSS (SVG/HTML files). Serve them from a separate domain or bucket with a correct Content-Type and X-Content-Type-Options: nosniff.',
      'req.file is undefined when no file is sent (TypeError → 500); return 400. Map multer’s LIMIT_FILE_SIZE error to 413.',
      'At scale: local disk does not work across multiple instances; prefer presigned URLs so clients upload directly to object storage, and process the image asynchronously.',
    ],
    sources: [
      { label: 'multer (GitHub)', url: 'https://github.com/expressjs/multer' },
      { label: 'OWASP — File Upload Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html' },
      {
        label: 'AWS — Uploading objects with presigned URLs',
        url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html',
      },
    ],
  },
  {
    id: 'api-idempotency-keys',
    category: 'http-apis',
    level: 'senior',
    type: 'design',
    prompt:
      'Mobile clients on flaky networks sometimes create duplicate payments when they retry POST /payments after a timeout. Design an idempotency-key mechanism for this API.',
    keyPoints: [
      'The client generates a unique key (e.g. UUID v4) per logical operation and sends it in an Idempotency-Key header; every retry of that operation reuses the key. This is the Stripe pattern, being standardised by the IETF httpapi working group.',
      'The server stores the key, scoped per account/API key, with a fingerprint of the request (method, path, body hash) and, once finished, the status and response body. A repeat of a completed request returns the stored response without re-executing.',
      'Concurrency: claim the key atomically before doing any work (unique constraint with INSERT ... ON CONFLICT, or Redis SET NX with a TTL), so two simultaneous retries cannot both charge; a retry while the original is in progress gets 409.',
      'Same key with a different payload → reject (the IETF draft suggests 422); a missing key on an endpoint that requires one → 400.',
      'Atomicity: record the outcome in the same transaction as the business write. For external side effects, pass an idempotency key downstream (payment providers accept them) and track progress as a state machine so a retry can resume. Decide which outcomes are stored: Stripe saves the first result once execution has started, even a 500.',
      'Expire keys after a documented retention window (Stripe allows pruning after at least 24 hours), and have clients retry with exponential backoff and jitter.',
    ],
    followUps: ['Where would you store the keys, and what happens if that store is unavailable?'],
    sources: [
      { label: 'Stripe API — Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests' },
      { label: 'Stripe blog — Designing robust and predictable APIs with idempotency', url: 'https://stripe.com/blog/idempotency' },
      {
        label: 'IETF draft — The Idempotency-Key HTTP Header Field',
        url: 'https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/',
      },
    ],
  },
  {
    id: 'api-timeouts-keepalive',
    category: 'http-apis',
    level: 'senior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'Behind an AWS Application Load Balancer, about 0.1% of requests get a 502, mostly after quiet periods, with nothing in the app logs. Separately, /quote sometimes hangs for minutes. Explain both problems and fix the configuration.',
    codeLang: 'js',
    code: `const server = app.listen(3000);

// Load balancer idle timeout: 60 s
server.keepAliveTimeout = 5_000; // Node default
server.requestTimeout = 0;       // "big uploads were being cut off"

app.get('/quote', async (req, res) => {
  const r = await fetch('https://pricing.internal/quote');
  res.json(await r.json());
});`,
    keyPoints: [
      'Keep-alive race: Node closes idle keep-alive sockets after keepAliveTimeout (5 s), while the ALB keeps pooled connections for up to its idle timeout (60 s). The ALB sends a request on a socket Node is closing, gets a reset/FIN and returns 502; the app never sees the request.',
      'Fix: the upstream keep-alive timeout must exceed the proxy’s idle timeout, e.g. server.keepAliveTimeout = 65_000, and keep headersTimeout consistent with it. Newer Node versions add server.keepAliveTimeoutBuffer (1 s default) to soften the race, but the rule still applies.',
      'requestTimeout = 0 removes the protection against slow clients (slowloris-style DoS). Restore a finite value (default 300 s) and handle large uploads differently (per route, or direct-to-storage presigned uploads).',
      'Outbound: global fetch (undici) has no overall deadline; its header and body timeouts default to 300 s, hence the multi-minute hangs. Pass signal: AbortSignal.timeout(2000), check r.ok and map timeouts to 504 or a fallback.',
      'Connection reuse: global fetch pools keep-alive connections per origin via undici’s global dispatcher (tune with an undici Agent via the dispatcher option or setGlobalDispatcher); http.globalAgent has keep-alive on by default since Node 19. Never create an agent per request.',
      'Retry only idempotent calls, with backoff and jitter, inside a total time budget shorter than the LB/client timeout. On deploys, drain gracefully: stop accepting, server.close(), close idle connections.',
    ],
    sources: [
      { label: 'Node.js docs — server.keepAliveTimeout', url: 'https://nodejs.org/api/http.html#serverkeepalivetimeout' },
      { label: 'Node.js docs — server.requestTimeout', url: 'https://nodejs.org/api/http.html#serverrequesttimeout' },
      {
        label: 'AWS — Troubleshoot your Application Load Balancers (HTTP 502)',
        url: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html',
      },
      { label: 'Node.js docs — fetch (based on undici)', url: 'https://nodejs.org/api/globals.html#fetch' },
    ],
  },
  {
    id: 'api-graphql-n1',
    category: 'http-apis',
    level: 'senior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'The query { posts { title author { name } } } is slow and the database shows 51 queries per request. Explain why and fix it. What mistake do people often make with the fix?',
    codeLang: 'js',
    code: `const resolvers = {
  Query: {
    posts: () => db.posts.findLatest({ limit: 50 }),
  },
  Post: {
    author: (post) => db.users.findById(post.authorId),
  },
};`,
    keyPoints: [
      'N+1: one query for the 50 posts, then the Post.author resolver runs once per post, issuing 50 more queries. Deeper nesting (comments → author) multiplies it.',
      'GraphQL resolves field by field, and each resolver only sees its parent, so it cannot batch on its own.',
      'DataLoader collects every load(id) call made in the same tick and calls a batch function once (SELECT * FROM users WHERE id = ANY($1)). The batch function must return results in the same order and length as the keys (null or an Error for missing ones).',
      'Common mistake: creating the loader at module level. Its cache is a per-request memo; shared globally it serves stale data forever and leaks data across users with different permissions. Create loaders per request in the context factory.',
      'Complements: joins or look-ahead in the parent resolver, query depth/complexity limits, persisted queries, and monitoring queries per request.',
      'DataLoader is not an application cache: use Redis or HTTP caching for cross-request caching.',
    ],
    sources: [
      { label: 'graphql/dataloader (GitHub)', url: 'https://github.com/graphql/dataloader' },
      { label: 'GraphQL — Performance: the N+1 problem', url: 'https://graphql.org/learn/performance/#the-n1-problem' },
    ],
  },
  {
    id: 'api-protocol-choice',
    category: 'http-apis',
    level: 'senior',
    type: 'design',
    prompt:
      'You are designing the API layer for a product with a web app, mobile apps, third-party integrators and about 30 internal services. Where would you use REST, GraphQL and gRPC, and would you put an API gateway or BFFs in front?',
    keyPoints: [
      'REST/JSON: best for public and partner APIs. Universal client support, HTTP caching (ETags, CDNs), simple debugging, OpenAPI tooling. Downsides: over/under-fetching and many round trips for complex screens.',
      'GraphQL: clients ask for exactly the fields they need from a typed schema, which suits first-party UIs with varied needs (web vs mobile) and evolves by deprecating fields instead of versioning. Costs: N+1 (DataLoader), query cost limits, weaker HTTP caching, per-field authorization, errors returned with HTTP 200.',
      'gRPC: Protocol Buffers over HTTP/2. Compact binary, generated typed clients, streaming, deadlines. Ideal service-to-service; browsers need gRPC-Web or a proxy, payloads are harder to inspect, and long-lived HTTP/2 connections need L7 load balancing.',
      'API gateway: a single entry point for cross-cutting concerns (TLS, authentication, rate limiting, routing, logging). Keep business logic out of it.',
      'BFF (Backend for Frontend): one backend per client experience, usually owned by that frontend team, which aggregates and shapes internal APIs for its UI. Avoids a one-size-fits-none API; the risk is duplicated logic across BFFs.',
      'A reasonable answer: REST + OpenAPI for third parties, GraphQL or BFFs for first-party apps, gRPC (or REST) internally, a gateway at the edge. Justify it by team skills and constraints, not fashion.',
    ],
    sources: [
      { label: 'gRPC — Introduction', url: 'https://grpc.io/docs/what-is-grpc/introduction/' },
      { label: 'GraphQL — Learn', url: 'https://graphql.org/learn/' },
      { label: 'Sam Newman — Backends For Frontends', url: 'https://samnewman.io/patterns/architectural/bff/' },
      { label: 'microservices.io — API Gateway pattern', url: 'https://microservices.io/patterns/apigateway.html' },
    ],
  },
  {
    id: 'api-realtime',
    category: 'http-apis',
    level: 'senior',
    type: 'concept',
    prompt:
      'A dashboard needs live order-status updates and the product also wants chat. Compare WebSockets, Server-Sent Events and long polling, and explain what changes when the Node service runs as 10 instances behind a load balancer.',
    keyPoints: [
      'Long polling: the server holds each request open until there is data or a timeout, and the client immediately re-requests. Works everywhere, but adds per-message overhead and latency.',
      'SSE: one long-lived HTTP response (Content-Type: text/event-stream), server → client only, text-based, with automatic reconnection and Last-Event-ID built into EventSource. Good for dashboards and notifications. Over HTTP/1.1 browsers allow only ~6 connections per domain; HTTP/2 removes that limit.',
      'WebSockets: full-duplex messages over one TCP connection after an HTTP Upgrade (RFC 6455), text or binary. Best for chat and collaboration, but you build reconnection, heartbeats (ping/pong), acks and ordering yourself (ws, or Socket.IO which adds them).',
      'Multiple instances: each client is connected to one instance, so events must reach every instance through a pub/sub backbone (Redis pub/sub or streams, NATS, Kafka). Socket.IO needs sticky sessions when it falls back to HTTP long polling.',
      'Infrastructure: load balancer idle timeouts kill quiet connections (send heartbeats); proxies may buffer SSE (disable buffering); every connection costs memory and a file descriptor; deploys trigger reconnect storms, so clients need jittered backoff.',
      'Authenticate on connect and re-check on long-lived connections; handle slow consumers (ws bufferedAmount) so per-connection buffers do not grow without bound.',
    ],
    sources: [
      {
        label: 'MDN — Using server-sent events',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events',
      },
      { label: 'MDN — The WebSocket API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' },
      { label: 'Socket.IO — Using multiple nodes', url: 'https://socket.io/docs/v4/using-multiple-nodes/' },
      { label: 'RFC 6455 — The WebSocket Protocol', url: 'https://www.rfc-editor.org/rfc/rfc6455.html' },
    ],
  },
];
