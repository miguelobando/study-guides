import { CATEGORY_LABELS, CHALLENGE_LABELS, LEVEL_LABELS, TYPE_LABELS } from '../data/meta';
import type { Question } from '../types';

export function QuestionBadges({ question }: { question: Question }) {
  return (
    <div className="badges">
      <span className={`badge level-${question.level}`}>{LEVEL_LABELS[question.level]}</span>
      <span className="badge">{CATEGORY_LABELS[question.category]}</span>
      <span className={`badge type-${question.type}`}>
        {question.type === 'code' && question.challenge
          ? CHALLENGE_LABELS[question.challenge]
          : TYPE_LABELS[question.type]}
      </span>
    </div>
  );
}
