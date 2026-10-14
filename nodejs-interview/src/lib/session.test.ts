import { describe, expect, it } from 'vitest';
import { QUESTIONS, QUESTIONS_BY_ID } from '../data';
import { CATEGORIES, LEVELS } from '../data/meta';
import type { AnswerRecord, SessionConfig } from '../types';
import {
  advance,
  buildQuestionSet,
  createSession,
  DEFAULT_CONFIG,
  filterPool,
  finishEarly,
  formatDuration,
  recordAnswer,
  shuffle,
  summarize,
} from './session';

/** Deterministic PRNG (mulberry32) so tests are reproducible. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const config = (patch: Partial<SessionConfig> = {}): SessionConfig => ({ ...DEFAULT_CONFIG, ...patch });

function answer(questionId: string, status: AnswerRecord['status'] = 'answered', timeSpentSec = 30): AnswerRecord {
  return { questionId, status, answer: status === 'answered' ? 'my answer' : '', timeSpentSec, answeredAt: 0 };
}

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffle(input, seeded(1));
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(input);
  });
});

describe('filterPool', () => {
  it('filters by level, category and type together', () => {
    const pool = filterPool(QUESTIONS, config({ levels: ['senior'], categories: ['typescript'], types: ['code'] }));
    expect(pool.length).toBeGreaterThan(0);
    for (const q of pool) {
      expect(q.level).toBe('senior');
      expect(q.category).toBe('typescript');
      expect(q.type).toBe('code');
    }
  });

  it('returns nothing when a dimension is empty', () => {
    expect(filterPool(QUESTIONS, config({ levels: [] }))).toEqual([]);
    expect(filterPool(QUESTIONS, config({ categories: [] }))).toEqual([]);
    expect(filterPool(QUESTIONS, config({ types: [] }))).toEqual([]);
  });
});

describe('buildQuestionSet', () => {
  it('respects the requested count and never repeats questions', () => {
    const ids = buildQuestionSet(QUESTIONS, config({ count: 25 }), seeded(2));
    expect(ids).toHaveLength(25);
    expect(new Set(ids).size).toBe(25);
  });

  it('uses all matching questions when count is 0', () => {
    const cfg = config({ count: 0, categories: ['javascript'] });
    const ids = buildQuestionSet(QUESTIONS, cfg, seeded(3));
    expect(ids).toHaveLength(filterPool(QUESTIONS, cfg).length);
  });

  it('caps the count at the pool size', () => {
    const cfg = config({ count: 60, categories: ['behavioral'] });
    expect(buildQuestionSet(QUESTIONS, cfg, seeded(4))).toHaveLength(filterPool(QUESTIONS, cfg).length);
  });

  it('spreads questions across all selected categories', () => {
    const cfg = config({ count: CATEGORIES.length });
    const ids = buildQuestionSet(QUESTIONS, cfg, seeded(5));
    const categories = new Set(ids.map((id) => QUESTIONS_BY_ID.get(id)!.category));
    expect(categories.size).toBe(cfg.categories.length);
  });

  it('orders junior → mid → senior in progressive mode', () => {
    const ids = buildQuestionSet(QUESTIONS, config({ count: 40, order: 'progressive' }), seeded(6));
    const levelIndexes = ids.map((id) => LEVELS.indexOf(QUESTIONS_BY_ID.get(id)!.level));
    expect(levelIndexes).toEqual([...levelIndexes].sort((a, b) => a - b));
  });

  it('is deterministic for the same seed and varies across seeds', () => {
    const a = buildQuestionSet(QUESTIONS, config({ order: 'random' }), seeded(7));
    const b = buildQuestionSet(QUESTIONS, config({ order: 'random' }), seeded(7));
    const c = buildQuestionSet(QUESTIONS, config({ order: 'random' }), seeded(8));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('session lifecycle', () => {
  it('records answers, advances and finishes after the last question', () => {
    let s = createSession(config({ count: 2 }), QUESTIONS, seeded(9), 1000);
    expect(s.currentIndex).toBe(0);
    expect(s.finishedAt).toBeUndefined();

    const [first, second] = s.questionIds as [string, string];
    s = advance(recordAnswer(s, answer(first)), 2000);
    expect(s.currentIndex).toBe(1);
    expect(s.finishedAt).toBeUndefined();

    s = advance(recordAnswer(s, answer(second, 'skipped')), 3000);
    expect(s.finishedAt).toBe(3000);
    expect(summarize(s)).toEqual({ total: 2, answered: 1, skipped: 1, notReached: 0, totalTimeSec: 60 });
  });

  it('counts unanswered questions as not reached when finished early', () => {
    let s = createSession(config({ count: 5 }), QUESTIONS, seeded(10), 0);
    s = recordAnswer(s, answer(s.questionIds[0]!));
    s = finishEarly(s, 500);
    expect(s.finishedAt).toBe(500);
    expect(summarize(s)).toMatchObject({ answered: 1, skipped: 0, notReached: 4 });
  });

  it('does not mutate the previous session object', () => {
    const s = createSession(config({ count: 3 }), QUESTIONS, seeded(11), 0);
    const next = recordAnswer(s, answer(s.questionIds[0]!));
    expect(s.answers).toEqual({});
    expect(next).not.toBe(s);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0s'],
    [59, '59s'],
    [61, '1m 1s'],
    [3725, '1h 2m 5s'],
    [-4, '0s'],
  ])('%i → %s', (sec, expected) => {
    expect(formatDuration(sec)).toBe(expected);
  });
});
