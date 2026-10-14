import { describe, expect, it } from 'vitest';
import type { Question, Session } from '../types';
import { buildTranscript, REVIEWER_INSTRUCTIONS, transcriptFilename } from './exportTxt';
import { DEFAULT_CONFIG } from './session';

const QUESTIONS: Question[] = [
  {
    id: 'el-order',
    category: 'event-loop',
    level: 'junior',
    type: 'code',
    challenge: 'output',
    prompt: 'In what order are the lines logged?',
    codeLang: 'js',
    code: "setTimeout(() => console.log('timeout'), 0);\nPromise.resolve().then(() => console.log('promise'));\nconsole.log('sync');",
    keyPoints: ['sync, promise, timeout', 'Microtasks run before the next macrotask', 'Timers run in the timers phase'],
    sources: [{ label: 'Node.js — The event loop', url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick' }],
  },
  {
    id: 'js-closures',
    category: 'javascript',
    level: 'junior',
    type: 'concept',
    prompt: 'What is a closure? Give a practical example.',
    keyPoints: ['A function bundled with its lexical scope', 'Keeps variables alive after the outer function returns', 'Used for private state and factories'],
    sources: [{ label: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures' }],
  },
  {
    id: 'js-this',
    category: 'javascript',
    level: 'mid',
    type: 'concept',
    prompt: 'How is the value of this determined?',
    keyPoints: ['Call site decides', 'Arrow functions capture lexical this', 'bind, call and apply set it explicitly'],
    sources: [{ label: 'MDN — this', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this' }],
  },
];
const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

const session: Session = {
  id: 's-test',
  config: { ...DEFAULT_CONFIG, candidateName: 'Ada Lovelace', categories: ['event-loop', 'javascript'] },
  questionIds: ['el-order', 'js-closures', 'js-this'],
  answers: {
    'el-order': {
      questionId: 'el-order',
      status: 'answered',
      answer: 'sync, promise, timeout\nbecause microtasks drain first',
      confidence: 'high',
      timeSpentSec: 95,
      answeredAt: 0,
    },
    'js-closures': { questionId: 'js-closures', status: 'skipped', answer: '', timeSpentSec: 4, answeredAt: 0 },
  },
  currentIndex: 2,
  startedAt: Date.UTC(2026, 9, 13, 10, 0),
  finishedAt: Date.UTC(2026, 9, 13, 10, 30),
};

const now = new Date(Date.UTC(2026, 9, 13, 11, 0));

describe('buildTranscript', () => {
  const text = buildTranscript(session, QUESTIONS_BY_ID, { includeKeyPoints: true }, now);

  it('includes header, summary and reviewer instructions', () => {
    expect(text).toContain('Candidate:   Ada Lovelace');
    expect(text).toContain('1 answered, 1 skipped, 1 not reached (of 3)');
    expect(text).toContain('Time spent:  1m 39s');
    expect(text).toContain(REVIEWER_INSTRUCTIONS);
  });

  it('includes each question with its code, answer status and sources', () => {
    const order = QUESTIONS_BY_ID.get('el-order')!;
    expect(text).toContain('Q1 of 3  ·  [JUNIOR]  ·  Event Loop & Async  ·  Code challenge — What does this output?');
    expect(text).toContain(order.prompt);
    expect(text).toContain("Promise.resolve().then(() => console.log('promise'));");
    expect(text).toContain('CANDIDATE ANSWER  (time: 1m 35s, self-rated confidence: high):');
    expect(text).toContain('    sync, promise, timeout\n    because microtasks drain first');
    expect(text).toContain('CANDIDATE ANSWER: [SKIPPED]');
    expect(text).toContain('CANDIDATE ANSWER: [NOT REACHED]');
    for (const s of order.sources) expect(text).toContain(s.url);
  });

  it('includes the rubric only when asked', () => {
    const point = QUESTIONS_BY_ID.get('js-closures')!.keyPoints[0]!;
    expect(text).toContain(point);
    expect(text).toContain('REFERENCE KEY POINTS (rubric):');

    const withoutRubric = buildTranscript(session, QUESTIONS_BY_ID, { includeKeyPoints: false }, now);
    expect(withoutRubric).not.toContain(point);
    expect(withoutRubric).not.toContain('REFERENCE KEY POINTS');
    // Sources are always present so the reviewer can point to study material.
    expect(withoutRubric).toContain('SOURCES:');
  });

  it('keeps question order from the session', () => {
    const positions = session.questionIds.map((id) => text.indexOf(`id: ${id}`));
    expect(positions.every((p) => p > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe('transcriptFilename', () => {
  it('slugifies the candidate name and adds a timestamp', () => {
    const local = new Date(2026, 9, 13, 9, 5);
    expect(transcriptFilename(session, local)).toBe('nodejs-interview-ada-lovelace-2026-10-13-0905.txt');
  });

  it('works without a name', () => {
    const local = new Date(2026, 0, 2, 3, 4);
    const anon = { ...session, config: { ...session.config, candidateName: '  ' } };
    expect(transcriptFilename(anon, local)).toBe('nodejs-interview-2026-01-02-0304.txt');
  });
});
