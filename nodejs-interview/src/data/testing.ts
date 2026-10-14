import type { Question } from '../types';

const NODE_TEST = { label: 'Node.js docs — Test runner', url: 'https://nodejs.org/api/test.html' };
const NODE_TESTING_BP = {
  label: 'Yoni Goldberg — Node.js testing best practices',
  url: 'https://github.com/goldbergyoni/nodejs-testing-best-practices',
};
const JS_TESTING_BP = {
  label: 'Yoni Goldberg — JavaScript & Node.js testing best practices',
  url: 'https://github.com/goldbergyoni/javascript-testing-best-practices',
};

export const testing: Question[] = [
  {
    id: 'test-levels',
    category: 'testing',
    level: 'junior',
    type: 'concept',
    prompt:
      'What is the difference between unit, integration and end-to-end tests for a Node.js REST API? How would you balance them, and have you heard of the test pyramid and the testing trophy?',
    keyPoints: [
      'Unit: one function or module in isolation, dependencies replaced; very fast, pinpoints failures, but can pass while the parts do not work together.',
      'Integration: several real parts together, e.g. HTTP request → route → service → real database; slower but catches wiring, SQL and serialization bugs.',
      'End-to-end: the deployed system through its public interface (and other services); highest confidence per test, slowest and most flaky.',
      'Test pyramid: many unit tests, fewer integration, very few E2E. Testing trophy: most effort in integration tests because they give the best confidence for the cost.',
      'For backends, API-level integration tests with a real database are often the sweet spot; unit tests for complex pure logic; a few E2E smoke tests; contract tests between services.',
      'Choose by confidence per cost: test behaviour through public interfaces, not implementation details.',
    ],
    sources: [
      { label: 'Martin Fowler — The Practical Test Pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
      {
        label: 'Kent C. Dodds — The Testing Trophy and Testing Classifications',
        url: 'https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications',
      },
      NODE_TESTING_BP,
    ],
  },
  {
    id: 'test-unawaited-assertion',
    category: 'testing',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'Both tests stay green even after someone broke getUser so it returns the wrong user and never rejects. Why? Fix them.',
    codeLang: 'js',
    code: `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUser } from '../src/users.js';

test('returns the user', () => {
  getUser(1).then((user) => {
    assert.equal(user.name, 'Ada');
  });
});

test('rejects unknown ids', () => {
  assert.rejects(getUser(999), { code: 'NOT_FOUND' });
});`,
    keyPoints: [
      'The test functions return undefined synchronously, so the runner marks them passed before the promises settle; the assertions run after the test has ended.',
      'assert.rejects returns a promise; without await its failure is never attached to the test.',
      'node:test may then report "generated asynchronous activity after the test ended" and fail the file, but only if the rejection happens while the process is still running; Jest can let it pass silently or blame another test.',
      'Fix: make the tests async and await: const user = await getUser(1); assert.equal(user.name, \'Ada\'); and await assert.rejects(getUser(999), { code: \'NOT_FOUND\' }). Returning the promise also works.',
      'Prevent: lint for floating promises (typescript-eslint no-floating-promises), see each test fail at least once, and use expect.assertions in Jest/Vitest; current Vitest fails tests with un-awaited .resolves/.rejects assertions.',
    ],
    sources: [
      NODE_TEST,
      { label: 'Node.js docs — assert.rejects', url: 'https://nodejs.org/api/assert.html' },
      { label: 'Jest — Testing Asynchronous Code', url: 'https://jestjs.io/docs/asynchronous' },
    ],
  },
  {
    id: 'test-node-runner-hooks',
    category: 'testing',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'In what order do the hooks and tests in this node:test file run? Then: would you choose the built-in runner over Jest or Vitest for a new service, and why?',
    codeLang: 'js',
    code: `import { describe, it, before, beforeEach, afterEach, after } from 'node:test';

const log = [];

describe('outer', () => {
  before(() => log.push('before'));
  beforeEach(() => log.push('beforeEach'));
  afterEach(() => log.push('afterEach'));
  after(() => log.push('after'));

  it('a', () => log.push('a'));

  describe('inner', () => {
    beforeEach(() => log.push('inner beforeEach'));
    it('b', () => log.push('b'));
  });
});`,
    keyPoints: [
      'Order: before, beforeEach, a, afterEach, beforeEach, inner beforeEach, b, afterEach, after.',
      'before/after run once per suite; beforeEach/afterEach run around every test in the suite, including tests in nested suites, outer hooks before inner ones.',
      'node:test + node:assert: built in, no dependencies or transpiler config for plain JS, supports describe/it, mocking (mock.fn, mock.method, mock.timers), snapshots, coverage, watch mode and parallel files (node --test).',
      'Jest/Vitest: richer ecosystem and expect matchers, mature module mocking, nicer watch UI; Vitest has native ESM/TypeScript through Vite, Jest’s ESM support is still more awkward.',
      'Reasonable choice: node:test for libraries and small services that want zero dependencies; Vitest/Jest when the team relies on their mocking and tooling. Consistency across the repo matters more than the runner.',
    ],
    sources: [
      NODE_TEST,
      { label: 'Node.js Learn — Using Node.js’s test runner', url: 'https://nodejs.org/learn/test-runner/using-test-runner' },
      { label: 'Vitest — Mocking', url: 'https://vitest.dev/guide/mocking' },
    ],
  },
  {
    id: 'test-http-supertest',
    category: 'testing',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Write integration tests for this endpoint with supertest and node:test. Which cases would you cover, and how is the app structured to make this easy?',
    codeLang: 'js',
    code: `// app.js
import express from 'express';

export function buildApp({ users }) {
  const app = express();
  app.use(express.json());

  app.post('/users', async (req, res) => {
    const { email } = req.body ?? {};
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'invalid_email' });
    }
    if (await users.findByEmail(email)) {
      return res.status(409).json({ error: 'email_taken' });
    }
    const user = await users.create({ email });
    res.status(201).location(\`/users/\${user.id}\`).json(user);
  });

  return app;
}

// server.js
// buildApp({ users: createUserRepo(pool) }).listen(process.env.PORT);`,
    keyPoints: [
      'Exporting the app (buildApp) separately from listen() lets supertest call request(app), which binds an ephemeral port per test; no running server needed. Fastify’s app.inject() does the same without a socket.',
      'Happy path: const res = await request(app).post(\'/users\').send({ email: \'ada@example.com\' }).expect(201); then assert the body, the Location header and that the user really exists (GET it or query the repo).',
      'Error paths matter as much: missing body and invalid email → 400, duplicate email → 409, and what happens when the repository throws (500 without leaking internals).',
      'Use a real database (or the real repository against a test DB) for integration tests; injecting users makes an in-memory fake possible for faster component tests.',
      'Isolate tests: unique emails per test or clean tables, no ordering dependencies; close pools and servers in after() so the runner exits.',
    ],
    sources: [
      { label: 'supertest — README', url: 'https://github.com/forwardemail/supertest/blob/master/README.md' },
      { label: 'Fastify — Testing guide', url: 'https://fastify.dev/docs/latest/Guides/Testing/' },
      NODE_TESTING_BP,
    ],
  },
  {
    id: 'test-real-database',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt:
      'Your integration tests mock the repository layer, yet SQL bugs keep reaching production. How would you run tests against a real database, and how do you keep them fast and isolated?',
    keyPoints: [
      'Mocks only check that you called the repository the way you expected; they cannot catch wrong SQL, constraints, migrations, transactions or driver behaviour.',
      'Run the same engine and major version as production (SQLite or an in-memory fake is not Postgres): Testcontainers starts a throwaway container from the test code; docker-compose works well locally and in CI.',
      'Start the database and run migrations once per test run (global setup), not per test.',
      'Isolation options: wrap each test in a transaction and roll back (fast, but breaks when the code under test manages its own transactions or uses several pool connections); truncate tables between tests; or give each test unique data so tests can run in parallel.',
      'Speed: reuse the container, tmpfs and relaxed durability settings for the test database, parallel workers with separate schemas or databases.',
      'Keep pure unit tests for business logic, and mock only what you do not control (third-party APIs).',
    ],
    sources: [
      { label: 'Testcontainers', url: 'https://testcontainers.com/' },
      { label: 'Testcontainers for Node.js', url: 'https://node.testcontainers.org/' },
      NODE_TESTING_BP,
    ],
  },
  {
    id: 'test-mocking-boundaries',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt:
      'Your service calls Stripe, sends emails and reads from Postgres. In tests, what would you mock, what would you keep real, and how would you mock outbound HTTP?',
    keyPoints: [
      'Mock at the boundaries you do not control or cannot run cheaply: third-party APIs (payments, email, SMS), time and randomness. Keep your own code and the database real in integration tests.',
      'Over-mocking tests the implementation, not the behaviour: tests break on refactors and still pass when the real integration is broken.',
      'node:test offers mock.fn() and mock.method(obj, \'name\', impl) with call tracking; t.mock is restored automatically after each test (otherwise mock.restoreAll()). Jest/Vitest have vi.fn/vi.spyOn and module mocking.',
      'For outbound HTTP intercept at the network layer (nock, MSW, undici MockAgent) so your real client code, headers, retries and error handling run. Make sure the tool intercepts fetch/undici, not only the http module.',
      'Block real network calls in tests, and also test failure modes: timeouts, 5xx, malformed responses.',
      'Prefer injecting a fake (in-memory mailer that records messages) over patching modules; check provider sandboxes or contract tests for real API drift.',
    ],
    sources: [
      { label: 'Node.js Learn — Mocking in tests', url: 'https://nodejs.org/learn/test-runner/mocking' },
      { label: 'MSW — Node.js integration', url: 'https://mswjs.io/guides/integrations/node' },
      { label: 'nock', url: 'https://github.com/nock/nock' },
      { label: 'Martin Fowler — Mocks Aren’t Stubs', url: 'https://martinfowler.com/articles/mocksArentStubs.html' },
    ],
  },
  {
    id: 'test-fake-timers',
    category: 'testing',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Write a test proving that withRetry retries after 1 s and then 2 s, without making the suite slow. What changes if the delay adds random jitter or the code uses Date.now()?',
    codeLang: 'js',
    code: `export async function withRetry(fn, { retries = 3, delayMs = 1000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * 2 ** attempt));
    }
  }
}`,
    keyPoints: [
      'Use fake timers: in node:test t.mock.timers.enable({ apis: [\'setTimeout\'] }) then t.mock.timers.tick(1000); in Vitest/Jest vi.useFakeTimers() / jest.useFakeTimers().',
      'Use a mock fn that fails twice then resolves, e.g. t.mock.fn() with a counter; assert callCount after each tick: 1 initially, 2 after 1000 ms, 3 after another 2000 ms, and the final result.',
      'Timers and promises interleave: after ticking, let pending promises settle (await a microtask/setImmediate turn) before asserting; Vitest’s advanceTimersByTimeAsync does this for you.',
      'Also test the failure path: after retries are exhausted the original error is thrown (await assert.rejects).',
      'Randomness and wall-clock time: inject them (random = Math.random, now = Date.now as parameters or a clock object) and pass deterministic fakes in tests; mock.timers can also fake Date.',
      'Restore real timers after each test (t.mock does this automatically) so other tests are not affected.',
    ],
    sources: [
      NODE_TEST,
      { label: 'Vitest — vi utility (fake timers)', url: 'https://vitest.dev/api/vi.html' },
      { label: 'Martin Fowler — Eradicating Non-Determinism in Tests', url: 'https://martinfowler.com/articles/nonDeterminism.html' },
    ],
  },
  {
    id: 'test-dependency-injection',
    category: 'testing',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'This function is hard to test. Why? Refactor it so it can be unit tested without module mocking.',
    codeLang: 'js',
    code: `import { db } from './db.js';
import { sendEmail } from './mailer.js';

export async function startTrial(userId) {
  const user = await db.users.findById(userId);
  const endsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const code = Math.random().toString(36).slice(2, 8);

  await db.trials.insert({ userId, endsAt, code });
  await sendEmail(user.email, \`Your trial code is \${code}\`);
  return { endsAt, code };
}`,
    keyPoints: [
      'Dependencies are hard-wired module singletons (db, mailer), so tests need module mocking (jest.mock, vi.mock, or node:test’s experimental mock.module) or a real database and mail server.',
      'Time and randomness are read directly, so endsAt and code are non-deterministic and hard to assert.',
      'Refactor with dependency injection: export function createTrialService({ users, trials, mailer, clock, generateCode }) returning { startTrial }. A composition root (server.js) wires the real implementations.',
      'Tests pass simple fakes: an in-memory repository, a mailer that records messages, a fixed clock and a stub code generator, then assert on outputs and recorded effects.',
      'No DI container is needed; plain function parameters or factory functions are enough in Node.',
      'Side note: a trial code should come from crypto.randomInt or crypto.randomUUID, not Math.random; also handle a missing user.',
    ],
    sources: [
      { label: 'Martin Fowler — Inversion of Control Containers and the Dependency Injection pattern', url: 'https://martinfowler.com/articles/injection.html' },
      JS_TESTING_BP,
    ],
  },
  {
    id: 'test-data-builders',
    category: 'testing',
    level: 'mid',
    type: 'concept',
    prompt:
      'Every test file starts with 40 lines of hand-built objects, and a new required column broke 200 tests. How would you manage test data?',
    keyPoints: [
      'Use factories/builders with valid defaults and per-test overrides, e.g. buildUser({ role: \'admin\' }) or a library like fishery; a schema change is fixed in one place.',
      'Each test states only the fields that matter for its scenario, which makes the intent readable.',
      'Generate unique values (emails, ids) so tests do not collide when run in parallel or against a shared database; faker can create realistic data (seed it to reproduce failures).',
      'Each test creates its own data (via the API or repository) instead of relying on a shared global seed that other tests mutate.',
      'Builders vs Object Mother: named fixtures (aCustomerWithOverdueInvoice) are readable but multiply; builders compose better.',
    ],
    sources: [
      { label: 'Martin Fowler — Object Mother', url: 'https://martinfowler.com/bliki/ObjectMother.html' },
      { label: 'fishery', url: 'https://github.com/thoughtbot/fishery' },
      JS_TESTING_BP,
    ],
  },
  {
    id: 'test-coverage-limits',
    category: 'testing',
    level: 'senior',
    type: 'concept',
    prompt: 'Leadership wants a CI gate of 100% line coverage. What is your position, and how would you measure test quality instead?',
    keyPoints: [
      'Coverage shows which code ran during tests, not what was verified: a test without assertions can produce 100% coverage.',
      'Branch coverage is more informative than line coverage, but neither covers missing code paths, input combinations or integration behaviour.',
      'A hard 100% target invites low-value tests and gaming (Goodhart’s law) and makes refactors expensive; the last few percent are often trivial or defensive code.',
      'Use coverage as a tool to find untested areas, especially error handling, and gate on coverage of changed code or a ratchet that does not decrease, rather than an absolute number.',
      'Mutation testing (e.g. Stryker) checks whether tests fail when code is changed, measuring assertion quality.',
      'Tooling: node --test --experimental-test-coverage, c8 (V8 coverage), Vitest/Jest coverage providers. Also track escaped defects and flaky test rates.',
    ],
    sources: [
      { label: 'Martin Fowler — Test Coverage', url: 'https://martinfowler.com/bliki/TestCoverage.html' },
      { label: 'Stryker Mutator', url: 'https://stryker-mutator.io/' },
      NODE_TEST,
    ],
  },
  {
    id: 'test-contract-testing',
    category: 'testing',
    level: 'senior',
    type: 'design',
    prompt:
      'You have 12 microservices and a shared staging environment where E2E tests are slow and flaky. A provider team renamed a field and broke two consumers in production. How would contract testing help, and how would you introduce it?',
    keyPoints: [
      'Consumer-driven contracts: each consumer’s tests record the requests it makes and the response fields it relies on, against a mock provider; this produces a contract (pact).',
      'The provider verifies every consumer’s contract against its real implementation in its own CI, using provider states to set up data.',
      'A broker (Pact Broker/PactFlow) shares contracts and verification results; can-i-deploy checks compatibility before releasing either side.',
      'Contracts test the interface the consumer needs, not the provider’s business logic, so they are fast, independent and pinpoint who broke what. They replace most cross-service E2E tests, but keep a few smoke tests.',
      'Works for message/event payloads too; schema-based approaches (OpenAPI, JSON Schema) are a lighter alternative but do not capture what consumers actually use.',
      'Roll out incrementally: start with the most fragile integration, and combine with backwards-compatible API evolution (expand/contract fields, deprecation).',
    ],
    sources: [
      { label: 'Pact docs — How Pact works', url: 'https://docs.pact.io/getting_started/how_pact_works' },
      { label: 'Pact docs — Convince me', url: 'https://docs.pact.io/faq/convinceme' },
      { label: 'Martin Fowler — Consumer-Driven Contracts', url: 'https://martinfowler.com/articles/consumerDrivenContracts.html' },
    ],
  },
  {
    id: 'test-performance-ci',
    category: 'testing',
    level: 'senior',
    type: 'design',
    prompt:
      'After a release, p99 latency of a key endpoint doubled and nobody noticed until customers complained. How would you add load and performance testing to the delivery pipeline?',
    keyPoints: [
      'Define what "good" means first: SLO-style thresholds such as p95/p99 latency, throughput and error rate for key endpoints.',
      'Tools: k6 scripts with thresholds that fail the run, autocannon for quick HTTP benchmarks of a Node server; test types include load, stress, spike and soak (memory leaks show up over time).',
      'Run a short, low-load performance smoke test on every PR or merge and compare against a baseline; run full load tests nightly or before releases in a production-like environment.',
      'Shared CI runners are noisy: use dedicated runners or environments, warm up first (JIT, caches), repeat runs and compare relative changes instead of absolute numbers.',
      'Use realistic data volumes and traffic mixes, and observe the server during the test: event loop lag, CPU, GC, heap, database and pool metrics, to find the bottleneck rather than just the symptom.',
      'Production monitoring and alerting on latency percentiles remain the last line of defence; tests catch regressions earlier.',
    ],
    sources: [
      { label: 'Grafana k6 — Thresholds', url: 'https://grafana.com/docs/k6/latest/using-k6/thresholds/' },
      { label: 'autocannon', url: 'https://github.com/mcollina/autocannon' },
      NODE_TESTING_BP,
    ],
  },
];
