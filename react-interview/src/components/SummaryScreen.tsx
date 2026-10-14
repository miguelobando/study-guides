import { useState } from 'react';
import { CATEGORY_LABELS } from '../data/meta';
import { buildTranscript, downloadText, transcriptFilename } from '../lib/exportTxt';
import { formatDuration, summarize } from '../lib/session';
import type { Category, Question, Session } from '../types';
import { QuestionBadges } from './Badges';
import { CodeBlock } from './CodeBlock';
import { SourceList } from './SourceList';

interface SummaryScreenProps {
  session: Session;
  questionsById: ReadonlyMap<string, Question>;
  onRestart: () => void;
}

export function SummaryScreen({ session, questionsById, onRestart }: SummaryScreenProps) {
  const [includeKeyPoints, setIncludeKeyPoints] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const summary = summarize(session);

  const transcript = () => buildTranscript(session, questionsById, { includeKeyPoints });

  async function copy() {
    try {
      await navigator.clipboard.writeText(transcript());
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  const byCategory = new Map<Category, { answered: number; total: number }>();
  for (const id of session.questionIds) {
    const q = questionsById.get(id);
    if (!q) continue;
    const entry = byCategory.get(q.category) ?? { answered: 0, total: 0 };
    entry.total++;
    if (session.answers[id]?.status === 'answered') entry.answered++;
    byCategory.set(q.category, entry);
  }

  return (
    <main className="screen summary">
      <header className="hero">
        <h1>Interview complete</h1>
        <p>
          Export the transcript and send it to a model (or a mentor) for grading. The file already includes reviewer
          instructions, the rubric and the sources for every question.
        </p>
      </header>

      <section className="stats" aria-label="Results">
        <div className="stat">
          <span className="stat-value">{summary.answered}</span>
          <span className="stat-label">Answered</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.skipped}</span>
          <span className="stat-label">Skipped</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.notReached}</span>
          <span className="stat-label">Not reached</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatDuration(summary.totalTimeSec)}</span>
          <span className="stat-label">Time</span>
        </div>
      </section>

      <section className="card export" aria-label="Export">
        <label className="chip">
          <input type="checkbox" checked={includeKeyPoints} onChange={(e) => setIncludeKeyPoints(e.target.checked)} />
          Include reference key points (rubric) in the export
        </label>
        <div className="row">
          <button
            type="button"
            className="primary large"
            onClick={() => downloadText(transcriptFilename(session), transcript())}
          >
            Download .txt
          </button>
          <button type="button" className="ghost" onClick={copy}>
            Copy to clipboard
          </button>
          <button type="button" className="ghost" onClick={onRestart}>
            New interview
          </button>
        </div>
        <p className="muted small" aria-live="polite">
          {copyStatus === 'copied' && 'Transcript copied.'}
          {copyStatus === 'failed' && 'Clipboard is not available here; use Download instead.'}
        </p>
      </section>

      <section className="card" aria-label="Results by topic">
        <h2>By topic</h2>
        <ul className="topic-list">
          {[...byCategory].map(([category, { answered, total }]) => (
            <li key={category}>
              <span>{CATEGORY_LABELS[category]}</span>
              <span className="muted">
                {answered}/{total} answered
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="All questions">
        <h2>Review</h2>
        {session.questionIds.map((id, i) => {
          const q = questionsById.get(id);
          if (!q) return null;
          const a = session.answers[id];
          const status = a ? a.status : 'not-reached';
          return (
            <details key={id} className={`card review-item ${status}`}>
              <summary>
                <span className="review-index">{i + 1}.</span>
                <span className="review-prompt">{q.prompt}</span>
                <span className={`pill ${status}`}>{status.replace('-', ' ')}</span>
              </summary>
              <QuestionBadges question={q} />
              {q.code && <CodeBlock code={q.code} lang={q.codeLang} />}
              <div className={`your-answer ${status}`}>
                <h3>Your answer</h3>
                {a?.status === 'answered' ? (
                  <p className="pre">{a.answer}</p>
                ) : (
                  <p className="muted">{status === 'skipped' ? 'Skipped.' : 'Not reached.'}</p>
                )}
                {a && (
                  <p className="muted small">
                    Time: {formatDuration(a.timeSpentSec)}
                    {a.confidence && ` · confidence: ${a.confidence}`}
                  </p>
                )}
              </div>
              <div className="rubric">
                <h3>What a strong answer covers</h3>
                <ul>
                  {q.keyPoints.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <SourceList sources={q.sources} />
            </details>
          );
        })}
      </section>
    </main>
  );
}
