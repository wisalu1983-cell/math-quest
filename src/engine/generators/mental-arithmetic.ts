import type { Question, ComputationStep } from '@/types';
import type { GeneratorParams } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeEntry } from '../index';
import type { SubtypeDef } from '@/types/gamification';

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---------------------------------------------------------------------------
// 子线 A：纯算术心算
// 根据 v2.2 规格（2 档，对齐 TOPIC_STAR_CAP=3）：
//   档 1 (d≤5): 一步题 + 两步无括号，两位数加减/表内乘除/整十整百差；少量陷阱
//   档 2 (d≥6): 合并原"中档陷阱"（退位边界/中间含0/接近整数减法）+
//               原"高档拆分技巧"（末尾0管理/25×24 拆分/4500÷25 拆分）
// ---------------------------------------------------------------------------

type Trio = [number, number, number];

function lowAdd(): Trio {
  // 两位数 + 两位数 或 整十整百差
  if (Math.random() < 0.25) {
    const base = Math.random() < 0.5 ? 10 : 100;
    const a = randInt(1, 9) * base;
    const b = randInt(1, 9) * base;
    return [a, b, a + b];
  }
  const a = randInt(10, 99);
  const b = randInt(10, 99);
  return [a, b, a + b];
}

function lowSub(): Trio {
  if (Math.random() < 0.25) {
    const base = Math.random() < 0.5 ? 10 : 100;
    const a = randInt(3, 9) * base;
    const b = randInt(1, (a / base) - 1) * base;
    return [a, b, a - b];
  }
  const a = randInt(20, 99);
  const b = randInt(10, a);
  return [a, b, a - b];
}

function lowMul(): Trio {
  // 表内乘法：两端都在 2-9
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  return [a, b, a * b];
}

function lowDiv(): Trio {
  // 表内除法：整除
  const b = randInt(2, 9);
  const q = randInt(2, 9);
  return [b * q, b, q];
}

// 中档陷阱题池 ----------------------------------------------------------------

/** 退位边界：1000-997、1000-3 等 */
function midSubBorrowEdge(): Trio {
  const pattern = randInt(0, 2);
  if (pattern === 0) {
    // 1000-997 样式
    const a = pick([100, 1000, 10000] as const);
    const b = a - randInt(1, 20);
    return [a, b, a - b];
  }
  if (pattern === 1) {
    // 503-498 接近整数
    const base = randInt(2, 9) * 100;
    const a = base + randInt(1, 9);
    const b = base - randInt(1, 9);
    return [a, b, a - b];
  }
  // 350-178 多次退位
  const a = randInt(2, 9) * 100 + randInt(10, 99);
  const b = randInt(100, a - 10);
  return [a, b, a - b];
}

/** 中间含 0 乘法：208×5、302×4 */
function midMulMidZero(): Trio {
  // a 形如 X0Y（百位非0、十位为0、个位非0）或 X00Y
  const hundreds = randInt(2, 9);
  const units = randInt(1, 9);
  const a = hundreds * 100 + units; // 形如 X0Y
  const b = randInt(3, 9);
  return [a, b, a * b];
}

/** 中档加法：连进位或跨整百 */
function midAdd(): Trio {
  if (Math.random() < 0.5) {
    // 三位数 + 两位数
    const a = randInt(100, 999);
    const b = randInt(10, 99);
    return [a, b, a + b];
  }
  // 三位数 + 三位数
  const a = randInt(100, 899);
  const b = randInt(100, 999 - a + 100);
  return [a, b, a + b];
}

/** 中档减法：混合陷阱 */
function midSub(): Trio {
  const pattern = randInt(0, 2);
  if (pattern === 0) return midSubBorrowEdge();
  // 三位数 - 三位数，退位后忘减1
  const a = randInt(200, 999);
  const b = randInt(50, a - 10);
  return [a, b, a - b];
}

/** 中档除法：三位数 ÷ 一位数 */
function midDiv(): Trio {
  const b = randInt(2, 9);
  const q = randInt(20, 150);
  return [b * q, b, q];
}

// 高档：末尾0管理 / 需拆分 ----------------------------------------------------

