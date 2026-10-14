# Interview Study Guides

Interactive interview simulators for **React** (frontend) and **Node.js** (backend) engineers,
covering **junior to senior** levels. Each guide asks you real interview questions, makes you type
your answer *before* you see a reference, shows where the question and answer come from, and exports
a transcript you can hand to a reviewer (a mentor, a peer, or a language model) for a graded evaluation.

| Guide | Focus | Questions | Code challenges | Topics |
| --- | --- | ---: | ---: | ---: |
| [`react-interview/`](react-interview/) | React, JavaScript, TypeScript, frontend system design | 205 | 52 | 14 |
| [`nodejs-interview/`](nodejs-interview/) | Node.js, JavaScript, TypeScript, APIs, databases, backend system design | 251 | 116 | 15 |

Everything runs locally in your browser. There is no backend, no account and no tracking.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Quick start](#quick-start)
- [How an interview works](#how-an-interview-works)
- [How the content is divided](#how-the-content-is-divided)
- [What it is based on](#what-it-is-based-on)
- [Getting your answers graded](#getting-your-answers-graded)
- [Repository layout](#repository-layout)
- [Contributing questions](#contributing-questions)
- [Tech stack](#tech-stack)
- [License](#license)

---

## Why this exists

Reading flashcards or articles feels productive, but it is recognition, not recall. In an interview
you have to produce an answer from a blank page, explain trade-offs out loud and spot bugs in code
you have never seen. These guides recreate that pressure:

- **Open questions first, answers later.** You write your answer before seeing anything. The rubric
  only appears after you submit (or only at the very end, in strict mode).
- **Code challenges, not just theory.** "What's wrong here?", "What does this output?", "Spot the bad
  practice" and "Implement it", with real snippets.
- **Every question has sources.** Each one links to the documentation or article it is based on, so
  you can check the answer yourself and study the gap.
- **Honest self-assessment.** You rate your confidence, the timer runs, and skipping is allowed and
  recorded. The transcript shows exactly what you knew and what you didn't.

## Quick start

Requirements: [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (an LTS release is recommended) and npm.

```bash
git clone https://github.com/miguelobando/study-guides.git
cd study-guides

# React guide
cd react-interview
npm install
npm run dev          # opens on http://localhost:5173

# Node.js guide (in another terminal)
cd nodejs-interview
npm install
npm run dev -- --port 5174
```

Open the URL that Vite prints, enter your name, choose what to practise and press **Start interview**.

## How an interview works

```
 ┌──────────┐     ┌──────────────────────────────┐     ┌──────────────────────┐
 │  Setup   │ ──► │  Interview (one question at  │ ──► │  Summary & export    │
 │          │     │  a time)                     │     │                      │
 │ levels   │     │  prompt + code snippet       │     │  stats per topic     │
 │ topics   │     │  your answer (text box)      │     │  review every answer │
 │ types    │     │  confidence · timer          │     │  download .txt       │
 │ count    │     │  Submit · Skip · End early   │     │  copy to clipboard   │
 │ mode     │     │  rubric + sources            │     │                      │
 └──────────┘     └──────────────────────────────┘     └──────────────────────┘
```

**1. Setup.** Choose:

- **Levels:** Junior, Mid and/or Senior.
- **Topics:** pick individual categories or use a preset (for example *Senior loop*, *JS + TS*,
  *Node core*, *APIs & data*).
- **Question types:** open questions, code challenges, system design, behavioral.
- **Number of questions:** 10, 15, 25, 40, 60 or all matching questions.
- **Order:** *progressive* (junior → mid → senior, like a real interview loop) or *random*. Questions
  are spread evenly across the selected topics.
- **Soft time limit** per question (optional). It warns you but never cuts you off.
- **Mode:**
  - *Study mode* shows "what a strong answer covers" and likely follow-up questions right after each answer.
  - *Strict mode* hides all of that until the end, closer to a real interview.

**2. Interview.** For each question:

- Read the prompt (and the code, for code challenges), type your answer and rate your confidence
  (low / medium / high).
- **Submit** (or <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>) records the answer. **Skip** records it as skipped.
- The **sources** for the question are always shown under the answer box.
- **End interview early** marks the remaining questions as "not reached" and keeps your current draft.
- Progress is saved in your browser (`localStorage`). If you close the tab, you can resume later.

**3. Summary.** You get answered / skipped / not reached counts, time spent, a per-topic breakdown and
a review of every question next to its rubric. Then **Download .txt** or **Copy to clipboard**.

## How the content is divided

### Levels

| Level | What it tests |
| --- | --- |
| **Junior** | Core concepts and vocabulary: can you explain how the tool works and use it correctly? |
| **Mid** | Practical depth: debugging, trade-offs, common pitfalls, performance and testing in real projects. |
| **Senior** | Internals, architecture, scalability, failure modes, system design and leading technical decisions. |

### Question types

| Type | Description |
| --- | --- |
| **Open question** | A conceptual or scenario question ("Your API's p99 latency doubled after a deploy. Walk me through it."). |
| **Code challenge** | A snippet with one of four tasks: *What's wrong here?* (bug), *What does this output?*, *Spot the bad practice*, *Implement it*. |
| **System design** | An open design problem (a news feed, a rate limiter, a chat app...), graded on requirements, API, data model, scaling and trade-offs. |
| **Behavioral** | STAR-style questions about incidents, disagreements, mentoring, technical debt and ownership. |

### Topics

**React guide** (205 questions)

| Topic | Junior | Mid | Senior | Total |
| --- | ---: | ---: | ---: | ---: |
| React Fundamentals | 9 | 8 | 0 | 17 |
| Hooks & State | 7 | 13 | 2 | 22 |
| Advanced React & Internals | 0 | 6 | 9 | 15 |
| Architecture & Patterns | 0 | 8 | 6 | 14 |
| State Management & Data Fetching | 1 | 6 | 6 | 13 |
| Performance | 2 | 8 | 2 | 12 |
| Testing | 2 | 6 | 2 | 10 |
| Accessibility | 2 | 4 | 1 | 7 |
| Security | 1 | 4 | 3 | 8 |
| JavaScript | 11 | 11 | 4 | 26 |
| TypeScript | 5 | 14 | 5 | 24 |
| Web Platform & Browser | 4 | 5 | 3 | 12 |
| Frontend System Design | 0 | 4 | 13 | 17 |
| Behavioral & Leadership | 1 | 4 | 3 | 8 |

**Node.js guide** (251 questions)

| Topic | Junior | Mid | Senior | Total |
| --- | ---: | ---: | ---: | ---: |
| Node.js Fundamentals | 7 | 7 | 2 | 16 |
| Event Loop & Async | 3 | 9 | 6 | 18 |
| Streams, Buffers & File System | 3 | 8 | 4 | 15 |
| HTTP & API Design | 4 | 10 | 5 | 19 |
| Errors, Logging & Debugging | 3 | 8 | 3 | 14 |
| Databases & Data Access | 3 | 8 | 5 | 16 |
| Performance & Scaling | 1 | 7 | 7 | 15 |
| Security & Auth | 3 | 8 | 6 | 17 |
| Testing | 2 | 7 | 3 | 12 |
| Architecture & Patterns | 1 | 8 | 7 | 16 |
| Production, DevOps & Observability | 2 | 8 | 5 | 15 |
| JavaScript | 9 | 12 | 5 | 26 |
| TypeScript | 5 | 14 | 6 | 25 |
| Backend System Design | 0 | 4 | 13 | 17 |
| Behavioral & Leadership | 1 | 5 | 4 | 10 |

Each guide's own README has more detail on its question bank.

### Anatomy of a question

Every question carries the same fields:

- **Prompt:** what the interviewer asks.
- **Code** (code challenges only): the snippet to analyse.
- **Key points:** the rubric, meaning what a strong answer should cover. It is not a script to memorise;
  correct points that are not listed still count.
- **Follow-ups:** the questions an interviewer would likely ask next, to push you one level deeper.
- **Sources:** the links the question and its answer are based on.

## What it is based on

The questions are modelled on what is commonly asked in frontend and backend interviews at product
companies, and the answers are written from **primary sources** wherever possible:

| Area | Main sources |
| --- | --- |
| React | [react.dev](https://react.dev/) (including the React 19 docs and blog), the React Working Group |
| Node.js | [Node.js API docs](https://nodejs.org/api/) and [Node.js Learn](https://nodejs.org/learn), libuv docs, V8 blog |
| JavaScript | [MDN](https://developer.mozilla.org/), the ECMAScript spec, javascript.info |
| TypeScript | [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/) and [tsconfig reference](https://www.typescriptlang.org/tsconfig/) |
| Web platform & performance | [web.dev](https://web.dev/), MDN, WAI-ARIA Authoring Practices |
| APIs & HTTP | Express and Fastify docs, MDN HTTP, RFC 9110 / RFC 9457 |
| Data | PostgreSQL docs, Redis docs, node-postgres, TanStack Query, Redux |
| Security | [OWASP](https://owasp.org/) (Top 10, API Security Top 10, Cheat Sheet Series) |
| Testing | Testing Library, `node:test`, Vitest, Testcontainers, Kent C. Dodds' articles |
| Production | Docker, Kubernetes, OpenTelemetry, Google SRE book, The Twelve-Factor App |
| Architecture & system design | Node.js Best Practices, microservices.io, Martin Fowler, AWS Builders' Library, Azure architecture patterns, System Design Primer, GreatFrontEnd |
| Behavioral | Tech Interview Handbook (STAR method) |

Quality checks behind the content:

- **Every source URL is checked automatically** (`npm run check-links`). At the time of writing all
  352 (React) and 554 (Node.js) unique links resolve.
- **Every "What does this output?" snippet was run** in Node, and the TypeScript snippets were
  compiled, so the expected answers match real behaviour.
- **Version-specific claims** (React 19.2, Express 5, Node LTS policy, TypeScript 6/7 defaults) were
  checked against the current official docs. Tooling moves fast, so if something looks out of date,
  please open an issue.

## Getting your answers graded

The exported `.txt` transcript is designed to be pasted into a reviewer of your choice: a mentor,
a peer or a language model. It contains:

1. **Instructions for the reviewer:** score each answer from 0 to 10, point out what was right,
   wrong or missing, give a concise model answer, then give an overall assessment. That assessment
   covers a score per topic and per level, the seniority your answers demonstrate, your top 5 gaps
   and a 2-week study plan built from the listed sources.
2. **Session details:** levels, topics, order, mode and time spent.
3. **Every question:** prompt, code, your answer (or *skipped* / *not reached*), time spent,
   confidence, the rubric (optional, toggle it on the summary screen) and the sources.

Tip: do one interview in strict mode, get it graded, study the gaps from the sources, then repeat
with the same topics a week later.

## Repository layout

```
study-guides/
├── README.md                 ← you are here
├── LICENSE
├── react-interview/
│   ├── README.md             details of the React guide
│   ├── src/
│   │   ├── data/             question bank, one file per topic, plus meta.ts (labels)
│   │   ├── lib/
│   │   │   ├── session.ts    question selection (balanced across topics, progressive order)
│   │   │   ├── exportTxt.ts  transcript builder and download
│   │   │   └── storage.ts    localStorage persistence (fails safely)
│   │   ├── components/       Setup, Interview and Summary screens
│   │   └── App.tsx           screen state machine
│   └── scripts/check-links.mjs
└── nodejs-interview/         same structure, with a Node.js question bank
```

Both apps share the same engine. Only the question bank (`src/data/`), the topic list, the presets
and the reviewer instructions differ, so adding a new guide (Python, Go, Java...) is mostly a matter
of writing questions.

## Contributing questions

Questions live in `src/data/*.ts`, one file per topic, and follow the `Question` type in
`src/types.ts`:

```ts
{
  id: 'el-example',                   // unique, prefixed by topic
  category: 'event-loop',
  level: 'mid',                       // junior | mid | senior
  type: 'code',                       // concept | code | design | behavioral
  challenge: 'output',                // code only: bug | output | bad-practice | implement
  prompt: 'What does this print, and why?',
  code: `...`, codeLang: 'js',        // code only
  keyPoints: ['...', '...', '...'],   // the rubric, at least 3
  followUps: ['...'],                 // optional
  sources: [{ label: 'Node.js docs — ...', url: 'https://...' }],
}
```

Before opening a pull request, run these inside the guide's folder:

```bash
npm test             # validates the whole bank: unique ids, rubric size, https sources, code challenges have code...
npm run typecheck
npm run check-links  # verifies every source URL still resolves
```

Good questions are open-ended, have a precise rubric, and link to a primary source. For output
challenges, run the snippet and put the exact output in the first key point.

## Tech stack

React 19, TypeScript, Vite, Vitest and Testing Library. Each guide has unit tests for the session
logic, the export and the storage, validation tests for every question, and UI tests for the full
interview flow. There is no server: state lives in the browser's `localStorage`.

## License

[MIT](LICENSE). Use it, fork it, adapt it for your team's hiring loop or your own preparation.
