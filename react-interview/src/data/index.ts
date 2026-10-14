import type { Question } from '../types';
import { accessibility, security } from './accessibilitySecurity';
import { architecture } from './architecture';
import { behavioral } from './behavioral';
import { dataState } from './dataState';
import { hooks } from './hooks';
import { javascript } from './javascript';
import { performance } from './performance';
import { reactAdvanced } from './reactAdvanced';
import { reactFundamentals } from './reactFundamentals';
import { systemDesign } from './systemDesign';
import { testing } from './testing';
import { typescript } from './typescript';
import { webPlatform } from './webPlatform';

export const QUESTIONS: Question[] = [
  ...reactFundamentals,
  ...hooks,
  ...reactAdvanced,
  ...architecture,
  ...dataState,
  ...performance,
  ...testing,
  ...accessibility,
  ...security,
  ...javascript,
  ...typescript,
  ...webPlatform,
  ...systemDesign,
  ...behavioral,
];

export const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]));
