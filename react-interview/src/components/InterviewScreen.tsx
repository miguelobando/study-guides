import { useEffect, useId, useRef, useState } from 'react';
import { formatDuration } from '../lib/session';
import type { AnswerRecord, Confidence, Question, Session } from '../types';
import { QuestionBadges } from './Badges';
import { CodeBlock } from './CodeBlock';
import { SourceList } from './SourceList';

interface InterviewScreenProps {
  session: Session;
  questionsById: ReadonlyMap<string, Question>;
  /** Saves the record; when `advance` is true also moves to the next question. */
  onRecord: (record: AnswerRecord, advance: boolean) => void;
  onNext: () => void;
  onEnd: (pending?: AnswerRecord) => void;
}

export function InterviewScreen({ session, questionsById, onRecord, onNext, onEnd }: InterviewScreenProps) {
  const id = session.questionIds[session.currentIndex];
  const question = id ? questionsById.get(id) : undefined;
  if (!question) return null;

  const total = session.questionIds.length;
  const done = Object.keys(session.answers).length;

  return (
    <main className="screen interview">
      <div className="progress" role="progressbar" aria-label="Interview progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="progress-bar" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {/* key resets the draft, timer and phase for every new question */}
      <QuestionView
        key={question.id}
        question={question}
        index={session.currentIndex}
        total={total}
        existing={session.answers[question.id]}
        feedback={session.config.feedback}
        timeLimitSec={session.config.timeLimitSec}
        onRecord={onRecord}
        onNext={onNext}
        onEnd={onEnd}
      />
    </main>
  );
}

interface QuestionViewProps {
  question: Question;
  index: number;
  total: number;
  existing: AnswerRecord | undefined;
  feedback: Session['config']['feedback'];
  timeLimitSec: number;
  onRecord: InterviewScreenProps['onRecord'];
  onNext: () => void;
  onEnd: InterviewScreenProps['onEnd'];
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function QuestionView({ question, index, total, existing, feedback, timeLimitSec, onRecord, onNext, onEnd }: QuestionViewProps) {
  const [draft, setDraft] = useState(existing?.answer ?? '');
  const [confidence, setConfidence] = useState<Confidence | undefined>(existing?.confidence);
  const [record, setRecord] = useState<AnswerRecord | undefined>(existing);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const answerId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const reviewing = record !== undefined;
  const now = useNow(!reviewing);
  const elapsedSec = reviewing ? record.timeSpentSec : Math.floor((now - startedAt) / 1000);
  const overTime = timeLimitSec > 0 && elapsedSec > timeLimitSec;
  const isLast = index === total - 1;

  // Move focus to the new question so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (reviewing) nextRef.current?.focus();
  }, [reviewing]);

  function buildRecord(status: AnswerRecord['status']): AnswerRecord {
    return {
      questionId: question.id,
      status,
      answer: status === 'answered' ? draft : '',
      confidence: status === 'answered' ? confidence : undefined,
      timeSpentSec: Math.floor((Date.now() - startedAt) / 1000),
      answeredAt: Date.now(),
    };
  }

  function commit(status: AnswerRecord['status']) {
    const next = buildRecord(status);
    if (feedback === 'each') {
      setRecord(next);
      onRecord(next, false);
    } else {
      onRecord(next, true);
    }
  }

  function endNow() {
    if (reviewing) onEnd();
    else onEnd(draft.trim() ? buildRecord('answered') : undefined);
  }

  const canSubmit = draft.trim().length > 0;

  return (
    <article className="card question" aria-labelledby={`${answerId}-title`}>
      <header className="question-head">
        <div className="question-meta">
          <span className="counter">
            Question {index + 1} / {total}
          </span>
          <span className={`timer${overTime ? ' over' : ''}`} aria-live="off">
            ⏱ {formatDuration(elapsedSec)}
            {timeLimitSec > 0 && ` / ${formatDuration(timeLimitSec)}`}
          </span>
        </div>
        <QuestionBadges question={question} />
      </header>

      <h2 id={`${answerId}-title`} className="prompt" tabIndex={-1} ref={headingRef}>
        {question.prompt}
      </h2>

      {question.code && <CodeBlock code={question.code} lang={question.codeLang} />}

      {!reviewing ? (
        <form
          className="answer-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) commit('answered');
          }}
        >
          <label htmlFor={answerId} className="answer-label">
            Your answer
          </label>
          <textarea
            id={answerId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
                e.preventDefault();
                commit('answered');
              }
            }}
            rows={10}
            spellCheck
            placeholder="Answer as you would out loud: definition, how it works, trade-offs, an example…"
          />
          <div className="answer-tools">
            <fieldset className="confidence">
              <legend>Confidence</legend>
              {(['low', 'medium', 'high'] as Confidence[]).map((c) => (
                <label key={c} className="chip small">
                  <input
                    type="radio"
                    name={`confidence-${question.id}`}
                    checked={confidence === c}
                    onChange={() => setConfidence(c)}
                  />
                  {c}
                </label>
              ))}
            </fieldset>
            <span className="muted small">{draft.trim() ? `${draft.trim().split(/\s+/).length} words` : ''}</span>
          </div>
          <div className="actions">
            <button type="button" className="ghost" onClick={() => commit('skipped')}>
              Skip
            </button>
            <button type="submit" className="primary" disabled={!canSubmit} title="Ctrl/⌘ + Enter">
              Submit answer
            </button>
          </div>
          <p className="muted small hint">Tip: Ctrl/⌘ + Enter submits.</p>
        </form>
      ) : (
        <section className="review" aria-label="Review">
          <div className={`your-answer ${record.status}`}>
            <h3>{record.status === 'skipped' ? 'Skipped' : 'Your answer'}</h3>
            {record.status === 'answered' && <p className="pre">{record.answer}</p>}
          </div>
          <div className="rubric">
            <h3>What a strong answer covers</h3>
            <ul>
              {question.keyPoints.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {question.followUps && question.followUps.length > 0 && (
              <>
                <h4>Likely follow-ups</h4>
                <ul>
                  {question.followUps.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="actions">
            <button type="button" className="primary" ref={nextRef} onClick={onNext}>
              {isLast ? 'Finish interview' : 'Next question →'}
            </button>
          </div>
        </section>
      )}

      <SourceList sources={question.sources} title="Where this question & answer come from" />

      <footer className="question-foot">
        {confirmingEnd ? (
          <div className="confirm" role="group" aria-label="Confirm ending the interview">
            <span>End now? Remaining questions will be marked as not reached{draft.trim() && !reviewing ? ' (your current draft is kept)' : ''}.</span>
            <button type="button" className="danger small" onClick={endNow}>
              Yes, end interview
            </button>
            <button type="button" className="ghost small" onClick={() => setConfirmingEnd(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="link" onClick={() => setConfirmingEnd(true)}>
            End interview early
          </button>
        )}
      </footer>
    </article>
  );
}
