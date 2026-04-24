import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';
import { formatNum } from './utils';

// v2.1 重构：
// - 低档：单层去括号（填写式子，bracketPolicy=must-not-have），括号位置三档多样化
// - 中档：添括号（填写式子，must-have）+ 减法vs除法性质辨析 MC
// - 高档：嵌套去括号/四项逐项变号（填写）+ 错误诊断 MC + 括号与分配律 MC
//
// 题干统一写"直接去掉括号，写出等价的式子（不要算出结果）"以避免学生算出数值提交。

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) {
    if (difficulty <= 3) {
      // 档1-低 (d=3): 只出 remove-bracket-plus
      return [
        { tag: 'remove-bracket-plus',  weight: 100 },
        { tag: 'remove-bracket-minus', weight: 0 },
      ];
    }
    // 档1-高 (d=4~5): 主出 remove-bracket-minus（减号去括号，核心陷阱）
    return [
      { tag: 'remove-bracket-plus',  weight: 30 },
      { tag: 'remove-bracket-minus', weight: 70 },
    ];
  }
  if (difficulty <= 7) return [
    { tag: 'add-bracket',          weight: 45 },
    { tag: 'division-property',    weight: 35 },
    { tag: 'remove-bracket-minus', weight: 20 },
  ];
  // v2.2：division-property 在高档降权为 0（一眼口算，无认知负担，移交中档）
  return [
    { tag: 'nested-bracket',       weight: 35 },
    { tag: 'four-items-sign',      weight: 35 },
    { tag: 'error-diagnose',       weight: 30 },
    { tag: 'division-property',    weight: 0 },
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

type Position = 'front' | 'middle' | 'tail';
function pickPosition(): Position {
  const r = Math.random();
  return r < 1 / 3 ? 'front' : r < 2 / 3 ? 'middle' : 'tail';
}

const REMOVE_PROMPT = '直接去掉括号，写出等价的式子（只变形，不要算出结果）';
const ADD_PROMPT_SUFFIX = '给它添上括号，写出等价的式子（只变形，不要算出结果）';

// ==================== 低档：单层去括号（填写式子） ====================

// 加号前括号：内部符号不变
function generateRemoveBracketPlus(difficulty: number, id: string): Question {
  const pos = pickPosition();
  const a = randInt(10, 99);
  const b = randInt(10, 99);
  const c = randInt(10, Math.max(11, b - 1)); // c<b 避免 b-c 产生负数
  const innerOp: '+' | '-' = Math.random() < 0.5 ? '+' : '-';

  let original: string;
  let standard: string;

  if (pos === 'tail') {
    // a + (b op c)  →  a + b op c
    original = `${a} + (${b} ${innerOp} ${c})`;
    standard = `${a} + ${b} ${innerOp} ${c}`;
  } else if (pos === 'front') {
    // (b op c) + a  →  b op c + a
    original = `(${b} ${innerOp} ${c}) + ${a}`;
    standard = `${b} ${innerOp} ${c} + ${a}`;
  } else {
    // a + (b op c) + d（middle）
    const d = randInt(10, 99);
    original = `${a} + (${b} ${innerOp} ${c}) + ${d}`;
    standard = `${a} + ${b} ${innerOp} ${c} + ${d}`;
  }

  return {
    id, topicId: 'bracket-ops', type: 'expression-input', difficulty,
    prompt: `${REMOVE_PROMPT}：\n${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: original, position: pos, bracketSide: 'plus' },
    solution: {
      answer: standard,
      standardExpression: standard,
      bracketPolicy: 'must-not-have',
      explanation: `括号前是加号，去括号后括号里的符号不变：${original} = ${standard}`,
    },
    hints: ['括号前是加号，去括号时里面的每个符号都保持不变'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// 减号前括号：内部符号全变
function generateRemoveBracketMinus(difficulty: number, id: string): Question {
  const pos = pickPosition();
  const a = randInt(100, 999);
  const b = randInt(20, 99);
  const c = randInt(10, Math.max(11, b - 1));
  const d = randInt(10, 80);

  let original: string;
  let standard: string;

  if (pos === 'tail') {
    // a - (b op c)  →  a - b ¬op c
    const innerOp: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
    const flipped = innerOp === '+' ? '-' : '+';
    original = `${a} - (${b} ${innerOp} ${c})`;
    standard = `${a} - ${b} ${flipped} ${c}`;
  } else if (pos === 'middle') {
    // a - (b op c) + d  →  a - b ¬op c + d
    const innerOp: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
    const flipped = innerOp === '+' ? '-' : '+';
    original = `${a} - (${b} ${innerOp} ${c}) + ${d}`;
    standard = `${a} - ${b} ${flipped} ${c} + ${d}`;
  } else {
    // front: a + b - (c + d)  →  a + b - c - d
    //   括号在"式尾前"偏前，但相对整体算前半段起首：让 a 小，括号在式中偏前
    // 为保证视觉"前"，改成： (x - y) + a - b 这种"式首+括号前是括号本身开头、后接减号"
    // 改用减号作为括号前符号，但括号位于开头段：a - (b + c) + d + e
    const e = randInt(10, 60);
    const innerOp: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
    const flipped = innerOp === '+' ? '-' : '+';
    original = `${a} - (${b} ${innerOp} ${c}) + ${d} + ${e}`;
    standard = `${a} - ${b} ${flipped} ${c} + ${d} + ${e}`;
  }

  return {
    id, topicId: 'bracket-ops', type: 'expression-input', difficulty,
    prompt: `${REMOVE_PROMPT}：\n${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: original, position: pos, bracketSide: 'minus' },
    solution: {
      answer: standard,
      standardExpression: standard,
      bracketPolicy: 'must-not-have',
      steps: ['减号后去括号时，括号里的每个加减符号都要变号'],
      explanation: `减号后面去括号，括号内的符号要全部变号：${original} = ${standard}`,
    },
    hints: ['括号前是减号——括号里的每个加减符号都要反过来！'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ==================== 中档：添括号（填写式子） ====================

function generateAddBracket(difficulty: number, id: string): Question {
  // 从"a - b ± c ± d"形式的扁平式生成一个添括号题，让学生把括号加进去
  const a = randInt(200, 2000);
  const b = randInt(20, 99);
  const c = randInt(10, 99);

  const variant = Math.random();
  let original: string;
  let standard: string;
  let hint: string;

  if (variant < 0.5) {
    // 连减合并：a - b - c  →  a - (b + c)
    original = `${a} - ${b} - ${c}`;
    standard = `${a} - (${b} + ${c})`;
    hint = '连续减去两个数，等于减去这两个数的和';
  } else {
    // 三项：a - b + c - d  →  a - (b - c + d) 或 a + (? ... ?)
    const d = randInt(5, 50);
    original = `${a} - ${b} + ${c} - ${d}`;
    // 把 -b+c-d 合并到一个减号后的括号里，内部符号全变
    standard = `${a} - (${b} - ${c} + ${d})`;
    hint = '减号后添括号——括号里每个加减符号都要变号';
  }

  return {
    id, topicId: 'bracket-ops', type: 'expression-input', difficulty,
    prompt: `把算式 ${original} 中从第一个减号起的后面几项整理到括号里——${ADD_PROMPT_SUFFIX}：\n${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'add-bracket', originalExpression: original },
    solution: {
      answer: standard,
      standardExpression: standard,
      bracketPolicy: 'must-have',
      explanation: `添括号时，括号前是减号——括号里每项的加减号都要变：${original} = ${standard}`,
    },
    hints: [hint],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ==================== 中/高档：减法 vs 除法性质辨析 MC ====================

function generateDivisionProperty(difficulty: number, id: string): Question {
  // 减法性质：a - b - c = a - (b + c)；a - (b - c) = a - b + c
  // 除法性质：a ÷ b ÷ c = a ÷ (b × c)；a ÷ (b × c) = a ÷ b ÷ c
  // 辨析点：学生容易把 - 写成 + 或 ÷ 写成 ×
  const pairs: [number, number][] = difficulty <= 7
    ? [[4, 25], [5, 20], [2, 50], [8, 125]]
    : [[4, 25], [5, 20], [8, 125], [2, 50]];
  const [b, c] = pairs[randInt(0, pairs.length - 1)];
  const multiplier = randInt(2, 12);
  const a = b * c * multiplier;

  const useDivision = Math.random() < 0.5;
  if (useDivision) {
    const isRemove = Math.random() < 0.5;
    const original = isRemove ? `${a} ÷ (${b} × ${c})` : `${a} ÷ ${b} ÷ ${c}`;
    const correct = isRemove ? `${a} ÷ ${b} ÷ ${c}` : `${a} ÷ (${b} × ${c})`;
    const wrong1 = isRemove ? `${a} ÷ ${b} × ${c}` : `${a} ÷ (${b} + ${c})`;
    const wrong2 = isRemove ? `${a} × ${b} ÷ ${c}` : `${a} ÷ (${b} ÷ ${c})`;
    const wrong3 = isRemove ? `${a} ÷ (${b} + ${c})` : `${a} × ${b} ÷ ${c}`;
    const action = isRemove ? '去括号' : '添括号';
    return {
      id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
      prompt: `运用除法性质${action}：${original} = ?`,
      data: { kind: 'bracket-ops', subtype: 'division-property', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
      solution: { answer: correct, explanation: '除法性质：a÷b÷c = a÷(b×c)；连除等于除以积，不能变成乘法' },
      hints: ['连续除以两个数，等于一次性除以这两个数的积'],
      xpBase: 12 + (difficulty - 1) * 5,
    };
  }

  // 减法性质 MC
  const isRemove = Math.random() < 0.5;
  const original = isRemove ? `${a} - (${b} + ${c})` : `${a} - ${b} - ${c}`;
  const correct = isRemove ? `${a} - ${b} - ${c}` : `${a} - (${b} + ${c})`;
  const wrong1 = isRemove ? `${a} - ${b} + ${c}` : `${a} - (${b} - ${c})`;
  const wrong2 = isRemove ? `${a} + ${b} - ${c}` : `${a} + (${b} + ${c})`;
  const wrong3 = isRemove ? `${a} + ${b} + ${c}` : `${a} - (${c} - ${b})`;
  const action = isRemove ? '去括号' : '添括号';
  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `运用减法性质${action}：${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'division-property', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, explanation: '减法性质：a-b-c = a-(b+c)；括号前减号，添/去括号时内部加减号要变' },
    hints: ['括号前是减号，括号里的加减号要全部反过来'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ==================== 高档：嵌套去括号（填写式子） ====================

function generateNestedBracket(difficulty: number, id: string): Question {
  // a - (b - (c + d))  →  a - b + c + d
  const a = randInt(200, 2000);
  const b = randInt(50, 200);
  const c = randInt(10, 80);
  const d = randInt(5, 40);

  const form = Math.random() < 0.5
    ? { orig: `${a} - (${b} - (${c} + ${d}))`, std: `${a} - ${b} + ${c} + ${d}` }
    : { orig: `${a} - (${b} + (${c} - ${d}))`, std: `${a} - ${b} - ${c} + ${d}` };

  return {
    id, topicId: 'bracket-ops', type: 'expression-input', difficulty,
    prompt: `${REMOVE_PROMPT}：\n${form.orig} = ?`,
    data: { kind: 'bracket-ops', subtype: 'nested-bracket', originalExpression: form.orig },
    solution: {
      answer: form.std,
      standardExpression: form.std,
      bracketPolicy: 'must-not-have',
      steps: ['先去内层括号（保持外层括号里符号）', '再去外层括号（减号后所有符号变号）'],
      explanation: `从内到外去括号，注意每层括号前的符号：${form.orig} = ${form.std}`,
    },
    hints: ['先去内层括号，再去外层——每次去括号前先看括号前面是什么符号'],
    xpBase: 15 + (difficulty - 1) * 5,
  };
}

// ==================== 高档：四项式逐项变号（填写式子） ====================

function generateFourItemsSign(difficulty: number, id: string): Question {
  const a = randInt(500, 2000);
  const b = randInt(50, 200);
  const c = randInt(10, 99);
  const d = randInt(5, 50);
  // a - (b + c - d + randSome)
  const e = randInt(5, 50);

  const original = `${a} - (${b} + ${c} - ${d} + ${e})`;
  const standard = `${a} - ${b} - ${c} + ${d} - ${e}`;

  return {
    id, topicId: 'bracket-ops', type: 'expression-input', difficulty,
    prompt: `${REMOVE_PROMPT}：\n${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'four-items-sign', originalExpression: original },
    solution: {
      answer: standard,
      standardExpression: standard,
      bracketPolicy: 'must-not-have',
      explanation: `减号后四项都要逐项变号：+${b}→-${b}，+${c}→-${c}，-${d}→+${d}，+${e}→-${e}`,
    },
    hints: ['减号后括号里一共 4 项——每一项的加减号都要反过来，一个都不能漏'],
    xpBase: 15 + (difficulty - 1) * 5,
  };
}

// ==================== 高档：错误诊断 MC ====================

// v2.2：错误诊断简化为"单步找错" —— 给出原式 → 某个去括号结果，让学生判断这一步是否正确/错在哪
function generateErrorDiagnose(difficulty: number, id: string): Question {
  const a = randInt(200, 999);
  const b = randInt(20, 99);
  const c = randInt(10, 80);
  const d = randInt(5, 40);

  // 原式：a - (b + c - d)；正确去括号结果：a - b - c + d
  const original = `${a} - (${b} + ${c} - ${d})`;
  const correctResult = `${a} - ${b} - ${c} + ${d}`;

  // 4 种可能的学生答案（1 对 + 3 种典型错法）
  const candidates = [
    { expr: correctResult,                                  label: '这一步正确',                                    isCorrect: true },
    { expr: `${a} - ${b} + ${c} - ${d}`, label: `错：+${c} 没变号（应为 -${c}）、-${d} 没变号（应为 +${d}）`, isCorrect: false },
    { expr: `${a} + ${b} + ${c} - ${d}`, label: `错：-${b} 应为 -${b}（括号外减号保留），但 +${b} 符号反了`,    isCorrect: false },
    { expr: `${a} - ${b} - ${c} - ${d}`, label: `错：-${d} 应为 +${d}（减-号两次相当于加）`,                    isCorrect: false },
  ];
  const pickedIdx = randInt(0, candidates.length - 1);
  const picked = candidates[pickedIdx];

  // 四选一选项：
  // 若实际答案正确 → "这一步正确" + 3 个错误类型（但它们不是这道的错）——为避免错选项语义矛盾，
  // 统一采用"判断对错并说明错点"固定 4 项：正确 / 符号错类 A / 符号错类 B / 变号漏项
  const options = [
    '这一步正确',
    `错：括号外是 "-"，去括号时括号内每一项都要变号，但该步漏变了一项`,
    `错：括号外是 "-"，去括号时括号内每一项都要变号，但该步漏变了两项`,
    `错：括号外是 "-"，去括号时不应该把括号外第一个符号也一起反掉`,
  ];

  // 判定 picked 对应哪个选项
  let correctOption: string;
  if (pickedIdx === 0) correctOption = options[0];
  else if (pickedIdx === 1) correctOption = options[2];       // 漏变 2 项
  else if (pickedIdx === 2) correctOption = options[3];       // 把外层 -b 也反了
  else                      correctOption = options[1];       // 漏变 1 项（-d 没变 +d）

  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `某同学的去括号过程：\n原式：${original}\n学生写成：${picked.expr}\n\n请判断这一步是否正确——如果有错，错在哪里？`,
    data: { kind: 'bracket-ops', subtype: 'error-diagnose', originalExpression: original, options: shuffle(options) },
    solution: {
      answer: correctOption,
      explanation: `正确去括号应为：${correctResult}。对照学生答案「${picked.expr}」：${picked.isCorrect ? '每一项符号都已正确反转。' : picked.label}`,
    },
    hints: ['减号后去括号：括号里 *每一项* 都要变号，一项都不能漏，括号外的符号不跟着反'],
    xpBase: 15 + (difficulty - 1) * 5,
  };
}

// ==================== 分发 ====================

export function generateBracketOps(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  // 低档子题型权重按 d 区间分配（C1档内梯度规范化）
  // d=3 (档1-低): 只出 remove-bracket-plus（加号后括号，符号不变）
  // d=5 (档1-高): 主出 remove-bracket-minus（减号后括号，符号全变，核心陷阱）
  const lowEntries: SubtypeEntry[] = difficulty <= 3
    ? [
        { tag: 'remove-bracket-plus',  weight: 100, gen: () => generateRemoveBracketPlus(difficulty, id) },
        { tag: 'remove-bracket-minus', weight: 0,   gen: () => generateRemoveBracketMinus(difficulty, id) },
      ]
    : [
        { tag: 'remove-bracket-plus',  weight: 30,  gen: () => generateRemoveBracketPlus(difficulty, id) },
        { tag: 'remove-bracket-minus', weight: 70,  gen: () => generateRemoveBracketMinus(difficulty, id) },
      ];

  const midEntries: SubtypeEntry[] = [
    { tag: 'add-bracket',          weight: 45, gen: () => generateAddBracket(difficulty, id) },
    { tag: 'division-property',    weight: 35, gen: () => generateDivisionProperty(difficulty, id) },
    { tag: 'remove-bracket-minus', weight: 20, gen: () => generateRemoveBracketMinus(difficulty, id) },
    // 兼容 campaign.ts 已有关卡的 subtypeFilter（若传入低档 tag 也要给出生成入口）
    { tag: 'remove-bracket-plus',  weight: 0,  gen: () => generateRemoveBracketPlus(difficulty, id) },
  ];

  const highEntries: SubtypeEntry[] = [
    { tag: 'nested-bracket',       weight: 35, gen: () => generateNestedBracket(difficulty, id) },
    { tag: 'four-items-sign',      weight: 35, gen: () => generateFourItemsSign(difficulty, id) },
    { tag: 'error-diagnose',       weight: 30, gen: () => generateErrorDiagnose(difficulty, id) },
    // v2.2：division-property 在高档权重为 0（仅保留以兼容旧 subtypeFilter）
    { tag: 'division-property',    weight: 0,  gen: () => generateDivisionProperty(difficulty, id) },
    // 兼容 tag 向下传入
    { tag: 'remove-bracket-minus', weight: 0,  gen: () => generateRemoveBracketMinus(difficulty, id) },
    { tag: 'remove-bracket-plus',  weight: 0,  gen: () => generateRemoveBracketPlus(difficulty, id) },
    { tag: 'add-bracket',          weight: 0,  gen: () => generateAddBracket(difficulty, id) },
  ];

  const entries = difficulty <= 5 ? lowEntries : difficulty <= 7 ? midEntries : highEntries;

  // formatNum 未直接使用（新版数字均为整数）—— 标记引用避免未使用告警
  void formatNum;

  return pickSubtype(entries, subtypeFilter);
}
