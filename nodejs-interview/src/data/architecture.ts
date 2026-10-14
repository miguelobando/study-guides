import type { Question } from '../types';

const NBP = { label: 'Node.js Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices' };

export const architecture: Question[] = [
  {
    id: 'arch-layers',
    category: 'architecture',
    level: 'junior',
    type: 'concept',
    prompt:
      'You are starting a small REST API with Express. Where would you put routing, input validation, business logic and database access? Why not just write everything inside the route handlers?',
    keyPoints: [
      'Routes/controllers own HTTP only: parse the request, validate input, call a service, map the result or error to a status code and response body.',
      'Services hold the business rules and know nothing about req/res, so they can be reused from a CLI, a queue consumer or a test.',
      'Repositories / data-access modules hold the SQL or ORM calls behind functions like findUserByEmail().',
      'Cross-cutting pieces get their own place: config (validated env vars), logger, centralised error-handling middleware.',
      'Split the Express app from the server: app.js builds and exports the app, server.js calls listen(). Tests can then use supertest without opening a port.',
      'Benefits: each piece is testable in isolation, changes stay local and handlers stay readable. Do not over-layer a 200-line script, though.',
    ],
    followUps: ['How do you get errors from a service back to the right HTTP status code?', 'Where does authorisation logic belong?'],
    sources: [
      NBP,
      { label: 'Express — Routing guide', url: 'https://expressjs.com/en/guide/routing.html' },
      { label: 'Express — Error handling', url: 'https://expressjs.com/en/guide/error-handling.html' },
    ],
  },
  {
    id: 'arch-fat-handler',
    category: 'architecture',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'This signup route works and is in production. Review it: what is wrong with it, and how would you refactor it into layers?',
    codeLang: 'js',
    code: `const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.post('/users', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email taken' });
  }

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
    [email, hash, name],
  );

  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST });
  await transporter.sendMail({
    to: email,
    subject: 'Welcome!',
    text: \`Hi \${name}, thanks for signing up.\`,
  });

  res.status(201).json(rows[0]);
});

module.exports = router;`,
    keyPoints: [
      'One function mixes HTTP, validation, business rules, SQL and email. It can only be tested end to end with a real database and SMTP server.',
      'RETURNING * followed by res.json(rows[0]) leaks password_hash to the client. Return an explicit DTO.',
      'Check-then-insert is a race: two concurrent requests can both pass the SELECT. Rely on a UNIQUE constraint on email and map the unique-violation error (23505) to 409.',
      'The email is sent inside the request: if SMTP is slow the user waits, and if it fails the user is already created but gets a 500, and a retry then returns 409. Enqueue a background job instead (ideally written via an outbox in the same transaction).',
      'In Express 4 a rejected promise in an async handler never reaches the error middleware (unhandled rejection, request hangs). Express 5 forwards it; on 4 you need a wrapper. A transporter created on every request is wasteful too.',
      'Refactor: a validation middleware with a schema (zod / JSON Schema) → a thin controller → userService.register() with the business rules → userRepository with the SQL → a mailer or job queue port. Domain errors (EmailTaken) are mapped to HTTP in one error middleware.',
    ],
    followUps: [
      'How would you unit test userService.register() after the refactor?',
      'How do you guarantee the welcome email is sent at least once if the process crashes right after the INSERT?',
    ],
    sources: [
      { label: 'Node.js Best Practices — Layer your components', url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/projectstructre/createlayers.md' },
      { label: 'Express — Error handling', url: 'https://expressjs.com/en/guide/error-handling.html' },
      { label: 'microservices.io — Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
    ],
  },
  {
    id: 'arch-folder-structure',
    category: 'architecture',
    level: 'mid',
    type: 'concept',
    prompt:
      'Your Node service has controllers/, services/, models/ and utils/ folders, each with 60+ files. Every feature change touches four folders. How would you restructure it?',
    keyPoints: [
      'Technical (layer-first) folders spread one feature across the whole tree and give no visible boundaries between features.',
      'Feature/component-based folders (orders/, users/, billing/) group each feature’s routes, service, repository, schemas and tests together. High cohesion, easy to find, easy to delete.',
      'Keep the layers inside each component (api → domain/service → data access), so you get both the vertical and the horizontal split.',
      'Each component exposes a small public API (an index file). Others never import its internals or query its tables directly.',
      'Enforce boundaries with tooling (eslint import restrictions, dependency-cruiser, Nx module boundary rules), not just convention.',
      'A shared/ or libs/ area holds truly cross-cutting code (logger, config, error types). Keep it small so it does not become a dumping ground.',
      'This is the base of a modular monolith and makes it much easier to extract a service later.',
    ],
    sources: [
      { label: 'Node.js Best Practices — Structure by components', url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/projectstructre/breakintcomponents.md' },
      { label: 'dependency-cruiser', url: 'https://github.com/sverweij/dependency-cruiser' },
    ],
  },
  {
    id: 'arch-singleton-db',
    category: 'architecture',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'Every module in this codebase imports the database like this. The team complains that tests are slow, flaky and need module mocking everywhere. What is the design problem and how would you fix it?',
    codeLang: 'js',
    code: `// db.js
const { Pool } = require('pg');
module.exports = new Pool({ connectionString: process.env.DATABASE_URL });

// orders/orders.service.js
const db = require('../db');
const payments = require('../payments/stripe-client');

async function cancelOrder(orderId) {
  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (rows[0].status === 'shipped') throw new Error('Cannot cancel');
  await payments.refund(rows[0].payment_id);
  await db.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);
}

module.exports = { cancelOrder };`,
    keyPoints: [
      'Hidden, hard-wired dependencies: the service reaches for a global instance through require(), so callers and tests cannot pass a different one.',
      'Import-time side effects: requiring any module creates the pool and reads process.env at load time, before test setup can change config.',
      'Tests must either hit a real database or patch the module system (jest.mock / vi.mock by file path). That couples tests to the file layout and breaks on refactors.',
      'No clear lifecycle owner: nothing calls pool.end(), so test runners report open handles and graceful shutdown is ad hoc. Parallel test workers cannot easily use separate databases.',
      'Having one pool per process is fine. The problem is global access, not the single instance.',
      'Fix: factories that receive dependencies, e.g. createOrderService({ db, payments }), with the pool built once in a composition root (main.js) that also closes it on shutdown.',
      'Tests then pass fakes for unit tests, or a real pool pointed at a throwaway database (e.g. Testcontainers) for integration tests, without module mocking.',
    ],
    followUps: ['Do you also see a correctness problem in cancelOrder (think concurrency and partial failure)?'],
    sources: [
      { label: 'Martin Fowler — Inversion of Control Containers and the Dependency Injection pattern', url: 'https://martinfowler.com/articles/injection.html' },
      { label: 'node-postgres — Pooling', url: 'https://node-postgres.com/features/pooling' },
    ],
  },
  {
    id: 'arch-composition-root',
    category: 'architecture',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Without a DI framework, finish createUserService and write the composition root (main.ts) so that dependencies are injected and tests can swap them. When would you reach for a container such as awilix or NestJS instead?',
    codeLang: 'ts',
    code: `interface User { id: string; email: string; name: string }
interface NewUser { email: string; name: string }

interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  insert(user: NewUser): Promise<User>;
}

interface Mailer {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class EmailTakenError extends Error {}

// TODO: accept dependencies instead of importing them
export function createUserService(/* ? */) {
  return {
    async register(input: NewUser): Promise<User> {
      // TODO: reject duplicate emails, insert, send a welcome email
    },
  };
}

// main.ts
// TODO: load config, create the pg pool, repositories, services and the
// Express app; start listening; close everything cleanly on SIGTERM.`,
    keyPoints: [
      'Inject through parameters: createUserService({ users, mailer }: { users: UserRepository; mailer: Mailer }). The service depends on interfaces (ports), not on pg or nodemailer.',
      'register(): check findByEmail → throw EmailTakenError; insert; then send the email (or enqueue a job). Still keep the UNIQUE constraint in the database as the real guard.',
      'main.ts is the composition root, the only place that knows concrete classes: config → pool → createPgUserRepository(pool) → createSmtpMailer(config) → services → createApp({ userService }) → app.listen().',
      'Shutdown: on SIGTERM stop accepting connections (server.close()), then pool.end() and close queues, with a timeout.',
      'Tests build the same graph with in-memory fakes (createUserService({ users: fakeRepo, mailer: fakeMailer })), or createApp(...) with supertest. No module mocking needed.',
      'Avoid a service locator (container.get() calls scattered through business code): it hides dependencies again.',
      'Containers pay off when the graph is large or needs lifetimes: awilix (asClass / asFunction / asValue, SINGLETON / SCOPED / TRANSIENT, createScope() per request) or NestJS’s built-in IoC with @Injectable() providers and modules. For a small service, manual wiring is clearer.',
    ],
    sources: [
      { label: 'awilix', url: 'https://github.com/jeffijoe/awilix' },
      { label: 'NestJS — Providers', url: 'https://docs.nestjs.com/providers' },
      { label: 'Martin Fowler — Inversion of Control Containers and the Dependency Injection pattern', url: 'https://martinfowler.com/articles/injection.html' },
    ],
  },
  {
    id: 'arch-sync-vs-async',
    category: 'architecture',
    level: 'mid',
    type: 'concept',
    prompt:
      'When an order is placed, the order service must notify inventory, billing and email. Would you call them over REST/gRPC or publish an event to a broker? Compare RabbitMQ, Kafka and SQS for this.',
    keyPoints: [
      'Synchronous (REST/gRPC): simple and gives an immediate answer, but creates temporal coupling. Latencies add up, availability multiplies (99.9% × 3 services is worse than 99.9%) and failures cascade. Use it when the caller needs the answer now (queries, validation).',
      'gRPC: HTTP/2, Protobuf contracts with code generation, streaming. Good for internal service-to-service traffic, less convenient for browsers and ad-hoc debugging.',
      'Asynchronous (events/messages): the producer does not wait. You get decoupling in time, load levelling, easy fan-out and retries. The costs are eventual consistency, duplicates, ordering issues, harder tracing and running a broker.',
      'RabbitMQ: a classic broker with exchanges routing to queues and per-message acks. Messages are removed once consumed. Good for task distribution and flexible routing.',
      'Kafka: a partitioned, replicated, append-only log with retention. Consumer groups track offsets, ordering is per partition (pick the key carefully) and you can replay. Good for event streams and multiple independent consumers.',
      'SQS: a fully managed queue. Standard queues are at-least-once with best-effort ordering; FIFO queues order within a message group and deduplicate. Visibility timeout and dead-letter queues are built in. Pair with SNS/EventBridge for fan-out.',
      'Event-driven design: decide between event notification (thin, consumers call back) and event-carried state transfer (fat events), version event schemas, and propagate correlation IDs / trace context (OpenTelemetry).',
    ],
    followUps: ['How do you publish the event reliably if the DB commit succeeds but the broker call fails?', 'What does "at-least-once" force your consumers to do?'],
    sources: [
      { label: 'Martin Fowler — What do you mean by “Event-Driven”?', url: 'https://martinfowler.com/articles/201701-event-driven.html' },
      { label: 'microservices.io — Messaging', url: 'https://microservices.io/patterns/communication-style/messaging.html' },
      { label: 'Azure Architecture Center — Queue-Based Load Leveling', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling' },
    ],
  },
  {
    id: 'arch-background-jobs',
    category: 'architecture',
    level: 'mid',
    type: 'concept',
    prompt:
      'Generating an invoice PDF and emailing it takes ~5 seconds and sometimes fails. How would you move this to background jobs in Node with BullMQ? What happens when a job fails or a worker crashes?',
    keyPoints: [
      'The API adds a job (queue.add(name, data, opts)) and returns quickly (e.g. 202 with a job/resource id). Separate Worker processes, scaled independently, consume from Redis.',
      'Retries: set attempts plus backoff ({ type: \'exponential\', delay }). Throw UnrecoverableError for failures that should not be retried (e.g. invalid input).',
      'Jobs that exhaust their attempts land in the failed set. BullMQ has no separate dead-letter queue built in, so treat the failed set as one (alert, inspect, retry) or move jobs to a dedicated queue from a failed handler.',
      'Delivery is effectively at-least-once: a stalled job (worker crashed or blocked the event loop so the lock expired) is processed again. Handlers must be idempotent, and a custom jobId deduplicates adds.',
      'Tune concurrency for I/O-bound work. Run CPU-heavy work (PDF rendering) in sandboxed processors or worker threads so the lock can be renewed. Use the queue rate limiter to respect third-party limits.',
      'Production: Redis with maxmemory-policy noeviction, removeOnComplete/removeOnFail to bound memory, worker.close() on SIGTERM for graceful shutdown, metrics on queue depth and failure rate.',
      'If the job is enqueued after a DB commit, a crash in between loses it. Use an outbox table or enqueue first with an idempotent job.',
    ],
    sources: [
      { label: 'BullMQ — Retrying failing jobs', url: 'https://docs.bullmq.io/guide/retrying-failing-jobs' },
      { label: 'BullMQ — Stalled jobs', url: 'https://docs.bullmq.io/guide/workers/stalled-jobs' },
      { label: 'BullMQ — Going to production', url: 'https://docs.bullmq.io/guide/going-to-production' },
    ],
  },
  {
    id: 'arch-nest-vs-express',
    category: 'architecture',
    level: 'mid',
    type: 'concept',
    prompt:
      'A new team of eight is starting a Node backend. They are debating Express, Fastify and NestJS. How would you help them choose?',
    keyPoints: [
      'Express: minimal and unopinionated, with the largest ecosystem and hiring pool. You design the structure yourself. Express 5 handles rejected promises from async handlers.',
      'Fastify: high performance, JSON Schema validation and fast serialization built in, an encapsulated plugin system, hooks and pino logging out of the box. Still lightweight and unopinionated about app structure.',
      'NestJS: an opinionated framework (modules, providers, a DI container, decorators, guards, pipes, interceptors) running on Express by default or on a Fastify adapter. It is TypeScript-first and gives large teams consistency.',
      'NestJS costs: learning curve, decorator/metadata magic, more abstraction and indirection, and a risk of framework types leaking into domain code.',
      'Decision factors: team size and experience, need for enforced conventions, performance needs, existing code, and microservice transports or GraphQL integrations.',
      'Whatever they pick, keep business logic framework-agnostic (plain services) so the framework stays at the edge.',
    ],
    sources: [
      { label: 'NestJS — Introduction', url: 'https://docs.nestjs.com/' },
      { label: 'Fastify — Documentation', url: 'https://fastify.dev/docs/latest/' },
      { label: 'Express — Migrating to Express 5', url: 'https://expressjs.com/en/guide/migrating-5.html' },
    ],
  },
  {
    id: 'arch-monorepo',
    category: 'architecture',
    level: 'mid',
    type: 'concept',
    prompt:
      'You have four Node services in separate repos plus a shared "common" package published to a private registry. Version drift and cross-repo changes are painful. Would you move to a monorepo, and how would you set it up?',
    keyPoints: [
      'Monorepo benefits: atomic cross-package changes, one toolchain and lint/TS config, no publish-to-consume loop for internal packages, easier large refactors.',
      'Workspaces (npm, pnpm, Yarn) link local packages. pnpm’s workspace:* protocol pins internal dependencies to the local version.',
      'A task runner with a dependency graph, caching and "affected" detection (Turborepo, Nx) keeps CI fast as the repo grows. Remote caching helps further.',
      'Keep shared packages small and purpose-specific (logger, config, API client/contracts). A big shared domain-model package re-couples services and forces lockstep deploys.',
      'Services still deploy independently: build Docker images with only what a service needs (turbo prune, pnpm deploy) and deploy only affected apps.',
      'Ownership and governance: CODEOWNERS, module boundary rules, and changesets if some packages are still published externally.',
      'Costs: tooling complexity, CI scale, repository permissions. A polyrepo keeps strong isolation but makes cross-cutting changes slow.',
    ],
    sources: [
      { label: 'monorepo.tools', url: 'https://monorepo.tools/' },
      { label: 'pnpm — Workspace', url: 'https://pnpm.io/workspaces' },
      { label: 'npm Docs — Workspaces', url: 'https://docs.npmjs.com/cli/v10/using-npm/workspaces' },
    ],
  },
  {
    id: 'arch-hexagonal',
    category: 'architecture',
    level: 'senior',
    type: 'concept',
    prompt:
      'A colleague proposes hexagonal (ports and adapters) / clean architecture for all your Node services. Explain the idea, where it pays off and where it becomes over-engineering.',
    keyPoints: [
      'The domain/application core has no framework, HTTP or database imports. Dependencies point inward.',
      'Ports are interfaces defined by the core: driving ports (use cases the outside calls) and driven ports (repositories, payment gateway, clock, message publisher).',
      'Adapters implement ports at the edge: Express/Fastify controllers, a queue consumer, a CLI, a pg repository, a Stripe client. The same use case can be driven by HTTP and by a Kafka consumer.',
      'Pays off with rich business rules, long-lived systems, several entry points or infrastructure likely to change. The core can be tested fast with in-memory adapters.',
      'Over-engineering for CRUD services where the "domain" is mapping JSON to rows: extra interfaces, mappers and DTOs on every layer, "in case we switch databases" abstractions that never get used.',
      'Leaky spots to discuss: transactions spanning repositories (unit of work), ORM entities leaking into the core, performance-specific queries.',
      'Pragmatic path: start with simple layers and framework at the edge, then introduce ports where there is real variation or testing pain. Clean and onion architecture are variations of the same dependency rule.',
    ],
    sources: [
      { label: 'Alistair Cockburn — Hexagonal architecture', url: 'https://alistair.cockburn.us/hexagonal-architecture/' },
      { label: 'Robert C. Martin — The Clean Architecture', url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html' },
    ],
  },
  {
    id: 'arch-monolith-microservices',
    category: 'architecture',
    level: 'senior',
    type: 'concept',
    prompt:
      'Your company runs a Node monolith with 40 engineers, and deploys keep getting blocked. Leadership wants to "go microservices". How do you decide what to do, and how do you record the decision?',
    keyPoints: [
      'Name the real pain first (deploy contention, team coupling, scaling one hot path, blast radius) and check whether better modularity, CI or ownership would fix it.',
      'Modular monolith: one deployable with enforced module boundaries, each module owning its tables and exposing an API, no cross-module joins. You get most of the organisational benefit with simple operations and local transactions.',
      'Microservices bring independent deploy and scaling and team autonomy. They cost network failures, distributed data consistency, observability, platform/DevOps maturity and harder testing.',
      'Split along business capabilities / bounded contexts, not technical layers. Extract where there is a concrete driver (different scaling profile, release cadence or team ownership).',
      'Data ownership: database per service. Other services use its API or events, never its tables.',
      'Distributed-monolith smells: services that must deploy together, a shared database, long synchronous call chains, shared libraries containing domain models, lockstep versioning.',
      'Record the decision in an ADR (context, options, decision, consequences) so future engineers understand the trade-off and when to revisit it.',
    ],
    followUps: ['Which module would you extract first and why?', 'How do you handle a query that needs data from three services?'],
    sources: [
      { label: 'Martin Fowler — MonolithFirst', url: 'https://martinfowler.com/bliki/MonolithFirst.html' },
      { label: 'microservices.io — Database per service', url: 'https://microservices.io/patterns/data/database-per-service.html' },
      { label: 'Architectural Decision Records (adr.github.io)', url: 'https://adr.github.io/' },
    ],
  },
  {
    id: 'arch-idempotent-consumer',
    category: 'architecture',
    level: 'senior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This consumer reads payment.captured events from a standard SQS queue and credits the user’s wallet. Finance reports that a few users were credited twice. Explain why and fix it.',
    codeLang: 'js',
    code: `async function handle(message) {
  const event = JSON.parse(message.Body); // { eventId, userId, amount }

  await db.query(
    'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
    [event.amount, event.userId],
  );

  await sqs.send(new DeleteMessageCommand({
    QueueUrl: QUEUE_URL,
    ReceiptHandle: message.ReceiptHandle,
  }));
}`,
    keyPoints: [
      'Standard SQS queues are at-least-once: the same message can be delivered more than once. The handler is not idempotent, so every duplicate credits again.',
      'Duplicates also come from the consumer: a crash between the UPDATE and DeleteMessage, or processing slower than the visibility timeout, makes the message visible again. Producer retries can publish the same event twice.',
      'Fix with an idempotent consumer: in one transaction, INSERT INTO processed_events(event_id) ... ON CONFLICT DO NOTHING. If no row was inserted, skip; otherwise apply the update. Commit, then delete the message.',
      'Even better, make the effect naturally idempotent: insert a ledger entry with a UNIQUE payment id and derive the balance, instead of incrementing blindly.',
      'Messages that keep failing go to a dead-letter queue via a redrive policy (maxReceiveCount) with alerting. Never ack-and-drop.',
      'FIFO queues deduplicate sends only within a 5-minute window, and Kafka consumers committing offsets after processing are also at-least-once. "Exactly once" is really at-least-once delivery plus idempotent processing.',
      'On the producer side, use a transactional outbox so the event is published if and only if the payment row is committed.',
    ],
    sources: [
      { label: 'microservices.io — Idempotent Consumer', url: 'https://microservices.io/patterns/communication-style/idempotent-consumer.html' },
      { label: 'Amazon SQS — At-least-once delivery', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html' },
      { label: 'Amazon SQS — Dead-letter queues', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html' },
    ],
  },
  {
    id: 'arch-saga',
    category: 'architecture',
    level: 'senior',
    type: 'concept',
    prompt:
      'Placing an order must reserve stock (inventory service), charge the card (payment service) and confirm the order (order service), each with its own database. How do you keep this consistent? Why not a distributed transaction?',
    keyPoints: [
      'There is no ACID transaction across services. Two-phase commit (XA) needs every participant to support it (most brokers, NoSQL stores and third-party APIs like a PSP do not), blocks on coordinator failure and hurts availability.',
      'A saga is a sequence of local transactions. Each step publishes an event or replies, and each has a compensating action (release stock, refund payment) that runs if a later step fails.',
      'Choreography: services react to each other’s events. Fine for a few steps, but the flow is implicit and cyclic dependencies creep in. Orchestration: one orchestrator (a state machine, or a workflow engine such as Temporal or AWS Step Functions) tells each participant what to do. Explicit and easier to monitor.',
      'Compensations are semantic, not rollbacks. Intermediate states are visible (no isolation), so model them explicitly (PENDING, RESERVED) and use countermeasures such as semantic locks.',
      'Every step must be idempotent and retried with timeouts. Order the steps so the hard-to-compensate one (the "pivot", e.g. charging the card) comes as late as possible.',
      'Publish events reliably with a transactional outbox (or CDC, e.g. Debezium) so state change and event never diverge.',
    ],
    sources: [
      { label: 'microservices.io — Saga', url: 'https://microservices.io/patterns/data/saga.html' },
      { label: 'microservices.io — Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
      { label: 'Azure Architecture Center — Saga pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/saga' },
    ],
  },
  {
    id: 'arch-cqrs-es',
    category: 'architecture',
    level: 'senior',
    type: 'concept',
    prompt:
      'Explain CQRS and event sourcing. Would you use them for a new SaaS product’s backend? Where would they fit and where would they hurt?',
    keyPoints: [
      'CQRS separates the write model (commands that enforce invariants) from one or more read models (denormalised projections optimised for queries). It can be the same database or separate stores.',
      'With asynchronously updated read models you accept eventual consistency: handle read-your-own-writes in the UI or API (return the new state, version checks, wait for projection).',
      'Event sourcing stores state as an append-only sequence of domain events. Current state is rebuilt by replaying them, usually with snapshots, and new projections can be built from history.',
      'Benefits: a full audit trail, temporal queries ("what did this account look like last month"), debugging by replay, natural event publishing.',
      'Costs: event schema versioning forever (upcasting), projection rebuilds and lag, harder ad-hoc queries, GDPR deletion in an immutable log (crypto-shredding), a steep learning curve.',
      'Event sourcing almost always needs CQRS; CQRS does not need event sourcing.',
      'Apply them to specific bounded contexts where history is the business (ledgers, bookings, workflows), not to the whole system. Most CRUD domains are better with plain tables.',
    ],
    sources: [
      { label: 'Martin Fowler — CQRS', url: 'https://martinfowler.com/bliki/CQRS.html' },
      { label: 'Martin Fowler — Event Sourcing', url: 'https://martinfowler.com/eaaDev/EventSourcing.html' },
      { label: 'microservices.io — Event sourcing', url: 'https://microservices.io/patterns/data/event-sourcing.html' },
    ],
  },
  {
    id: 'arch-resilience',
    category: 'architecture',
    level: 'senior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'During a slowdown of the profile service, this client helper turned a partial outage into a full one. What is wrong, and which resilience patterns would you apply?',
    codeLang: 'js',
    code: `async function getProfile(userId) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(\`\${PROFILE_URL}/users/\${userId}\`);
      return await res.json();
    } catch (err) {
      logger.warn({ err, attempt }, 'profile call failed, retrying');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}`,
    keyPoints: [
      'No timeout: a slow dependency holds requests, sockets and memory for minutes. Add a deadline, e.g. fetch(url, { signal: AbortSignal.timeout(2000) }), shorter than the caller’s own timeout.',
      'Unbounded retries with a fixed 1 s delay: every client retries in lockstep, multiplying load on an already struggling service (retry storm). Cap attempts (2–3) and use exponential backoff with jitter.',
      'res.ok is never checked: a 503 is not retried and an error body is returned as if it were a profile, while a 400 should not be retried at all. Retry only transient failures and only idempotent operations.',
      'Retries at several layers multiply (3 × 3 × 3). Retry at one layer, and consider a retry budget or token bucket.',
      'Circuit breaker (e.g. opossum): after a failure threshold, fail fast for a cool-down period, then let a few trial requests through (half-open). This protects both sides and allows a fallback (cached profile, degraded response).',
      'Bulkhead: limit concurrent calls per dependency (a small pool or semaphore) so one slow dependency cannot exhaust the whole process. Pair with load shedding.',
    ],
    sources: [
      { label: 'Amazon Builders’ Library — Timeouts, retries and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
      { label: 'Azure Architecture Center — Circuit Breaker pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker' },
      { label: 'Azure Architecture Center — Bulkhead pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead' },
      { label: 'opossum (Node.js circuit breaker)', url: 'https://github.com/nodeshift/opossum' },
    ],
  },
  {
    id: 'arch-gateway-bff',
    category: 'architecture',
    level: 'senior',
    type: 'concept',
    prompt:
      'A web app, two mobile apps and external partners call a dozen backend services directly. Would you introduce an API gateway, backends-for-frontends, or both? What should and should not live there?',
    keyPoints: [
      'API gateway: a single entry point handling routing, TLS termination, authentication (token validation), rate limiting and quotas, request IDs, CORS and caching. Usually managed or off the shelf (cloud gateways, Kong, Envoy) rather than hand-written.',
      'BFF: a backend per client experience, often a Node service owned by that frontend team. It aggregates several service calls and shapes responses for one UI, cutting round trips for mobile.',
      'GraphQL can play the BFF/aggregation role. Partners usually get a stable, versioned public API separate from internal BFFs.',
      'Keep business logic out of the gateway and BFFs, or they become a new monolith and a coordination bottleneck. They orchestrate and translate; services own the rules.',
      'Resilience in aggregation: parallel calls, per-call timeouts, partial responses (Promise.allSettled) and fallbacks, so one slow service does not fail the whole page.',
      'Trade-offs: an extra network hop, another component to scale and secure (it must be horizontally scaled, not a single point of failure), and possible duplication across BFFs.',
    ],
    sources: [
      { label: 'microservices.io — API gateway / BFF', url: 'https://microservices.io/patterns/apigateway.html' },
      { label: 'Azure Architecture Center — Backends for Frontends pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends' },
      { label: 'Sam Newman — Backends For Frontends', url: 'https://samnewman.io/patterns/architectural/bff/' },
    ],
  },
];
