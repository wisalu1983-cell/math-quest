import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  // 普通档：仅 weight>0 的条目（add-bracket 和 division-property 在普通档 weight=0，不纳入）
  if (difficulty <= 5) return [
    { tag: 'remove-bracket-plus',  weight: 60 },
    { tag: 'remove-bracket-minus', weight: 40 },
  ];
  if (difficulty <= 7) return [
    { tag: 'remove-bracket-plus',  weight: 25 },
    { tag: 'remove-bracket-minus', weight: 25 },
    { tag: 'add-bracket',          weight: 25 },
    { tag: 'division-property',    weight: 25 },
  ];
  return [
    { tag: 'remove-bracket-minus', weight: 25 },
    { tag: 'add-bracket',          weight: 20 },
    { tag: 'nested-bracket',       weight: 15 },
    { tag: 'division-property',    weight: 20 },
    { tag: 'remove-bracket-plus',  weight: 20 },
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

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function generateRemoveBracketPlus(difficulty: number, id: string): Question {
  const max = difficulty <= 5 ? 99 : difficulty <= 7 ? 500 : 2000;
  const a = randInt(10, max);
  const b = randInt(10, max);
  const c = randInt(10, max);
  const innerOp = Math.random() < 0.5 ? '+' : '-';
  const original = `${a} + (${b} ${innerOp} ${c})`;
  const correct = `${a} + ${b} ${innerOp} ${c}`;
  const wrong1 = `${a} + ${b} ${innerOp === '+' ? '-' : '+'} ${c}`;
  const wrong2 = `${a} - ${b} ${innerOp} ${c}`;
  const wrong3 = `${a} - ${b} ${innerOp === '+' ? '-' : '+'} ${c}`;

  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `去括号: ${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, explanation: `加号后面的括号去掉，括号内的符号不变: ${original} = ${correct}` },
    hints: ['括号前是加号，去括号后括号里的符号不变'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateRemoveBracketMinus(difficulty: number, id: string): Question {
  const max = difficulty <= 5 ? 200 : difficulty <= 7 ? 1000 : 5000;
  const useDecimal = difficulty >= 6 && Math.random() < 0.3;
  const useFourItems = difficulty >= 6 && Math.random() < 0.4;
  const scale = useDecimal ? 10 : 1;

  const a = useDecimal ? randInt(50, 500) / scale : randInt(50, max);
  const b = useDecimal ? randInt(12, 99) / scale : randInt(12, Math.min(99, max));
  const c = useDecimal ? randInt(10, 80) / scale : randInt(10, Math.floor(b * scale) - 1) / (useDecimal ? scale : 1);

  if (useFourItems) {
    const d = useDecimal ? randInt(5, 40) / scale : randInt(5, 40);
    const original = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)})`;
    const correct = `${formatNum(a)} - ${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)}`;
    const wrong1 = `${formatNum(a)} - ${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)}`;
    const wrong2 = `${formatNum(a)} - ${formatNum(b)} - ${formatNum(c)} - ${formatNum(d)}`;
    const wrong3 = `${formatNum(a)} + ${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)}`;

    return {
      id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
      prompt: `去括号: ${original} = ?`,
      data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
      solution: { answer: correct, explanation: `减号后面去括号，括号内每个符号都变: ${original} = ${correct}` },
      hints: ['括号前是减号，去括号后括号里的每个符号都要变！'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  const innerOp = Math.random() < 0.5 ? '+' : '-';
  const original = `${formatNum(a)} - (${formatNum(b)} ${innerOp} ${formatNum(c)})`;
  const flippedOp = innerOp === '+' ? '-' : '+';
  const correct = `${formatNum(a)} - ${formatNum(b)} ${flippedOp} ${formatNum(c)}`;
  const wrong1 = `${formatNum(a)} - ${formatNum(b)} ${innerOp} ${formatNum(c)}`;
  const wrong2 = `${formatNum(a)} + ${formatNum(b)} ${flippedOp} ${formatNum(c)}`;
  const wrong3 = `${formatNum(a)} + ${formatNum(b)} ${innerOp} ${formatNum(c)}`;

  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `去括号: ${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, steps: [`括号前是减号，去括号后括号内各项变号`, `${innerOp} 变成 ${flippedOp}`], explanation: `减号后面的括号去掉，括号内的符号要变: ${original} = ${correct}` },
    hints: ['括号前是减号，去括号后括号里的每个符号都要变！'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateAddBracket(difficulty: number, id: string): Question {
  const max = difficulty <= 5 ? 500 : difficulty <= 7 ? 2000 : 9999;
  const useDecimal = difficulty >= 6 && Math.random() < 0.3;
  const useFourItems = difficulty >= 6 && Math.random() < 0.4;
  const scale = useDecimal ? 10 : 1;

  const a = useDecimal ? randInt(100, 999) / scale : randInt(100, max);
  const b = useDecimal ? randInt(10, 99) / scale : randInt(10, Math.min(99, max));
  const c = useDecimal ? randInt(10, 99) / scale : randInt(10, Math.min(99, max));

  if (useFourItems) {
    const d = useDecimal ? randInt(5, 50) / scale : randInt(5, 50);
    const original = `${formatNum(a)} - ${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)}`;
    const correct = `${formatNum(a)} - (${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)})`;
    const wrong1 = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)})`;
    const wrong2 = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)} + ${formatNum(d)})`;
    const wrong3 = `${formatNum(a)} + (${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)})`;

    return {
      id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
      prompt: `添括号: ${original} = ?`,
      data: { kind: 'bracket-ops', subtype: 'add-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
      solution: { answer: correct, explanation: `添括号时符号要变: -${formatNum(b)}+${formatNum(c)}-${formatNum(d)} → -(${formatNum(b)}-${formatNum(c)}+${formatNum(d)})` },
      hints: ['添括号后，括号里的每个符号都要反过来'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  const original = `${formatNum(a)} - ${formatNum(b)} - ${formatNum(c)}`;
  const correct = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)})`;
  const wrong1 = `${formatNum(a)} - (${formatNum(b)} - ${formatNum(c)})`;
  const wrong2 = `${formatNum(a)} + (${formatNum(b)} + ${formatNum(c)})`;
  const wrong3 = `${formatNum(a)} + (${formatNum(b)} - ${formatNum(c)})`;

  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `添括号: ${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'add-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, explanation: `减号后面添括号，括号内的符号要变: - ${formatNum(b)} - ${formatNum(c)} → -(${formatNum(b)} + ${formatNum(c)})` },
    hints: ['减号后面添括号时，括号里的符号要反过来'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateNestedBracket(difficulty: number, id: string): Question {
  const a = randInt(200, 2000);
  const b = randInt(50, 200);
  const c = randInt(10, 80);
  const d = randInt(5, 40);
  const expression = `${a} - (${b} - (${c} + ${d}))`;
  const correct = `${a} - ${b} + ${c} + ${d}`;
  const wrong1 = `${a} - ${b} - ${c} + ${d}`;
  const wrong2 = `${a} - ${b} - ${c} - ${d}`;
  const wrong3 = `${a} + ${b} - ${c} - ${d}`;

  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `去括号: ${expression} = ?`,
    data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: expression, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, steps: ['先去内层括号', '再去外层括号，注意减号后变号'], explanation: `从内到外去括号: ${expression} = ${correct}` },
    hints: ['从最内层的括号开始去，一层一层来'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateDivisionProperty(difficulty: number, id: string): Question {
  const pairs: [number, number][] = difficulty <= 7
    ? [[4, 25], [5, 20], [2, 50], [8, 125]]
    : [[0.25, 4], [0.125, 8], [0.5, 2], [4, 25], [5, 20]];
  const [b, c] = pairs[randInt(0, pairs.length - 1)];
  const product = b * c;
  const multiplier = randInt(2, 12);
  const a = product * multiplier;

  const isRemove = Math.random() < 0.5;
  const original = isRemove
    ? `${formatNum(a)} ÷ (${formatNum(b)} × ${formatNum(c)})`
    : `${formatNum(a)} ÷ ${formatNum(b)} ÷ ${formatNum(c)}`;
  const correct = isRemove
    ? `${formatNum(a)} ÷ ${formatNum(b)} ÷ ${formatNum(c)}`
    : `${formatNum(a)} ÷ (${formatNum(b)} × ${formatNum(c)})`;

  const wrong1 = `${formatNum(a)} × ${formatNum(b)} ÷ ${formatNum(c)}`;
  const wrong2 = `${formatNum(a)} ÷ ${formatNum(b)} × ${formatNum(c)}`;
  const wrong3 = `(${formatNum(a)} ÷ ${formatNum(b)}) × ${formatNum(c)}`;

  const actionText = isRemove ? '去括号' : '添括号';
  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `${actionText}: ${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'division-property', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, explanation: `除法性质: a÷b÷c = a÷(b×c)，连除等于除以积` },
    hints: ['连续除以两个数，等于除以这两个数的积'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

export function generateBracketOps(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = difficulty <= 5 ? [
    { tag: 'remove-bracket-plus', weight: 60, gen: () => generateRemoveBracketPlus(difficulty, id) },
    { tag: 'remove-bracket-minus', weight: 40, gen: () => generateRemoveBracketMinus(difficulty, id) },
    { tag: 'add-bracket', weight: 0, gen: () => generateAddBracket(difficulty, id) },
    { tag: 'division-property', weight: 0, gen: () => generateDivisionProperty(difficulty, id) },
  ] : difficulty <= 7 ? [
    { tag: 'remove-bracket-plus', weight: 25, gen: () => generateRemoveBracketPlus(difficulty, id) },
    { tag: 'remove-bracket-minus', weight: 25, gen: () => generateRemoveBracketMinus(difficulty, id) },
    { tag: 'add-bracket', weight: 25, gen: () => generateAddBracket(difficulty, id) },
    { tag: 'division-property', weight: 25, gen: () => generateDivisionProperty(difficulty, id) },
  ] : [
    { tag: 'remove-bracket-minus', weight: 25, gen: () => generateRemoveBracketMinus(difficulty, id) },
    { tag: 'add-bracket', weight: 20, gen: () => generateAddBracket(difficulty, id) },
    { tag: 'nested-bracket', weight: 15, gen: () => generateNestedBracket(difficulty, id) },
    { tag: 'division-property', weight: 20, gen: () => generateDivisionProperty(difficulty, id) },
    { tag: 'remove-bracket-plus', weight: 20, gen: () => generateRemoveBracketPlus(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
