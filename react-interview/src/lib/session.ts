import { CATEGORIES, LEVELS } from '../data/meta';
import type { AnswerRecord, Category, Question, Session, SessionConfig } from '../types';

export type Rng = () => number;

export const DEFAULT_CONFIG: SessionConfig = {
  candidateName: '',
  levels: ['junior', 'mid', 'senior'],
  categories: [...CATEGORIES],
  types: ['concept', 'code', 'design', 'behavioral'],
  count: 25,
  order: 'progressive',
  feedback: 'each',
  timeLimitSec: 0,
};

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function filterPool(questions: readonly Question[], config: SessionConfig): Question[] {
  return questions.filter(
    (q) =>
      config.levels.includes(q.level) &&
      config.categories.includes(q.category) &&
      config.types.includes(q.type),
  );
}

/**
 * Picks questions so every selected category is represented: shuffle within each
 * category, then deal round-robin across categories until `count` is reached.
 */
export function buildQuestionSet(
  questions: readonly Question[],
  config: SessionConfig,
  rng: Rng = Math.random,
): string[] {
  const pool = filterPool(questions, config);

  const byCategory = new Map<Category, Question[]>();
  for (const q of pool) {
    const bucket = byCategory.get(q.category) ?? [];
    bucket.push(q);
    byCategory.set(q.category, bucket);
  }
  const buckets = shuffle([...byCategory.values()], rng).map((bucket) => shuffle(bucket, rng));

  const limit = config.count > 0 ? Math.min(config.count, pool.length) : pool.length;
  const picked: Question[] = [];
  for (let round = 0; picked.length < limit; round++) {
    for (const bucket of buckets) {
      const q = bucket[round];
      if (q && picked.length < limit) picked.push(q);
    }
  }

  if (config.order === 'progressive') {
    // Array.prototype.sort is stable, so the round-robin mix survives within each level.
    picked.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  }
  return picked.map((q) => q.id);
}

export function createSession(
  config: SessionConfig,
  questions: readonly Question[],
  rng: Rng = Math.random,
  now: number = Date.now(),
): Session {
  return {
    id: `s-${now.toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`,
    config,
    questionIds: buildQuestionSet(questions, config, rng),
    answers: {},
    currentIndex: 0,
    startedAt: now,
  };
}

export function recordAnswer(session: Session, record: AnswerRecord): Session {
  return { ...session, answers: { ...session.answers, [record.questionId]: record } };
}

export function advance(session: Session, now: number = Date.now()): Session {
  const nextIndex = session.currentIndex + 1;
  if (nextIndex >= session.questionIds.length) {
    return { ...session, currentIndex: session.questionIds.length, finishedAt: now };
  }
  return { ...session, currentIndex: nextIndex };
}

export function finishEarly(session: Session, now: number = Date.now()): Session {
  return { ...session, finishedAt: now };
}

export interface SessionSummary {
  total: number;
  answered: number;
  skipped: number;
  notReached: number;
  totalTimeSec: number;
}

export function summarize(session: Session): SessionSummary {
  let answered = 0;
  let skipped = 0;
  let totalTimeSec = 0;
  for (const id of session.questionIds) {
    const a = session.answers[id];
    if (!a) continue;
    if (a.status === 'answered') answered++;
    else skipped++;
    totalTimeSec += a.timeSpentSec;
  }
  const total = session.questionIds.length;
  return { total, answered, skipped, notReached: total - answered - skipped, totalTimeSec };
}

export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
