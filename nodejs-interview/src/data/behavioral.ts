import type { Question } from '../types';

const STAR = { label: 'Tech Interview Handbook — Behavioral interviews', url: 'https://www.techinterviewhandbook.org/behavioral-interview/' };
const SRE_POSTMORTEM = { label: 'Google SRE Book — Postmortem Culture', url: 'https://sre.google/sre-book/postmortem-culture/' };
const CODE_REVIEW = { label: 'Google Engineering Practices — Code Review', url: 'https://google.github.io/eng-practices/review/' };

export const behavioral: Question[] = [
  {
    id: 'bh-why-node',
    category: 'behavioral',
    level: 'junior',
    type: 'behavioral',
    prompt: 'Why would you choose Node.js for a new backend service? When would you NOT choose it?',
    keyPoints: [
      'Strengths: non-blocking I/O handles many concurrent connections cheaply (APIs, BFFs, real-time/WebSockets, streaming), one language and shared types across frontend and backend, a huge npm ecosystem, fast iteration.',
      'Weaknesses: CPU-heavy work blocks the event loop (image/video processing, heavy computation, ML) unless moved to worker threads or other services; dependency sprawl and supply-chain risk; dynamic typing without TypeScript.',
      'Alternatives in context: Go or Java/Kotlin for CPU-bound or very high-throughput services, Python for data/ML, or whatever the team already runs well in production.',
      'A good answer is about trade-offs, team skills and operational context, not fandom.',
    ],
    sources: [
      { label: 'Node.js — Introduction to Node.js', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs' },
      { label: 'Node.js — Don’t Block the Event Loop (or the Worker Pool)', url: 'https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop' },
    ],
  },
  {
    id: 'bh-incident',
    category: 'behavioral',
    level: 'senior',
    type: 'behavioral',
    prompt:
      'Tell me about the hardest production incident or bug you have dealt with on a backend system. What did you do during the incident, and what happened afterwards?',
    keyPoints: [
      'STAR structure with a real, specific example (what broke, user and business impact, your role).',
      'Mitigate first: roll back, disable the feature flag, scale out or shed load, and confirm recovery with metrics before digging into root cause.',
      'Systematic investigation: dashboards, logs and traces, correlating with deploys/config changes, reproducing (e.g. heap snapshots for a memory leak, event-loop lag for latency spikes), forming and testing hypotheses.',
      'Communication: an incident channel, clear roles (incident commander, communications), regular status updates to stakeholders and support.',
      'Blameless postmortem: timeline, root cause and contributing factors, what went well, action items with owners that are actually tracked.',
      'Prevention: regression tests, alerts on symptoms (SLO burn rate), safer rollouts (canary), runbooks. What you personally learned.',
    ],
    sources: [STAR, SRE_POSTMORTEM, { label: 'Google SRE Book — Managing Incidents', url: 'https://sre.google/sre-book/managing-incidents/' }],
  },
  {
    id: 'bh-disagreement',
    category: 'behavioral',
    level: 'mid',
    type: 'behavioral',
    prompt:
      'Tell me about a time you disagreed with a technical decision, for example a choice of database, framework or service boundary. How did you handle it?',
    keyPoints: [
      'STAR structure with a real example.',
      'Listened first and understood the other side’s constraints (deadlines, team skills, operational cost).',
      'Argued with evidence: a prototype, benchmark, load test, incident data or cost estimate, not opinions. Wrote it down (design doc or ADR) so options were compared fairly.',
      'Escalated respectfully only when needed. Once decided, disagreed and committed with no passive resistance.',
      'Outcome, what you learned, and what you would do differently.',
    ],
    sources: [
      STAR,
      { label: 'Tech Interview Handbook — Behavioral interview questions', url: 'https://www.techinterviewhandbook.org/behavioral-interview-questions/' },
    ],
  },
  {
    id: 'bh-code-review',
    category: 'behavioral',
    level: 'mid',
    type: 'behavioral',
    prompt: 'What do you look for when reviewing a pull request on a Node backend? How do you give feedback?',
    keyPoints: [
      'Correctness and failure paths: error handling (no swallowed errors, no unhandled rejections), timeouts on outbound calls, retries only where safe, partial failure and idempotency.',
      'Data and concurrency: transactions, race conditions, N+1 queries, missing indexes, migrations that lock big tables or are not backward compatible.',
      'Security: input validation, authorisation checks on every resource, SQL/NoSQL injection, secrets in code or logs, new dependencies and their risk.',
      'Node specifics: blocking the event loop (sync APIs, heavy JSON, CPU work in request handlers), memory growth (unbounded caches, listeners), stream back-pressure.',
      'Operability and tests: logs, metrics and traces for the new path, behaviour-focused tests, readable code consistent with the codebase, reasonable PR size.',
      'Feedback: kind and specific, explain why, separate blocking issues from nits, and automate style with linters and CI.',
    ],
    sources: [
      CODE_REVIEW,
      { label: 'Google Engineering Practices — What to look for in a code review', url: 'https://google.github.io/eng-practices/review/reviewer/looking-for.html' },
    ],
  },
  {
    id: 'bh-performance',
    category: 'behavioral',
    level: 'mid',
    type: 'behavioral',
    prompt: 'Tell me about a time you improved the performance or reliability of a service. How did you know it was a problem, and how did you prove the fix worked?',
    keyPoints: [
      'Started from data, not hunches: latency percentiles (p95/p99), error rates, SLOs, traces, slow query logs, event-loop lag, CPU/heap profiles.',
      'Found the actual bottleneck before optimising (profiling, flame graphs, EXPLAIN ANALYZE, load tests reproducing production traffic).',
      'Chose a fix proportional to the problem: an index, caching, batching, connection pool tuning, moving work to a queue, removing a sync call.',
      'Rolled out safely (flag or canary) and compared before/after metrics under similar load. Quantified the impact (e.g. p99 from 1.2 s to 250 ms, fewer pages, lower cost).',
      'Kept it from regressing: dashboards, alerts, performance budgets or benchmarks in CI.',
    ],
    sources: [STAR, { label: 'Google SRE Book — Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/' }],
  },
  {
    id: 'bh-estimation',
    category: 'behavioral',
    level: 'mid',
    type: 'behavioral',
    prompt: 'You are asked to estimate a large, vague backend project, such as "add multi-currency support to billing". How do you break it down, estimate and de-risk it?',
    keyPoints: [
      'Clarify goals, scope and success criteria with product; list explicit non-goals.',
      'Identify the biggest unknowns (data model changes, third-party APIs, migrations of existing data) and run short, time-boxed spikes on them first.',
      'Slice into small vertical increments that can ship behind feature flags, so risk surfaces early and value lands incrementally.',
      'Give ranges with stated assumptions, not single numbers. Call out dependencies on other teams and add explicit buffers for testing, rollout and migration.',
      'Track progress against milestones and re-estimate and communicate early when assumptions change.',
    ],
    sources: [STAR, { label: 'Martin Fowler — Feature Toggles', url: 'https://martinfowler.com/articles/feature-toggles.html' }],
  },
  {
    id: 'bh-api-contracts',
    category: 'behavioral',
    level: 'mid',
    type: 'behavioral',
    prompt:
      'Tell me about a time you designed or changed an API used by other teams (frontend, mobile or another service). How did you agree on the contract and avoid breaking consumers?',
    keyPoints: [
      'Involved consumers early: design-first with an OpenAPI (or Protobuf) spec reviewed by frontend/mobile/product before implementing. Mocks let them start in parallel.',
      'Designed around consumer use cases, with consistent conventions (errors, pagination, naming, idempotency).',
      'Evolved without breaking: additive changes, tolerant readers, deprecation with timelines and usage monitoring, versioning only when unavoidable. Mobile apps stay on old versions for a long time.',
      'Verified compatibility automatically: contract tests (e.g. Pact consumer-driven contracts) or schema diff checks in CI.',
      'Communicated changes through changelogs and announcements, and measured adoption before removing anything.',
    ],
    sources: [
      STAR,
      { label: 'OpenAPI Specification', url: 'https://spec.openapis.org/oas/latest.html' },
      { label: 'Pact docs — Introduction', url: 'https://docs.pact.io/' },
    ],
  },
  {
    id: 'bh-tech-debt',
    category: 'behavioral',
    level: 'senior',
    type: 'behavioral',
    prompt: 'How do you balance paying down technical debt against delivering features on a backend team? Give an example.',
    keyPoints: [
      'Make debt visible and quantify it: incidents and pages, slow deploys, time lost per change, onboarding cost, security exposure (outdated Node versions or dependencies).',
      'Translate it into business terms (risk, delivery speed, cost) so it can be prioritised with product.',
      'Mix strategies: continuous small refactors when touching code, a reserved share of capacity, and dedicated projects for high-interest debt.',
      'Not all debt needs paying: focus on code that changes often or causes incidents, and let stable, rarely touched code be.',
      'A concrete example with the outcome you measured.',
    ],
    sources: [{ label: 'Martin Fowler — Technical Debt Quadrant', url: 'https://martinfowler.com/bliki/TechnicalDebtQuadrant.html' }],
  },
  {
    id: 'bh-mentoring',
    category: 'behavioral',
    level: 'senior',
    type: 'behavioral',
    prompt: 'How do you raise the engineering quality bar of a backend team and help less experienced engineers grow?',
    keyPoints: [
      'Lead by example in code and design reviews: explain the why, link to docs, praise good work.',
      'Pairing, design-doc reviews, internal talks, and including juniors in on-call shadowing and postmortems so they learn production thinking.',
      'Automate standards (lint, type checks, CI, service templates, ADRs for decisions) so reviews focus on design.',
      'Give stretch ownership of meaningful work with support and a safety net. Regular feedback and career conversations.',
      'Measure outcomes (fewer incidents, faster reviews, people promoted or owning systems), not just activity.',
    ],
    sources: [CODE_REVIEW, SRE_POSTMORTEM],
  },
  {
    id: 'bh-migration',
    category: 'behavioral',
    level: 'senior',
    type: 'behavioral',
    prompt:
      'Tell me about a migration you owned, for example moving to a new database, splitting a table, or upgrading a major framework or Node version. How did you avoid downtime and data loss?',
    keyPoints: [
      'Why the migration was worth it, and how you got buy-in and a clear definition of done.',
      'Incremental plan instead of a big bang: expand/contract (parallel change). Add the new structure, dual-write or backfill, switch reads, verify, then remove the old path.',
      'Verification: compare old and new results (shadow reads, checksums, reconciliation jobs), monitor error rates and latency, keep a rollback path at every step.',
      'Coordination: communicated timelines to dependent teams, used flags for gradual rollout, ran rehearsals in staging with production-like data.',
      'Outcome with numbers, what went wrong and how you handled it, and cleanup of the old system (migrations are not done until the old path is deleted).',
    ],
    sources: [
      { label: 'Stripe — Online migrations at scale', url: 'https://stripe.com/blog/online-migrations' },
      { label: 'Martin Fowler — Parallel Change', url: 'https://martinfowler.com/bliki/ParallelChange.html' },
      STAR,
    ],
  },
];
