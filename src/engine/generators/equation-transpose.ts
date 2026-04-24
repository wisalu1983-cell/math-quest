import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';

// v2.2 重构：A08 方程移项（2 档，对齐 TOPIC_STAR_CAP=3★）
//
// 核心原则：
// - 学生写的是"移项后的完整等式"（equation-input），不是 x 的解
// - 答题框只给一个空白行，模板不帮学生做变号
// - 四类陷阱：
//     T1 减号后 x 项丢负号：  a - bx = c → -bx = c - a
//     T2 同侧多项漏移：        同侧 2+ 常数只移一个
//     T3 括号展开漏乘：        a(x + b) = c → ax + ab = c
//     T4 两边含 x 交叉变号：  ax + b = cx + d → ax - cx = d - b
//
// 档位（v2.2）：
//   档 1（d≤5）：一步移项 + 等式反写 + 轻度 T1；即使档 1 也要求学生手动变号
//   档 2（d≥6）：双向移项 + T2/T3/T4 陷阱 + T3+T4 叠加 + 错误诊断 MC

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) return [
    // 档 1：一步移项（含轻度 T1 陷阱）
    { tag: 'move-constant',         weight: 55 },
    { tag: 'move-from-linear',      weight: 20 }, // 档 1 也引入轻度 T1
    { tag: 'solve-after-transpose', weight: 15 },
    { tag: 'equation-concept',      weight: 10 },
  ];
  // 档 2：双向移项 + 各类陷阱 + 错误诊断
  return [
    { tag: 'move-both-sides',       weight: 30 }, // T4
    { tag: 'bracket-equation',      weight: 25 }, // T3 / T3+T4
    { tag: 'move-from-linear',      weight: 15 }, // T1/T2 + 两步移项
    { tag: 'error-diagnose',        weight: 15 }, // 错误诊断 MC
    { tag: 'solve-after-transpose', weight: 10 },
    { tag: 'division-equation',     weight: 5 },
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

const PROMPT_TRANSPOSE = '对该方程移项，写出移项后的完整等式（不要算出 x 的值）';
const PROMPT_TRANSPOSE_BOTH_SIDES = '移项，使含 x 的项在左边、常数项在右边，写出完整等式（不要算出 x 的值）';

// ==================== 低档：一步移项 ====================
// 子情形：
//   a) x + a = b   → x = b - a
//   b) x - a = b   → x = b + a
//   c) ax = b      → 保留原式即可；但考察"一步移项"语义较弱，用"b = ax"反写版替代
//   d) 轻度陷阱 I：a + x = b（x 不在首位）→ 移项后 x = b - a
//   e) 轻度陷阱 II：x + a = a（答案为 0）→ 移项后 x = 0

function generateLowOneStep(difficulty: number, id: string): Question {
  const variant = randInt(0, 4);
  let equation: string;
  let standard: string;
  let explanation: string;

  if (variant === 0) {
    const a = randInt(3, 60);
    const x = randInt(1, 80);
    const b = x + a;
    equation = `x + ${a} = ${b}`;
    standard = `x = ${b} - ${a}`;
    explanation = `+${a} 移到右边变号为 -${a}`;
  } else if (variant === 1) {
    const a = randInt(3, 60);
    const x = randInt(a + 1, 100);
    const b = x - a;
    equation = `x - ${a} = ${b}`;
    standard = `x = ${b} + ${a}`;
    explanation = `-${a} 移到右边变号为 +${a}`;
  } else if (variant === 2) {
    // x 不在首位的轻度陷阱
    const a = randInt(3, 60);
    const x = randInt(1, 80);
    const b = a + x;
    equation = `${a} + x = ${b}`;
    standard = `x = ${b} - ${a}`;
    explanation = `+${a} 在左边，移到右边变号为 -${a}（注意：x 原本在加号后面，但不影响变号）`;
  } else if (variant === 3) {
    // 答案为 0 的轻度陷阱
    const a = randInt(3, 80);
    equation = `x + ${a} = ${a}`;
    standard = `x = ${a} - ${a}`;
    explanation = `+${a} 移到右边变号为 -${a}，右边变为 ${a} - ${a}`;
  } else {
    // 反写形式 b = x + a
    const a = randInt(3, 50);
    const x = randInt(1, 80);
    const b = x + a;
    equation = `${b} = x + ${a}`;
    standard = `${b} - ${a} = x`;
    explanation = `把 +${a} 移到左边变号为 -${a}，x 保持在右边`;
  }

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE}：\n${equation}`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'move-constant' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `${equation} → ${standard}（${explanation}）`,
    },
    hints: ['把含 x 的那一项和它对应的常数项分别移到等号两侧，移过去的项要变号'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ==================== 中档：两步移项 + T1 / T2 ====================

// T1：a - bx = c → -bx = c - a（容易错写成 bx = c - a 把负号丢了）
function generateMidT1(difficulty: number, id: string): Question {
  const b = randInt(2, 9);
  const x = randInt(1, 15);
  const a = b * x + randInt(5, 60); // 保证 c = a - b*x > 0 不一定需要
  const c = a - b * x;
  const equation = `${a} - ${b}x = ${c}`;
  // 正确移项：-bx = c - a（x 项系数保持负号）
  const standard = `-${b}x = ${c} - ${a}`;

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE}：\n${equation}\n（提示：当 x 的项前面带负号时，移项后要保留那个负号）`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'move-from-linear', trap: 'T1' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `${equation} → ${standard}。陷阱 T1：-${b}x 已经带负号，移项时只变 +${a} 为 -${a}，x 的系数 -${b} 保持不变（不能写成 ${b}x = ${c} - ${a}，那就把负号丢了）。`,
    },
    hints: ['x 前面的负号不能忽略——移走的是常数项，x 项本身的系数和符号保持不变'],
    xpBase: 14 + (difficulty - 1) * 5,
  };
}

