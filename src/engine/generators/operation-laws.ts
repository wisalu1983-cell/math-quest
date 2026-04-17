/**
 * A04 运算律 generator (v2.2)
 *
 * 两档定位（对齐进阶规格 TOPIC_STAR_CAP = 3，即 2 梯度）：
 *   档 1（d≤5）律的认识：identify-law / structure-blank / reverse-blank / simple-judge
 *   档 2（d≥6）律的深化：counter-example / easy-confuse / compound-law /
 *                         distributive-trap / concept-reverse / error-diagnose
 *
 * 核心变更（v2.1 → v2.2）：
 *   - 从 3 档压缩到 2 档（对齐 Specs/2026-04-15-gamification-phase2-advance-spec.md §3.1）
 *   - "拆分凑整"相关（split-path-*, cannot-simplify, choose-law, multi-select-simplify,
 *     reverse-coefficient）下沉 A07，因为那是"策略应用"而非"认识律"
 *   - A04 本主题聚焦"认识律"层面：辨识 / 结构 / 反例 / 易混 / 陷阱
 */

import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';

// ==================== Subtype 声明 ====================

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) {
    return [
      { tag: 'identify-law', weight: 40 },
      { tag: 'structure-blank', weight: 25 },
      { tag: 'reverse-blank', weight: 25 },
      { tag: 'simple-judge', weight: 10 },
    ];
  }
  return [
    { tag: 'counter-example', weight: 25 },
    { tag: 'easy-confuse', weight: 15 },
    { tag: 'compound-law', weight: 15 },
    { tag: 'distributive-trap', weight: 20 },
    { tag: 'concept-reverse', weight: 15 },
    { tag: 'error-diagnose', weight: 10 },
  ];
}

// ==================== 工具 ====================

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

function choice<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

const LAW_NAME = {
  commutative: '交换律',
  associative: '结合律',
  distributive: '分配律',
} as const;

// ==================== 档 1：律的认识 ====================

/**
 * identify-law：给出一个变形等式，问用了什么律（MC）
 */
function generateIdentifyLaw(difficulty: number, id: string): Question {
  const laws = ['commutative', 'associative', 'distributive'] as const;
  const law = choice(laws);
  let original = '';
  let transformed = '';

  if (law === 'commutative') {
    const isAdd = Math.random() < 0.5;
    const op = isAdd ? '+' : '×';
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    original = `${a} ${op} ${b}`;
    transformed = `${b} ${op} ${a}`;
  } else if (law === 'associative') {
    const isAdd = Math.random() < 0.5;
    const op = isAdd ? '+' : '×';
    const a = randInt(10, 50);
    const b = randInt(10, 50);
    const c = randInt(10, 50);
    original = `(${a} ${op} ${b}) ${op} ${c}`;
    transformed = `${a} ${op} (${b} ${op} ${c})`;
  } else {
    const a = randInt(2, 9);
    const b = randInt(10, 50);
    const c = randInt(10, 50);
    const forward = Math.random() < 0.5;
    if (forward) {
      original = `${a} × (${b} + ${c})`;
      transformed = `${a} × ${b} + ${a} × ${c}`;
    } else {
      original = `${a} × ${b} + ${a} × ${c}`;
      transformed = `${a} × (${b} + ${c})`;
    }
  }

  const options = shuffle(Object.values(LAW_NAME));

  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: `${original} = ${transformed}，运用了什么运算律？`,
    data: {
      kind: 'operation-laws',
      law,
      originalExpression: original,
      transformedExpression: transformed,
      options,
    },
    solution: {
      answer: LAW_NAME[law],
      explanation: `这个变形把 "${original}" 改写为 "${transformed}"，用的是${LAW_NAME[law]}。`,
    },
    hints: [
      '交换律：调换位置；结合律：调整括号位置；分配律：把 a×(b+c) 拆成 a×b+a×c',
    ],
  };
}

/**
 * structure-blank：公式骨架填空，掌握律的结构（multi-blank）
 * 示例：a × (b + c) = ___ × b + a × ___    答案 [a, c]
 *       (a + b) + c = a + (___ + ___)      答案 [b, c]
 */
