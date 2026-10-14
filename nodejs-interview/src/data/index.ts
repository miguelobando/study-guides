import type { Question } from '../types';
import { architecture } from './architecture';
import { behavioral } from './behavioral';
import { databases } from './databases';
import { errorsDebugging } from './errorsDebugging';
import { eventLoop } from './eventLoop';
import { httpApis } from './httpApis';
import { javascript } from './javascript';
import { nodeFundamentals } from './nodeFundamentals';
import { performance } from './performance';
import { production } from './production';
import { security } from './security';
import { streamsIo } from './streamsIo';
import { systemDesign } from './systemDesign';
import { testing } from './testing';
import { typescript } from './typescript';

export const QUESTIONS: Question[] = [
  ...nodeFundamentals,
  ...eventLoop,
  ...streamsIo,
  ...httpApis,
  ...errorsDebugging,
  ...databases,
  ...performance,
  ...security,
  ...testing,
  ...architecture,
  ...production,
  ...javascript,
  ...typescript,
  ...systemDesign,
  ...behavioral,
];

export const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]));
