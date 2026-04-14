import { nanoid } from 'nanoid';
import type { Question, TopicId } from '@/types';
import { generateMentalArithmetic } from './generators/mental-arithmetic';
import { generateNumberSense } from './generators/number-sense';
import { generateOperationLaws } from './generators/operation-laws';
import { generateVerticalCalc } from './generators/vertical-calc';
import { generateDecimalOps } from './generators/decimal-ops';
import { generateBracketOps } from './generators/bracket-ops';
import { generateMultiStep } from './generators/multi-step';
import { generateEquationTranspose } from './generators/equation-transpose';

export interface GeneratorParams {
  difficulty: number;
  id?: string;
  subtypeFilter?: string[];
}

export interface SubtypeEntry {
  tag: string;
  weight: number;
  gen: () => Question;
}

/** 按权重从 entries 中随机选择，支持 subtypeFilter 过滤+重新归一化 */
export function pickSubtype(entries: SubtypeEntry[], subtypeFilter?: string[]): Question {
  let pool = entries;
  if (subtypeFilter?.length) {
    const filtered = entries.filter(e => subtypeFilter.includes(e.tag));
    if (filtered.length > 0) pool = filtered;
  }
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const entry of pool) {
    r -= entry.weight;
    if (r <= 0) return entry.gen();
  }
  return pool[pool.length - 1].gen();
}

type Generator = (params: GeneratorParams) => Question;

const generators: Record<TopicId, Generator> = {
  'mental-arithmetic': generateMentalArithmetic,
  'number-sense': generateNumberSense,
  'operation-laws': generateOperationLaws,
  'vertical-calc': generateVerticalCalc,
  'decimal-ops': generateDecimalOps,
  'bracket-ops': generateBracketOps,
  'multi-step': generateMultiStep,
  'equation-transpose': generateEquationTranspose,
};

export function generateQuestion(topicId: TopicId, difficulty: number, subtypeFilter?: string[]): Question {
  const gen = generators[topicId];
  const d = Math.max(1, Math.min(10, Math.round(difficulty)));
  return gen({ difficulty: d, id: nanoid(10), subtypeFilter });
}

export function generateMixedQuestions(topicIds: TopicId[], difficulty: number, count: number): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const topic = topicIds[i % topicIds.length];
    questions.push(generateQuestion(topic, difficulty));
  }
  return questions;
}
