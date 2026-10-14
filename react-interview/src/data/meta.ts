import type { Category, ChallengeKind, Level, QuestionType } from '../types';

export const LEVELS: Level[] = ['junior', 'mid', 'senior'];

export const LEVEL_LABELS: Record<Level, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
};

export const CATEGORIES: Category[] = [
  'react-fundamentals',
  'hooks-state',
  'react-advanced',
  'architecture',
  'data-state',
  'performance',
  'testing',
  'accessibility',
  'security',
  'javascript',
  'typescript',
  'web-platform',
  'system-design',
  'behavioral',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  'react-fundamentals': 'React Fundamentals',
  'hooks-state': 'Hooks & State',
  'react-advanced': 'Advanced React & Internals',
  architecture: 'Architecture & Patterns',
  'data-state': 'State Management & Data Fetching',
  performance: 'Performance',
  testing: 'Testing',
  accessibility: 'Accessibility',
  security: 'Security',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  'web-platform': 'Web Platform & Browser',
  'system-design': 'Frontend System Design',
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