// T2：同侧多项漏移 —— x + a + b = c（两个常数）→ x = c - a - b
function generateMidT2(difficulty: number, id: string): Question {
  const a = randInt(3, 40);
  const b = randInt(3, 40);
  const x = randInt(1, 60);
  const c = x + a + b;
  const equation = `x + ${a} + ${b} = ${c}`;
  const standard = `x = ${c} - ${a} - ${b}`;

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE}：\n${equation}\n（提示：左边的 *所有* 常数项都要移到右边，一个都不能漏）`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'move-constant', trap: 'T2' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `${equation} → ${standard}。陷阱 T2：左边 ${a} 和 ${b} 都是常数，移项时两个都要变号移到右边，不能只移一个。`,
    },
    hints: ['左边除 x 以外的每一项都要变号移到右边'],
    xpBase: 14 + (difficulty - 1) * 5,
  };
}

// ==================== 中档兼容：基本两步移项 ax + b = c ====================

function generateMidLinearBasic(difficulty: number, id: string): Question {
  const a = randInt(2, 9);
  const x = randInt(1, 20);
  const b = randInt(3, 80);
  const op = Math.random() < 0.5 ? '+' : '-';
  const c = op === '+' ? a * x + b : a * x - b;
  const equation = `${a}x ${op} ${b} = ${c}`;
  const flipped = op === '+' ? '-' : '+';
  const standard = `${a}x = ${c} ${flipped} ${b}`;

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE}：\n${equation}`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'move-from-linear' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `${op}${b} 移到右边变号为 ${flipped}${b}`,
    },
    hints: ['把常数项移到等号右边，移过去要变号'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ==================== 高档：T3 括号展开漏乘 ====================

function generateHighT3(difficulty: number, id: string): Question {
  const a = randInt(2, 7);
  const x = randInt(1, 15);
  const b = randInt(2, 20);
  const op = Math.random() < 0.5 ? '+' : '-';
  const inside = op === '+' ? x + b : x - b;
  const c = a * inside;
  const equation = `${a}(x ${op} ${b}) = ${c}`;
  // 正确展开：ax ± ab = c，然后移项：ax = c ∓ ab
  const ab = a * b;
  const moveSign = op === '+' ? '-' : '+';
  const standard = `${a}x = ${c} ${moveSign} ${ab}`;

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE}：\n${equation}\n（先展开括号，再移项；写出移项后的等式）`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'bracket-equation', trap: 'T3' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `${equation}：先展开为 ${a}x ${op} ${ab} = ${c}（陷阱 T3：${a} 必须同时乘 x 和 ${b}，不能漏乘 ${b}！），再把 ${op}${ab} 移到右边变号为 ${moveSign}${ab}：${standard}。`,
    },
    hints: [`展开括号时 ${a} 要同时乘 x 和 ${b}，不能漏乘——然后再做移项`],
    xpBase: 16 + (difficulty - 1) * 5,
  };
}

// ==================== 高档：T4 两边含 x 交叉变号 ====================

function generateHighT4(difficulty: number, id: string): Question {
  const a = randInt(4, 12);
  const cc = randInt(1, a - 1);
  const x = randInt(1, 15);
  const b = randInt(3, 40);
  const d = (a - cc) * x + b;
  const equation = `${a}x + ${b} = ${cc}x + ${d}`;
  // 正确移项：ax - cx = d - b
  const standard = `${a}x - ${cc}x = ${d} - ${b}`;

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE_BOTH_SIDES}：\n${equation}`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'move-both-sides', trap: 'T4' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `${equation} → ${standard}。陷阱 T4：+${cc}x 移到左边变为 -${cc}x，+${b} 移到右边变为 -${b}——每个移动的项都要变号。`,
    },
    hints: ['x 项全部移到左边，常数项全部移到右边，*每个* 移过去的项都要变号'],
    xpBase: 16 + (difficulty - 1) * 5,
  };
}

