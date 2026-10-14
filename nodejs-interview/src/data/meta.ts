import type { Category, ChallengeKind, Level, QuestionType } from '../types';

export const LEVELS: Level[] = ['junior', 'mid', 'senior'];

export const LEVEL_LABELS: Record<Level, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
};

export const CATEGORIES: Category[] = [
  'node-fundamentals',
  'event-loop',
  'streams-io',
  'http-apis',
  'errors-debugging',
  'databases',
  'performance',
  'security',
  'testing',
  'architecture',
  'production',
  'javascript',
  'typescript',
  'system-design',
  'behavioral',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  'node-fundamentals': 'Node.js Fundamentals',
  'event-loop': 'Event Loop & Async',
  'streams-io': 'Streams, Buffers & File System',
  'http-apis': 'HTTP & API Design',
  'errors-debugging': 'Errors, Logging & Debugging',
  databases: 'Databases & Data Access',
  performance: 'Performance & Scaling',
  security: 'Security & Auth',
  testing: 'Testing',
  architecture: 'Architecture & Patterns',
  production: 'Production, DevOps & Observability',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  'system-design': 'Backend System Design',
  behavioral: 'Behavioral & Leadership',
};

export const TYPES: QuestionType[] = ['concept', 'code', 'design', 'behavioral'];

export const TYPE_LABELS: Record<QuestionType, string> = {
  concept: 'Open question',
  code: 'Code challenge',
  design: 'System design',
  behavioral: 'Behavioral',
};

export const CHALLENGE_LABELS: Record<ChallengeKind, string> = {
  bug: "What's wrong here?",
  output: 'What does this output?',
  'bad-practice': 'Spot the bad practice',
  implement: 'Implement it',
};
