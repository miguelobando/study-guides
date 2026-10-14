import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '.';
import { CATEGORIES, LEVELS, TYPES } from './meta';

describe('question bank', () => {
  it('has unique ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))('%s is well-formed', (_id, q) => {
    expect(CATEGORIES).toContain(q.category);
    expect(LEVELS).toContain(q.level);
    expect(TYPES).toContain(q.type);
    expect(q.prompt.trim().length).toBeGreaterThan(10);
    expect(q.keyPoints.length).toBeGreaterThanOrEqual(3);
    expect(q.sources.length).toBeGreaterThanOrEqual(1);

    for (const s of q.sources) {
      expect(s.label.trim()).not.toBe('');
      const url = new URL(s.url);
      expect(url.protocol).toBe('https:');
    }

    if (q.type === 'code') {
      expect(q.code, 'code challenges need a snippet').toBeTruthy();
      expect(q.challenge, 'code challenges need a challenge kind').toBeTruthy();
      expect(q.codeLang).toBeTruthy();
    } else {
      expect(q.challenge).toBeUndefined();
    }
  });

  it('has no duplicate source URLs within a question', () => {
    for (const q of QUESTIONS) {
      const urls = q.sources.map((s) => s.url);
      expect(new Set(urls).size, q.id).toBe(urls.length);
    }
  });

  it('covers every category', () => {
    for (const category of CATEGORIES) {
      expect(QUESTIONS.some((q) => q.category === category), category).toBe(true);
    }
  });

  it.each(['react-fundamentals', 'hooks-state', 'javascript', 'typescript'] as const)(
    '%s has questions at junior and mid level',
    (category) => {
      const levels = new Set(QUESTIONS.filter((q) => q.category === category).map((q) => q.level));
      expect(levels.has('junior')).toBe(true);
      expect(levels.has('mid')).toBe(true);
    },
  );

  it('has senior questions in JavaScript, TypeScript and React', () => {
    for (const category of ['javascript', 'typescript', 'react-advanced', 'hooks-state'] as const) {
      expect(QUESTIONS.some((q) => q.category === category && q.level === 'senior'), category).toBe(true);
    }
  });

  it('has a healthy share of code challenges of every kind', () => {
    const code = QUESTIONS.filter((q) => q.type === 'code');
    expect(code.length).toBeGreaterThanOrEqual(40);
    for (const kind of ['bug', 'output', 'bad-practice', 'implement'] as const) {
      expect(code.some((q) => q.challenge === kind), kind).toBe(true);
    }
  });
});