function generateStructureBlank(difficulty: number, id: string): Question {
  const templates = [
    // 分配律骨架
    {
      law: 'distributive' as const,
      make: () => {
        const a = randInt(3, 12);
        const b = randInt(5, 30);
        const c = randInt(5, 30);
        return {
          prompt: `${a} × (${b} + ${c}) = ___ × ${b} + ${a} × ___`,
          blanks: [a, c],
          explain: `分配律：${a} 要分别乘以括号内的 ${b} 和 ${c}。`,
        };
      },
    },
    {
      law: 'distributive' as const,
      make: () => {
        const a = randInt(3, 12);
        const b = randInt(5, 30);
        const c = randInt(5, 30);
        return {
          prompt: `(${b} + ${c}) × ${a} = ${b} × ___ + ___ × ${a}`,
          blanks: [a, c],
          explain: `分配律（反向写法）：${a} 分别乘以 ${b} 和 ${c}。`,
        };
      },
    },
    // 结合律（加法）骨架
    {
      law: 'associative' as const,
      make: () => {
        const a = randInt(10, 50);
        const b = randInt(10, 50);
        const c = randInt(10, 50);
        return {
          prompt: `(${a} + ${b}) + ${c} = ${a} + (___ + ___)`,
          blanks: [b, c],
          explain: `结合律：改变加法的括号位置，参与运算的数不变。`,
        };
      },
    },
    // 结合律（乘法）骨架
    {
      law: 'associative' as const,
      make: () => {
        const a = randInt(2, 25);
        const b = randInt(2, 25);
        const c = randInt(2, 25);
        return {
          prompt: `${a} × (${b} × ${c}) = (___ × ___) × ${c}`,
          blanks: [a, b],
          explain: `结合律：乘法的括号可以调整位置。`,
        };
      },
    },
  ];

  const t = choice(templates);
  const { prompt, blanks, explain } = t.make();

  return {
    id,
    topicId: 'operation-laws',
    type: 'multi-blank',
    difficulty,
    prompt,
    data: {
      kind: 'operation-laws',
      law: t.law,
      originalExpression: prompt,
      transformedExpression: '',
    },
    solution: {
      answer: blanks.join('|'),
      blanks,
      explanation: explain,
    },
    hints: ['按照律的公式骨架对照每个位置填上相应的数字'],
  };
}

/**
 * reverse-blank：反用律填空，识别律的应用方向（multi-blank）
 * 示例：36×5 + 36×7 = 36 × (___ + ___)          答案 [5, 7]
 *       (25+15) × 4 = 25 × ___ + 15 × ___         答案 [4, 4]
 */
function generateReverseBlank(difficulty: number, id: string): Question {
  const templates = [
    {
      law: 'distributive' as const,
      make: () => {
        const a = randInt(3, 30);
        const b = randInt(2, 20);
        const c = randInt(2, 20);
        return {
          prompt: `${a} × ${b} + ${a} × ${c} = ${a} × (___ + ___)`,
          blanks: [b, c],
          explain: `提出公因数 ${a}，括号内是 ${b} 和 ${c}。`,
        };
      },
    },
    {
      law: 'distributive' as const,
      make: () => {
        const a = randInt(3, 30);
        const b = randInt(5, 20);
        const c = randInt(2, 4);
        return {
          prompt: `${a} × ${b} − ${a} × ${c} = ${a} × (___ − ___)`,
          blanks: [b, c],
          explain: `提出公因数 ${a}，括号内是 ${b} − ${c}。`,
        };
      },
    },
    {
      law: 'distributive' as const,
      make: () => {
        const a = randInt(2, 8);
        const b = randInt(10, 50);
        const c = randInt(10, 50);
        return {
          prompt: `(${b} + ${c}) × ${a} = ${b} × ___ + ${c} × ___`,
          blanks: [a, a],
          explain: `分配律：${a} 分别乘 ${b} 和 ${c}，两个空都填 ${a}。`,
        };
      },
    },
    {
      law: 'commutative' as const,
      make: () => {
        const a = randInt(10, 99);
        const b = randInt(10, 99);
        return {
          prompt: `${a} + ${b} = ___ + ___`,
          blanks: [b, a],
          explain: `加法交换律：交换两个加数的位置。`,
        };
      },
    },
  ];

  const t = choice(templates);
  const { prompt, blanks, explain } = t.make();

  return {
    id,
    topicId: 'operation-laws',
    type: 'multi-blank',
    difficulty,
    prompt,
    data: {
      kind: 'operation-laws',
      law: t.law,
      originalExpression: prompt,
      transformedExpression: '',
    },
    solution: {
      answer: blanks.join('|'),
      blanks,
      explanation: explain,
    },
    hints: ['观察等号两边的变形方向，识别用了哪条律'],
  };
}

