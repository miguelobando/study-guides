import type { Question } from '../types';

const PG_QUERIES = { label: 'node-postgres — Queries', url: 'https://node-postgres.com/features/queries' };
const PG_POOLING = { label: 'node-postgres — Pooling', url: 'https://node-postgres.com/features/pooling' };
const PG_TRANSACTIONS = { label: 'node-postgres — Transactions', url: 'https://node-postgres.com/features/transactions' };
const PG_ISOLATION = {
  label: 'PostgreSQL docs — Transaction Isolation',
  url: 'https://www.postgresql.org/docs/current/transaction-iso.html',
};
const PG_LOCKING = {
  label: 'PostgreSQL docs — Explicit Locking',
  url: 'https://www.postgresql.org/docs/current/explicit-locking.html',
};

export const databases: Question[] = [
  {
    id: 'db-sql-vs-nosql',
    category: 'databases',
    level: 'junior',
    type: 'concept',
    prompt:
      'You are starting a new Node.js service. How do you decide between a relational database like PostgreSQL and a document database like MongoDB?',
    keyPoints: [
      'Relational: fixed schema enforced by the database, joins, foreign keys and constraints, strong ACID transactions across rows and tables. Good default for business data with relationships (orders, payments, users).',
      'Document: flexible JSON-like documents, data that is read together is stored together, horizontal scaling (sharding) built in. Good when the access pattern is "load one aggregate by id" and the shape varies.',
      'Model around access patterns: in MongoDB you design for the queries you run; in SQL you normalise and let joins and indexes serve many query shapes.',
      'The gap is smaller than it used to be: Postgres has JSONB with indexes, MongoDB has multi-document transactions and schema validation.',
      'Consider the team’s experience, operations (backups, hosting, migrations) and reporting/analytics needs; "schemaless" still means the schema lives in your application code.',
    ],
    followUps: ['When would you put JSONB columns in Postgres instead of adding a second database?'],
    sources: [
      { label: 'PostgreSQL docs — JSON Types', url: 'https://www.postgresql.org/docs/current/datatype-json.html' },
      { label: 'MongoDB docs — Data Modeling', url: 'https://www.mongodb.com/docs/manual/data-modeling/' },
    ],
  },
  {
    id: 'db-sql-injection',
    category: 'databases',
    level: 'junior',
    type: 'code',
    challenge: 'bug',
    prompt: 'This search endpoint works in manual testing. What is wrong with it and how do you fix it?',
    codeLang: 'js',
    code: `import pg from 'pg';
const pool = new pg.Pool();

app.get('/users', async (req, res) => {
  const { email } = req.query;
  const { rows } = await pool.query(
    "SELECT id, email, name FROM users WHERE email = '" + email + "'"
  );
  res.json(rows);
});`,
    keyPoints: [
      'SQL injection: user input is concatenated into the SQL text, so input like \' OR \'1\'=\'1 returns every user, and other payloads can read or modify other tables.',
      'Fix with a parameterized query: pool.query(\'SELECT ... WHERE email = $1\', [email]). The values are sent separately from the SQL text, so they are never parsed as SQL.',
      'Escaping by hand or using template literals is not a fix; placeholders cannot be used for identifiers (table/column names), so those must come from an allowlist.',
      'Also validate the input at the boundary (is it a string, is it an email) and avoid leaking database error messages to clients.',
      'ORMs and query builders parameterize by default, but their raw-query escape hatches ($queryRawUnsafe, knex.raw with interpolation) bring the same risk back.',
    ],
    sources: [
      PG_QUERIES,
      {
        label: 'OWASP — SQL Injection Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
      },
    ],
  },
  {
    id: 'db-redis-use-cases',
    category: 'databases',
    level: 'junior',
    type: 'concept',
    prompt: 'Your team wants to add Redis to the stack. What is Redis good for in a Node.js backend, and what would you be careful about?',
    keyPoints: [
      'In-memory key-value store with rich data types (strings, hashes, lists, sets, sorted sets, streams) and per-key expiry (TTL).',
      'Common uses: caching query results, session storage shared between instances, rate limiting counters (INCR + EXPIRE), job queues (e.g. BullMQ, Streams), pub/sub between instances, leaderboards with sorted sets.',
      'Pub/sub is fire-and-forget: subscribers that are disconnected miss messages. Use Streams or a real broker when delivery matters.',
      'Memory is the limit: configure maxmemory and an eviction policy, and decide what happens when data is evicted or Redis restarts (persistence settings).',
      'Locks with SET key value NX PX are fine for efficiency, but not safe for correctness without fencing tokens (expiry plus process pauses can let two holders overlap).',
      'Treat it as a cache or helper, not the source of truth, unless you have deliberately configured and tested durability.',
    ],
    followUps: ['How would you implement a fixed-window rate limiter with Redis?'],
    sources: [
      { label: 'Redis docs — Key eviction', url: 'https://redis.io/docs/latest/develop/reference/eviction/' },
      { label: 'Redis docs — Pub/Sub', url: 'https://redis.io/docs/latest/develop/pubsub/' },
      { label: 'Redis docs — Distributed Locks', url: 'https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/' },
    ],
  },
  {
    id: 'db-orm-vs-sql',
    category: 'databases',
    level: 'mid',
    type: 'concept',
    prompt:
      'Prisma, Drizzle, Knex, TypeORM or raw SQL with pg: how would you choose a data access approach for a Node.js/TypeScript service, and what are the trade-offs?',
    keyPoints: [
      'Raw SQL (pg, postgres.js): full control and performance, every database feature available; you write mapping, types and migrations yourself.',
      'Query builders (Knex, Kysely): composable SQL in JS with parameterization built in; Kysely adds strong TypeScript types. Still close to SQL, so the mental model stays simple.',
      'Drizzle: schema defined in TypeScript, SQL-like API with inferred types, thin runtime; drizzle-kit for migrations.',
      'Prisma: schema file plus generated, fully typed client and Prisma Migrate; very productive, but some queries need raw SQL and you should check the SQL it generates.',
      'TypeORM: decorator-based entities with Active Record or Data Mapper; more implicit behaviour (lazy relations, cascades) that can hide queries.',
      'Whatever you choose: know the SQL it emits (log queries), watch for N+1, keep an escape hatch for raw parameterized SQL, and treat migrations as code.',
    ],
    followUps: ['How would you debug a slow query generated by an ORM?'],
    sources: [
      { label: 'Prisma docs — What is Prisma ORM?', url: 'https://www.prisma.io/docs/orm' },
      { label: 'Drizzle ORM — Why Drizzle?', url: 'https://orm.drizzle.team/docs/overview' },
      { label: 'Knex.js — Guide', url: 'https://knexjs.org/guide/' },
    ],
  },
  {
    id: 'db-n-plus-one',
    category: 'databases',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'This endpoint is fast in development but takes seconds in production with 500 orders. Why, and how would you fix it?',
    codeLang: 'js',
    code: `app.get('/orders', async (req, res) => {
  const { rows: orders } = await pool.query(
    'SELECT id, customer_id, total FROM orders ORDER BY created_at DESC LIMIT 500'
  );

  for (const order of orders) {
    const { rows } = await pool.query(
      'SELECT id, name FROM customers WHERE id = $1',
      [order.customer_id]
    );
    order.customer = rows[0];
  }

  res.json(orders);
});`,
    keyPoints: [
      'N+1 queries: one query for the list plus one per row, run sequentially, so latency is 501 round trips to the database.',
      'Fix with a JOIN: SELECT o.id, o.total, c.id AS customer_id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id ...',
      'Or batch: collect the distinct ids and run one query with WHERE id = ANY($1) (or IN), then map the results in memory.',
      'In GraphQL resolvers or ORMs, use a DataLoader-style batcher or the ORM’s eager loading (include/with) instead of lazy loading in a loop.',
      'Promise.all over the loop only parallelises the damage: still 500 queries, and it can exhaust the connection pool.',
      'Detect it by logging query counts per request or in APM traces.',
    ],
    sources: [
      { label: 'PostgreSQL docs — Row and Array Comparisons (ANY)', url: 'https://www.postgresql.org/docs/current/functions-comparisons.html' },
      { label: 'GraphQL — DataLoader', url: 'https://github.com/graphql/dataloader' },
      {
        label: 'Prisma docs — Query optimization',
        url: 'https://www.prisma.io/docs/orm/v7/prisma-client/queries/advanced/query-optimization-performance',
      },
    ],
  },
  {
    id: 'db-connection-per-request',
    category: 'databases',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'Under load this service starts failing with "sorry, too many clients already" and latency climbs. What is wrong, and how should connections be managed?',
    codeLang: 'js',
    code: `import pg from 'pg';

app.get('/products/:id', async (req, res) => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.sendStatus(404);

  res.json(rows[0]);
  await client.end();
});`,
    keyPoints: [
      'A new connection per request is expensive (TCP, TLS, auth, a backend process per connection in Postgres) and unbounded under load.',
      'Connection leak: on the 404 path (and if the query throws) client.end() is never called, so connections pile up until max_connections is hit.',
      'Fix: create one pg.Pool per process at startup and use pool.query(), or pool.connect() with client.release() in a finally block.',
      'Size the pool deliberately: pool max × number of instances (pods, workers) must stay below the database max_connections, leaving room for admin and migrations. More connections is not more throughput.',
      'Set connectionTimeoutMillis/idleTimeoutMillis and a statement timeout, and close the pool on graceful shutdown.',
      'Serverless or many small instances: put PgBouncer (or a managed pooler/proxy) in front; transaction pooling mode does not keep session state (SET, session advisory locks, LISTEN), so check what your driver relies on.',
    ],
    followUps: ['How would you pick the pool size for a service with 20 replicas?'],
    sources: [
      PG_POOLING,
      { label: 'PostgreSQL wiki — Number Of Database Connections', url: 'https://wiki.postgresql.org/wiki/Number_Of_Database_Connections' },
      { label: 'PgBouncer — Features', url: 'https://www.pgbouncer.org/features.html' },
    ],
  },
  {
    id: 'db-transaction-transfer',
    category: 'databases',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This money transfer sometimes leaves money missing after an error, even though it uses BEGIN and COMMIT. Explain why and rewrite it correctly.',
    codeLang: 'js',
    code: `async function transfer(fromId, toId, amount) {
  await pool.query('BEGIN');
  try {
    await pool.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    );
    await pool.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}`,
    keyPoints: [
      'pool.query checks out a client per call, so BEGIN, the UPDATEs, COMMIT and ROLLBACK can run on different connections: the updates may auto-commit independently and the transaction is meaningless.',
      'Worse, a connection can be returned to the pool in the middle of an open transaction and affect the next request that uses it.',
      'Fix: const client = await pool.connect(); run BEGIN, both UPDATEs and COMMIT on that client; ROLLBACK in catch; client.release() in finally.',
      'Add business checks inside the transaction: UPDATE ... SET balance = balance - $1 WHERE id = $2 AND balance >= $1 and verify rowCount, or lock rows with SELECT ... FOR UPDATE.',
      'Lock both accounts in a consistent order (e.g. lower id first) to avoid deadlocks when two transfers run in opposite directions; retry on deadlock or serialization errors.',
      'ACID: atomicity (both or neither), consistency (constraints like balance >= 0 via CHECK), isolation (concurrent transfers), durability (committed means persisted).',
    ],
    sources: [
      PG_TRANSACTIONS,
      { label: 'PostgreSQL docs — Transactions tutorial', url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html' },
      PG_LOCKING,
    ],
  },
  {
    id: 'db-isolation-output',
    category: 'databases',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt:
      'Two sessions run concurrently in PostgreSQL at the default isolation level, in the order shown. What do the two SELECTs in session B return? What changes if B uses REPEATABLE READ?',
    codeLang: 'sql',
    code: `-- accounts: (id = 1, balance = 100)

-- Session A                                  -- Session B
BEGIN;
UPDATE accounts SET balance = balance - 30
WHERE id = 1;
                                              BEGIN;
                                              SELECT balance FROM accounts WHERE id = 1; -- (1)
COMMIT;
                                              SELECT balance FROM accounts WHERE id = 1; -- (2)
                                              COMMIT;`,
    keyPoints: [
      '(1) returns 100 and (2) returns 70.',
      'The default is READ COMMITTED: each statement sees a snapshot of data committed before that statement started, so (1) does not see A’s uncommitted change and (2) sees it after A commits (a non-repeatable read).',
      'PostgreSQL never allows dirty reads; READ UNCOMMITTED behaves like READ COMMITTED.',
      'With REPEATABLE READ (2) also returns 100: the snapshot is taken at the first statement of the transaction and reused. If B then tried to update that row, it would fail with a serialization error and must retry.',
      'SERIALIZABLE adds detection of dangerous read/write dependencies (SSI) so the result matches some serial order; the application must retry transactions that fail with SQLSTATE 40001.',
    ],
    followUps: ['Which anomaly would cause a lost update here, and how would you prevent it?'],
    sources: [PG_ISOLATION, { label: 'PostgreSQL docs — MVCC Introduction', url: 'https://www.postgresql.org/docs/current/mvcc-intro.html' }],
  },
  {
    id: 'db-index-not-used',
    category: 'databases',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'The table has the indexes shown, yet each of these queries is slow on a large table. For each one, explain why the index does not help and how you would fix it. How would you confirm?',
    codeLang: 'sql',
    code: `CREATE INDEX users_email_idx ON users (email);
CREATE INDEX orders_tenant_created_idx ON orders (tenant_id, created_at);

-- (a)
SELECT * FROM users WHERE lower(email) = 'ada@example.com';
-- (b)
SELECT * FROM orders WHERE created_at > now() - interval '1 day';
-- (c)
SELECT * FROM users WHERE email LIKE '%@example.com';
-- (d)
SELECT * FROM orders WHERE tenant_id = 42;
-- (tenant 42 owns 60% of all rows)`,
    keyPoints: [
      '(a) A function on the column hides it from a plain index: create an expression index ON users (lower(email)) or store a normalised value (or use citext).',
      '(b) A B-tree on (tenant_id, created_at) is ordered by tenant first; without a condition on the leading column it is usually not useful. Add an index on (created_at) or rethink the column order. PostgreSQL 18 can sometimes skip-scan, but only when the leading column has few distinct values.',
      '(c) A leading wildcard cannot use a B-tree range scan; use a trigram (pg_trgm) GIN index, store the domain in its own column, or use full-text search.',
      '(d) The predicate is not selective: reading 60% of the table through an index means random I/O for most pages, so the planner correctly prefers a sequential scan. The fix is to return less (pagination, aggregation), not another index. Stale statistics (run ANALYZE) can also mislead the planner.',
      'Verify with EXPLAIN (ANALYZE, BUFFERS): look at Seq Scan vs Index Scan, estimated vs actual rows, and buffers read.',
      'Covering indexes (INCLUDE columns) allow index-only scans; every index slows writes and uses memory, so drop unused ones (pg_stat_user_indexes).',
    ],
    sources: [
      { label: 'PostgreSQL docs — Multicolumn Indexes', url: 'https://www.postgresql.org/docs/current/indexes-multicolumn.html' },
      { label: 'PostgreSQL docs — Indexes on Expressions', url: 'https://www.postgresql.org/docs/current/indexes-expressional.html' },
      { label: 'PostgreSQL docs — Using EXPLAIN', url: 'https://www.postgresql.org/docs/current/using-explain.html' },
      {
        label: 'Use The Index, Luke — Concatenated indexes',
        url: 'https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys',
      },
    ],
  },
  {
    id: 'db-keyset-pagination',
    category: 'databases',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'The feed endpoint uses this query. Page 1 is fast, page 5,000 takes seconds, and users see duplicates while scrolling. Rewrite it with keyset (cursor) pagination and describe the API change.',
    codeLang: 'sql',
    code: `-- GET /posts?page=5000
SELECT id, title, created_at
FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 99980;`,
    keyPoints: [
      'OFFSET still reads and discards all skipped rows, so cost grows with page depth; inserts between requests shift rows and cause duplicates or gaps.',
      'Keyset: remember the last row of the page and continue from it: WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20.',
      'Add a unique tie-breaker (id) so the ordering is deterministic, and an index matching the order, e.g. ON posts (created_at DESC, id DESC).',
      'API returns an opaque cursor (e.g. base64 of created_at + id) and the client sends ?cursor=...; you lose "jump to page N", which most feeds do not need.',
      'Fetch LIMIT + 1 rows to know whether there is a next page; validate and decode the cursor before using it as a parameter.',
    ],
    sources: [
      { label: 'Use The Index, Luke — We need tool support for keyset pagination', url: 'https://use-the-index-luke.com/no-offset' },
      {
        label: 'Use The Index, Luke — Paging Through Results',
        url: 'https://use-the-index-luke.com/sql/partial-results/fetch-next-page',
      },
    ],
  },
  {
    id: 'db-mongo-schema',
    category: 'databases',
    level: 'mid',
    type: 'concept',
    prompt:
      'You are modelling a blog in MongoDB: users, posts, comments and tags. How do you decide what to embed and what to reference?',
    keyPoints: [
      'Embed data that is read together, belongs to the parent and is bounded in size (e.g. a post’s tags, an author snapshot): one read, atomic single-document updates.',
      'Reference when the related set is large or unbounded (thousands of comments), shared by many parents (many-to-many), or accessed and updated on its own.',
      'Documents have a 16 MB limit; unbounded arrays also make updates and indexes expensive.',
      'Duplicating data (extended reference, e.g. author name on each post) speeds reads but needs a plan to update copies.',
      'Design from the queries the app runs; use $lookup sparingly, schema validation ($jsonSchema) for safety, and multi-document transactions only when a single-document design is not possible.',
      'Patterns worth naming: subset (latest 10 comments embedded, rest referenced), bucket, computed fields.',
    ],
    sources: [
      { label: 'MongoDB docs — Embedded Data', url: 'https://www.mongodb.com/docs/manual/data-modeling/embedding/' },
      { label: 'MongoDB docs — Referenced Data', url: 'https://www.mongodb.com/docs/manual/data-modeling/referencing/' },
      { label: 'MongoDB docs — Limits and Thresholds', url: 'https://www.mongodb.com/docs/manual/reference/limits/' },
    ],
  },
  {
    id: 'db-lost-update',
    category: 'databases',
    level: 'senior',
    type: 'code',
    challenge: 'bug',
    prompt:
      'During a flash sale this code oversold a product with 10 units by 37 orders. Explain the race and give at least three ways to fix it, with their trade-offs.',
    codeLang: 'js',
    code: `async function reserve(productId, qty) {
  const { rows } = await pool.query(
    'SELECT stock FROM products WHERE id = $1',
    [productId]
  );
  const stock = rows[0].stock;
  if (stock < qty) throw new Error('Out of stock');

  await pool.query(
    'UPDATE products SET stock = $1 WHERE id = $2',
    [stock - qty, productId]
  );
}`,
    keyPoints: [
      'Lost update (read-modify-write race): concurrent requests read the same stock, all pass the check, and each writes its own computed value. Wrapping it in a READ COMMITTED transaction does not fix it.',
      'Atomic conditional update: UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock, and treat rowCount 0 as out of stock. Simplest and fastest.',
      'Pessimistic locking: in a transaction on one client, SELECT ... FOR UPDATE then UPDATE; other transactions wait. Correct but serialises hot rows and needs short transactions and lock timeouts.',
      'Optimistic locking: a version column; UPDATE ... SET stock = $1, version = version + 1 WHERE id = $2 AND version = $3, retry on rowCount 0. Good with low contention, many retries under high contention.',
      'SERIALIZABLE or REPEATABLE READ isolation with retry on serialization failures (SQLSTATE 40001).',
      'Add a CHECK (stock >= 0) constraint as a safety net, and for extreme hot spots consider pre-splitting inventory or a queue.',
    ],
    followUps: ['How would you implement the retry loop for serialization failures in Node.js?'],
    sources: [
      PG_LOCKING,
      PG_ISOLATION,
      { label: 'PostgreSQL docs — SELECT (locking clause)', url: 'https://www.postgresql.org/docs/current/sql-select.html' },
    ],
  },
  {
    id: 'db-zero-downtime-migrations',
    category: 'databases',
    level: 'senior',
    type: 'design',
    prompt:
      'You need to rename users.name to users.full_name on a large, busy table, with rolling deploys and no downtime. Walk me through the migration plan and how your team manages migrations in general.',
    keyPoints: [
      'Rolling deploys mean old and new code run at the same time, so every schema step must be compatible with both versions.',
      'Expand/contract (parallel change): add full_name (nullable); deploy code that writes both columns; backfill in small batches; switch reads to full_name; stop writing name; drop name in a later release.',
      'Avoid long locks: even fast DDL needs an ACCESS EXCLUSIVE lock and can queue behind long transactions, so set lock_timeout and retry. Create indexes with CREATE INDEX CONCURRENTLY (not inside a transaction).',
      'Adding NOT NULL safely: add a CHECK (col IS NOT NULL) NOT VALID constraint, VALIDATE it separately, then SET NOT NULL.',
      'Process: migrations are versioned files in the repo, reviewed like code, applied by one tool in CI/CD (not by app instances racing at startup), forward-only, tested against production-like data volumes.',
      'Separate schema migrations from large data backfills, and keep a rollback plan that is a new forward migration.',
    ],
    sources: [
      { label: 'Martin Fowler — Parallel Change', url: 'https://martinfowler.com/bliki/ParallelChange.html' },
      { label: 'Martin Fowler — Evolutionary Database Design', url: 'https://martinfowler.com/articles/evodb.html' },
      { label: 'PostgreSQL docs — ALTER TABLE', url: 'https://www.postgresql.org/docs/current/sql-altertable.html' },
      { label: 'PostgreSQL docs — CREATE INDEX', url: 'https://www.postgresql.org/docs/current/sql-createindex.html' },
    ],
  },
  {
    id: 'db-cache-aside',
    category: 'databases',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement getProduct(id) and updateProduct(id, data) using the cache-aside pattern with Redis. Then tell me what can go wrong under load and how you would handle it.',
    codeLang: 'js',
    code: `// Available: redis (node-redis v4+ client), db.findProduct(id), db.updateProduct(id, data)
const TTL_SECONDS = 300;

async function getProduct(id) {
  // TODO
}

async function updateProduct(id, data) {
  // TODO
}`,
    keyPoints: [
      'Read: GET product:{id}; on hit return JSON.parse; on miss load from the DB and SET with an expiry (EX/PX), then return. Cache "not found" briefly to avoid repeated misses.',
      'Write: update the database first, then delete the cache key (invalidate) rather than writing the new value, which avoids racing writers leaving stale data.',
      'Races still exist (a slow reader can repopulate an old value after the delete), so always keep a TTL as a bound on staleness; add jitter so keys do not expire together.',
      'Cache stampede on a hot key: coalesce concurrent misses in-process (share one pending promise per key), use a short lock, or serve stale while one request refreshes.',
      'Redis failures should degrade to the database (timeouts, circuit breaker), not take the endpoint down.',
      'Invalidation is the hard part: know every write path (including other services and jobs); for multi-service setups consider events or change data capture to invalidate.',
    ],
    followUps: ['How would you cache a list endpoint that depends on many products?'],
    sources: [
      { label: 'Azure Architecture Center — Cache-Aside pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside' },
      {
        label: 'AWS — Caching challenges and strategies',
        url: 'https://builder.aws.com/content/3K9TeXp6strMiJ4vhakpRD7BQWO/caching-challenges-and-strategies',
      },
      { label: 'Redis docs — SET', url: 'https://redis.io/docs/latest/commands/set/' },
    ],
  },
  {
    id: 'db-scaling-reads-writes',
    category: 'databases',
    level: 'senior',
    type: 'design',
    prompt:
      'The primary Postgres database is at 80% CPU. The team proposes read replicas, then sharding. How do you approach scaling, and what problems do replicas and sharding introduce?',
    keyPoints: [
      'First optimise: slow query log/pg_stat_statements, indexes, N+1, caching, connection pooling. Vertical scaling is often cheapest.',
      'Read replicas use asynchronous streaming replication: reads scale, writes do not, and replicas lag behind the primary.',
      'Replication lag breaks read-your-writes: a user saves and immediately reads stale data. Fixes: read from the primary for that user for a short window after a write, sticky sessions, or wait until the replica has replayed the write’s WAL position.',
      'Partitioning (one database, many tables by range/list/hash) helps huge tables: partition pruning, cheap removal of old data by dropping partitions; unique keys must include the partition key.',
      'Sharding (data split across databases) scales writes but costs cross-shard joins, transactions and rebalancing; choosing the shard key (high cardinality, even load, matches access, e.g. tenant_id) is the key decision.',
      'Prefer managed or proven options (Citus, MongoDB sharding, cloud offerings) over hand-rolled routing when you must shard.',
    ],
    sources: [
      { label: 'PostgreSQL docs — Hot Standby', url: 'https://www.postgresql.org/docs/current/hot-standby.html' },
      { label: 'PostgreSQL docs — Table Partitioning', url: 'https://www.postgresql.org/docs/current/ddl-partitioning.html' },
      { label: 'MongoDB docs — Sharding', url: 'https://www.mongodb.com/docs/manual/sharding/' },
    ],
  },
  {
    id: 'db-outbox',
    category: 'databases',
    level: 'senior',
    type: 'design',
    prompt:
      'When an order is created, the service inserts it into Postgres and then publishes an OrderCreated event to Kafka. Sometimes orders exist without events, and sometimes events exist without orders. Why, and how would you design this reliably?',
    keyPoints: [
      'Dual-write problem: the database and the broker cannot share one transaction; a crash or error between the two writes leaves them inconsistent, in either order.',
      'Transactional outbox: in the same database transaction insert the order and an outbox row (event id, type, payload, aggregate id).',
      'A relay publishes outbox rows to the broker and marks them sent: either polling (SELECT ... FOR UPDATE SKIP LOCKED in batches) or change data capture/log tailing (e.g. Debezium).',
      'Delivery is at-least-once: the relay can publish and crash before marking the row, so consumers must be idempotent (dedupe by event id).',
      'Keep ordering per aggregate (partition by aggregate id), clean up old outbox rows, and monitor outbox lag.',
      'Avoid 2PC/XA across database and broker; the inbox pattern on the consumer side complements the outbox.',
    ],
    sources: [
      { label: 'microservices.io — Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
      { label: 'microservices.io — Transaction log tailing', url: 'https://microservices.io/patterns/data/transaction-log-tailing.html' },
      {
        label: 'Debezium — Outbox Event Router',
        url: 'https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html',
      },
    ],
  },
];
