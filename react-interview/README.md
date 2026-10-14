# React Interview Simulator

A local practice app for React / JavaScript / TypeScript interviews, from junior to senior.
It asks open questions, code challenges and frontend system design questions. You type your
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

205 questions (45 junior, 101 mid, 59 senior); 52 of them are code challenges ("what's wrong here?", "what does this output?",
"spot the bad practice", "implement it").

| Topic                            | Junior | Mid | Senior | Code | Total |
| -------------------------------- | -----: | --: | -----: | ---: | ----: |
| React Fundamentals               |      9 |   8 |      0 |    4 |    17 |
| Hooks & State                    |      7 |  13 |      2 |   10 |    22 |
| Advanced React & Internals       |      0 |   6 |      9 |    2 |    15 |
| Architecture & Patterns          |      0 |   8 |      6 |    0 |    14 |
| State Management & Data Fetching |      1 |   6 |      6 |    2 |    13 |
| Performance                      |      2 |   8 |      2 |    4 |    12 |
| Testing                          |      2 |   6 |      2 |    1 |    10 |
| Accessibility                    |      2 |   4 |      1 |    2 |     7 |
| Security                         |      1 |   4 |      3 |    3 |     8 |
| JavaScript                       |     11 |  11 |      4 |   14 |    26 |
| TypeScript                       |      5 |  14 |      5 |   10 |    24 |
| Web Platform & Browser           |      4 |   5 |      3 |    0 |    12 |
| Frontend System Design           |      0 |   4 |     13 |    0 |    17 |
| Behavioral & Leadership          |      1 |   4 |      3 |    0 |     8 |

Sources are mostly primary references: react.dev, MDN, the TypeScript handbook, web.dev,
WAI-ARIA APG, OWASP, Testing Library, TanStack, Redux. They are complemented by well-known
articles (Dan Abramov, Kent C. Dodds, TkDodo) and the GreatFrontEnd system design playbook.

### Adding questions

Questions live in `src/data/*.ts`, one file per area. Each one follows the `Question` type in
`src/types.ts`:

```ts
{
  id: 'hs-example',              // unique, prefixed by area
  category: 'hooks-state',
  level: 'mid',                  // junior | mid | senior
  type: 'code',                  // concept | code | design | behavioral
  challenge: 'bug',              // code only: bug | output | bad-practice | implement
  prompt: 'What is wrong here?',
  code: `...`, codeLang: 'jsx',  // code only
  keyPoints: ['...', '...', '...'], // rubric, at least 3
  followUps: ['...'],            // optional
  sources: [{ label: 'react.dev — ...', url: 'https://...' }],
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
