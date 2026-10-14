import { useId, useState } from 'react';
import { CATEGORIES, CATEGORY_LABELS, LEVEL_LABELS, LEVELS, TYPE_LABELS, TYPES } from '../data/meta';
import { filterPool } from '../lib/session';
import type { Category, FeedbackMode, Order, Question, Session, SessionConfig } from '../types';

interface SetupScreenProps {
  questions: readonly Question[];
  initialConfig: SessionConfig;
  resumable: Session | null;
  onStart: (config: SessionConfig) => void;
  onResume: () => void;
  onDiscard: () => void;
}

const COUNT_OPTIONS = [10, 15, 25, 40, 60, 0];
const TIME_OPTIONS = [0, 120, 180, 300, 600];

const PRESETS: { label: string; categories: Category[] }[] = [
  { label: 'Everything', categories: [...CATEGORIES] },
  {
    label: 'React core',
    categories: ['react-fundamentals', 'hooks-state', 'react-advanced', 'performance'],
  },
  { label: 'JS + TS', categories: ['javascript', 'typescript'] },
  {
    label: 'Senior loop',
    categories: ['react-advanced', 'architecture', 'data-state', 'performance', 'system-design', 'behavioral'],
  },
  {
    label: 'Quality & safety',
    categories: ['testing', 'accessibility', 'security', 'web-platform'],
  },
];

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function SetupScreen({ questions, initialConfig, resumable, onStart, onResume, onDiscard }: SetupScreenProps) {
  const [config, setConfig] = useState<SessionConfig>(initialConfig);
  const nameId = useId();
  const countId = useId();
  const timeId = useId();

  const pool = filterPool(questions, config);
  const plannedCount = config.count > 0 ? Math.min(config.count, pool.length) : pool.length;

  const countFor = (predicate: (q: Question) => boolean) => questions.filter(predicate).length;
  const update = (patch: Partial<SessionConfig>) => setConfig((c) => ({ ...c, ...patch }));

  return (
    <main className="screen setup">
      <header className="hero">
        <h1>React Interview Simulator</h1>
        <p>
          Open questions, code challenges and frontend system design from junior to senior. Type your answer as you would
          say it in an interview, then compare with the rubric and the source. At the end, export a transcript to have a
          model grade it.
        </p>
        <p className="muted">{questions.length} questions in the bank.</p>
      </header>

      {resumable && (
        <section className="card resume" aria-label="Interview in progress">
          <div>
            <strong>Interview in progress</strong>
            <p className="muted">
              Question {Math.min(resumable.currentIndex + 1, resumable.questionIds.length)} of{' '}
              {resumable.questionIds.length}, started {new Date(resumable.startedAt).toLocaleString()}.
            </p>
          </div>
          <div className="row">
            <button type="button" className="primary" onClick={onResume}>
              Resume
            </button>
            <button type="button" className="ghost" onClick={onDiscard}>
              Discard
            </button>
          </div>
        </section>
      )}

      <form
        className="card setup-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (plannedCount > 0) onStart(config);
        }}
      >
        <div className="field">
          <label htmlFor={nameId}>Your name (optional, goes into the transcript)</label>
          <input
            id={nameId}
            type="text"
            value={config.candidateName}
            autoComplete="name"
            onChange={(e) => update({ candidateName: e.target.value })}
          />
        </div>

        <fieldset>
          <legend>Levels</legend>
          <div className="chips">
            {LEVELS.map((level) => (
              <label key={level} className="chip">
                <input
                  type="checkbox"
                  checked={config.levels.includes(level)}
                  onChange={() => update({ levels: toggle(config.levels, level) })}
                />
                {LEVEL_LABELS[level]} <span className="count">{countFor((q) => q.level === level)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Topics</legend>
          <div className="presets" role="group" aria-label="Topic presets">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="ghost small" onClick={() => update({ categories: p.categories })}>
                {p.label}
              </button>
            ))}
            <button type="button" className="ghost small" onClick={() => update({ categories: [] })}>
              Clear
            </button>
          </div>
          <div className="chips">
            {CATEGORIES.map((category) => (
              <label key={category} className="chip">
                <input
                  type="checkbox"
                  checked={config.categories.includes(category)}
                  onChange={() => update({ categories: toggle(config.categories, category) })}
                />
                {CATEGORY_LABELS[category]} <span className="count">{countFor((q) => q.category === category)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Question types</legend>
          <div className="chips">
            {TYPES.map((type) => (
              <label key={type} className="chip">
                <input
                  type="checkbox"
                  checked={config.types.includes(type)}
                  onChange={() => update({ types: toggle(config.types, type) })}
                />
                {TYPE_LABELS[type]} <span className="count">{countFor((q) => q.type === type)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid-2">
          <div className="field">
            <label htmlFor={countId}>Number of questions</label>
            <select id={countId} value={config.count} onChange={(e) => update({ count: Number(e.target.value) })}>
              {COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'All matching' : n}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={timeId}>Soft time limit per question</label>
            <select id={timeId} value={config.timeLimitSec} onChange={(e) => update({ timeLimitSec: Number(e.target.value) })}>
              {TIME_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 0 ? 'None' : `${s / 60} min`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend>Order</legend>
          <div className="chips">
            {(
              [
                ['progressive', 'Progressive (junior → senior, like a real loop)'],
                ['random', 'Fully random'],
              ] as [Order, string][]
            ).map(([value, label]) => (
              <label key={value} className="chip">
                <input type="radio" name="order" checked={config.order === value} onChange={() => update({ order: value })} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>When to reveal the rubric</legend>
          <div className="chips">
            {(
              [
                ['each', 'After each answer (study mode)'],
                ['end', 'Only at the end (strict interview mode)'],
              ] as [FeedbackMode, string][]
            ).map(([value, label]) => (
              <label key={value} className="chip">
                <input
                  type="radio"
                  name="feedback"
                  checked={config.feedback === value}
                  onChange={() => update({ feedback: value })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="start-row">
          <p aria-live="polite" className={plannedCount === 0 ? 'warning' : 'muted'}>
            {plannedCount === 0
              ? 'No questions match these filters. Select at least one level, topic and type.'
              : `${pool.length} questions match · this interview will have ${plannedCount}.`}
          </p>
          <button type="submit" className="primary large" disabled={plannedCount === 0}>
            {resumable ? 'Start a new interview' : 'Start interview'}
          </button>
        </div>
      </form>
    </main>
  );
}
