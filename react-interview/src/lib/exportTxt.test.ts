import { describe, expect, it } from 'vitest';
import { QUESTIONS_BY_ID } from '../data';
import type { Session } from '../types';
import { buildTranscript, REVIEWER_INSTRUCTIONS, transcriptFilename } from './exportTxt';
import { DEFAULT_CONFIG } from './session';

const session: Session = {
  id: 's-test',
  config: { ...DEFAULT_CONFIG, candidateName: 'Ada Lovelace', categories: ['hooks-state', 'javascript'] },
  questionIds: ['hs-snapshot', 'js-closures', 'js-event-loop'],
  answers: {
    'hs-snapshot': {
      questionId: 'hs-snapshot',
      status: 'answered',
      answer: 'count is 1 and it logs 0\nbecause state is a snapshot',
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
    const snapshot = QUESTIONS_BY_ID.get('hs-snapshot')!;
    expect(text).toContain('Q1 of 3  ·  [JUNIOR]  ·  Hooks & State  ·  Code challenge — What does this output?');
    expect(text).toContain(snapshot.prompt);
    expect(text).toContain('setCount(count + 1);');
    expect(text).toContain('CANDIDATE ANSWER  (time: 1m 35s, self-rated confidence: high):');
    expect(text).toContain('    count is 1 and it logs 0\n    because state is a snapshot');
    expect(text).toContain('CANDIDATE ANSWER: [SKIPPED]');
    expect(text).toContain('CANDIDATE ANSWER: [NOT REACHED]');
    for (const s of snapshot.sources) expect(text).toContain(s.url);
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
    expect(transcriptFilename(session, local)).toBe('react-interview-ada-lovelace-2026-10-13-0905.txt');
  });

  it('works without a name', () => {
    const local = new Date(2026, 0, 2, 3, 4);
    const anon = { ...session, config: { ...session.config, candidateName: '  ' } };
    expect(transcriptFilename(anon, local)).toBe('react-interview-2026-01-02-0304.txt');
  });
});