/**
 * simple-judge：三大律基本适用性判断（MC）
 * 示例："加法满足交换律吗？" / "减法满足结合律吗？"
 */
function generateSimpleJudge(difficulty: number, id: string): Question {
  const cases = [
    { prompt: '加法满足交换律吗？', answer: '满足' },
    { prompt: '乘法满足交换律吗？', answer: '满足' },
    { prompt: '减法满足交换律吗？', answer: '不满足' },
    { prompt: '除法满足交换律吗？', answer: '不满足' },
    { prompt: '加法满足结合律吗？', answer: '满足' },
    { prompt: '乘法满足结合律吗？', answer: '满足' },
    { prompt: '减法满足结合律吗？', answer: '不满足' },
    { prompt: '除法满足结合律吗？', answer: '不满足' },
  ];
  const c = choice(cases);
  const options = shuffle(['满足', '不满足']);

  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: c.prompt,
    data: {
      kind: 'operation-laws',
      law: 'commutative',
      originalExpression: c.prompt,
      transformedExpression: '',
      options,
    },
    solution: {
      answer: c.answer,
      explanation:
        c.answer === '满足'
          ? '加法和乘法既满足交换律也满足结合律。'
          : '减法和除法都不满足交换律和结合律（可以举反例：5−3≠3−5）。',
    },
    hints: ['可以举具体例子验证：5−3 和 3−5 相等吗？'],
  };
}

// ==================== 档 2：律的深化 ====================

/**
 * counter-example：反例识别（MC / 多选）——"以下哪些不满足交换律？"
 */
function generateCounterExample(difficulty: number, id: string): Question {
  const lawPool = [
    {
      law: '交换律',
      notSatisfy: ['减法', '除法'],
      satisfy: ['加法', '乘法'],
    },
    {
      law: '结合律',
      notSatisfy: ['减法', '除法'],
      satisfy: ['加法', '乘法'],
    },
  ];
  const p = choice(lawPool);

  // 多选变体：选出所有"不满足"项
  const multiSelect = Math.random() < 0.5;

  if (multiSelect) {
    const options = shuffle([...p.satisfy, ...p.notSatisfy]);
    const correctLetters = options
      .map((o, i) => (p.notSatisfy.includes(o) ? String.fromCharCode(65 + i) : null))
      .filter((x): x is string => x !== null);
    return {
      id,
      topicId: 'operation-laws',
      type: 'multi-select',
      difficulty,
      prompt: `以下哪些运算不满足${p.law}？（可多选）`,
      data: {
        kind: 'operation-laws',
        law: 'commutative',
        originalExpression: '',
        transformedExpression: '',
        options,
      },
      solution: {
        answer: correctLetters.join(','),
        answers: correctLetters,
        explanation: `${p.notSatisfy.join('和')}不满足${p.law}（反例：5−3≠3−5，12÷4≠4÷12）。`,
      },
      hints: ['举反例是最快的判断方法'],
    };
  }

  // 单选变体：四选一
  const wrong = choice(p.notSatisfy);
  const options = shuffle([wrong, ...p.satisfy]);
  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: `以下哪种运算不满足${p.law}？`,
    data: {
      kind: 'operation-laws',
      law: 'commutative',
      originalExpression: '',
      transformedExpression: '',
      options,
    },
    solution: {
      answer: wrong,
      explanation: `${wrong}不满足${p.law}（反例：5−3≠3−5）。`,
    },
    hints: ['加法乘法性质较好，减法除法经常"不满足"'],
  };
}

/**
 * easy-confuse：易混辨析——区分律的精确陈述
 */
