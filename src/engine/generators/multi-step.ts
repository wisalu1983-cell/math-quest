import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';
import { formatNum } from './utils';

// v2.1 重构：A07 简便计算"识别 + 执行"双能力
//
// 核心约束：不考最终得数；考的是"判断能否简便"和"写出正确的变形式"。
//
// 三档结构：
//   低档：识别（MC 哪道可以凑整简便）+ 执行（multi-blank 凑整拆分模板）
//   中档：识别（MC 哪道不能简便 / 用什么方法）+ 执行（multi-blank 拆分路径 / MC 选变形式）
//   高档：识别（multi-select 哪些可以简便）+ 错误诊断（MC 哪步错了）+ 执行（expression-input 隐藏公因数统一）
//
// 兼容 campaign.ts 的 subtype tag：bracket-normal / bracket-hard / bracket-demon /
//   extract-factor / decimal-two-step / decimal-multi-step / decimal-chain / simplify-subtract
// 所有 tag 都被重新映射到"识别 + 执行"双能力模式。

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) return [
    { tag: 'bracket-normal',    weight: 35 }, // 连减凑整：识别 + 执行
    { tag: 'extract-factor',    weight: 30 }, // 分配律凑整：识别 + 执行
    { tag: 'decimal-two-step',  weight: 35 }, // 近似整数拆分：识别 + 执行
  ];
  if (difficulty <= 7) return [
    { tag: 'bracket-hard',      weight: 30 }, // 辨析能否简便 MC + 拆分路径填空
    { tag: 'extract-factor',    weight: 25 }, // 发现因数拆分填空（72×125=8×9×125）
    { tag: 'decimal-two-step',  weight: 25 }, // 方法选择 MC（用什么律）
    { tag: 'simplify-subtract', weight: 20 }, // 变号陷阱 MC + 填空
  ];
  return [
    { tag: 'bracket-demon',      weight: 30 }, // 错误诊断 MC
    { tag: 'extract-factor',     weight: 25 }, // 隐藏公因数统一填空
    { tag: 'decimal-multi-step', weight: 25 }, // 多选识别（哪些可简便）
    { tag: 'decimal-chain',      weight: 20 }, // 多步串联拆分填空
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

// ============================================================
// 低档识别力：MC"哪道可以凑整简便"
// ============================================================

function pickExprSimplifiableAdd(): { expr: string; pair: [number, number] } {
  const pairs: Array<[number, number]> = [
    [48, 52], [37, 63], [28, 72], [19, 81], [45, 55], [68, 32], [77, 23], [36, 64],
  ];
  const [b, c] = pairs[randInt(0, pairs.length - 1)];
  const a = randInt(30, 80);
  return { expr: `${a} + ${b} + ${c}`, pair: [b, c] };
}

function pickExprSimplifiableSubChain(): { expr: string; pair: [number, number] } {
  const pairs: Array<[number, number]> = [
    [39, 61], [48, 52], [127, 73], [85, 15], [136, 64], [238, 62], [75, 25],
  ];
  const [b, c] = pairs[randInt(0, pairs.length - 1)];
  const a = randInt(200, 900);
  return { expr: `${a} - ${b} - ${c}`, pair: [b, c] };
}

function pickExprNotSimplifiable(): string {
  // 混合运算但无凑整特征：各项数字"不成对"
  const cases = [
    `${randInt(23, 89)} + ${randInt(17, 39)} + ${randInt(11, 28)}`,
    `${randInt(200, 500)} - ${randInt(37, 89)} - ${randInt(13, 41)}`,
    `${randInt(12, 19)} × ${randInt(23, 37)}`,
    `${randInt(42, 89)} + ${randInt(11, 29)} - ${randInt(7, 23)}`,
  ];
  return cases[randInt(0, cases.length - 1)];
}

function generateRecognizeSimplifiableLow(difficulty: number, id: string): Question {
  // 4 个选项中 1 个有明显凑整特征，其它 3 个无
  const target = Math.random() < 0.5 ? pickExprSimplifiableAdd() : pickExprSimplifiableSubChain();
  const others = [pickExprNotSimplifiable(), pickExprNotSimplifiable(), pickExprNotSimplifiable()];
  const options = shuffle([target.expr, ...others]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: '下面哪个算式可以通过"凑整"来简便计算？',
    data: { kind: 'multi-step', expression: target.expr, steps: [], options, subtype: 'recognize-simplifiable' },
    solution: {
      answer: target.expr,
      explanation: `${target.expr} 中 ${target.pair[0]} + ${target.pair[1]} = ${target.pair[0] + target.pair[1]}（凑整）。其它算式没有这样"和为整百/整千"的组合。`,
    },
    hints: ['找"两项相加等于整十、整百、整千"的组合'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 低档执行力：凑整拆分模板（multi-blank）
// ============================================================

function generateFillSplitLow(difficulty: number, id: string): Question {
  // 模式一：a + b（b 接近 R）→ a + R - δ
  // 模式二：a - b（b 接近 R）→ a - R + δ
  const R = [100, 200, 500, 1000][randInt(0, 3)];
  const delta = randInt(1, 9);
  const b = R - delta;
  const isAdd = Math.random() < 0.5;
  const a = isAdd ? randInt(120, 800) : randInt(R + 50, R * 3);

  const expression = `${a} ${isAdd ? '+' : '-'} ${b}`;
  // 模板：a ± b = a ± R ∓ δ，空位为 R 和 δ
  const templateRendered = isAdd
    ? `${a} + ${b} = ${a} + ___ - ___`
    : `${a} - ${b} = ${a} - ___ + ___`;

  return {
    id, topicId: 'multi-step', type: 'multi-blank', difficulty,
    prompt: `用凑整法把 ${expression} 拆成更好算的形式。按顺序填入两个空（不要算出最后得数）：\n${templateRendered}`,
    data: { kind: 'multi-step', expression, steps: [], subtype: 'fill-split-low', template: templateRendered },
    solution: {
      answer: `${R}|${delta}`,
      blanks: [R, delta],
      explanation: `${b} 接近 ${R}，可以写成 ${R} ${isAdd ? '-' : '-'} ${delta}${isAdd ? '' : '，代入后括号前是减号，括号内 -δ 变 +δ'}。`,
    },
    hints: [`${b} 是接近哪个整数？它和那个整数差多少？`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 中档识别力：MC"哪道不能简便"
// ============================================================

function pickFakeSimplifiable(): { expr: string; reason: string } {
  // 看似可简便实则不能，典型"伪简便"
  const cases: Array<{ expr: string; reason: string }> = [
    { expr: `${randInt(50, 90)} + ${randInt(21, 45)} - ${randInt(11, 19)}`, reason: '加减项之间没有可以凑整的组合' },
    { expr: `${randInt(10, 20)} × ${randInt(11, 29)}`, reason: '单个乘法无法通过律变换简化' },
    { expr: `${randInt(100, 300)} ÷ ${randInt(11, 29)}`, reason: '单个除法且除数不是凑整因子' },
    { expr: `${randInt(12, 48)} + ${randInt(13, 47)} × ${randInt(3, 7)}`, reason: '各项结构不同无公因数，也无凑整' },
  ];
  return cases[randInt(0, cases.length - 1)];
}

function generateRecognizeNotSimplifiable(difficulty: number, id: string): Question {
  // 3 项可简便 + 1 项伪简便（去重避免两次 pickExprSimplifiableAdd 偶发撞同一个表达式）
  const fake = pickFakeSimplifiable();
  const simplifiables: string[] = [];
  const tried = new Set<string>([fake.expr]);
  while (simplifiables.length < 3) {
    const candidate = simplifiables.length === 1
      ? pickExprSimplifiableSubChain().expr
      : pickExprSimplifiableAdd().expr;
    if (!tried.has(candidate)) {
      tried.add(candidate);
      simplifiables.push(candidate);
    }
  }
  const options = shuffle([fake.expr, ...simplifiables]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: '下面哪个算式 *不能* 用简便方法计算（只能按顺序正常计算）？',
    data: { kind: 'multi-step', expression: fake.expr, steps: [], options, subtype: 'recognize-not-simplifiable' },
    solution: {
      answer: fake.expr,
      explanation: `${fake.expr} — ${fake.reason}。其它三项都含有凑整组合或公因数，可以简便。`,
    },
    hints: ['简便的关键是找凑整组合或公因数。都没有，就不能简便。'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 中档执行力：拆分路径填空 （multi-blank）
// ============================================================

function generateFillSplitMid(difficulty: number, id: string): Question {
  // 模式：a × b × c，其中 a 和 c 可以配凑成整百（如 125 × 32 × 25）
  // 策略：选 125 和 25 作为两头，中间 b 可拆分成"(与125配合) × (与25配合)"
  const ends: Array<[number, number, [number, number]]> = [
    [125, 25, [8, 4]],     // 125×8=1000，25×4=100，所以 b = 32 = 8×4
    [125, 8,  [8, 1]],     // 125×8=1000
    [25,  4,  [4, 1]],     // 25×4=100
    [25,  8,  [4, 2]],     // 25×4=100，8=2×4；b=4×2=8
    [125, 4,  [8, 2]],     // 125×8=1000；b=8×2=16
  ];
  const [lead, tail, splitPair] = ends[randInt(0, ends.length - 1)];
  const [k1, k2] = splitPair;
  const b = k1 * k2;
  const expression = `${lead} × ${b} × ${tail}`;

  // 模板："lead × b × tail = lead × (__ × __) × tail = (lead × __) × (__ × tail)"
  // 两个空分别是 k1 和 k2（顺序由 expression 决定）
  const templateRendered = `${lead} × ${b} × ${tail} = ${lead} × (___ × ___) × ${tail}`;

  return {
    id, topicId: 'multi-step', type: 'multi-blank', difficulty,
    prompt: `把 ${expression} 拆成能凑整的形式。按顺序填入两个因数（不要算出最后得数）：\n${templateRendered}`,
    data: { kind: 'multi-step', expression, steps: [], subtype: 'fill-split-mid', template: templateRendered },
    solution: {
      answer: `${k1}|${k2}`,
      blanks: [k1, k2],
      explanation: `${b} = ${k1} × ${k2}，这样 ${lead} × ${k1} 和 ${k2} × ${tail} 都能凑整。`,
    },
    hints: [`想想 ${lead} 和 ${tail} 各自需要乘以什么才能变成整百/整千？`],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// 中档执行力 B：MC 选变形式（发现隐藏分配律 / 提公因数）
function generateMidPickTransform(difficulty: number, id: string): Question {
  // 形如 a×m + a×n 的分配律逆用
  const a = [25, 36, 45, 72, 125][randInt(0, 4)];
  const target = [10, 20, 100][randInt(0, 2)];
  const m = randInt(1, target - 1);
  const n = target - m;
  const expression = `${a} × ${m} + ${a} × ${n}`;

  const correct = `${a} × (${m} + ${n})`;
  const wrong1 = `${a} × (${m} - ${n})`;
  const wrong2 = `(${a} + ${a}) × (${m} + ${n})`;
  const wrong3 = `${a + a} × (${m} + ${n})`;

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `用简便方法计算 ${expression}，应该先变成哪个式子？`,
    data: { kind: 'multi-step', expression, steps: [], options: shuffle([correct, wrong1, wrong2, wrong3]), subtype: 'mid-pick-transform' },
    solution: {
      answer: correct,
      explanation: `两项都含公因数 ${a}，提出来后里面写 ${m} + ${n}（注意：提因数时不能把 a 自己相加）。`,
    },
    hints: ['提公因数：把相同的那个数提出来，剩下的部分用括号括起来'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 中档识别力 B：MC"用什么方法"
// ============================================================

function generateRecognizeMethod(difficulty: number, id: string): Question {
  type Case = { expr: string; method: string; why: string };
  const cases: Case[] = [
    { expr: `38 + 76 + 62`, method: '加法交换律（凑整）', why: '38 + 62 = 100，先把 38 和 62 结合起来' },
    { expr: `25 × 17 × 4`,  method: '乘法交换律（凑整）', why: '25 × 4 = 100，先把 25 和 4 结合起来' },
    { expr: `125 × 72`,     method: '乘法分配律（拆分）', why: '72 = 8 × 9，先把 72 拆成 8 × 9，再用 125 × 8 = 1000' },
    { expr: `35 × 99`,      method: '乘法分配律（拆分）', why: '99 = 100 - 1，用 35 × 100 - 35 × 1' },
    { expr: `450 - 127 - 73`, method: '减法性质（合并减数）', why: '127 + 73 = 200，先合并两个减数再一起减' },
    { expr: `3600 ÷ 25 ÷ 4`, method: '除法性质（合并除数）', why: '25 × 4 = 100，先合并两个除数再一起除' },
  ];
  const idx = randInt(0, cases.length - 1);
  const target = cases[idx];
  // 去重后再取 3 个不同的错误方法，保证 4 个选项互不相同
  const uniqueMethods = Array.from(new Set(cases.map(c => c.method)));
  const wrongs = uniqueMethods.filter(m => m !== target.method);
  while (wrongs.length < 3) wrongs.push(`方法 ${wrongs.length + 1}（不适用）`);
  const pick3 = shuffle(wrongs).slice(0, 3);
  const options = shuffle([target.method, ...pick3]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `简便计算 ${target.expr}，应该使用哪个律/性质？`,
    data: { kind: 'multi-step', expression: target.expr, steps: [], options, subtype: 'recognize-method' },
    solution: {
      answer: target.method,
      explanation: `${target.why}。`,
    },
    hints: ['先找到能凑整的那部分，再决定用哪条律/性质'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 高档识别力：multi-select"以下哪些可以简便"
// ============================================================

function generateRecognizeMulti(difficulty: number, id: string): Question {
  // 构造 4 个算式，其中 2~3 个可简便，其它不能
  const pool: Array<{ expr: string; can: boolean; why: string }> = [
    { expr: `125 × 88`, can: true,  why: '88 = 8 × 11，125 × 8 = 1000' },
    { expr: `99 × 25 + 25`, can: true, why: '看作 25 × 99 + 25 × 1 = 25 × 100' },
    { expr: `17 × 23 + 17 × 77`, can: true, why: '提公因数 17，17 × (23 + 77) = 17 × 100' },
    { expr: `36 × 7 + 36 × 3 + 36`, can: true, why: '36 × (7 + 3 + 1) = 36 × 11' },
    { expr: `37 × 41 + 13`, can: false, why: '37 × 41 和 13 没有公共因数或凑整组合' },
    { expr: `19 × 26 - 23`, can: false, why: '19×26 与 23 之间没有公因数' },
    { expr: `${randInt(200, 400)} ÷ 7`, can: false, why: '单一除法且除数不是整百/整千因子' },
    { expr: `${randInt(53, 89)} - ${randInt(17, 41)}`, can: false, why: '单一减法且减数不接近整十整百' },
  ];
  const shuffled = shuffle(pool);
  const selected = shuffled.slice(0, 4);
  // 标签为 A-D
  const labels = ['A', 'B', 'C', 'D'];
  const correctLabels = selected.map((c, i) => c.can ? labels[i] : null).filter((x): x is string => x !== null);
  if (correctLabels.length === 0) {
    // 确保至少有一个正确
    selected[0] = pool.find(c => c.can)!;
    correctLabels.push('A');
  }

  const optionsText = selected.map((c, i) => `${labels[i]}. ${c.expr}`).join('\n');
  const explanation = selected.map((c, i) => `${labels[i]}（${c.can ? '可简便' : '不可简便'}）：${c.why}`).join('\n');

  return {
    id, topicId: 'multi-step', type: 'multi-select', difficulty,
    prompt: `下面哪些算式可以用简便方法计算？（多选）\n${optionsText}`,
    data: { kind: 'multi-step', expression: selected[0].expr, steps: [], options: selected.map((c, i) => `${labels[i]}. ${c.expr}`), subtype: 'recognize-multi' },
    solution: {
      answer: correctLabels.join(','),
      answers: correctLabels,
      explanation,
    },
    hints: ['逐项看：有没有凑整组合？有没有公因数？'],
    xpBase: 15 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 高档错误诊断：MC"哪步错了"
// ============================================================

function generateErrorDiagnoseHigh(difficulty: number, id: string): Question {
  // 典型错误：a × (b + c) = a × b + c（漏乘 c）
  const a = randInt(5, 25);
  const b = randInt(20, 80);
  const c = randInt(10, 40);

  const steps = [
    `原式：${a} × (${b} + ${c})`,
    `Step 1：= ${a} × ${b} + ${c}`,
    `Step 2：= ${a * b} + ${c}`,
    `Step 3：= ${a * b + c}`,
  ];
  const options = [
    '原式 → Step 1（分配律漏乘 c，应为 a×b + a×c）',
    'Step 1 → Step 2（乘法计算错误）',
    'Step 2 → Step 3（加法计算错误）',
    '全对，没错',
  ];

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `下面是某同学的解题过程，哪一步错了？\n${steps.join('\n')}`,
    data: { kind: 'multi-step', expression: `${a} × (${b} + ${c})`, steps: [], options, subtype: 'error-diagnose' },
    solution: {
      answer: options[0],
      explanation: `分配律：a × (b + c) = a × b + a × c。括号外的 ${a} 必须分别乘以括号里的每一项 ${b} 和 ${c}，不能漏乘 ${c}。正确 Step 1 应为 ${a}×${b} + ${a}×${c}。`,
    },
    hints: ['分配律是括号外的数乘以括号里的 *每一项*，不是只乘第一项'],
    xpBase: 15 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 高档执行力：隐藏公因数统一（expression-input）
// ============================================================

function generateHiddenFactorExec(difficulty: number, id: string): Question {
  // 形如 12.5 × 7 + 125 × 0.3，需先把两项统一为相同公因数
  // 策略：选 base 125，让一项 = base × k1 / 10，另一项 = (base/10) × k2 × 10 形式
  const base = [125, 25, 75, 36][randInt(0, 3)];
  const k1 = randInt(2, 9);
  const k2 = randInt(2, 9);
  // 第一项：(base/10) × (k1) = 0.1 × base × k1
  const aVal = base / 10;
  const expression = `${formatNum(aVal)} × ${k1} + ${base} × ${formatNum(k2 / 10)}`;
  // 统一为 base × 0.1 × k1 + base × 0.1 × k2 = base × 0.1 × (k1 + k2)
  const standard = `${base} × ${formatNum(0.1 * (k1 + k2))}`;

  return {
    id, topicId: 'multi-step', type: 'expression-input', difficulty,
    prompt: `写出 ${expression} 的**一个**简便变形式（统一公因数后的乘积形式，不要算出最后得数）：`,
    data: { kind: 'multi-step', expression, steps: [], subtype: 'hidden-factor-exec' },
    solution: {
      answer: standard,
      standardExpression: standard,
      explanation: `两项可以统一为 ${base} × ${formatNum(aVal / base * k1)} + ${base} × ${formatNum(k2 / 10)} = ${base} × (${formatNum(aVal / base * k1)} + ${formatNum(k2 / 10)}) = ${standard}。`,
    },
    hints: [`试着把 ${formatNum(aVal)} 写成 ${base} × 0.1，看看能不能提出公因数 ${base}`],
    xpBase: 15 + (difficulty - 1) * 5,
  };
}

// ============================================================
// 分发器：每个 subtype tag 内部按"识别 + 执行"各占一半
// ============================================================

function dispatchLow(difficulty: number, id: string): Question {
  // C1档内梯度规范化：d=2 辨识为主（80%），d=3 执行为主（80%）
  const recognizeProb = difficulty <= 2 ? 0.8 : 0.2;
  return Math.random() < recognizeProb
    ? generateRecognizeSimplifiableLow(difficulty, id)
    : generateFillSplitLow(difficulty, id);
}

function dispatchMid(difficulty: number, id: string): Question {
  const r = Math.random();
  if (r < 0.30) return generateRecognizeNotSimplifiable(difficulty, id);
  if (r < 0.55) return generateRecognizeMethod(difficulty, id);
  if (r < 0.80) return generateFillSplitMid(difficulty, id);
  return generateMidPickTransform(difficulty, id);
}

function dispatchHigh(difficulty: number, id: string): Question {
  const r = Math.random();
  if (r < 0.30) return generateRecognizeMulti(difficulty, id);
  if (r < 0.55) return generateErrorDiagnoseHigh(difficulty, id);
  if (r < 0.80) return generateHiddenFactorExec(difficulty, id);
  // 回退：中档路径也可以混入
  return generateFillSplitMid(difficulty, id);
}

// ============================================================
// Main generator
// ============================================================

export function generateMultiStep(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  // 每个 tag 都走"档位相符的识别+执行分发"
  const low: SubtypeEntry[] = [
    { tag: 'bracket-normal',    weight: 35, gen: () => dispatchLow(difficulty, id) },
    { tag: 'extract-factor',    weight: 30, gen: () => dispatchLow(difficulty, id) },
    { tag: 'decimal-two-step',  weight: 35, gen: () => dispatchLow(difficulty, id) },
  ];
  const mid: SubtypeEntry[] = [
    { tag: 'bracket-hard',      weight: 30, gen: () => dispatchMid(difficulty, id) },
    { tag: 'extract-factor',    weight: 25, gen: () => dispatchMid(difficulty, id) },
    { tag: 'decimal-two-step',  weight: 25, gen: () => dispatchMid(difficulty, id) },
    { tag: 'simplify-subtract', weight: 20, gen: () => dispatchMid(difficulty, id) },
    { tag: 'bracket-normal',    weight: 0,  gen: () => dispatchMid(difficulty, id) }, // 兼容旧 filter
  ];
  const high: SubtypeEntry[] = [
    { tag: 'bracket-demon',      weight: 30, gen: () => dispatchHigh(difficulty, id) },
    { tag: 'extract-factor',     weight: 25, gen: () => dispatchHigh(difficulty, id) },
    { tag: 'decimal-multi-step', weight: 25, gen: () => dispatchHigh(difficulty, id) },
    { tag: 'decimal-chain',      weight: 20, gen: () => dispatchHigh(difficulty, id) },
    { tag: 'bracket-hard',       weight: 0,  gen: () => dispatchHigh(difficulty, id) },
    { tag: 'bracket-normal',     weight: 0,  gen: () => dispatchHigh(difficulty, id) },
    { tag: 'simplify-subtract',  weight: 0,  gen: () => dispatchHigh(difficulty, id) },
  ];

  const entries = difficulty <= 5 ? low : difficulty <= 7 ? mid : high;
  return pickSubtype(entries, subtypeFilter);
}
