import type { Question } from '../types';

const K8S_PROBES = {
  label: 'Kubernetes — Configure liveness, readiness and startup probes',
  url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/',
};
const K8S_POD_LIFECYCLE = {
  label: 'Kubernetes — Pod lifecycle (termination of pods)',
  url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/',
};
const DOCKER_NODE_BP = {
  label: 'docker-node — Docker and Node.js best practices',
  url: 'https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md',
};
const SNYK_DOCKER = {
  label: 'Snyk — 10 best practices to containerize Node.js web applications with Docker',
  url: 'https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/',
};
const NODE_HTTP = { label: 'Node.js docs — HTTP (server.close, closeIdleConnections)', url: 'https://nodejs.org/api/http.html' };
const NODE_RELEASES = { label: 'Node.js — Release schedule and LTS status', url: 'https://nodejs.org/en/about/previous-releases' };

export const production: Question[] = [
  {
    id: 'prod-env-config',
    category: 'production',
    level: 'junior',
    type: 'concept',
    prompt:
      'How should a Node service get its configuration (port, database URL, API keys) in development, staging and production? Where do secrets live?',
    keyPoints: [
      '12-factor: configuration that varies between deploys lives in environment variables, strictly separate from code; the same build artifact (image) runs in every environment.',
      'process.env values are always strings (or undefined): parse and validate them once at startup in a single config module, and fail fast with a clear message if something is missing or invalid.',
      'Local development: a .env file loaded with node --env-file=.env (or process.loadEnvFile()) instead of a dotenv dependency; real environment variables take precedence over the file.',
      'Never commit secrets: .env in .gitignore, commit a .env.example with dummy values, and enable secret scanning in the repository.',
      'In production inject secrets at runtime from a secrets manager (AWS Secrets Manager, GCP Secret Manager, Vault) or Kubernetes Secrets (base64 is encoding, not encryption: enable encryption at rest and RBAC); never bake them into the image.',
      'Do not log the config object as-is: redact secrets.',
    ],
    sources: [
      { label: 'The Twelve-Factor App — Config', url: 'https://12factor.net/config' },
      { label: 'Node.js docs — Command-line options (--env-file)', url: 'https://nodejs.org/api/cli.html' },
      { label: 'Kubernetes — Secrets', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' },
    ],
  },
  {
    id: 'prod-node-env',
    category: 'production',
    level: 'junior',
    type: 'concept',
    prompt: 'What does setting NODE_ENV=production actually change? Should staging run with NODE_ENV=staging?',
    keyPoints: [
      'Node.js itself does not read NODE_ENV; it is a convention used by libraries, frameworks and tools.',
      'Express, for example, caches view templates and produces less verbose error responses (no stack traces) in production mode; many libraries skip development-only checks and warnings.',
      'npm omits devDependencies on install when NODE_ENV=production (the omit config defaults to dev); in Docker builds prefer an explicit npm ci --omit=dev.',
      'Staging should run the same code paths as production, so it should also use NODE_ENV=production; use a separate variable (APP_ENV, DEPLOY_ENV) for "which environment am I in".',
      'Avoid scattering if (process.env.NODE_ENV === ...) branches through business logic; express differences as explicit config values.',
    ],
    sources: [
      {
        label: 'Node.js Learn — The difference between development and production',
        url: 'https://nodejs.org/learn/getting-started/nodejs-the-difference-between-development-and-production',
      },
      {
        label: 'Express — Production best practices: performance',
        url: 'https://expressjs.com/en/advanced/best-practice-performance/',
      },
      { label: 'npm docs — config (omit)', url: 'https://docs.npmjs.com/cli/v11/using-npm/config/' },
    ],
  },
  {
    id: 'prod-dockerfile',
    category: 'production',
    level: 'mid',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'Review this Dockerfile for a TypeScript API. What would you change and why?',
    codeLang: 'dockerfile',
    code: `FROM node:latest

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

ENV DATABASE_URL=postgres://admin:s3cret@db.prod:5432/app
EXPOSE 3000

CMD npm start`,
    keyPoints: [
      'node:latest is unpinned and large: pin a specific LTS version with a slim (or alpine) variant, ideally by digest, so builds are reproducible.',
      'COPY . . before installing invalidates the dependency layer on every code change: copy package.json and package-lock.json first, run npm ci, then copy the source, so the install layer is cached.',
      'npm install can change the lockfile; use npm ci. Use a multi-stage build: build stage with devDependencies runs tsc, runtime stage runs npm ci --omit=dev and copies only dist/, giving a smaller image with fewer vulnerabilities.',
      'No .dockerignore: node_modules, .git, .env and local build output get copied into the context and image (secrets, wrong-platform native modules, slow builds).',
      'The secret is baked into an image layer and visible to anyone with the image (docker history/inspect); inject it at runtime from the orchestrator or a secrets manager. Also set NODE_ENV=production.',
      'Runs as root: switch to the unprivileged node user that official images provide (USER node, files owned accordingly).',
      'CMD npm start (shell form) puts sh and npm between the container runtime and node, and SIGTERM may never reach the app, so it gets SIGKILLed after the grace period. Use CMD ["node", "dist/server.js"], plus --init or tini so PID 1 handles signals and reaps zombies.',
    ],
    followUps: ['How would you cache npm downloads across builds (BuildKit cache mounts)?'],
    sources: [
      DOCKER_NODE_BP,
      SNYK_DOCKER,
      { label: 'Docker docs — Multi-stage builds', url: 'https://docs.docker.com/build/building/multi-stage/' },
      { label: 'Docker docs — Build cache', url: 'https://docs.docker.com/build/cache/' },
      { label: 'npm docs — npm ci', url: 'https://docs.npmjs.com/cli/v11/commands/npm-ci/' },
    ],
  },
  {
    id: 'prod-pid1-signals',
    category: 'production',
    level: 'mid',
    type: 'concept',
    prompt:
      'Every deploy, our Node containers take exactly 30 seconds to stop and in-flight requests are cut off. What is probably happening, and how do you fix it?',
    keyPoints: [
      'On stop, the runtime sends SIGTERM to the container’s PID 1, waits for a grace period (Kubernetes terminationGracePeriodSeconds, default 30 s; docker stop defaults to 10 s) and then sends SIGKILL. Stopping at exactly the grace period means the app ignored SIGTERM.',
      'With shell-form CMD or npm start, PID 1 is sh or npm, which may not forward signals to the node child process.',
      'If node itself is PID 1, the kernel does not apply default signal actions to PID 1: without a handler, SIGTERM and SIGINT do nothing. The docker-node docs state Node was not designed to run as PID 1.',
      'Fix: exec-form CMD ["node", "dist/server.js"]; register process.on("SIGTERM") (and SIGINT) handlers that shut down gracefully; run with docker run --init or put tini/dumb-init in the image as ENTRYPOINT (Kubernetes has no --init flag).',
      'The init process also reaps zombie child processes if the app spawns children.',
      'Then make the shutdown itself graceful: stop accepting connections, drain, close resources, with a timeout shorter than the grace period.',
    ],
    sources: [
      DOCKER_NODE_BP,
      {
        label: 'Node.js Best Practices — Bootstrap using node, not npm',
        url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/bootstrap-using-node.md',
      },
      { label: 'tini', url: 'https://github.com/krallin/tini' },
      K8S_POD_LIFECYCLE,
    ],
  },
  {
    id: 'prod-graceful-shutdown-bug',
    category: 'production',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This graceful shutdown was added after users complained about 502s during deploys, but the 502s and "Client was closed" errors are still there. What is wrong?',
    codeLang: 'js',
    code: `const server = app.listen(3000);

process.on('SIGTERM', async () => {
  console.log('shutting down');
  server.close();
  await pool.end();
  process.exit(0);
});`,
    keyPoints: [
      'server.close() is not awaited: it only stops accepting new connections and calls its callback once existing connections have ended. The code moves on immediately.',
      'pool.end() then runs while in-flight requests still need the database, producing errors, and process.exit(0) kills those requests mid-flight.',
      'Fix the order: stop accepting → wait for in-flight requests (await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()))) → close the DB pool and other clients → exit.',
      'Keep-alive or slow clients can keep server.close() from ever completing: recent Node versions close idle connections in server.close(), server.closeIdleConnections() and closeAllConnections() exist for older ones or for a forced close; add a hard timeout (setTimeout(...).unref() then process.exit(1)) shorter than the grace period.',
      'In Kubernetes, endpoint removal and SIGTERM happen concurrently, so new requests can still arrive: fail readiness and keep serving for a few seconds (or use a preStop sleep) before closing the server.',
      'Use process.once or a guard so a second signal does not run shutdown twice; log through a logger that is flushed before exit.',
    ],
    sources: [
      NODE_HTTP,
      {
        label: 'Express — Health checks and graceful shutdown',
        url: 'https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/',
      },
      {
        label: 'Node.js Best Practices — Shut down gracefully',
        url: 'https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/graceful-shutdown.md',
      },
      K8S_POD_LIFECYCLE,
    ],
  },
  {
    id: 'prod-probes',
    category: 'production',
    level: 'mid',
    type: 'concept',
    prompt:
      'Explain liveness, readiness and startup probes in Kubernetes. What should each check for a Node API, and what goes wrong if liveness checks the database?',
    keyPoints: [
      'Liveness: "is this container broken beyond repair?" Failing restarts the container. Keep it cheap and in-process (the event loop can answer an HTTP request), with no dependency checks.',
      'Readiness: "should this pod receive traffic right now?" Failing removes the pod from Service endpoints without restarting it. Fail during startup warm-up, during shutdown, or when the instance cannot serve.',
      'Startup probe: for slow-starting apps; liveness and readiness are held off until it succeeds, so slow boots are not killed.',
      'If liveness checks the database, a DB outage makes every pod fail liveness and restart in a loop: a dependency problem becomes a full outage and a thundering herd on recovery.',
      'Dependency checks in readiness also need care: if all pods depend on the same DB they all go unready together; prefer short timeouts, cached results and serving degraded responses.',
      'A blocked event loop fails probes (timeoutSeconds defaults to 1 s); tune periods and thresholds, and do not put probes behind auth or heavy middleware.',
    ],
    sources: [
      K8S_PROBES,
      K8S_POD_LIFECYCLE,
      {
        label: 'Express — Health checks and graceful shutdown',
        url: 'https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/',
      },
    ],
  },
  {
    id: 'prod-config-validation',
    category: 'production',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Every module reads process.env directly, and last week the service started fine but crashed hours later because REDIS_URL was missing. Implement a config module that makes this impossible.',
    codeLang: 'ts',
    code: `// config.ts
// Required: DATABASE_URL, REDIS_URL
// Optional: PORT (default 3000), LOG_LEVEL (default "info"),
//           ENABLE_CACHE (boolean, default true)

export const config = {
  // TODO
};

// elsewhere
import { config } from './config';
app.listen(config.port);`,
    keyPoints: [
      'Define a schema (zod, envalid, or similar) for every variable: required strings, URL validation, enums for LOG_LEVEL, defaults for optional values.',
      'Coerce types explicitly: PORT to an integer in range; booleans parsed from "true"/"false" (the string "false" is truthy, so Boolean(process.env.X) is a bug).',
      'Validate once at import time; on failure print every problem (names and reasons, never the secret values) and exit with a non-zero code before the server starts listening: fail fast at deploy, not hours later.',
      'Export a typed, frozen object with camelCase keys; only this module touches process.env, which also makes config easy to override in tests.',
      'Mark secrets so loggers redact them; keep defaults safe for production rather than convenient for development.',
    ],
    sources: [
      { label: 'The Twelve-Factor App — Config', url: 'https://12factor.net/config' },
      { label: 'Zod — documentation', url: 'https://zod.dev/' },
      { label: 'envalid', url: 'https://github.com/af/envalid' },
    ],
  },
  {
    id: 'prod-process-managers',
    category: 'production',
    level: 'mid',
    type: 'concept',
    prompt:
      'When would you run a Node service with PM2 or systemd, and when with Docker and an orchestrator like Kubernetes or ECS? Would you run PM2 inside a Kubernetes pod?',
    keyPoints: [
      'Every production process needs a supervisor: start on boot, restart on crash with backoff, capture logs, apply resource limits.',
      'systemd: built into most Linux distributions; Restart=on-failure, journald logs, cgroup resource limits, runs as a dedicated user. Simple and solid for a few VMs.',
      'PM2: Node-focused; cluster mode across cores, zero-downtime reload, log management, an ecosystem file. Convenient on VMs or bare metal.',
      'Orchestrators schedule containers across machines and add health probes, rolling deploys, autoscaling, service discovery and secrets: the right tool for many services or teams.',
      'Inside Kubernetes skip PM2: double supervision hides crashes from the orchestrator, complicates signals and graceful shutdown, mixes metrics of several processes, and conflicts with CPU limits. One node process per container; scale with replicas.',
    ],
    sources: [
      { label: 'PM2 — Cluster mode', url: 'https://pm2.keymetrics.io/docs/usage/cluster-mode/' },
      { label: 'Kubernetes — Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
      { label: 'The Twelve-Factor App — Processes', url: 'https://12factor.net/processes' },
    ],
  },
  {
    id: 'prod-ci-cd',
    category: 'production',
    level: 'mid',
    type: 'concept',
    prompt: 'Design a CI/CD pipeline for a Node/TypeScript service, from pull request to production.',
    keyPoints: [
      'On every PR: npm ci with a dependency cache, lint (ESLint), typecheck (tsc --noEmit), unit tests, integration tests against real dependencies (service containers or Testcontainers).',
      'Supply chain checks: npm audit --omit=dev --audit-level=high (or Snyk/OSV), secret scanning, license checks; a committed lockfile.',
      'Build the image once per commit (multi-stage), tag it with the git SHA, scan it (Trivy, Docker Scout) and push to a registry.',
      'Promote the same artifact through environments (staging → production) with config injected per environment; never rebuild per environment.',
      'Deploy progressively (rolling or canary) with smoke tests and automated rollback on failing health checks or SLOs; database migrations run as a separate, backward-compatible step.',
      'Pin the Node version consistently (.nvmrc or engines, CI matrix, Docker base image) and keep the pipeline fast with parallel jobs and caching.',
    ],
    sources: [
      { label: 'npm docs — npm audit', url: 'https://docs.npmjs.com/cli/v11/commands/npm-audit/' },
      { label: 'Trivy — vulnerability scanner', url: 'https://github.com/aquasecurity/trivy' },
      { label: 'Node.js Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices' },
    ],
  },
  {
    id: 'prod-dependency-updates',
    category: 'production',
    level: 'mid',
    type: 'concept',
    prompt:
      'Our service is two Node major versions behind and has 80 outdated packages. How do you get current and stay current without breaking production?',
    keyPoints: [
      'Automate update PRs with Renovate or Dependabot: group minor/patch updates, schedule them, automerge low-risk ones when CI is green, and handle majors individually with changelogs.',
      'The lockfile plus a good test suite is what makes this safe; semver ranges are promises, not guarantees.',
      'Treat security advisories separately and faster (npm audit, Dependabot alerts); reduce the number of dependencies over time.',
      'Production should run Active LTS or Maintenance LTS releases (Node 24 is Active LTS today); plan upgrades well before end-of-life, after which there are no security fixes. Up to Node 26 only even-numbered majors become LTS; from Node 27 every major becomes LTS after its Current phase.',
      'Upgrade one major at a time: run the test suite on the new version in a CI matrix, check deprecation warnings (--throw-deprecation), rebuild native addons, update the Docker base image, then canary in production.',
      'Make it routine (a small amount every sprint) rather than a big-bang project every few years.',
    ],
    sources: [
      NODE_RELEASES,
      { label: 'Node.js Release Working Group — schedule', url: 'https://github.com/nodejs/release' },
      { label: 'Renovate — documentation', url: 'https://docs.renovatebot.com/' },
      {
        label: 'GitHub Docs — Dependabot version updates',
        url: 'https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates',
      },
    ],
  },
  {
    id: 'prod-zero-downtime',
    category: 'production',
    level: 'senior',
    type: 'concept',
    prompt:
      'Compare rolling, blue/green and canary deployments for a Node service. What has to be true of the application and database for any of them to be zero-downtime, and where do feature flags fit?',
    keyPoints: [
      'Rolling (Kubernetes Deployment default): replace pods gradually (maxSurge / maxUnavailable); cheap, but old and new versions serve traffic at the same time and rollback is another rollout.',
      'Blue/green: a full second environment, switch the router at once; instant rollback, but double capacity, and both share the same database.',
      'Canary: send a small percentage of traffic to the new version, compare error rate and latency against the baseline, then widen (automated analysis with tools like Argo Rollouts or Flagger).',
      'Prerequisites: readiness probes and graceful shutdown so no request is dropped, and backward-compatible changes, because two versions run concurrently: API changes additive, database changes via expand/contract (add column → write both → backfill → switch reads → remove old).',
      'Feature flags decouple deploy from release: ship code dark, roll out by percentage or cohort, and use kill switches without redeploying. OpenFeature offers a vendor-neutral API.',
      'Flags have costs: test both paths, keep evaluation fast and local (cached), and remove stale flags so they do not become permanent complexity.',
    ],
    sources: [
      { label: 'Kubernetes — Deployments (rolling update)', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
      { label: 'Martin Fowler — Blue Green Deployment', url: 'https://martinfowler.com/bliki/BlueGreenDeployment.html' },
      { label: 'Martin Fowler — Parallel Change (expand/contract)', url: 'https://martinfowler.com/bliki/ParallelChange.html' },
      { label: 'Pete Hodgson — Feature Toggles', url: 'https://martinfowler.com/articles/feature-toggles.html' },
      { label: 'Google SRE workbook — Canarying releases', url: 'https://sre.google/workbook/canarying-releases/' },
    ],
  },
  {
    id: 'prod-observability',
    category: 'production',
    level: 'senior',
    type: 'concept',
    prompt:
      'You are launching a new Node service tomorrow. What observability do you put in place on day one so that you can debug it at 3 a.m.?',
    keyPoints: [
      'Three signals: structured logs (detail per event), metrics (cheap aggregates for dashboards and alerts), traces (one request across services). Correlate them with a trace id in every log line.',
      'OpenTelemetry: the Node SDK with auto-instrumentations (http, Express/Fastify, pg, Redis, etc.) loaded before the app (e.g. node --require @opentelemetry/auto-instrumentations-node/register), exporting OTLP to a collector; W3C trace context propagates across services.',
      'Metrics with prom-client: collectDefaultMetrics (event-loop lag, GC, heap, CPU, handles) plus an HTTP duration histogram labelled by method, route template and status. Keep label cardinality low (no user ids or raw URLs).',
      'RED for request-driven services: Rate, Errors, Duration per endpoint. USE for resources: Utilization, Saturation, Errors of CPU, memory, DB pool, thread pool.',
      'Control cost: sample traces (head or tail sampling), set log levels, set retention.',
      'Dashboards and runbooks per service, alerts tied to SLOs, and a deploy marker on graphs.',
    ],
    sources: [
      { label: 'OpenTelemetry — Zero-code instrumentation for JavaScript', url: 'https://opentelemetry.io/docs/zero-code/js/' },
      { label: 'OpenTelemetry — Observability primer', url: 'https://opentelemetry.io/docs/concepts/observability-primer/' },
      { label: 'prom-client (Prometheus client for Node.js)', url: 'https://github.com/prometheus/client_js' },
      { label: 'Grafana — The RED method', url: 'https://grafana.com/blog/the-red-method-how-to-instrument-your-services/' },
      { label: 'Brendan Gregg — The USE method', url: 'https://www.brendangregg.com/usemethod.html' },
    ],
  },
  {
    id: 'prod-slos-alerting',
    category: 'production',
    level: 'senior',
    type: 'concept',
    prompt:
      'Our on-call engineers get paged 30 times a week, mostly for "CPU above 80%" and single pod restarts. How would you redesign alerting around SLIs, SLOs and error budgets?',
    keyPoints: [
      'SLI: a measured ratio of good events to total events from the user’s point of view, e.g. requests that return non-5xx in under 300 ms, measured at the load balancer.',
      'SLO: a target for the SLI over a window, e.g. 99.9% over 30 days. The error budget is the rest: 0.1%, about 43 minutes of full downtime per 30 days.',
      'Error budget policy: when the budget is exhausted, slow or freeze risky releases and prioritize reliability work; when there is budget, ship faster.',
      'Page on symptoms that users feel (SLO burn, error rate, latency), not causes (CPU, one restart, disk at 70%); causes go to dashboards and tickets.',
      'Multi-window, multi-burn-rate alerts: e.g. page when 2% of the monthly budget burns within an hour (burn rate 14.4), ticket for slow burns. This catches fast outages quickly and suppresses noise.',
      'Every page must be actionable and link a runbook; review alerts regularly and delete the ones nobody acts on.',
    ],
    sources: [
      { label: 'Google SRE book — Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/' },
      { label: 'Google SRE workbook — Alerting on SLOs', url: 'https://sre.google/workbook/alerting-on-slos/' },
      { label: 'Google SRE book — Monitoring Distributed Systems', url: 'https://sre.google/sre-book/monitoring-distributed-systems/' },
      { label: 'Google SRE workbook — Error budget policy', url: 'https://sre.google/workbook/error-budget-policy/' },
    ],
  },
  {
    id: 'prod-serverless',
    category: 'production',
    level: 'senior',
    type: 'concept',
    prompt:
      'When does running Node on AWS Lambda make sense instead of containers, and what changes in how you write the code (cold starts, database connections)?',
    keyPoints: [
      'Good fit: spiky or low/unpredictable traffic, event-driven glue (queues, S3 events, schedules), scale-to-zero and pay-per-use. Poorer fit: steady high throughput (cost), long jobs (15-minute maximum), long-lived connections, strict latency budgets sensitive to cold starts.',
      'Cold start: a new execution environment downloads the code, starts the runtime and runs your init code. Reduce it with small bundles (esbuild, modular AWS SDK v3 clients), lazy loading and less top-level work; use provisioned concurrency for latency-critical paths.',
      'Initialize SDK clients and DB connections outside the handler so warm invocations reuse them; the environment is frozen between invocations, so do not rely on background work after returning.',
      'Each environment handles one request at a time, so concurrency equals environments: 1,000 concurrent requests can mean 1,000 DB connections. Use RDS Proxy, HTTP-based data APIs, or a pool size of 1 with short idle timeouts.',
      'Keep handlers stateless and idempotent (events can be retried or delivered more than once); configure timeouts, dead-letter queues and structured logs with request ids.',
    ],
    sources: [
      { label: 'AWS Lambda — Execution environment lifecycle', url: 'https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html' },
      { label: 'AWS Lambda — Best practices', url: 'https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html' },
      { label: 'Amazon RDS Proxy', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html' },
    ],
  },
  {
    id: 'prod-health-shutdown-implement',
    category: 'production',
    level: 'senior',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Add /livez and /readyz endpoints and SIGTERM handling to this service so that Kubernetes never sends it traffic before it is ready or while it is shutting down, and no in-flight request is dropped during a deploy.',
    codeLang: 'js',
    code: `const http = require('node:http');
const app = require('./app');
const { pool } = require('./db');

const server = http.createServer(app);

async function start() {
  await pool.query('SELECT 1'); // fail early if the DB is unreachable
  server.listen(3000);
}

// TODO: /livez, /readyz, SIGTERM handling

start();`,
    keyPoints: [
      'State flags: ready = false until startup work (DB connection, cache warm-up) is done and the server is listening; shuttingDown = false.',
      '/livez returns 200 whenever the process can respond (no dependency checks); /readyz returns 503 when !ready or shuttingDown, otherwise 200. Register them before auth and noisy logging middleware.',
      'On SIGTERM (process.once): set shuttingDown so readiness fails, keep serving for a few seconds while endpoints are removed (or rely on a preStop sleep), then server.close() to stop accepting connections.',
      'Wait for in-flight requests via the server.close callback, close idle keep-alive connections (server.closeIdleConnections()), then close the DB pool and other clients, and exit 0.',
      'A hard timeout (unref’d timer, exit 1) below terminationGracePeriodSeconds guarantees the process exits even if a connection hangs.',
      'Configure the probes to match (readiness period and failure threshold, startup probe for slow boots); libraries such as @godaddy/terminus implement this pattern.',
    ],
    sources: [
      K8S_PROBES,
      K8S_POD_LIFECYCLE,
      NODE_HTTP,
      { label: 'godaddy/terminus', url: 'https://github.com/godaddy/terminus' },
    ],
  },
];