function generateEasyConfuse(difficulty: number, id: string): Question {
  const cases = [
    {
      prompt: '以下哪个等式体现的是加法结合律？',
      options: [
        '(a + b) + c = a + (b + c)',
        '(a + b) + c = (a + c) + b',
        'a + b = b + a',
        'a + (b − c) = a + b − c',
      ],
      answer: '(a + b) + c = a + (b + c)',
      explanation: '结合律只改变括号位置，不改变加数顺序。第二项既换位又换括号，是结合律+交换律的复合。',
    },
    {
      prompt: '以下哪个等式体现的是乘法分配律？',
      options: [
        'a × (b + c) = a × b + a × c',
        'a × (b × c) = (a × b) × c',
        'a × b = b × a',
        'a × b + c = a × (b + c)',
      ],
      answer: 'a × (b + c) = a × b + a × c',
      explanation: '第二项是结合律；第三项是交换律；第四项不是恒等式（a×b+c≠a×(b+c)）。',
    },
    {
      prompt: '下列等式中，哪个用的是分配律（不含其他律）？',
      options: [
        '25 × (4 + 8) = 25 × 4 + 25 × 8',
        '25 × 4 × 8 = 25 × 8 × 4',
        '25 + 4 + 8 = 4 + 25 + 8',
        '(25 + 4) × 8 = 25 × 8 + 4',
      ],
      answer: '25 × (4 + 8) = 25 × 4 + 25 × 8',
      explanation: '第二项是交换律；第三项是交换律；第四项错误（应为 25×8+4×8）。',
    },
  ];
  const c = choice(cases);
  const options = shuffle(c.options);

  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: c.prompt,
    data: {
      kind: 'operation-laws',
      law: 'associative',
      originalExpression: '',
      transformedExpression: '',
      options,
    },
    solution: {
      answer: c.answer,
      explanation: c.explanation,
    },
    hints: ['注意律的精确陈述：结合律只改括号，不换加数顺序'],
  };
}

/**
 * compound-law：复合律辨识——一个变形用了哪些律
 */
function generateCompoundLaw(difficulty: number, id: string): Question {
  const cases = [
    {
      prompt: '125 × 7 × 8 = 125 × 8 × 7 用了哪条律？',
      answer: '乘法交换律',
      options: ['乘法交换律', '乘法结合律', '乘法分配律', '交换律和结合律'],
      explanation: '这里只调换了 7 和 8 的位置，用的是交换律。',
    },
    {
      prompt: '125 × 7 × 8 = 125 × (7 × 8) 用了哪条律？',
      answer: '乘法结合律',
      options: ['乘法交换律', '乘法结合律', '乘法分配律', '交换律和结合律'],
      explanation: '这里只改变了括号，没有换位置，用的是结合律。',
    },
    {
      prompt: '17 + 83 + 42 = 42 + (17 + 83) 用了哪些律？',
      answer: '加法交换律和结合律',
      options: ['加法交换律', '加法结合律', '加法交换律和结合律', '加法分配律'],
      explanation: '42 跨到前面用了交换律，加括号把 17+83 结合起来用了结合律。',
    },
    {
      prompt: '25 × 4 × 13 = (25 × 4) × 13 用了哪条律？',
      answer: '乘法结合律',
      options: ['乘法交换律', '乘法结合律', '乘法分配律', '交换律和结合律'],
      explanation: '只是给前两个乘数加了括号，用的是结合律。',
    },
    {
      prompt: '56 × 25 × 4 = 56 × (25 × 4) 用了哪条律？',
      answer: '乘法结合律',
      options: ['乘法交换律', '乘法结合律', '乘法分配律', '交换律和结合律'],
      explanation: '只改变括号，用的是结合律。',
    },
  ];
  const c = choice(cases);
  const options = shuffle(c.options);

  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: c.prompt,
    data: {
      kind: 'operation-laws',
      law: 'associative',
      originalExpression: c.prompt,
      transformedExpression: '',
      options,
    },
    solution: {
      answer: c.answer,
      explanation: c.explanation,
    },
    hints: ['观察变形：换位置 → 交换律；换括号 → 结合律；两者都换 → 都用'],
  };
}

/**
 * distributive-trap：分配律最常见错误陷阱（MC）
 * 如 8 × (25 − 1) = 8 × 25 − 1 对吗？
 */
