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
  template?: string,
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
      knowledgePoint: 'operation-laws',
      template,
    },
    solution,
    hints: ['先判断式子结构，再对应交换律、结合律或分配律。'],
  };
}

function generateLawIdentify(difficulty: number, id: string): Question {
  const cases = [
    {
      expression: '36 + 64 = 64 + 36',
      answer: '交换律',
      explanation: '两个加数交换位置，和不变，这是交换律。',
    },
    {
      expression: '(25 × 4) × 8 = 25 × (4 × 8)',
      answer: '结合律',
      explanation: '乘法里只改变括号位置，这是结合律。',
    },
    {
      expression: '7 × (30 + 4) = 7 × 30 + 7 × 4',
      answer: '分配律',
      explanation: '括号外的 7 分别乘括号里的两项，这是分配律。',
    },
  ];
  const c = cases[randInt(0, cases.length - 1)];
  const options = shuffle(['交换律', '结合律', '分配律', '减法性质']);
  return baseQuestion(
    id,
    difficulty,
    'law-identify',
    'multiple-choice',
    `${c.expression}，运用了什么运算律？`,
    c.expression,
    { answer: c.answer, explanation: c.explanation },
    options,
  );
}

function generateLawSimpleJudge(difficulty: number, id: string): Question {
  const cases = [
    {
      prompt: '减法满足交换律吗？例如 9 - 4 和 4 - 9。',
      answer: '不满足，两个结果不相等',
      explanation: '9 - 4 = 5，而 4 - 9 = -5，结果不同。',
    },
    {
      prompt: '乘法满足结合律吗？例如 (2 × 5) × 4 和 2 × (5 × 4)。',
      answer: '满足，只改变括号位置',
      explanation: '两边都等于 40，乘法满足结合律。',
    },
    {
      prompt: '除法满足结合律吗？例如 (24 ÷ 6) ÷ 2 和 24 ÷ (6 ÷ 2)。',
      answer: '不满足，两个结果不相等',
      explanation: '(24 ÷ 6) ÷ 2 = 2，而 24 ÷ (6 ÷ 2) = 8。',
    },
  ];
  const c = cases[randInt(0, cases.length - 1)];
  const options = shuffle([c.answer, '满足，因为数字一样', '不满足，因为不能有括号', '无法判断']);
  return baseQuestion(
    id,
    difficulty,
    'law-simple-judge',
    'multiple-choice',
    c.prompt,
    c.prompt,
    { answer: c.answer, explanation: c.explanation },
    options,
  );
}

function generateLawStructureBlank(difficulty: number, id: string): Question {
  const a = randInt(3, 9);
  const b = randInt(10, 40);
  const c = randInt(10, 40);
  const template = `${a} × (${b} + ${c}) = ___ × ${b} + ${a} × ___`;
  return baseQuestion(
    id,
    difficulty,
    'law-structure-blank',
    'multi-blank',
    `按分配律补全等式：\n${template}`,
    `${a} × (${b} + ${c})`,
    {
      answer: `${a}|${c}`,
      blanks: [a, c],
      explanation: `分配律要求 ${a} 分别乘 ${b} 和 ${c}。`,
    },
    undefined,
    template,
  );
}

function generateLawReverseBlank(difficulty: number, id: string): Question {
  const a = randInt(12, 60);
  const b = randInt(2, 12);
  const c = randInt(2, 12);
  const template = `${a} × ${b} + ${a} × ${c} = ${a} × (___ + ___)`;
  return baseQuestion(
    id,
    difficulty,
    'law-reverse-blank',
    'multi-blank',
    `反用分配律补全等式：\n${template}`,
    `${a} × ${b} + ${a} × ${c}`,
    {
      answer: `${b}|${c}`,
      blanks: [b, c],
      explanation: `两项都有公因数 ${a}，括号里保留 ${b} 和 ${c}。`,
    },
    undefined,
    template,
  );
}

function generateLawCounterExample(difficulty: number, id: string): Question {
  const options = shuffle(['加法', '乘法', '减法', '除法']);
  return baseQuestion(
    id,
    difficulty,
    'law-counter-example',
    'multiple-choice',
    '下面哪种运算不满足交换律？',
    '5 - 3 ≠ 3 - 5',
    {
      answer: '减法',
      explanation: '减法交换前后结果不同，例如 5 - 3 = 2，3 - 5 = -2。',
    },
    options,
  );
}

