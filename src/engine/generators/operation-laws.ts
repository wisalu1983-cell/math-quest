import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) return [
    { tag: 'commutative',   weight: 35 },
    { tag: 'associative',   weight: 30 },
    { tag: 'identification', weight: 35 },
  ];
  if (difficulty <= 7) return [
    { tag: 'distributive',  weight: 30 },
    { tag: 'associative',   weight: 25 },
    { tag: 'commutative',   weight: 20 },
    { tag: 'identification', weight: 25 },
  ];
  return [
    { tag: 'distributive',  weight: 40 },
    { tag: 'associative',   weight: 25 },
    { tag: 'identification', weight: 35 },
  ];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCommutative(difficulty: number, id: string): Question {
  const useMultiply = Math.random() < 0.5;
  const max = difficulty <= 5 ? 50 : difficulty <= 7 ? 200 : 500;

  if (useMultiply) {
    const a = randInt(2, max < 100 ? 12 : 20);
    const b = randInt(2, max < 100 ? 12 : 20);
    const c = randInt(2, max < 100 ? 12 : 20);
    const original = `${a} × ${b} × ${c}`;
    const transformed = `${a} × ${c} × ${b}`;
    const wrong1 = `${a} + ${c} × ${b}`;
    const wrong2 = `${b} × ${a} + ${c}`;
    const options = shuffle([transformed, wrong1, wrong2, `${c} × ${b} + ${a}`]);

    return {
      id, topicId: 'operation-laws', type: 'multiple-choice', difficulty,
      prompt: `运用交换律，${original} 可以变为？`,
      data: { kind: 'operation-laws', law: 'commutative', originalExpression: original, transformedExpression: transformed, options },
      solution: { answer: transformed, explanation: `交换律: a × b = b × a，所以可以交换 ${b} 和 ${c} 的位置` },
      hints: ['交换律：两个数相乘，交换位置结果不变'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    const a = randInt(10, max);
    const b = randInt(10, max);
    const c = randInt(10, max);
    const original = `${a} + ${b} + ${c}`;
    const transformed = `${a} + ${c} + ${b}`;
    const wrong1 = `${a} - ${c} + ${b}`;
    const wrong2 = `${a} × ${c} + ${b}`;
    const options = shuffle([transformed, wrong1, wrong2, `${c} + ${a} - ${b}`]);

    return {
      id, topicId: 'operation-laws', type: 'multiple-choice', difficulty,
      prompt: `运用交换律，${original} 可以变为？`,
      data: { kind: 'operation-laws', law: 'commutative', originalExpression: original, transformedExpression: transformed, options },
      solution: { answer: transformed, explanation: `交换律: a + b = b + a，所以可以交换 ${b} 和 ${c} 的位置` },
      hints: ['交换律：两个数相加，交换位置结果不变'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
}

function generateAssociative(difficulty: number, id: string): Question {
  const targetMax = difficulty <= 5 ? 10 : difficulty <= 7 ? 20 : 50;
  const target = randInt(5, targetMax) * 10;
  const a = randInt(10, target - 10);
  const c = target - a;
  const bMax = difficulty <= 5 ? 99 : difficulty <= 7 ? 999 : 9999;
  const b = randInt(10, bMax);

  const original = `${a} + ${b} + ${c}`;
  const answer = a + b + c;
  const transformed = `(${a} + ${c}) + ${b}`;
  const simplified = `${target} + ${b} = ${answer}`;

  return {
    id, topicId: 'operation-laws', type: 'numeric-input', difficulty,
    prompt: `用简便方法计算: ${original}`,
    data: {
      kind: 'operation-laws', law: 'associative',
      originalExpression: original, transformedExpression: transformed,
    },
    solution: {
      answer,
      steps: [`观察到 ${a} + ${c} = ${target}（凑整）`, `所以 ${original} = ${transformed}`, `= ${simplified}`],
      explanation: `结合律凑整: ${a} + ${c} = ${target}，再加 ${b}`,
    },
    hints: ['找找哪两个数加起来是整十或整百'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateDistributive(difficulty: number, id: string): Question {
  const a = randInt(2, difficulty <= 7 ? 12 : 25);
  const b = randInt(10, 99);
  const c = difficulty <= 7 ? (100 - b) : randInt(10, 99);

  if (Math.random() < 0.5) {
    const original = `${a} × (${b} + ${c})`;
    const answer = a * (b + c);
    return {
      id, topicId: 'operation-laws', type: 'numeric-input', difficulty,
      prompt: `用分配律计算: ${original}`,
      data: { kind: 'operation-laws', law: 'distributive', originalExpression: original, transformedExpression: `${a} × ${b} + ${a} × ${c}` },
      solution: {
        answer,
        steps: [`${original} = ${a} × ${b} + ${a} × ${c}`, `= ${a * b} + ${a * c}`, `= ${answer}`],
        explanation: `分配律: a × (b + c) = a × b + a × c`,
      },
      hints: [`分配律: ${a} 分别乘以 ${b} 和 ${c}`],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    const original = `${a} × ${b} + ${a} × ${c}`;
    const answer = a * (b + c);
    return {
      id, topicId: 'operation-laws', type: 'numeric-input', difficulty,
      prompt: `用简便方法计算: ${original}`,
      data: { kind: 'operation-laws', law: 'distributive', originalExpression: original, transformedExpression: `${a} × (${b} + ${c})` },
      solution: {
        answer,
        steps: [`提取公因数 ${a}`, `= ${a} × (${b} + ${c})`, `= ${a} × ${b + c}`, `= ${answer}`],
        explanation: `逆用分配律提取公因数 ${a}`,
      },
      hints: [`两项都有公因数 ${a}，可以提出来`],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
}

function generateLawIdentification(difficulty: number, id: string): Question {
  const lawType = randInt(0, 2);
  let original: string;
  let transformed: string;
  let correctLaw: 'commutative' | 'associative' | 'distributive';
  let correctName: string;

  if (lawType === 0) {
    const isAdd = Math.random() < 0.5;
    const op = isAdd ? '+' : '×';
    const a = randInt(10, difficulty <= 5 ? 99 : 500);
    const b = randInt(10, difficulty <= 5 ? 99 : 500);
    original = `${a} ${op} ${b}`;
    transformed = `${b} ${op} ${a}`;
    correctLaw = 'commutative';
    correctName = '交换律';
  } else if (lawType === 1) {
    const isAdd = Math.random() < 0.5;
    const op = isAdd ? '+' : '×';
    const a = randInt(5, difficulty <= 5 ? 50 : 200);
    const b = randInt(5, difficulty <= 5 ? 50 : 200);
    const c = randInt(5, difficulty <= 5 ? 50 : 200);
    original = `(${a} ${op} ${b}) ${op} ${c}`;
    transformed = `${a} ${op} (${b} ${op} ${c})`;
    correctLaw = 'associative';
    correctName = '结合律';
  } else {
    const a = randInt(2, difficulty <= 5 ? 9 : 20);
    const b = randInt(10, 99);
    const c = randInt(10, 99);
    const isForward = Math.random() < 0.5;
    if (isForward) {
      original = `${a} × (${b} + ${c})`;
      transformed = `${a} × ${b} + ${a} × ${c}`;
    } else {
      original = `${a} × ${b} + ${a} × ${c}`;
      transformed = `${a} × (${b} + ${c})`;
    }
    correctLaw = 'distributive';
    correctName = '分配律';
  }

  const options = shuffle(['交换律', '结合律', '分配律']);

  return {
    id, topicId: 'operation-laws', type: 'multiple-choice', difficulty,
    prompt: `${original} = ${transformed}，这运用了什么运算律？`,
    data: { kind: 'operation-laws', law: correctLaw, originalExpression: original, transformedExpression: transformed, options },
    solution: { answer: correctName, explanation: `${original} = ${transformed} 运用了${correctName}` },
    hints: ['想想三种运算律的特点：交换律变顺序、结合律变括号、分配律拆乘法'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

export function generateOperationLaws(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = difficulty <= 5 ? [
    { tag: 'commutative', weight: 35, gen: () => generateCommutative(difficulty, id) },
    { tag: 'associative', weight: 30, gen: () => generateAssociative(difficulty, id) },
    { tag: 'identification', weight: 35, gen: () => generateLawIdentification(difficulty, id) },
  ] : difficulty <= 7 ? [
    { tag: 'distributive', weight: 30, gen: () => generateDistributive(difficulty, id) },
    { tag: 'associative', weight: 25, gen: () => generateAssociative(difficulty, id) },
    { tag: 'commutative', weight: 20, gen: () => generateCommutative(difficulty, id) },
    { tag: 'identification', weight: 25, gen: () => generateLawIdentification(difficulty, id) },
  ] : [
    { tag: 'distributive', weight: 40, gen: () => generateDistributive(difficulty, id) },
    { tag: 'associative', weight: 25, gen: () => generateAssociative(difficulty, id) },
    { tag: 'identification', weight: 35, gen: () => generateLawIdentification(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