function generateDistributiveTrap(difficulty: number, id: string): Question {
  const cases = [
    {
      setup: '下面的变形对吗：8 × (25 − 1) = 8 × 25 − 1',
      options: ['对', '错，应为 8×25 − 8×1', '错，应为 8×25 − 1×8'],
      answer: '错，应为 8×25 − 8×1',
      explanation: '分配律要求 8 同时乘以括号内的每一项，包括 −1。正确是 8×25 − 8×1 = 200 − 8 = 192。',
    },
    {
      setup: '下面的变形对吗：(40 + 2) × 25 = 40 × 25 + 2',
      options: ['对', '错，应为 40×25 + 2×25', '错，应为 40 + 2×25'],
      answer: '错，应为 40×25 + 2×25',
      explanation: '分配律要求括号外的 25 分别乘以 40 和 2。正确是 40×25 + 2×25 = 1000 + 50 = 1050。',
    },
    {
      setup: '下面的变形对吗：99 × 45 + 45 = 99 × 45 + 1',
      options: ['对', '错，应为 (99+1)×45 = 100×45', '错，应为 99×45 + 45×45'],
      answer: '错，应为 (99+1)×45 = 100×45',
      explanation: '单独的 45 可以看成 1×45（用×1 的隐含），然后提取公因数得到 (99+1)×45。',
    },
    {
      setup: '下面的变形对吗：36 × 101 = 36 × 100 + 1',
      options: ['对', '错，应为 36×100 + 36×1', '错，应为 36×101 = 36×1 + 36×100 + 36'],
      answer: '错，应为 36×100 + 36×1',
      explanation: '把 101 拆成 100+1 之后，36 要同时乘 100 和 1。正确是 36×100 + 36×1 = 3636。',
    },
    {
      setup: '下面的变形对吗：25 × (40 − 4) = 25 × 40 − 25 × 4',
      options: ['对', '错，减号要变加号', '错，应为 25×40 − 4'],
      answer: '对',
      explanation: '分配律对减法同样适用：25 分别乘以 40 和 4，减号保留。正确。',
    },
  ];

  const c = choice(cases);
  const options = shuffle(c.options);

  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: c.setup,
    data: {
      kind: 'operation-laws',
      law: 'distributive',
      originalExpression: c.setup,
      transformedExpression: '',
      options,
    },
    solution: {
      answer: c.answer,
      explanation: c.explanation,
    },
    hints: ['分配律的核心：括号外的因数必须同时乘以括号内的每一项'],
  };
}

/**
 * concept-reverse：概念反例——律的限定条件
 */
function generateConceptReverse(difficulty: number, id: string): Question {
  const cases = [
    {
      prompt: '下面这个式子对吗：a ÷ (b + c) = a ÷ b + a ÷ c（用 a=12, b=2, c=4 验证）',
      options: [
        '对，分配律对除法也成立',
        '错，左边 = 12÷6 = 2，右边 = 6 + 3 = 9，不相等',
        '错，右边应该是 a÷(b×c)',
      ],
      answer: '错，左边 = 12÷6 = 2，右边 = 6 + 3 = 9，不相等',
      explanation: '除法不满足对加法的分配律。这是分配律的限定条件——仅对乘法分配于加/减法成立。',
    },
    {
      prompt: '下面这个式子对吗：(a + b) ÷ c = a ÷ c + b ÷ c（用 a=4, b=6, c=2 验证）',
      options: [
        '对，等号两边都等于 5',
        '错，除法不满足分配律',
        '只有整除时才对',
      ],
      answer: '对，等号两边都等于 5',
      explanation: '(a+b)÷c 是把除数放在右边，等价于 (a+b)×(1/c)，因此对加法分配成立。左边 10÷2=5，右边 2+3=5。',
    },
    {
      prompt: '下列关于减法交换律的说法，哪个是对的？',
      options: [
        '减法满足交换律',
        '减法不满足交换律，因为 5−3 ≠ 3−5',
        '只有被减数大于减数时才不满足',
      ],
      answer: '减法不满足交换律，因为 5−3 ≠ 3−5',
      explanation: '5−3=2 但 3−5=−2，二者不等，所以减法不满足交换律。',
    },
    {
      prompt: '下列说法中，哪个正确描述了分配律的适用范围？',
      options: [
        '分配律只对加法和乘法之间成立，对减法不成立',
        '分配律对乘法与加、减法都成立，但对除法与加、减法不成立',
        '所有四则运算之间都满足分配律',
      ],
      answer: '分配律对乘法与加、减法都成立，但对除法与加、减法不成立',
      explanation: 'a×(b+c)=a×b+a×c 对减法同理；但 a÷(b+c)≠a÷b+a÷c。',
    },
  ];
  const c = choice(cases);
  const options = shuffle(c.options);

  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: c.prompt,
    data: {
      kind: 'operation-laws',
      law: 'distributive',
      originalExpression: '',
      transformedExpression: '',
      options,
    },
    solution: {
      answer: c.answer,
      explanation: c.explanation,
    },
    hints: ['用具体数字代入验证是识别"伪律"的利器'],
  };
}

