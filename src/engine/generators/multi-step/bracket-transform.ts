import type { MultiStepData, Question } from '@/types';
import type { SubtypeEntry } from '../../index';

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

function baseQuestion(
  id: string,
  difficulty: number,
  subtype: NonNullable<MultiStepData['subtype']>,
  type: Question['type'],
  prompt: string,
  expression: string,
  solution: Question['solution'],
  options?: string[],
): Question {
  return {
    id,
    topicId: 'multi-step',
    type,
    difficulty,
    prompt,
    data: {
      kind: 'multi-step',
      expression,
      steps: [],
      options,
      subtype,
      knowledgePoint: 'bracket-transform',
    },
    solution,
    hints: ['添括号或去括号前，先看括号前面的符号。'],
  };
}

function generateBracketRemovePlus(difficulty: number, id: string): Question {
  const a = randInt(20, 90);
  const b = randInt(10, 60);
  const c = randInt(5, b - 1);
  const expression = `${a} + (${b} - ${c})`;
  const answer = `${a} + ${b} - ${c}`;
  return baseQuestion(
    id,
    difficulty,
    'bracket-remove-plus',
    'expression-input',
    `直接去掉括号，写出等价的式子（不要算出结果）：\n${expression} = ?`,
    expression,
    {
      answer,
      standardExpression: answer,
      bracketPolicy: 'must-not-have',
      explanation: '括号前是加号，去括号后括号里的符号不变。',
    },
  );
}

function generateBracketRemoveMinus(difficulty: number, id: string): Question {
  const a = randInt(200, 900);
  const b = randInt(20, 90);
  const c = randInt(5, b - 1);
  const expression = `${a} - (${b} - ${c})`;
  const answer = `${a} - ${b} + ${c}`;
  return baseQuestion(
    id,
    difficulty,
    'bracket-remove-minus',
    'expression-input',
    `直接去掉括号，写出等价的式子（不要算出结果）：\n${expression} = ?`,
    expression,
    {
      answer,
      standardExpression: answer,
      bracketPolicy: 'must-not-have',
      explanation: '括号前是减号，去括号后括号里的加减号都要反过来。',
    },
  );
}

function generateBracketAdd(difficulty: number, id: string): Question {
  const a = randInt(200, 900);
  const b = randInt(20, 90);
  const c = randInt(10, 80);
  const expression = `${a} - ${b} - ${c}`;
  const answer = `${a} - (${b} + ${c})`;
  return baseQuestion(
    id,
    difficulty,
    'bracket-add',
    'expression-input',
    `给 ${expression} 添上括号，写出等价的式子（不要算出结果）：`,
    expression,
    {
      answer,
      standardExpression: answer,
      bracketPolicy: 'must-have',
      explanation: '连续减去两个数，等于减去这两个数的和。',
    },
  );
}

function generateBracketDivisionProperty(difficulty: number, id: string): Question {
  const a = 3600;
  const expression = `${a} ÷ 25 ÷ 4`;
  const answer = `${a} ÷ (25 × 4)`;
  return baseQuestion(
    id,
    difficulty,
    'bracket-division-property',
    'multiple-choice',
    `运用除法性质，${expression} 可以变成哪一个？`,
    expression,
    {
      answer,
      explanation: '连续除以两个数，等于除以这两个数的积。',
    },
    shuffle([answer, `${a} ÷ (25 + 4)`, `${a} × (25 × 4)`, `${a} ÷ 25 × 4`]),
  );
}

function generateBracketFourItemsSign(difficulty: number, id: string): Question {
  const a = randInt(500, 1200);
  const b = randInt(40, 90);
  const c = randInt(20, 80);
  const d = randInt(5, 40);
  const e = randInt(5, 40);
  const expression = `${a} - (${b} + ${c} - ${d} + ${e})`;
  const answer = `${a} - ${b} - ${c} + ${d} - ${e}`;
  return baseQuestion(
    id,
    difficulty,
    'bracket-four-items-sign',
    'expression-input',
    `直接去掉括号，写出等价的式子（不要算出结果）：\n${expression} = ?`,
    expression,
    {
      answer,
      standardExpression: answer,
      bracketPolicy: 'must-not-have',
      explanation: '减号后括号里的四项都要逐项变号。',
    },
  );
}

function generateBracketErrorDiagnose(difficulty: number, id: string): Question {
  const expression = '480 - (125 - 25)';
  const wrong = '480 - 125 - 25';
  const answer = '错：-25 应该变成 +25';
  return baseQuestion(
    id,
    difficulty,
    'bracket-error-diagnose',
    'multiple-choice',
    `某同学把 ${expression} 写成 ${wrong}。这一步怎样判断？`,
    expression,
    {
      answer,
      explanation: '括号前是减号，括号内的 -25 去括号后要变成 +25。',
    },
    shuffle([answer, '正确，没有问题', '错：480 应该变号', '错：125 应该变成 +125']),
  );
}

export function buildBracketKnowledgeEntries(difficulty: number, id: string): SubtypeEntry[] {
  const isIntro = difficulty <= 3;
  return [
    { tag: 'bracket-remove-plus', weight: isIntro ? 70 : 12, gen: () => generateBracketRemovePlus(difficulty, id) },
    { tag: 'bracket-remove-minus', weight: isIntro ? 15 : 26, gen: () => generateBracketRemoveMinus(difficulty, id) },
    { tag: 'bracket-add', weight: isIntro ? 15 : 20, gen: () => generateBracketAdd(difficulty, id) },
    { tag: 'bracket-division-property', weight: isIntro ? 0 : 16, gen: () => generateBracketDivisionProperty(difficulty, id) },
    { tag: 'bracket-four-items-sign', weight: isIntro ? 0 : 14, gen: () => generateBracketFourItemsSign(difficulty, id) },
    { tag: 'bracket-error-diagnose', weight: isIntro ? 0 : 12, gen: () => generateBracketErrorDiagnose(difficulty, id) },
  ];
}