// ==================== 高档：T3 + T4 叠加 ====================

function generateHighT3T4(difficulty: number, id: string): Question {
  const a = randInt(2, 5);
  const b = randInt(2, 15);
  const cc = randInt(2, 6);
  const x = randInt(1, 10);
  const lhs = a * (x + b);
  const d = lhs - cc * x;
  const equation = `${a}(x + ${b}) = ${cc}x + ${d}`;
  // 展开：ax + ab = cx + d → ax - cx = d - ab
  const ab = a * b;
  const standard = `${a}x - ${cc}x = ${d} - ${ab}`;

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE_BOTH_SIDES}：\n${equation}\n（先展开括号，再把含 x 的项集中到左边、常数集中到右边；写出移项后的等式）`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'bracket-equation', trap: 'T3+T4' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `先展开：${a}x + ${ab} = ${cc}x + ${d}（T3：不能漏乘 ${b}！）；再移项：${cc}x 过左变 -${cc}x、${ab} 过右变 -${ab}（T4：每个移动项都要变号），得 ${standard}。`,
    },
    hints: ['两步：先展开括号（分配律别漏乘），再把 x 项集中到左边'],
    xpBase: 18 + (difficulty - 1) * 5,
  };
}

// ==================== 高档：错误诊断 MC（"哪步错了"） ====================

function generateHighErrorDiagnose(difficulty: number, id: string): Question {
  // 出一个 T4 的错误过程：只变了 x 项、没变常数项
  const a = randInt(3, 10);
  const cc = randInt(1, a - 1);
  const x = randInt(1, 12);
  const b = randInt(3, 30);
  const d = (a - cc) * x + b;
  const equation = `${a}x + ${b} = ${cc}x + ${d}`;

  const correctStep = `${a}x - ${cc}x = ${d} - ${b}`;
  const wrongStep = `${a}x - ${cc}x = ${d} + ${b}`; // +b 没变号

  const procedure = [
    `原式：${equation}`,
    `Step 1：${wrongStep}`,
    `Step 2：${a - cc}x = ${d + b}`,
    `Step 3：x = ${(d + b) / (a - cc)}`,
  ];

  const options = [
    `Step 1：+${b} 移到右边时忘记变号（应为 -${b}）`,
    `Step 2：合并同类项时出错`,
    `Step 3：除法计算错误`,
    '过程完全正确',
  ];

  return {
    id, topicId: 'equation-transpose', type: 'multiple-choice', difficulty,
    prompt: `下面是某同学的解题过程。请找出错在哪一步：\n${procedure.join('\n')}`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [correctStep], options, subtype: 'error-diagnose' },
    solution: {
      answer: options[0],
      explanation: `移项时，所有从等号一侧移到另一侧的项都必须变号。+${b} 从左边移到右边应该变为 -${b}，该同学忘记了变号，所以 Step 1 错了。正确的 Step 1 应为 ${correctStep}。`,
    },
    hints: ['检查每个被移动的项：是否变号了？'],
    xpBase: 15 + (difficulty - 1) * 5,
  };
}

// ==================== 兼容类型：解方程（数值解） ====================

function generateSolveAfterTranspose(difficulty: number, id: string): Question {
  const x = randInt(1, 20);
  const a = randInt(2, 9);
  const b = randInt(5, 80);
  const c = a * x + b;
  const equation = `${a}x + ${b} = ${c}`;
  const step1 = `${a}x = ${c} - ${b} = ${c - b}`;
  const step2 = `x = ${c - b} ÷ ${a} = ${x}`;

  return {
    id, topicId: 'equation-transpose', type: 'numeric-input', difficulty,
    prompt: `解方程: ${equation}，x = ?`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [step1, step2] },
    solution: {
      answer: x,
      steps: [step1, step2],
      explanation: `移项: ${a}x = ${c - b}，再除以${a}: x = ${x}`,
    },
    hints: ['先移项: 把常数项移到右边，再两边同除以x的系数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateDivisionEquation(difficulty: number, id: string): Question {
  // a ÷ x = b → x = a ÷ b （简单）
  const b = randInt(2, 9);
  const x = randInt(2, 15);
  const a = b * x;
  const equation = `${a} ÷ x = ${b}`;
  return {
    id, topicId: 'equation-transpose', type: 'numeric-input', difficulty,
    prompt: `解方程: ${equation}，x = ?`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [`x = ${a} ÷ ${b} = ${x}`] },
    solution: {
      answer: x,
      steps: [`x = ${a} ÷ ${b} = ${x}`],
      explanation: `被除数 ÷ 商 = 除数，所以 x = ${a} ÷ ${b}`,
    },
    hints: ['想一想被除数、除数和商的关系'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateEquationConcept(difficulty: number, id: string): Question {
  const x = randInt(1, 20);
  const a = randInt(2, 9);
  const b = randInt(1, 50);
  const c = a * x + b;

  const equation = `${a}x + ${b} = ${c}`;
  const pureEquation = `${b} + ${c - b} = ${c}`;
  const inequality = `${a}x + ${b} > ${c - 1}`;
  const expression = `${a}x + ${b}`;
  const options = shuffle([equation, pureEquation, inequality, expression]);

  return {
    id, topicId: 'equation-transpose', type: 'multiple-choice', difficulty,
    prompt: `下面哪个是方程？`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [], options },
    solution: {
      answer: equation,
      explanation: `方程是含有未知数的等式。${equation} 含有未知数 x，且是等式，所以是方程`,
    },
    hints: ['方程的两个条件：1. 是等式（有等号）2. 含有未知数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ==================== 档 1 轻度 T1：单步减号后 x ====================
// a - x = b（系数 1 的轻量形态），移项后标准式 x = a - b
// 即使是档 1，也强制学生手动变号（而不是填数字）

function generateLowMildT1(difficulty: number, id: string): Question {
  const a = randInt(10, 60);
  const x = randInt(1, a - 1);
  const b = a - x;
  const equation = `${a} - x = ${b}`;
  const standard = `x = ${a} - ${b}`;

  return {
    id, topicId: 'equation-transpose', type: 'equation-input', difficulty,
    prompt: `${PROMPT_TRANSPOSE}：\n${equation}`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [standard], subtype: 'move-from-linear', trap: 'T1-lite' },
    solution: {
      answer: standard,
      standardExpression: standard,
      variable: 'x',
      explanation: `${equation}：x 带着前面的负号——把 -x 和 ${b} 互换位置并变号，得 ${standard}。陷阱 T1（档 1 版）：不能写成 x = ${b} - ${a}，那样符号就反了。`,
    },
    hints: ['x 前面是减号——要把 x 移成正的，就要把 x 和另一侧交换，并同时变号'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ==================== 分发器 ====================

function dispatchLow(difficulty: number, id: string): Question {
  // C1档内梯度规范化：
  // d=2 (档1-低)：90% 简单一步移项（无陷阱），5% 概念，5% 轻度T1
  // d=3 (档1-高)：50% 一步移项，45% 轻度T1（含减号后x项），5% 概念
  const r = Math.random();
  if (difficulty <= 2) {
    if (r < 0.90) return generateLowOneStep(difficulty, id);
    if (r < 0.95) return generateEquationConcept(difficulty, id);
    return generateLowMildT1(difficulty, id);
  }
  // d=3
  if (r < 0.50) return generateLowOneStep(difficulty, id);
  if (r < 0.95) return generateLowMildT1(difficulty, id);
  return generateEquationConcept(difficulty, id);
}

function dispatchMoveFromLinearHigh(difficulty: number, id: string): Question {
  // 档 2 的 move-from-linear = T1 / T2 / 两步移项 三选一
  const r = Math.random();
  if (r < 0.4) return generateMidT1(difficulty, id);
  if (r < 0.7) return generateMidT2(difficulty, id);
  return generateMidLinearBasic(difficulty, id);
}

function dispatchBracketEquation(difficulty: number, id: string): Question {
  // 档 2 括号方程：T3 单独 / T3+T4 叠加
  return Math.random() < 0.5 ? generateHighT3(difficulty, id) : generateHighT3T4(difficulty, id);
}

// ==================== Main ====================

export function generateEquationTranspose(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  // 档 1（d≤5）
  const tier1: SubtypeEntry[] = [
    { tag: 'move-constant',         weight: 55, gen: () => dispatchLow(difficulty, id) },
    { tag: 'move-from-linear',      weight: 20, gen: () => generateLowMildT1(difficulty, id) },
    { tag: 'solve-after-transpose', weight: 15, gen: () => generateSolveAfterTranspose(difficulty, id) },
    { tag: 'equation-concept',      weight: 10, gen: () => generateEquationConcept(difficulty, id) },
  ];

  // 档 2（d≥6）C1档内梯度规范化：
  // d=6 (档2-低)：简单双向移项(T4) + T1/T2陷阱 为主，不含括号展开
  // d=7 (档2-高)：引入括号展开(T3)和T3+T4叠加 + 错误诊断
  const tier2Low: SubtypeEntry[] = [
    { tag: 'move-both-sides',       weight: 50, gen: () => generateHighT4(difficulty, id) },
    { tag: 'move-from-linear',      weight: 30, gen: () => dispatchMoveFromLinearHigh(difficulty, id) },
    { tag: 'solve-after-transpose', weight: 15, gen: () => generateSolveAfterTranspose(difficulty, id) },
    { tag: 'division-equation',     weight: 5,  gen: () => generateDivisionEquation(difficulty, id) },
    // 兼容 subtypeFilter 中可能出现的 tag
    { tag: 'bracket-equation',      weight: 0,  gen: () => dispatchBracketEquation(difficulty, id) },
    { tag: 'error-diagnose',        weight: 0,  gen: () => generateHighErrorDiagnose(difficulty, id) },
  ];
  const tier2High: SubtypeEntry[] = [
    { tag: 'move-both-sides',       weight: 25, gen: () => generateHighT4(difficulty, id) },
    { tag: 'bracket-equation',      weight: 30, gen: () => dispatchBracketEquation(difficulty, id) },
    { tag: 'move-from-linear',      weight: 15, gen: () => dispatchMoveFromLinearHigh(difficulty, id) },
    { tag: 'error-diagnose',        weight: 20, gen: () => generateHighErrorDiagnose(difficulty, id) },
    { tag: 'solve-after-transpose', weight: 7,  gen: () => generateSolveAfterTranspose(difficulty, id) },
    { tag: 'division-equation',     weight: 3,  gen: () => generateDivisionEquation(difficulty, id) },
  ];

  let entries: SubtypeEntry[];
  if (difficulty <= 5) {
    entries = tier1;
  } else if (difficulty <= 6) {
    entries = tier2Low;
  } else {
    entries = tier2High;
  }
  return pickSubtype(entries, subtypeFilter);
}
