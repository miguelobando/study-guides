import { CATEGORY_LABELS, CHALLENGE_LABELS, LEVEL_LABELS, TYPE_LABELS } from '../data/meta';
import type { Question, Session } from '../types';
import { formatDuration, summarize } from './session';

export interface TranscriptOptions {
  /** Include the rubric so the reviewer can grade against it. */
  includeKeyPoints: boolean;
}

const RULE = '='.repeat(72);
const THIN_RULE = '-'.repeat(72);

export const REVIEWER_INSTRUCTIONS = `You are a senior backend engineering interviewer (Node.js, JavaScript,
TypeScript, APIs, databases, production operations and backend system
design). Below is the
transcript of a practice interview. The candidate typed their answers under
time pressure, without looking anything up.

Please evaluate it as follows:

1. For EACH question:
   - Score from 0 to 10 (0 = no answer or wrong, 5 = partially correct,
     8 = solid, 10 = excellent, senior-level depth).
   - What was correct.
   - What was missing or incorrect, including subtle inaccuracies.
   - A concise model answer (code where helpful).
   For SKIPPED or NOT REACHED questions, score 0 and give the model answer.
   The "Reference key points" are a rubric, not an exhaustive answer key:
   give credit for correct points that are not listed, and flag anything
   in the rubric you believe is outdated or wrong.

2. Then an overall assessment:
   - Score per category and per level (Junior / Mid / Senior).
   - The seniority level the answers demonstrate overall, with reasoning.
   - Strengths, and the top 5 knowledge gaps ordered by impact.
   - Communication: clarity, structure, use of trade-offs and examples.
   - A focused 2-week study plan, using the sources listed in the transcript.`;

function indent(text: string, prefix = '    '): string {
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? prefix + line : line))
    .join('\n');
}

function questionHeader(q: Question, index: number, total: number): string {
  const kind = q.type === 'code' && q.challenge ? `${TYPE_LABELS[q.type]} — ${CHALLENGE_LABELS[q.challenge]}` : TYPE_LABELS[q.type];
  return `Q${index + 1} of ${total}  ·  [${LEVEL_LABELS[q.level].toUpperCase()}]  ·  ${CATEGORY_LABELS[q.category]}  ·  ${kind}  ·  id: ${q.id}`;
}

export function buildTranscript(
  session: Session,
  questionsById: ReadonlyMap<string, Question>,
  options: TranscriptOptions = { includeKeyPoints: true },
  now: Date = new Date(),
): string {
  const summary = summarize(session);
  const { config } = session;
  const out: string[] = [];

  out.push(RULE);
  out.push('NODE.JS / JAVASCRIPT / TYPESCRIPT INTERVIEW — CANDIDATE TRANSCRIPT');
  out.push(RULE);
  out.push(`Candidate:   ${config.candidateName.trim() || '(not provided)'}`);
  out.push(`Exported:    ${now.toISOString()}`);
  out.push(`Started:     ${new Date(session.startedAt).toISOString()}`);
  out.push(`Levels:      ${config.levels.map((l) => LEVEL_LABELS[l]).join(', ')}`);
  out.push(`Categories:  ${config.categories.map((c) => CATEGORY_LABELS[c]).join(', ')}`);
  out.push(`Types:       ${config.types.map((t) => TYPE_LABELS[t]).join(', ')}`);
  out.push(`Order:       ${config.order === 'progressive' ? 'Progressive (junior → senior)' : 'Random'}`);
  out.push(
    `Result:      ${summary.answered} answered, ${summary.skipped} skipped, ${summary.notReached} not reached (of ${summary.total})`,
  );
  out.push(`Time spent:  ${formatDuration(summary.totalTimeSec)}`);
  out.push('');
  out.push(RULE);
  out.push('INSTRUCTIONS FOR THE REVIEWER');
  out.push(RULE);
  out.push(REVIEWER_INSTRUCTIONS);
  out.push('');
  out.push(RULE);
  out.push('QUESTIONS AND ANSWERS');
  out.push(RULE);

  session.questionIds.forEach((id, index) => {
    const q = questionsById.get(id);
    if (!q) return;
    const a = session.answers[id];

    out.push('');
    out.push(THIN_RULE);
    out.push(questionHeader(q, index, summary.total));
    out.push(THIN_RULE);
    out.push('QUESTION:');
    out.push(indent(q.prompt));
    if (q.code) {
      out.push('');
      out.push(`CODE (${q.codeLang ?? 'text'}):`);
      out.push(indent(q.code));
    }
    out.push('');

    if (!a) {
      out.push('CANDIDATE ANSWER: [NOT REACHED]');
    } else if (a.status === 'skipped') {
      out.push(`CANDIDATE ANSWER: [SKIPPED]  (time: ${formatDuration(a.timeSpentSec)})`);
    } else {
      const meta = [`time: ${formatDuration(a.timeSpentSec)}`];
      if (a.confidence) meta.push(`self-rated confidence: ${a.confidence}`);
      out.push(`CANDIDATE ANSWER  (${meta.join(', ')}):`);
      out.push(indent(a.answer.trim() || '(empty)'));
    }

    if (options.includeKeyPoints) {
      out.push('');
      out.push('REFERENCE KEY POINTS (rubric):');
      for (const point of q.keyPoints) out.push(`    - ${point}`);
      if (q.followUps?.length) {
        out.push('LIKELY FOLLOW-UPS:');
        for (const f of q.followUps) out.push(`    - ${f}`);
      }
    }

    out.push('');
    out.push('SOURCES:');
    for (const s of q.sources) out.push(`    - ${s.label}: ${s.url}`);
  });

  out.push('');
  out.push(RULE);
  out.push('END OF TRANSCRIPT');
  out.push(RULE);
  return out.join('\n') + '\n';
}

export function transcriptFilename(session: Session, now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const name = session.config.candidateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `nodejs-interview-${name ? `${name}-` : ''}${stamp}.txt`;
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