/**
 * error-diagnose：错误诊断（MC）——单步律使用的对错判断
 *
 * v2.2 说明：本函数保留但范围聚焦"律使用正误"，而非多步计算结果。
 * 多步算式的"哪步错了"下沉 A07（简便计算）。
 */
function generateErrorDiagnose(difficulty: number, id: string): Question {
  const cases = [
    {
      setup: '小明把 56 × (100 + 1) 展开为 56 × 100 + 1。他错在哪里？',
      options: [
        '错在只乘了 100 没乘 1',
        '错在拆分 101',
        '错在括号',
      ],
      answer: '错在只乘了 100 没乘 1',
      explanation: '分配律要求 56 分别乘以 100 和 1。正确展开是 56×100 + 56×1。',
    },
    {
      setup: '小华写 (40 + 2) × 25 = 40 × 25 + 2 × 25。他用的是什么律？对吗？',
      options: [
        '分配律，正确',
        '分配律，错误',
        '结合律，错误',
      ],
      answer: '分配律，正确',
      explanation: '反向分配律：括号外的 25 分别乘以 40 和 2，正确应用。',
    },
    {
      setup: '小亮把 125 × 32 × 25 改写成 (125 × 8) + (4 × 25)。他犯了什么错？',
      options: [
        '把结合律写成了分配律（中间应该用 ×）',
        '拆分 32 错了',
        '没错',
      ],
      answer: '把结合律写成了分配律（中间应该用 ×）',
      explanation: '调整乘法顺序应该用结合律（整体仍然是乘法），正确是 (125×8)×(4×25)。',
    },
    {
      setup: '小雨说：78 + 25 + 22 = 25 + (78 + 22)。这个变形对吗？',
      options: [
        '对，用的是加法交换律和结合律',
        '错，加法不能这样变',
        '只对两项的加法对',
      ],
      answer: '对，用的是加法交换律和结合律',
      explanation: '先把 25 挪到前面（交换律），再把 78 和 22 用括号结合（结合律）。',
    },
  ];
  const c = choice(cases);

  return {
    id,
    topicId: 'operation-laws',
    type: 'multiple-choice',
    difficulty,
    prompt: c.setup,
    data: {
      kind: 'operation-laws',
      law: 'distributive',
      originalExpression: '',
      transformedExpression: '',
      options: c.options,
    },
    solution: {
      answer: c.answer,
      explanation: c.explanation,
    },
    hints: ['逐条对照律的公式骨架，检查每一项是否到位'],
  };
}

// ==================== 入口 ====================

export function generateOperationLaws(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] =
    difficulty <= 5
      ? [
          { tag: 'identify-law', weight: 40, gen: () => generateIdentifyLaw(difficulty, id) },
          { tag: 'structure-blank', weight: 25, gen: () => generateStructureBlank(difficulty, id) },
          { tag: 'reverse-blank', weight: 25, gen: () => generateReverseBlank(difficulty, id) },
          { tag: 'simple-judge', weight: 10, gen: () => generateSimpleJudge(difficulty, id) },
        ]
      : [
          { tag: 'counter-example', weight: 25, gen: () => generateCounterExample(difficulty, id) },
          { tag: 'easy-confuse', weight: 15, gen: () => generateEasyConfuse(difficulty, id) },
          { tag: 'compound-law', weight: 15, gen: () => generateCompoundLaw(difficulty, id) },
          { tag: 'distributive-trap', weight: 20, gen: () => generateDistributiveTrap(difficulty, id) },
          { tag: 'concept-reverse', weight: 15, gen: () => generateConceptReverse(difficulty, id) },
          { tag: 'error-diagnose', weight: 10, gen: () => generateErrorDiagnose(difficulty, id) },
        ];

  return pickSubtype(entries, subtypeFilter);
}
