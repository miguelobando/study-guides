# Node.js Interview Simulator

A local practice app for Node.js / JavaScript / TypeScript backend interviews, from junior to senior.
It asks open questions, code challenges and backend system design questions. You type your
answers, skip what you don't know, and at the end you export a `.txt` transcript that you can
send to a model (or a mentor) to have it graded.

## Run it

```bash
npm install
npm run dev        # open the URL Vite prints (usually http://localhost:5173)
```

Other scripts:

| Script                | What it does                                              |
| --------------------- | --------------------------------------------------------- |
| `npm test`            | Runs the test suite (question bank, session logic, export, UI flows) |
| `npm run typecheck`   | Type-checks the app                                       |
| `npm run build`       | Production build into `dist/`                             |
| `npm run check-links` | Checks that every source URL in the question bank resolves |

## How an interview works

1. **Setup**: choose levels, topics (or a preset), question types, number of questions,
   order (progressive junior → senior, or random), an optional soft time limit, and when to see the rubric:
   - **Study mode**: after each answer you see "what a strong answer covers" and likely follow-ups.
   - **Strict mode**: no rubric until the end, closer to a real interview.
2. **Interview**: each question shows the prompt, a code snippet for code challenges, a text box,
   a confidence rating, a timer, and **the source links the question and answer come from**.
   - **Submit** (or Ctrl/⌘ + Enter) records your answer. **Skip** records it as skipped.
   - **End interview early** marks the remaining questions as "not reached" and keeps your current draft.
   - Progress is saved in `localStorage`. If you reload, you can resume.
3. **Summary**: stats, a per-topic breakdown, a review of every question, and the export:
   - **Download .txt**, or **Copy to clipboard**.
   - The transcript starts with **instructions for the reviewer** (score 0–10 per question, an
     estimated seniority level, the top gaps and a study plan), then lists every question with your answer,
     time spent, confidence, the rubric (optional) and the sources.

## Question bank

251 questions (47 junior, 123 mid, 81 senior); 116 of them are code challenges ("what's wrong here?",
"what does this output?", "spot the bad practice", "implement it").

| Topic                              | Junior | Mid | Senior | Code | Total |
| ---------------------------------- | -----: | --: | -----: | ---: | ----: |
| Node.js Fundamentals               |      7 |   7 |      2 |    8 |    16 |
| Event Loop & Async                 |      3 |   9 |      6 |   15 |    18 |
| Streams, Buffers & File System     |      3 |   8 |      4 |    8 |    15 |
| HTTP & API Design                  |      4 |  10 |      5 |    9 |    19 |
| Errors, Logging & Debugging        |      3 |   8 |      3 |    7 |    14 |
| Databases & Data Access            |      3 |   8 |      5 |    9 |    16 |
| Performance & Scaling              |      1 |   7 |      7 |    5 |    15 |
| Security & Auth                    |      3 |   8 |      6 |   10 |    17 |
| Testing                            |      2 |   7 |      3 |    5 |    12 |
| Architecture & Patterns            |      1 |   8 |      7 |    5 |    16 |
| Production, DevOps & Observability |      2 |   8 |      5 |    4 |    15 |
| JavaScript                         |      9 |  12 |      5 |   16 |    26 |
| TypeScript                         |      5 |  14 |      6 |   15 |    25 |
| Backend System Design              |      0 |   4 |     13 |    0 |    17 |
| Behavioral & Leadership            |      1 |   5 |      4 |    0 |    10 |

Sources are mostly primary references: the Node.js API docs and Learn guides, MDN, the TypeScript
handbook and tsconfig reference, Express and Fastify docs, PostgreSQL, Redis, OWASP (API Security
Top 10 and cheat sheets), RFCs, Docker, Kubernetes and OpenTelemetry. They are complemented by
well-known references such as Node.js Best Practices, microservices.io, Martin Fowler, the AWS
Builders' Library, the Azure architecture patterns and the System Design Primer.

### Adding questions

Questions live in `src/data/*.ts`, one file per area. Each one follows the `Question` type in
`src/types.ts`:

```ts
{
  id: 'el-example',              // unique, prefixed by area
  category: 'event-loop',
  level: 'mid',                  // junior | mid | senior
  type: 'code',                  // concept | code | design | behavioral
  challenge: 'bug',              // code only: bug | output | bad-practice | implement
  prompt: 'What is wrong here?',
  code: `...`, codeLang: 'js',   // code only: js | ts | json | sql | bash | dockerfile | yaml | text
  keyPoints: ['...', '...', '...'], // rubric, at least 3
  followUps: ['...'],            // optional
  sources: [{ label: 'Node.js docs — ...', url: 'https://...' }],
}
```

`npm test` validates the whole bank (unique ids, https sources, code challenges have code, and so on),
and `npm run check-links` verifies the URLs.

## Project layout

```
src/
  data/           question bank (one file per area) + labels in meta.ts
  lib/session.ts  question selection (balanced across topics, progressive order), session state
  lib/exportTxt.ts transcript builder and download
  lib/storage.ts  localStorage persistence (fails safely)
  components/     Setup, Interview, Summary screens
scripts/check-links.mjs
```
