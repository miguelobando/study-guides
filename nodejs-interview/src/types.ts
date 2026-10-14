export type Level = 'junior' | 'mid' | 'senior';

export type QuestionType = 'concept' | 'code' | 'design' | 'behavioral';

/** For code challenges: what kind of task the snippet is. */
export type ChallengeKind = 'bug' | 'output' | 'bad-practice' | 'implement';

export type Category =
  | 'node-fundamentals'
  | 'event-loop'
  | 'streams-io'
  | 'http-apis'
  | 'errors-debugging'
  | 'databases'
  | 'performance'
  | 'security'
  | 'testing'
  | 'architecture'
  | 'production'
  | 'javascript'
  | 'typescript'
  | 'system-design'
  | 'behavioral';

export interface Source {
  label: string;
  url: string;
}

export interface Question {
  id: string;
  category: Category;
  level: Level;
  type: QuestionType;
  challenge?: ChallengeKind;
  prompt: string;
  code?: string;
  codeLang?: 'js' | 'ts' | 'json' | 'sql' | 'bash' | 'dockerfile' | 'yaml' | 'text';
  /** Rubric: what a strong answer should cover. Hidden until the candidate answers. */
  keyPoints: string[];
  /** Questions an interviewer would likely ask next. */
  followUps?: string[];
  sources: Source[];
}

export type Order = 'progressive' | 'random';
export type FeedbackMode = 'each' | 'end';

export interface SessionConfig {
  candidateName: string;
  levels: Level[];
  categories: Category[];
  types: QuestionType[];
  /** 0 means "all matching questions". */
  count: number;
  order: Order;
  feedback: FeedbackMode;
  /** Soft per-question time limit in seconds. 0 disables it. */
  timeLimitSec: number;
}

export type AnswerStatus = 'answered' | 'skipped';
export type Confidence = 'low' | 'medium' | 'high';

export interface AnswerRecord {
  questionId: string;
  status: AnswerStatus;
  answer: string;
  confidence?: Confidence;
  timeSpentSec: number;
  answeredAt: number;
}

export interface Session {
  id: string;
  config: SessionConfig;
  questionIds: string[];
  answers: Record<string, AnswerRecord>;
  currentIndex: number;
  startedAt: number;
  finishedAt?: number;
}