function generateLawConceptReverse(difficulty: number, id: string): Question {
  const expression = '48 × 17 + 48 × 83';
  const answer = '48 × (17 + 83)';
  return baseQuestion(
    id,
    difficulty,
    'law-concept-reverse',
    'multiple-choice',
    `把 ${expression} 反用分配律，应该写成哪一个？`,
    expression,
    {
      answer,
      explanation: '两项都有 48，提出来后括号里写 17 + 83。',
    },
    shuffle([answer, '(48 + 17) × 83', '48 × (17 × 83)', '(48 + 48) × (17 + 83)']),
  );
}

function generateLawEasyConfuse(difficulty: number, id: string): Question {
  const answer = 'a × (b + c) = a × b + a × c';
  return baseQuestion(
    id,
    difficulty,
    'law-easy-confuse',
    'multiple-choice',
    '以下哪个等式准确表达了乘法分配律？',
    answer,
    {
      answer,
      explanation: '分配律中，括号外的 a 要分别乘 b 和 c。',
    },
    shuffle([answer, 'a × (b + c) = a × b + c', 'a × b = b × a', '(a × b) × c = a × (b × c)']),
  );
}

function generateLawCompoundLaw(difficulty: number, id: string): Question {
  const expression = '25 × 37 × 4';
  const answer = '(25 × 4) × 37';
  return baseQuestion(
    id,
    difficulty,
    'law-compound-law',
    'multiple-choice',
    `为了先算 25 × 4，${expression} 可以先变成哪一个？`,
    expression,
    {
      answer,
      explanation: '先用交换律把 4 调到 25 后面，再用结合律加括号。',
    },
    shuffle([answer, '25 × (37 + 4)', '(25 + 4) × 37', '25 × 37 + 4']),
  );
}

function generateLawDistributiveTrap(difficulty: number, id: string): Question {
  const answer = '56 × 100 + 56 × 1';
  return baseQuestion(
    id,
    difficulty,
    'law-distributive-trap',
    'multiple-choice',
    '56 × (100 + 1) 正确展开是哪一个？',
    '56 × (100 + 1)',
    {
      answer,
      explanation: '括号外的 56 必须分别乘 100 和 1，不能漏乘第二项。',
    },
    shuffle([answer, '56 × 100 + 1', '56 + 100 × 1', '(56 + 100) × (56 + 1)']),
  );
}

function generateLawErrorDiagnose(difficulty: number, id: string): Question {
  const answer = '错在把 32 拆成 8 + 4，原式是乘法应继续相乘';
  const expression = '125 × 32 × 25 = (125 × 8) + (4 × 25)';
  return baseQuestion(
    id,
    difficulty,
    'law-error-diagnose',
    'multiple-choice',
    `某同学写：${expression}。错在哪里？`,
    expression,
    {
      answer,
      explanation: '32 = 8 × 4，原式应变为 (125 × 8) × (4 × 25)，中间仍是乘号。',
    },
    shuffle([answer, '错在 125 × 8 不能凑整', '错在 4 × 25 不能凑整', '没有错']),
  );
}

export function buildLawKnowledgeEntries(difficulty: number, id: string): SubtypeEntry[] {
  const isIntro = difficulty <= 3;
  return [
    { tag: 'law-identify', weight: isIntro ? 45 : 12, gen: () => generateLawIdentify(difficulty, id) },
    { tag: 'law-simple-judge', weight: isIntro ? 35 : 8, gen: () => generateLawSimpleJudge(difficulty, id) },
    { tag: 'law-structure-blank', weight: isIntro ? 20 : 18, gen: () => generateLawStructureBlank(difficulty, id) },
    { tag: 'law-reverse-blank', weight: isIntro ? 0 : 16, gen: () => generateLawReverseBlank(difficulty, id) },
    { tag: 'law-counter-example', weight: isIntro ? 0 : 10, gen: () => generateLawCounterExample(difficulty, id) },
    { tag: 'law-concept-reverse', weight: isIntro ? 0 : 10, gen: () => generateLawConceptReverse(difficulty, id) },
    { tag: 'law-easy-confuse', weight: isIntro ? 0 : 8, gen: () => generateLawEasyConfuse(difficulty, id) },
    { tag: 'law-compound-law', weight: isIntro ? 0 : 8, gen: () => generateLawCompoundLaw(difficulty, id) },
    { tag: 'law-distributive-trap', weight: isIntro ? 0 : 6, gen: () => generateLawDistributiveTrap(difficulty, id) },
    { tag: 'law-error-diagnose', weight: isIntro ? 0 : 4, gen: () => generateLawErrorDiagnose(difficulty, id) },
  ];
}