/** 末尾0乘法：250×40、50×140、70×80 */
function highMulTrailingZero(): Trio {
  const pattern = randInt(0, 2);
  if (pattern === 0) {
    // 整十 × 整十：50×140、70×80
    const a = randInt(2, 9) * 10;
    const b = randInt(2, 9) * 10;
    return [a, b, a * b];
  }
  if (pattern === 1) {
    // 整百 × 整十：250×40、150×20
    const a = randInt(1, 9) * 50; // 50/100/150/200/...
    const b = randInt(2, 9) * 10;
    return [a, b, a * b];
  }
  // 一位数末尾0 × 整十：80×15、60×25
  const a = randInt(2, 9) * 10;
  const b = pick([15, 25, 35, 45, 55] as const);
  return [a, b, a * b];
}

/** 需拆分的乘法：25×24=25×4×6、125×16=125×8×2、25×36、125×24 */
function highMulFactorSplit(): Trio {
  const patterns: Trio[] = [
    [25, 24, 600],    // 25×4×6
    [25, 32, 800],    // 25×4×8
    [25, 36, 900],    // 25×4×9
    [25, 16, 400],    // 25×4×4
    [125, 16, 2000],  // 125×8×2
    [125, 24, 3000],  // 125×8×3
    [125, 32, 4000],  // 125×8×4
    [125, 8, 1000],
    [75, 12, 900],    // 75×4×3
    [50, 16, 800],
  ];
  const [a, b, ans] = pick(patterns);
  // 50% 交换顺序
  return Math.random() < 0.5 ? [a, b, ans] : [b, a, ans];
}

/** 末尾0抵消除法：4500÷50、6000÷30、8400÷20 */
function highDivTrailingZero(): Trio {
  const quotient = randInt(2, 9) * 10; // 20~90
  const divisor = randInt(2, 9) * 10;  // 20~90
  const a = quotient * divisor;        // 保证整除
  return [a, divisor, quotient];
}

/** 需拆分的大数除法：4500÷25=180（=4500÷100×4）、4800÷25、3600÷25 */
function highDivFactorSplit(): Trio {
  const patterns: Trio[] = [
    [4500, 25, 180],
    [4800, 25, 192],  // 4800÷25=192（非整百商但可拆）
    [3600, 25, 144],
    [5000, 25, 200],
    [7500, 25, 300],
    [6000, 125, 48],
    [8000, 125, 64],
    [2500, 125, 20],
    [4000, 125, 32],
  ];
  return pick(patterns);
}

/** 高档加法：三位数进位为主 + 少量口算友好四位数（补数凑整） */
function highAdd(): Trio {
  if (Math.random() < 0.3) {
    // 口算友好四位数：凑整补数（如 997+3=1000、2998+2=3000）
    const base = pick([1000, 2000, 3000, 5000] as const);
    const b = randInt(1, 15);
    const a = base - b;
    return [a, b, base];
  }
  // 三位数 + 三位数（含进位）
  const a = randInt(100, 899);
  const b = randInt(100, 999 - a);
  return [a, b, a + b];
}

/** 高档减法：三位数退位为主 + 少量口算友好四位数（凑整差） */
function highSub(): Trio {
  const pattern = randInt(0, 2);
  if (pattern === 0) {
    // 退位边界：1000-997、10000-9997 等
    const a = pick([1000, 10000] as const);
    const b = a - randInt(1, 20);
    return [a, b, a - b];
  }
  if (pattern === 1) {
    // 三位数 - 三位数（多次退位）
    const a = randInt(200, 999);
    const b = randInt(100, a - 10);
    return [a, b, a - b];
  }
  // 三位数 - 两位数
  const a = randInt(100, 999);
  const b = randInt(10, 99);
  return [a, b, a - b];
}

/** 按档位+运算符选数。返回 [a, b, answer] */
function generatePair(difficulty: number, op: '+' | '-' | '×' | '÷'): Trio {
  if (difficulty <= 5) {
    if (difficulty <= 3) {
      // 档1-低 (d=2~3)：低档函数——两位数加减/表内乘除
      if (op === '+') return lowAdd();
      if (op === '-') return lowSub();
      if (op === '×') return lowMul();
      return lowDiv();
    }
    // 档1-高 (d=4~5)：复用中档函数——含进退位/较大操作数
    if (op === '+') return midAdd();
    if (op === '-') return midSub();
    if (op === '×') return midMulMidZero();
    return midDiv();
  }
  // 档 2：合并原"中档陷阱"+ 原"高档拆分技巧"——75% 取高档技巧池，25% 取中档陷阱池
  // 权重由 0.5 调至 0.75（子计划 2.5 §S2-T3 方案 B），让 A01 S2-LB「口算拆分技巧」lane
  // 在 d≥6 时真正以"拆分/末尾0/凑整技巧"为主导，名实对齐
  const useHighPool = Math.random() < 0.75;
  if (op === '+') return useHighPool ? highAdd() : midAdd();
  if (op === '-') return useHighPool ? highSub() : midSub();
  if (op === '×') {
    if (!useHighPool) return midMulMidZero();
    // 高档乘法：60% 末尾0 / 40% 需拆分
    return Math.random() < 0.6 ? highMulTrailingZero() : highMulFactorSplit();
  }
  // ÷
  if (!useHighPool) return midDiv();
  // 高档除法：50% 末尾0抵消 / 50% 需拆分
  return Math.random() < 0.5 ? highDivTrailingZero() : highDivFactorSplit();
}

function generateSingleStep(forcedOp: '+' | '-' | '×' | '÷', difficulty: number, id: string): Question {
  const op = forcedOp;
  const [a, b, numAnswer] = generatePair(difficulty, op);
  const expression = `${a} ${op} ${b}`;

  const hintText =
    op === '+' ? (difficulty >= 8 ? `看看能不能凑整：${a} 接近哪个整百/整千？` : `试试把 ${a} 拆分成更容易计算的数`) :
    op === '-' ? (difficulty >= 6 ? `注意退位：${b} 距离 ${a} 还差多少？` : `想想 ${b} + ? = ${a}`) :
    op === '×' ? (
      difficulty >= 8
        ? `试试找因数：${b} 能拆成两个更好算的数吗？`
        : (b >= 10 ? `${a} × ${b} 可以拆成 ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10}` : '回忆一下乘法口诀表')
    ) :
    // ÷
    difficulty >= 8
      ? `想想：分子分母能同时约去一个因数吗？`
      : `想想 ${b} × ? = ${a}`;

  const explanation = `${expression} = ${numAnswer}`;

  return {
    id, topicId: 'mental-arithmetic', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'mental-arithmetic', expression, operands: [a, b], operator: op },
    solution: { answer: numAnswer, explanation },
    hints: [hintText],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ---------------------------------------------------------------------------
// 子线 B：运算顺序
// v2.2 2 档：
//   档 1 (d≤5): 两步无括号 + 50% MC（先算哪步）+ 50% numeric-input
//   档 2 (d≥6): 原"中档含括号两步" + 原"高档运算顺序陷阱"（同级左右 / 混合优先级 /
//              丢项）混合池；全部 numeric-input（陷阱题必须学生算出最终值）
// ---------------------------------------------------------------------------

/** 为 MC 生成 3 个干扰选项 */
function generateWrongFirstSteps(expression: string, correctFirst: string): string[] {
  const tokens = expression.replace(/[()]/g, '').split(/\s+/);
  const seen = new Set<string>([correctFirst]);
  const candidates: string[] = [];

  const add = (s: string) => {
    if (!seen.has(s)) { seen.add(s); candidates.push(s); }
  };

  // 相邻二元子表达式（左->右错序）
  for (let i = 0; i < tokens.length - 2; i += 2) {
    add(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }

  // 正确步骤换运算符
  const [cA, cOp, cB] = correctFirst.split(/\s+/);
  if (cOp === '×' || cOp === '÷') {
    add(`${cA} + ${cB}`);
    add(`${cA} - ${cB}`);
  } else {
    add(`${cA} × ${cB}`);
  }

  // 非相邻数对
  const nums = tokens.filter((_, i) => i % 2 === 0);
  const ops = tokens.filter((_, i) => i % 2 === 1);
  for (let i = 0; i < nums.length && candidates.length < 3; i++) {
    for (let j = i + 1; j < nums.length && candidates.length < 3; j++) {
      for (const op of ops) {
        add(`${nums[i]} ${op} ${nums[j]}`);
      }
    }
  }

  return shuffle(candidates).slice(0, 3);
}

// 低档：两步无括号
function orderLow(): { expression: string; answer: number; firstStep: string; steps: ComputationStep[] } {
  const useMul = Math.random() < 0.5;
  if (useMul) {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    const c = randInt(5, 30);
    const pattern = randInt(0, 2); // 0: c+a×b, 1: c-a×b, 2: a×b+c
    const prod = a * b;
    if (pattern === 0) {
      return {
        expression: `${c} + ${a} × ${b}`,
        answer: c + prod,
        firstStep: `${a} × ${b}`,
        steps: [
          { stepIndex: 0, subExpression: `${a} × ${b}`, result: prod, annotation: '先算乘法' },
          { stepIndex: 1, subExpression: `${c} + ${prod}`, result: c + prod, annotation: '再算加法' },
        ],
      };
    }
    if (pattern === 1 && c > prod) {
      return {
        expression: `${c} - ${a} × ${b}`,
        answer: c - prod,
        firstStep: `${a} × ${b}`,
        steps: [
          { stepIndex: 0, subExpression: `${a} × ${b}`, result: prod, annotation: '先算乘法' },
          { stepIndex: 1, subExpression: `${c} - ${prod}`, result: c - prod, annotation: '再算减法' },
        ],
      };
    }
    return {
      expression: `${a} × ${b} + ${c}`,
      answer: prod + c,
      firstStep: `${a} × ${b}`,
      steps: [
        { stepIndex: 0, subExpression: `${a} × ${b}`, result: prod, annotation: '先算乘法' },
        { stepIndex: 1, subExpression: `${prod} + ${c}`, result: prod + c, annotation: '再算加法' },
      ],
    };
  }
  // 除法：a÷b+c 或 c+a÷b 或 c-a÷b
  const divisor = randInt(2, 9);
  const q = randInt(2, 12);
  const a = divisor * q;
  const c = randInt(5, 30);
  const pattern = randInt(0, 2);
  if (pattern === 0) {
    return {
      expression: `${a} ÷ ${divisor} + ${c}`,
      answer: q + c,
      firstStep: `${a} ÷ ${divisor}`,
      steps: [
        { stepIndex: 0, subExpression: `${a} ÷ ${divisor}`, result: q, annotation: '先算除法' },
        { stepIndex: 1, subExpression: `${q} + ${c}`, result: q + c, annotation: '再算加法' },
      ],
    };
  }
  if (pattern === 1) {
    return {
      expression: `${c} + ${a} ÷ ${divisor}`,
      answer: c + q,
      firstStep: `${a} ÷ ${divisor}`,
      steps: [
        { stepIndex: 0, subExpression: `${a} ÷ ${divisor}`, result: q, annotation: '先算除法' },
        { stepIndex: 1, subExpression: `${c} + ${q}`, result: c + q, annotation: '再算加法' },
      ],
    };
  }
  return {
    expression: `${c} - ${a} ÷ ${divisor}`,
    answer: c - q,
    firstStep: `${a} ÷ ${divisor}`,
    steps: [
      { stepIndex: 0, subExpression: `${a} ÷ ${divisor}`, result: q, annotation: '先算除法' },
      { stepIndex: 1, subExpression: `${c} - ${q}`, result: c - q, annotation: '再算减法' },
    ],
  };
}

// 中档：必含括号的两步
function orderMid(): { expression: string; answer: number; firstStep: string; steps: ComputationStep[] } {
  const pattern = randInt(0, 3);
  if (pattern === 0) {
    // (a + b) × c
    const a = randInt(5, 30);
    const b = randInt(5, 30);
    const c = randInt(2, 9);
    const sum = a + b;
    return {
      expression: `(${a} + ${b}) × ${c}`,
      answer: sum * c,
      firstStep: `${a} + ${b}`,
      steps: [
        { stepIndex: 0, subExpression: `${a} + ${b}`, result: sum, annotation: '先算括号内' },
        { stepIndex: 1, subExpression: `${sum} × ${c}`, result: sum * c, annotation: '再算乘法' },
      ],
    };
  }
  if (pattern === 1) {
    // (a - b) ÷ c，a-b 整除 c
    const c = randInt(2, 9);
    const q = randInt(3, 20);
    const diff = c * q;
    const b = randInt(5, 40);
    const a = diff + b;
    return {
      expression: `(${a} - ${b}) ÷ ${c}`,
      answer: q,
      firstStep: `${a} - ${b}`,
      steps: [
        { stepIndex: 0, subExpression: `${a} - ${b}`, result: diff, annotation: '先算括号内' },
        { stepIndex: 1, subExpression: `${diff} ÷ ${c}`, result: q, annotation: '再算除法' },
      ],
    };
  }
  if (pattern === 2) {
    // a - (b + c)
    const b = randInt(10, 40);
    const c = randInt(10, 40);
    const sum = b + c;
    const a = sum + randInt(10, 60);
    return {
      expression: `${a} - (${b} + ${c})`,
      answer: a - sum,
      firstStep: `${b} + ${c}`,
      steps: [
        { stepIndex: 0, subExpression: `${b} + ${c}`, result: sum, annotation: '先算括号内' },
        { stepIndex: 1, subExpression: `${a} - ${sum}`, result: a - sum, annotation: '再算减法' },
      ],
    };
  }
  // a ÷ (b + c)，b+c 能整除 a
  const q = randInt(3, 10);
  const b = randInt(2, 6);
  const c = randInt(2, 6);
  const sum = b + c;
  const a = sum * q;
  return {
    expression: `${a} ÷ (${b} + ${c})`,
    answer: q,
    firstStep: `${b} + ${c}`,
    steps: [
      { stepIndex: 0, subExpression: `${b} + ${c}`, result: sum, annotation: '先算括号内' },
      { stepIndex: 1, subExpression: `${a} ÷ ${sum}`, result: q, annotation: '再算除法' },
    ],
  };
}

// 高档：运算顺序陷阱
function orderHigh(): { expression: string; answer: number; firstStep: string; steps: ComputationStep[]; trap: string } {
  const pattern = randInt(0, 3);

  if (pattern === 0) {
    // 同级左右（÷×）：20÷4×5，学生想先算 4×5=20
    const patterns: Array<[number, number, number]> = [
      [20, 4, 5], [12, 3, 2], [24, 6, 2], [30, 5, 2], [40, 8, 2], [36, 9, 2], [48, 6, 4],
    ];
    const [a, b, c] = pick(patterns);
    const q = a / b;
    return {
      expression: `${a} ÷ ${b} × ${c}`,
      answer: q * c,
      firstStep: `${a} ÷ ${b}`,
      steps: [
        { stepIndex: 0, subExpression: `${a} ÷ ${b}`, result: q, annotation: '同级运算从左到右，先算除法' },
        { stepIndex: 1, subExpression: `${q} × ${c}`, result: q * c, annotation: '再算乘法' },
      ],
      trap: '同级左到右：学生易先算 b×c',
    };
  }

  if (pattern === 1) {
    // 同级左右（减加）：4.3-1.6+0.4，学生易先算 1.6+0.4
    const patterns: Array<[number, number, number]> = [
      [43, 16, 4], // 4.3-1.6+0.4 = 3.1（放大10倍）
      [85, 37, 13], // 8.5-3.7+1.3=6.1
      [97, 52, 8],  // 9.7-5.2+0.8=5.3
      [56, 28, 12], // 5.6-2.8+1.2=4.0
    ];
    const [A, B, C] = pick(patterns);
    const expr = `${A / 10} - ${B / 10} + ${C / 10}`;
    const ans = (A - B + C) / 10;
    return {
      expression: expr,
      answer: Math.round(ans * 10) / 10,
      firstStep: `${A / 10} - ${B / 10}`,
      steps: [
        { stepIndex: 0, subExpression: `${A / 10} - ${B / 10}`, result: (A - B) / 10, annotation: '同级从左到右' },
        { stepIndex: 1, subExpression: `${(A - B) / 10} + ${C / 10}`, result: ans, annotation: '再算加法' },
      ],
      trap: '同级左到右：学生易先算 b+c',
    };
  }

  if (pattern === 2) {
    // 混合优先级"三明治"：a + b÷c + d，学生易连加
    const patterns: Array<{ a: number; b: number; c: number; d: number }> = [
      { a: 5, b: 12, c: 6, d: 3 },     // 5+2+3=10
      { a: 7, b: 6, c: 2, d: 4 },      // 7+3+4=14
      { a: 9, b: 15, c: 3, d: 2 },     // 9+5+2=16
      { a: 8, b: 20, c: 4, d: 1 },     // 8+5+1=14
      { a: 6, b: 24, c: 8, d: 2 },     // 6+3+2=11
    ];
    const { a, b, c, d } = pick(patterns);
    const q = b / c;
    return {
      expression: `${a} + ${b} ÷ ${c} + ${d}`,
      answer: a + q + d,
      firstStep: `${b} ÷ ${c}`,
      steps: [
        { stepIndex: 0, subExpression: `${b} ÷ ${c}`, result: q, annotation: '先算除法' },
        { stepIndex: 1, subExpression: `${a} + ${q}`, result: a + q, annotation: '再从左到右加' },
        { stepIndex: 2, subExpression: `${a + q} + ${d}`, result: a + q + d, annotation: '最后一步' },
      ],
      trap: '混合优先级：学生易把 a+b 连着加起来',
    };
  }

  // 丢项：a - b÷c，学生只算 b÷c
  const patterns: Array<{ a: number; b: number; c: number }> = [
    { a: 36, b: 135, c: 9 },    // 36-15=21
    { a: 50, b: 84, c: 4 },     // 50-21=29
    { a: 60, b: 144, c: 8 },    // 60-18=42
    { a: 40, b: 96, c: 6 },     // 40-16=24
    { a: 75, b: 144, c: 12 },   // 75-12=63
  ];
  const { a, b, c } = pick(patterns);
  const q = b / c;
  return {
    expression: `${a} - ${b} ÷ ${c}`,
    answer: a - q,
    firstStep: `${b} ÷ ${c}`,
    steps: [
      { stepIndex: 0, subExpression: `${b} ÷ ${c}`, result: q, annotation: '先算除法' },
      { stepIndex: 1, subExpression: `${a} - ${q}`, result: a - q, annotation: '再算减法（不能丢项）' },
    ],
    trap: '丢项：学生只算 b÷c 就交卷',
  };
}

function generateOperationOrder(difficulty: number, id: string): Question {
  let expression: string;
  let answer: number;
  let steps: ComputationStep[];
  let firstStep: string;
  let trap: string | null = null;

  if (difficulty <= 5) {
    // 档 1：两步无括号
    ({ expression, answer, firstStep, steps } = orderLow());
  } else if (difficulty <= 7) {
    // 档2-低 (d=6~7)：单括号改变顺序，两步混合顺序清晰（只用 orderMid）
    ({ expression, answer, firstStep, steps } = orderMid());
  } else {
    // 档2-高 (d=8~9)：多重顺序陷阱（同级左右/丢项）（只用 orderHigh）
    const res = orderHigh();
    expression = res.expression; answer = res.answer; firstStep = res.firstStep; steps = res.steps; trap = res.trap;
  }

  // 档 1：50% MC 先算哪一步 + 50% numeric-input
  // 档 2：100% numeric-input（陷阱题强制学生算出最终值）
  const useMC = difficulty <= 5 && Math.random() < 0.5;

  if (useMC) {
    const wrongOptions = generateWrongFirstSteps(expression, firstStep);
    const options = shuffle([firstStep, ...wrongOptions]);
    return {
      id, topicId: 'mental-arithmetic', type: 'multiple-choice', difficulty,
      prompt: `在 ${expression} 中，应该先算哪一步？`,
      data: { kind: 'multi-step' as const, expression, steps, options },
      solution: {
        answer: firstStep,
        steps: steps.map(s => s.annotation),
        explanation: `运算顺序：括号内优先，先乘除后加减，同级从左到右`,
      },
      hints: ['口诀：括号优先，先乘除后加减'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  const hint = trap
    ? `⚠ 小心：${trap}`
    : difficulty >= 6
      ? '注意括号优先，先乘除后加减'
      : '注意运算顺序';

  return {
    id, topicId: 'mental-arithmetic', type: 'numeric-input', difficulty,
    prompt: `按运算顺序计算: ${expression}`,
    data: { kind: 'multi-step' as const, expression, steps },
    solution: {
      answer,
      steps: steps.map(s => `${s.annotation}: ${s.subExpression} = ${s.result}`),
      explanation: `运算顺序：括号内优先，先乘除后加减${trap ? `（本题陷阱：${trap}）` : ''}`,
    },
    hints: [hint],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function getSubtypeEntries(): SubtypeDef[] {
  return [
    { tag: 'add',   weight: 20 },
    { tag: 'sub',   weight: 20 },
    { tag: 'mul',   weight: 20 },
    { tag: 'div',   weight: 20 },
    { tag: 'order', weight: 20 },
  ];
}

export function generateMentalArithmetic(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = [
    { tag: 'add',   weight: 20, gen: () => generateSingleStep('+', difficulty, id) },
    { tag: 'sub',   weight: 20, gen: () => generateSingleStep('-', difficulty, id) },
    { tag: 'mul',   weight: 20, gen: () => generateSingleStep('×', difficulty, id) },
    { tag: 'div',   weight: 20, gen: () => generateSingleStep('÷', difficulty, id) },
    { tag: 'order', weight: 20, gen: () => generateOperationOrder(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
