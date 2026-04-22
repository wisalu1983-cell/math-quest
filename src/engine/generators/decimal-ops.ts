import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';
import { formatNum } from './utils';

// v2.1 重构：A05 从"小数四则运算"改为"小数的性质与规律"
//
// 核心定位：
//   - 不考比大小（归 A02）
//   - 不考需要笔算的乘除（归 A03）
//   - 聚焦：位值、互换、移位、位数规律、方向辨析、循环节位置、反直觉性质
//
// 兼容策略：
//   - topicId 保留 'decimal-ops'，subtype 路由 tag 保留（add-sub / mul / div / shift / trap / compare / cyclic-div）
//   - 每个 tag 内部内容全部换为"性质/规律"类题；答案仍为 numeric-input / MC 形式
//
// 与 A02/A03 的边界：
//   - A02：不精确比较、估算方向、四舍五入
//   - A03：需列竖式的加减乘除
//   - A05：小数"这个数"的性质和运算规律（位值、移位、循环节位置、位数关系）

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) return [
    { tag: 'add-sub',  weight: 30 }, // 位值 / 互换
    { tag: 'mul',      weight: 30 }, // 简单移位 × / 特殊值乘法
    { tag: 'div',      weight: 25 }, // 简单移位 ÷
    { tag: 'compare',  weight: 15 }, // 移位等价比较
  ];
  if (difficulty <= 7) return [
    { tag: 'mul',       weight: 25 }, // 位数规律 / 方向实证
    { tag: 'div',       weight: 20 }, // 方向实证（×0.1 vs ÷0.1）
    { tag: 'add-sub',   weight: 15 }, // 位值延伸
    { tag: 'shift',     weight: 10 }, // 连续移位
    { tag: 'trap',      weight: 10 }, // <1×<1 反直觉实证
    { tag: 'compare',   weight: 10 }, // 移位等价比较
    { tag: 'cyclic-div', weight: 10 }, // 循环小数近似保留 1 位
  ];
  return [
    { tag: 'mul',       weight: 35 }, // <1×<1 反直觉 / 多位数规律
    { tag: 'div',       weight: 30 }, // 循环节位置推理
    { tag: 'compare',   weight: 15 }, // 复杂移位等价比较
    { tag: 'cyclic-div', weight: 10 }, // 循环小数保留 2 位
    { tag: 'trap',      weight: 10 }, // 概念陷阱实证
  ];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round(value: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(value * f) / f;
}

// ==================== 低档：add-sub = 位值 / 互换 ====================

function generatePlaceValueOrConvert(id: string, difficulty: number): Question {
  // C1档内梯度规范化：d=2 位值组合（variant 0,1），d=3 分数/小数互换（variant 2,3）
  const useConvert = difficulty >= 3;
  const variant = useConvert ? randInt(2, 3) : randInt(0, 1);

  // 变式 0：位值组合 —— "a 个十分之一 + b 个百分之一 = ?"
  if (variant === 0) {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    const answer = a / 10 + b / 100;
    const expression = `${a}个 1/10 + ${b}个 1/100`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `${a} 个十分之一加 ${b} 个百分之一，写成小数是多少？`,
      data: { kind: 'decimal-ops', expression, subtype: 'add-sub' },
      solution: {
        answer: formatNum(round(answer, 2)),
        explanation: `${a} 个 0.1 是 ${formatNum(a / 10)}，${b} 个 0.01 是 ${formatNum(b / 100)}，合起来是 ${formatNum(round(answer, 2))}`,
      },
      hints: ['1 个 0.1 = 0.1，1 个 0.01 = 0.01，按位相加'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 变式 1：三项位值 —— "a 个 1 + b 个 0.1 + c 个 0.01"
  if (variant === 1) {
    const a = randInt(1, 9);
    const b = randInt(0, 9);
    const c = randInt(0, 9);
    const answer = a + b / 10 + c / 100;
    const expression = `${a}个1 + ${b}个0.1 + ${c}个0.01`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `${a} 个 1、${b} 个 0.1、${c} 个 0.01 合起来是多少？`,
      data: { kind: 'decimal-ops', expression, subtype: 'add-sub' },
      solution: {
        answer: formatNum(round(answer, 2)),
        explanation: `按位组合：整数位 ${a}、十分位 ${b}、百分位 ${c} → ${formatNum(round(answer, 2))}`,
      },
      hints: ['整数部分、十分位、百分位按位填进来'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 变式 2：分数 → 小数（分母为 2/4/5/10/20/25/50/100）
  if (variant === 2) {
    const pairs: Array<[number, number]> = [
      [1, 2], [3, 4], [2, 5], [7, 10], [9, 20], [3, 25], [17, 50], [7, 100], [1, 4], [3, 5], [1, 5],
    ];
    const [num, den] = pairs[randInt(0, pairs.length - 1)];
    const answer = num / den;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `把分数 ${num}/${den} 化成小数（书写时请用小数形式）`,
      promptLatex: `\\frac{${num}}{${den}}`,
      data: { kind: 'decimal-ops', expression: `${num}/${den}`, subtype: 'add-sub' },
      solution: {
        answer: formatNum(round(answer, 3)),
        explanation: `${num} ÷ ${den} = ${formatNum(round(answer, 3))}`,
      },
      hints: ['分数化小数就是分子除以分母'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 变式 3：小数 → 分数（反向思考，答案是分母/分子对应的小数等价值 —— 保持 numeric-input，问学生"约分后分母是几"）
  const cases: Array<{ dec: number; expectDen: number; desc: string }> = [
    { dec: 0.5, expectDen: 2, desc: '0.5 = 1/?' },
    { dec: 0.25, expectDen: 4, desc: '0.25 = 1/?' },
    { dec: 0.2, expectDen: 5, desc: '0.2 = 1/?' },
    { dec: 0.1, expectDen: 10, desc: '0.1 = 1/?' },
    { dec: 0.75, expectDen: 4, desc: '0.75 = 3/?' },
    { dec: 0.4, expectDen: 5, desc: '0.4 = 2/?' },
  ];
  const c = cases[randInt(0, cases.length - 1)];
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `把 ${formatNum(c.dec)} 化成最简分数，分母是几？（${c.desc}）`,
    data: { kind: 'decimal-ops', expression: `${c.dec}→fraction`, subtype: 'add-sub' },
    solution: {
      answer: c.expectDen,
      explanation: `${formatNum(c.dec)} 写成分数先不约分（如 ${Math.round(c.dec * 100)}/100），然后化到最简，分母为 ${c.expectDen}`,
    },
    hints: ['先按小数位数写成 n/10、n/100，然后约分到最简'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ==================== 中档 add-sub：位值延伸（带补0的小数写法辨析） ====================

function generateMidPlaceExtend(id: string, difficulty: number): Question {
  // 末尾补0 / 去0 的等价识别：0.30 = 0.3 吗？以 numeric-input 形式：请把 0.30、0.300 化成最简小数
  const variant = randInt(0, 1);
  if (variant === 0) {
    const base = randInt(1, 99) / 10; // 1 位小数
    const padZeros = randInt(1, 3);
    const displayed = base.toFixed(1) + '0'.repeat(padZeros);
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `把 ${displayed} 化简为最简小数（去掉末尾多余的 0）`,
      data: { kind: 'decimal-ops', expression: displayed, subtype: 'add-sub' },
      solution: {
        answer: formatNum(base),
        explanation: `小数末尾的 0 不影响数的大小，${displayed} = ${formatNum(base)}`,
      },
      hints: ['小数末尾的 0 去掉，数的大小不变'],
      xpBase: 12 + (difficulty - 1) * 5,
    };
  }
  // 三位小数去末尾0
  const base2 = randInt(1, 999) / 100;
  const s = base2.toFixed(2) + '0';
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `${s} 这个小数，末尾 0 去掉后是？`,
    data: { kind: 'decimal-ops', expression: s, subtype: 'add-sub' },
    solution: {
      answer: formatNum(base2),
      explanation: `末尾的 0 可以去掉，${s} = ${formatNum(base2)}`,
    },
    hints: ['小数末尾的 0 去掉不改变大小'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ==================== 低档 mul：简单移位 × / 特殊值乘法 ====================

function generateLowMul(id: string, difficulty: number): Question {
  // C1档内梯度规范化：
  // d=3 (档1-低)：简单一步移位（×10, ÷100等）或特殊值（0.25×4=1）
  // d=4~5 (档1-高)：连续移位（×10÷100）或×0.1/÷0.1方向辨析
  if (difficulty >= 4) {
    // 档1-高：50% 方向辨析（×0.1 vs ÷0.1），50% 连续移位
    if (Math.random() < 0.5) {
      // 方向辨析：×0.1 等价于 ÷10，÷0.1 等价于 ×10
      const aScaled = randInt(11, 99);
      const a = aScaled / 10;
      const shift = Math.random() < 0.5 ? 0.1 : 0.01;
      const answer = a * shift;
      const expression = `${formatNum(a)} × ${formatNum(shift)}`;
      return {
        id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
        prompt: `计算: ${expression}`,
        data: { kind: 'decimal-ops', expression, subtype: 'mul' },
        solution: {
          answer: formatNum(round(answer, 4)),
          explanation: `乘 ${formatNum(shift)} 相当于小数点向左移 ${shift === 0.1 ? 1 : 2} 位：${expression} = ${formatNum(round(answer, 4))}`,
        },
        hints: [`× ${formatNum(shift)} 等价于 ÷ ${shift === 0.1 ? 10 : 100}`],
        xpBase: 10 + (difficulty - 1) * 5,
      };
    }
    // 连续移位：a × m ÷ n
    const a = randInt(1, 99) / 10;
    const shifts = [10, 100];
    const m = shifts[randInt(0, 1)];
    const n = shifts[randInt(0, 1)];
    const answer = a * m / n;
    const expression = `${formatNum(a)} × ${m} ÷ ${n}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: {
        answer: formatNum(round(answer, 4)),
        explanation: `先右移 ${Math.log10(m)} 位，再左移 ${Math.log10(n)} 位：${expression} = ${formatNum(round(answer, 4))}`,
      },
      hints: ['×10ⁿ 小数点右移 n 位，÷10ⁿ 小数点左移 n 位，按顺序做'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 档1-低 (d=3)：原逻辑（特殊值 20% + 简单单步移位 80%）
  if (Math.random() < 0.2) {
    const specials = [
      { a: 0.125, b: 8, answer: 1 },
      { a: 0.25, b: 4, answer: 1 },
      { a: 0.5, b: 2, answer: 1 },
      { a: 0.125, b: 16, answer: 2 },
      { a: 0.25, b: 8, answer: 2 },
      { a: 0.5, b: 4, answer: 2 },
      { a: 0.125, b: 24, answer: 3 },
    ];
    const s = specials[randInt(0, specials.length - 1)];
    const expression = `${formatNum(s.a)} × ${s.b}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: { answer: formatNum(s.answer), explanation: `${expression} = ${s.answer}（常见特殊值组合）` },
      hints: ['这是一个常见的特殊值组合，记住它！'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 简单右移：a × 10/100/1000
  const shifts = [10, 100, 1000];
  const shift = shifts[randInt(0, 2)];
  const dp = randInt(1, 2);
  const factor = Math.pow(10, dp);
  const aScaled = randInt(10, 99 * factor);
  const a = aScaled / factor;
  const answer = a * shift;
  const expression = `${formatNum(a)} × ${shift}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'mul' },
    solution: { answer: formatNum(answer), explanation: `乘 ${shift}，小数点向右移 ${Math.log10(shift)} 位` },
    hints: [`乘 ${shift} 时，小数点向右移动 ${Math.log10(shift)} 位`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ==================== 低档 div：简单移位 ÷ ====================

function generateLowDiv(id: string, difficulty: number): Question {
  // a ÷ 10/100/1000
  const shifts = [10, 100, 1000];
  const shift = shifts[randInt(0, 2)];
  const a = randInt(1, 999);
  const answer = a / shift;
  const expression = `${a} ÷ ${shift}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'div' },
    solution: { answer: formatNum(round(answer, 3)), explanation: `除以 ${shift}，小数点向左移 ${Math.log10(shift)} 位（位数不够用 0 补足）` },
    hints: [`除以 ${shift} 时，小数点向左移动 ${Math.log10(shift)} 位`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ==================== 中档 mul：位数规律 / 方向实证 ====================

function generateMidMulPattern(id: string, difficulty: number): Question {
  // v2.2：降低 ×0.1/0.01 系列权重，扩大 0.25/0.5/0.125/1.25/2.5 的覆盖
  // 骰子：0.25 = 变式 0（方向实证），0.25-0.60 = 变式 3（新：多样小数乘法），剩下 = 原变式 1/2
  const roll = Math.random();

  // 变式 0（降权至 25%）：方向实证 —— a × 0.1 / × 0.01
  if (roll < 0.20) {
    const aScaled = randInt(11, 99);
    const a = aScaled / 10;
    const shift = Math.random() < 0.5 ? 0.1 : 0.01;
    const answer = a * shift;
    const expression = `${formatNum(a)} × ${formatNum(shift)}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: {
        answer: formatNum(round(answer, 4)),
        explanation: `乘 ${formatNum(shift)} 相当于小数点向左移 ${shift === 0.1 ? 1 : 2} 位：${expression} = ${formatNum(round(answer, 4))}`,
      },
      hints: [`乘 ${formatNum(shift)} 等价于除以 ${shift === 0.1 ? 10 : 100}`],
      xpBase: 12 + (difficulty - 1) * 5,
    };
  }

  // 新变式 3（权重 40%）：多样化乘数 —— a × {0.25, 0.5, 0.125, 1.25, 2.5}
  // 考察"乘以 <1 的数 = 除以它的倒数"的数感
  if (roll < 0.60) {
    const pool: Array<{ mul: number; equiv: string }> = [
      { mul: 0.25,  equiv: '÷ 4' },
      { mul: 0.5,   equiv: '÷ 2' },
      { mul: 0.125, equiv: '÷ 8' },
      { mul: 1.25,  equiv: '× 5 ÷ 4' },
      { mul: 2.5,   equiv: '× 5 ÷ 2' },
    ];
    const { mul, equiv } = pool[randInt(0, pool.length - 1)];
    // 选择能整除的 a，保证结果好看
    const base = mul === 0.25 ? 4 : mul === 0.5 ? 2 : mul === 0.125 ? 8 : mul === 1.25 ? 4 : 2;
    const a = randInt(1, 20) * base;
    const answer = round(a * mul, 4);
    const expression = `${a} × ${formatNum(mul)}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: {
        answer: formatNum(answer),
        explanation: `${formatNum(mul)} 的倒数视角：${a} × ${formatNum(mul)} 等价于 ${a} ${equiv} = ${formatNum(answer)}`,
      },
      hints: [`× ${formatNum(mul)} 可以转换成 ${equiv}，心算更快`],
      xpBase: 13 + (difficulty - 1) * 5,
    };
  }

  // 变式 1（权重 20%）：位数规律 —— 0.3 × 0.04 = ? 让学生算出后自行体会位数
  if (roll < 0.80) {
    const a10 = randInt(1, 9);    // 0.1~0.9
    const b100 = randInt(1, 9);   // 0.01~0.09
    const a = a10 / 10;
    const b = b100 / 100;
    const answerScaled = a10 * b100; // 积 × 1000
    const answer = answerScaled / 1000;
    const expression = `${formatNum(a)} × ${formatNum(b)}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: {
        answer: formatNum(round(answer, 4)),
        explanation: `${a10} × ${b100} = ${answerScaled}；两个因数共 3 位小数，积点 3 位小数：${formatNum(round(answer, 4))}`,
      },
      hints: ['先按整数算 → 数两个因数共几位小数 → 在积里点出对应位数'],
      xpBase: 12 + (difficulty - 1) * 5,
    };
  }

  // 变式 2（权重 20%）：×1、×>1、×<1 对比
  const aScaled2 = randInt(11, 99) / 10;
  const bVariants = [0.8, 0.9, 1, 1.1, 1.2];
  const b = bVariants[randInt(0, bVariants.length - 1)];
  const answer2 = round(aScaled2 * b, 4);
  const expression2 = `${formatNum(aScaled2)} × ${formatNum(b)}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression2}`,
    data: { kind: 'decimal-ops', expression: expression2, subtype: 'mul' },
    solution: {
      answer: formatNum(answer2),
      explanation: `${expression2} = ${formatNum(answer2)}；${b < 1 ? `因为乘 ${formatNum(b)} < 1，所以积 ${formatNum(answer2)} < ${formatNum(aScaled2)}` : b > 1 ? `因为乘 ${formatNum(b)} > 1，所以积 ${formatNum(answer2)} > ${formatNum(aScaled2)}` : `乘 1 结果不变`}`,
    },
    hints: ['看因数和 1 的大小关系，可以预判积和原数的大小关系'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ==================== 中档 div：方向辨析（÷小于1 vs ÷大于1） ====================

function generateMidDivPattern(id: string, difficulty: number): Question {
  // v2.2：20% 出 ÷0.1/÷0.01 方向实证，80% 出多样化除数 {0.25, 0.5, 0.125, 1.25, 2.5}
  const useShift = Math.random() < 0.20;
  if (useShift) {
    const aScaled = randInt(11, 99);
    const a = aScaled / 10;
    const b = Math.random() < 0.5 ? 0.1 : 0.01;
    const answer = a / b;
    const expression = `${formatNum(a)} ÷ ${formatNum(b)}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'div' },
      solution: {
        answer: formatNum(round(answer, 4)),
        explanation: `${expression} = ${formatNum(round(answer, 4))}；除以 ${formatNum(b)}（<1），商比被除数大`,
      },
      hints: ['÷ 0.1 = × 10，÷ 0.01 = × 100'],
      xpBase: 12 + (difficulty - 1) * 5,
    };
  }
  // 多样化除数池：考察"÷ 小数 = × 倒数"
  const pool: Array<{ div: number; equiv: string }> = [
    { div: 0.25,  equiv: '× 4' },
    { div: 0.5,   equiv: '× 2' },
    { div: 0.125, equiv: '× 8' },
    { div: 1.25,  equiv: '× 4 ÷ 5' },
    { div: 2.5,   equiv: '× 2 ÷ 5' },
  ];
  const { div, equiv } = pool[randInt(0, pool.length - 1)];
  // 选能整除的被除数
  const base = div === 0.25 ? 1 : div === 0.5 ? 1 : div === 0.125 ? 1 : div === 1.25 ? 5 : 5;
  const a = randInt(2, 24) * base;
  const answer = round(a / div, 4);
  const expression = `${a} ÷ ${formatNum(div)}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'div' },
    solution: {
      answer: formatNum(answer),
      explanation: `${formatNum(div)} 的倒数视角：${a} ÷ ${formatNum(div)} 等价于 ${a} ${equiv} = ${formatNum(answer)}`,
    },
    hints: [`÷ ${formatNum(div)} 可以转换成 ${equiv}，心算更快`],
    xpBase: 13 + (difficulty - 1) * 5,
  };
}

// ==================== 中档 shift：连续移位 ====================

function generateShiftChain(id: string, difficulty: number): Question {
  // 40% 形式：a × 0.1 / 0.01 / 0.001 （左移等价题）
  if (Math.random() < 0.4) {
    const shifts = [0.1, 0.01];
    if (difficulty >= 8) shifts.push(0.001);
    const shift = shifts[randInt(0, shifts.length - 1)];
    const shiftPlaces = Math.round(-Math.log10(shift));
    const aScaled = randInt(11, 999);
    const a = aScaled / (Math.random() < 0.5 ? 1 : 10);
    const answer = round(a * shift, 4);
    const expression = `${formatNum(a)} × ${formatNum(shift)}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'shift' },
      solution: { answer: formatNum(answer), explanation: `乘 ${formatNum(shift)} 就是小数点向左移 ${shiftPlaces} 位` },
      hints: [`乘 ${formatNum(shift)} 等价于 ÷${Math.pow(10, shiftPlaces)}，小数点向左移 ${shiftPlaces} 位`],
      xpBase: 13 + (difficulty - 1) * 5,
    };
  }

  // 60% 形式：连续移位 a × m ÷ n   或   a ÷ m × n
  const a = randInt(1, 99) / 10; // 0.1~9.9
  const m = [10, 100, 1000][randInt(0, 2)];
  const n = [10, 100, 1000][randInt(0, 2)];
  const useDiv = Math.random() < 0.5;
  const answer = useDiv ? (a / m) * n : (a * m) / n;
  const expression = useDiv ? `${formatNum(a)} ÷ ${m} × ${n}` : `${formatNum(a)} × ${m} ÷ ${n}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'shift' },
    solution: {
      answer: formatNum(round(answer, 4)),
      explanation: `${expression}：连续移位，先${useDiv ? '左' : '右'}移 ${Math.log10(m)} 位，再${useDiv ? '右' : '左'}移 ${Math.log10(n)} 位`,
    },
    hints: ['×10ⁿ 小数点右移 n 位，÷10ⁿ 小数点左移 n 位，按顺序做'],
    xpBase: 13 + (difficulty - 1) * 5,
  };
}

// ==================== 中档 trap：<1 × <1 实证 ====================

function generateLt1Trap(id: string, difficulty: number): Question {
  // 两个都 <1，引导"积比两个因数都小"
  const a10 = randInt(2, 9);
  const b10 = randInt(2, 9);
  const a = a10 / 10;
  const b = b10 / 10;
  const answer = (a10 * b10) / 100;
  const expression = `${formatNum(a)} × ${formatNum(b)}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'mul' },
    solution: {
      answer: formatNum(round(answer, 4)),
      explanation: `${expression} = ${formatNum(round(answer, 4))}；两个因数都小于 1，所以积比任何一个因数都小`,
    },
    hints: ['两个都<1 时，积小于任意一个因数'],
    xpBase: 13 + (difficulty - 1) * 5,
  };
}

// ==================== compare：按难度分档的比较题 ====================

/** 低档 compare：移位结果与具体数比较（需要先算出移位结果，再和目标数比） */
function generateCompareLow_A05(id: string, difficulty: number): Question {
  let leftExpr: string;
  let rightExpr: string;
  let answer: '>' | '<' | '=';
  let explanation: string;

  const roll = Math.random();
  if (roll < 0.10) {
    // 移位等价识别（=）：a × 100 ○ a ÷ 0.01
    const a = randInt(11, 99) / 10;
    const pairs: Array<[string, string]> = [
      [`${formatNum(a)} × 100`, `${formatNum(a)} ÷ 0.01`],
      [`${formatNum(a)} × 10`, `${formatNum(a)} ÷ 0.1`],
      [`${formatNum(a)} ÷ 100`, `${formatNum(a)} × 0.01`],
    ];
    [leftExpr, rightExpr] = pairs[randInt(0, pairs.length - 1)];
    answer = '=';
    explanation = `两边等价：× 10 = ÷ 0.1，× 100 = ÷ 0.01`;
  } else {
    // 移位运算 vs 具体数（需要先算出结果，再比较）
    const a = randInt(1, 99) / 10;
    const shift = [10, 100][randInt(0, 1)];
    const isDiv = Math.random() < 0.3;
    const computed = isDiv ? round(a / shift, 4) : a * shift;
    const opStr = isDiv ? '÷' : '×';

    // 生成偏移后的目标数：60% 不等，40% 相等
    const makeEqual = Math.random() < 0.05; // 总体 ~14.5% 相等
    let target: number;
    if (makeEqual) {
      target = computed;
    } else {
      const offset = randInt(1, 5) * (Math.random() < 0.5 ? 1 : -1);
      target = computed + offset;
      if (target < 0) target = computed + Math.abs(offset);
    }
    leftExpr = `${formatNum(a)} ${opStr} ${shift}`;
    rightExpr = `${formatNum(target)}`;
    answer = computed > target ? '>' : computed < target ? '<' : '=';
    explanation = `${formatNum(a)} ${opStr} ${shift} = ${formatNum(computed)}，${formatNum(computed)} ${answer} ${formatNum(target)}`;
  }

  const comparison = `${leftExpr} ○ ${rightExpr}`;
  return {
    id, topicId: 'decimal-ops', type: 'multiple-choice', difficulty,
    prompt: `在 ○ 里填上合适的符号：${comparison}`,
    data: { kind: 'decimal-ops', expression: comparison, subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer, explanation },
    hints: ['先算出左边的结果，再和右边比较'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 中档 compare：与原数比较（a op b ○ a，需判断 b 和 1 的关系） */
/**
 * 中档 compare：多步推理 / 跨运算对比
 *
 * 四种题型（均来自真实考卷中档）：
 * V0 — 跨运算对比：a ÷ b ○ a × b（同数两种运算，需同时推理两条规则）
 * V1 — 商与 1 比较：a ÷ b ○ 1（需判断 a、b 大小关系）
 * V2 — 等价乘除识别：a × 0.25 ○ a ÷ 4（需知道 ×0.25 = ÷4）
 * V3 — 接近 1 的乘数：a × 0.99 ○ a（数值接近产生心理犹豫）
 */
function generateCompareMid_A05(id: string, difficulty: number): Question {
  const variant = randInt(0, 3);
  let leftExpr: string;
  let rightExpr: string;
  let answer: '>' | '<' | '=';
  let explanation: string;

  if (variant === 0) {
    // V0: a ÷ b ○ a × b （b < 1 → 左大右小；b > 1 → 左小右大）
    const a = Number((randInt(11, 99) / 10).toFixed(1));
    const bLt1 = Math.random() < 0.5;
    const b = bLt1
      ? Number((randInt(2, 8) / 10).toFixed(1))   // 0.2~0.8
      : Number((randInt(12, 25) / 10).toFixed(1)); // 1.2~2.5
    leftExpr = `${formatNum(a)} ÷ ${formatNum(b)}`;
    rightExpr = `${formatNum(a)} × ${formatNum(b)}`;
    answer = bLt1 ? '>' : '<';
    explanation = bLt1
      ? `b < 1 时，÷b 放大而 ×b 缩小，所以 ÷${formatNum(b)} > ×${formatNum(b)}`
      : `b > 1 时，÷b 缩小而 ×b 放大，所以 ÷${formatNum(b)} < ×${formatNum(b)}`;
  } else if (variant === 1) {
    // V1: a ÷ b ○ 1 （a > b → >1；a < b → <1；a = b → =1）
    const base = randInt(11, 90) / 10;
    const offset = randInt(1, 15) / 10;
    const aGtB = Math.random() < 0.5;
    const a = aGtB ? round(base + offset, 1) : round(base, 1);
    const b = aGtB ? round(base, 1) : round(base + offset, 1);
    leftExpr = `${formatNum(a)} ÷ ${formatNum(b)}`;
    rightExpr = '1';
    answer = a > b ? '>' : '<';
    explanation = `被除数${a > b ? '大于' : '小于'}除数，商${a > b ? '大于' : '小于'} 1`;
  } else if (variant === 2) {
    // V2: a × 0.25 ○ a ÷ 4（等价 =）或 a × 0.5 ○ a ÷ 2 等
    const a = Number((randInt(12, 88) / 10).toFixed(1));
    const pairs: Array<[string, string, string]> = [
      [`${formatNum(a)} × 0.25`, `${formatNum(a)} ÷ 4`, '×0.25 = ÷4'],
      [`${formatNum(a)} × 0.5`, `${formatNum(a)} ÷ 2`, '×0.5 = ÷2'],
      [`${formatNum(a)} × 0.125`, `${formatNum(a)} ÷ 8`, '×0.125 = ÷8'],
      [`${formatNum(a)} ÷ 0.5`, `${formatNum(a)} × 2`, '÷0.5 = ×2'],
      [`${formatNum(a)} ÷ 0.25`, `${formatNum(a)} × 4`, '÷0.25 = ×4'],
    ];
    const [l, r, rule] = pairs[randInt(0, pairs.length - 1)];
    leftExpr = l; rightExpr = r; answer = '=';
    explanation = rule;
  } else {
    // V3: a × 接近1的数 ○ a（0.99/1.01/0.98 等，制造心理犹豫）
    const a = Number((randInt(15, 95) / 10).toFixed(1));
    const nearOnes = [0.98, 0.99, 1.01, 1.02];
    const b = nearOnes[randInt(0, nearOnes.length - 1)];
    const op = Math.random() < 0.5 ? '×' : '÷';
    leftExpr = `${formatNum(a)} ${op} ${b}`;
    rightExpr = `${formatNum(a)}`;
    if (op === '×') {
      answer = b > 1 ? '>' : '<';
    } else {
      answer = b > 1 ? '<' : '>';
    }
    explanation = `${op === '×' ? '乘以' : '除以'}${b > 1 ? '大于' : '小于'} 1 的数，结果${answer === '>' ? '大于' : '小于'}原数`;
  }

  const comparison = `${leftExpr} ○ ${rightExpr}`;
  return {
    id, topicId: 'decimal-ops', type: 'multiple-choice', difficulty,
    prompt: `在 ○ 里填上合适的符号：${comparison}`,
    data: { kind: 'decimal-ops', expression: comparison, subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer, explanation },
    hints: ['关键：运算的数和 1 比较'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

/** 高档 compare：跨表达式变换 + 代数推理 */
function generateCompareHigh_A05(id: string, difficulty: number): Question {
  const variant = randInt(0, 2);

  if (variant === 0) {
    // 跨表达式位移等价：3.6 × 5.2 ○ 52 × 0.36（相等，小数点移动）
    const a10 = randInt(11, 99);
    const b10 = randInt(11, 99);
    const a = a10 / 10;
    const b = b10 / 10;
    const leftExpr = `${formatNum(a)} × ${formatNum(b)}`;
    const rightExpr = `${b10} × ${formatNum(a10 / 100)}`;
    return {
      id, topicId: 'decimal-ops', type: 'multiple-choice', difficulty,
      prompt: `在 ○ 里填上合适的符号：${leftExpr} ○ ${rightExpr}`,
      data: { kind: 'decimal-ops', expression: `${leftExpr} ○ ${rightExpr}`, subtype: 'compare', options: ['>', '<', '='] },
      solution: { answer: '=', explanation: `${formatNum(a)} × ${formatNum(b)} = ${formatNum(a10 / 100)} × ${b10}，小数点位移不改变乘积` },
      hints: ['观察两边的因数，小数点移动了几位？'],
      xpBase: 16 + (difficulty - 1) * 5,
    };
  }

  if (variant === 1) {
    // 两个因数都 <1 的积 vs 某个因数：0.8 × 0.6 ○ 0.8
    const a = Number((randInt(2, 9) / 10).toFixed(1));
    const b = Number((randInt(2, 9) / 10).toFixed(1));
    const leftExpr = `${formatNum(a)} × ${formatNum(b)}`;
    const rightExpr = `${formatNum(a)}`;
    return {
      id, topicId: 'decimal-ops', type: 'multiple-choice', difficulty,
      prompt: `在 ○ 里填上合适的符号：${leftExpr} ○ ${rightExpr}`,
      data: { kind: 'decimal-ops', expression: `${leftExpr} ○ ${rightExpr}`, subtype: 'compare', options: ['>', '<', '='] },
      solution: { answer: '<', explanation: `两个因数都小于 1，积比任何一个因数都小` },
      hints: ['两个因数和 1 的关系？'],
      xpBase: 16 + (difficulty - 1) * 5,
    };
  }

  // 除法 vs 乘法等价：a ÷ 0.25 ○ a × 4（相等）
  const a = randInt(2, 20);
  const pairs: Array<{ divExpr: string; mulExpr: string }> = [
    { divExpr: `${a} ÷ 0.25`, mulExpr: `${a} × 4` },
    { divExpr: `${a} ÷ 0.5`, mulExpr: `${a} × 2` },
    { divExpr: `${a} ÷ 0.125`, mulExpr: `${a} × 8` },
  ];
  const p = pairs[randInt(0, pairs.length - 1)];
  const swap = Math.random() < 0.5;
  const leftExpr = swap ? p.mulExpr : p.divExpr;
  const rightExpr = swap ? p.divExpr : p.mulExpr;
  return {
    id, topicId: 'decimal-ops', type: 'multiple-choice', difficulty,
    prompt: `在 ○ 里填上合适的符号：${leftExpr} ○ ${rightExpr}`,
    data: { kind: 'decimal-ops', expression: `${leftExpr} ○ ${rightExpr}`, subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer: '=', explanation: `÷ 0.25 = × 4，÷ 0.5 = × 2，÷ 0.125 = × 8` },
    hints: ['除以一个小数，等于乘以它的倒数'],
    xpBase: 16 + (difficulty - 1) * 5,
  };
}

function generateCompare_A05(id: string, difficulty: number): Question {
  if (difficulty >= 8) return generateCompareHigh_A05(id, difficulty);
  if (difficulty >= 6) return generateCompareMid_A05(id, difficulty);
  return generateCompareLow_A05(id, difficulty);
}

// ==================== 中/高档 cyclic-div：循环小数保留 n 位 ====================

function generateCyclicApprox(id: string, difficulty: number): Question {
  const divisorPool = difficulty <= 7 ? [3, 6, 9] : [3, 6, 7, 9, 11];
  const divisor = divisorPool[randInt(0, divisorPool.length - 1)];
  const maxDividend = difficulty <= 7 ? 30 : 80;
  let dividend = randInt(1, maxDividend);
  while (dividend % divisor === 0) dividend = randInt(1, maxDividend);

  let displayDividend: number = dividend;
  let displayDivisor: number = divisor;
  if (difficulty >= 8 && Math.random() < 0.5) {
    displayDividend = Number((dividend / 10).toFixed(1));
    displayDivisor = Number((divisor / 10).toFixed(1));
  }

  const places = difficulty <= 7 ? 1 : 2;
  const quotient = displayDividend / displayDivisor;
  const rounded = Number(quotient.toFixed(places));
  const placeText = places === 1 ? '一' : '两';
  const expression = `${formatNum(displayDividend)} ÷ ${formatNum(displayDivisor)}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}（商保留${placeText}位小数）`,
    data: { kind: 'decimal-ops', expression, subtype: 'div' },
    solution: {
      answer: formatNum(rounded),
      steps: [
        `${expression} ≈ ${quotient.toFixed(places + 2)}…`,
        `四舍五入保留${placeText}位小数 ≈ ${formatNum(rounded)}`,
      ],
      explanation: `商是循环小数（除不尽），需要四舍五入到${placeText}位小数`,
    },
    hints: ['商除不尽时，按要求保留小数位，最后一位要做四舍五入'],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

// ==================== 高档 div：循环节位置推理 ====================

function generateCyclicPosition(id: string, difficulty: number): Question {
  // 循环节 ≥2 位的标准案例；v2.2：题干只给最初几位，不明示循环节/长度
  const cases = [
    { expr: '1 ÷ 7',  digits: '142857', period: 6, preview: '0.142857142857…' },
    { expr: '2 ÷ 7',  digits: '285714', period: 6, preview: '0.285714285714…' },
    { expr: '3 ÷ 7',  digits: '428571', period: 6, preview: '0.428571428571…' },
    { expr: '1 ÷ 11', digits: '09',     period: 2, preview: '0.0909090909…' },
    { expr: '1 ÷ 13', digits: '076923', period: 6, preview: '0.076923076923…' },
  ];
  const c = cases[randInt(0, cases.length - 1)];
  const pos = randInt(10, 60);
  const idx = ((pos - 1) % c.period); // 0-indexed
  const answer = Number(c.digits[idx]);
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `${c.expr} = ${c.preview}\n请问小数点后第 ${pos} 位是哪个数字？`,
    data: { kind: 'decimal-ops', expression: c.expr, subtype: 'div' },
    solution: {
      answer,
      steps: [
        `先观察规律：这是循环小数，循环节是 ${c.digits}（共 ${c.period} 位）`,
        `${pos} ÷ ${c.period} = ${Math.floor(pos / c.period)} 余 ${pos % c.period}`,
        `余数为 ${pos % c.period === 0 ? c.period : pos % c.period}，对应循环节第 ${idx + 1} 位：${c.digits[idx]}`,
      ],
      explanation: `观察预览中反复出现的数字串，找出循环节（这里是 ${c.digits}，长度 ${c.period}），再用位置除以长度取余。`,
    },
    hints: ['先自己从预览里数出循环节——哪几位重复出现？', '找出循环节长度后，用位置数除以长度，取余数就是循环节内的序号'],
    xpBase: 18 + (difficulty - 1) * 5,
  };
}

// ==================== 高档 mul：<1×<1 反直觉实证（多位数） ====================

function generateHighMulLt1(id: string, difficulty: number): Question {
  // 2dp × 1dp，都 < 1
  const a100 = randInt(11, 99);
  const b10 = randInt(1, 9);
  const a = a100 / 100;
  const b = b10 / 10;
  const answerScaled = a100 * b10;
  const answer = answerScaled / 1000;
  const expression = `${formatNum(a)} × ${formatNum(b)}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'mul' },
    solution: {
      answer: formatNum(round(answer, 4)),
      explanation: `${a100} × ${b10} = ${answerScaled}，两因数共 3 位小数，积点 3 位：${formatNum(round(answer, 4))}；比两个因数都小`,
    },
    hints: ['两个都<1 → 积比两个都小'],
    xpBase: 16 + (difficulty - 1) * 5,
  };
}

// ==================== 高档 trap：概念陷阱实证 ====================

function generateConceptTrapCalc(id: string, difficulty: number): Question {
  // 用 a × b，b 是 >1 的小数，让学生算，体验"乘以小数积不一定变小"
  const aScaled = randInt(11, 99) / 10;
  const b = [1.2, 1.5, 2.5, 1.8, 3.2][randInt(0, 4)];
  const answer = round(aScaled * b, 4);
  const expression = `${formatNum(aScaled)} × ${formatNum(b)}`;
  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'trap' },
    solution: {
      answer: formatNum(answer),
      explanation: `${expression} = ${formatNum(answer)}；这里乘以的是 ${formatNum(b)}（>1），所以积比 ${formatNum(aScaled)} 大——"乘以小数积一定变小"其实是错的！`,
    },
    hints: ['只有乘以 <1 的数积才变小；乘以 >1 的小数积仍然变大'],
    xpBase: 16 + (difficulty - 1) * 5,
  };
}

// ==================== Main generator ====================

export function generateDecimalOps(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = difficulty <= 5 ? [
    { tag: 'add-sub', weight: 30, gen: () => generatePlaceValueOrConvert(id, difficulty) },
    { tag: 'mul',     weight: 30, gen: () => generateLowMul(id, difficulty) },
    { tag: 'div',     weight: 25, gen: () => generateLowDiv(id, difficulty) },
    { tag: 'compare', weight: 15, gen: () => generateCompare_A05(id, difficulty) },
  ] : difficulty <= 7 ? [
    { tag: 'mul',        weight: 25, gen: () => generateMidMulPattern(id, difficulty) },
    { tag: 'div',        weight: 20, gen: () => generateMidDivPattern(id, difficulty) },
    { tag: 'add-sub',    weight: 15, gen: () => generateMidPlaceExtend(id, difficulty) },
    { tag: 'shift',      weight: 10, gen: () => generateShiftChain(id, difficulty) },
    { tag: 'trap',       weight: 10, gen: () => generateLt1Trap(id, difficulty) },
    { tag: 'compare',    weight: 10, gen: () => generateCompare_A05(id, difficulty) },
    { tag: 'cyclic-div', weight: 10, gen: () => generateCyclicApprox(id, difficulty) },
  ] : [
    { tag: 'mul',        weight: 35, gen: () => generateHighMulLt1(id, difficulty) },
    { tag: 'div',        weight: 30, gen: () => generateCyclicPosition(id, difficulty) },
    { tag: 'compare',    weight: 15, gen: () => generateCompare_A05(id, difficulty) },
    { tag: 'cyclic-div', weight: 10, gen: () => generateCyclicApprox(id, difficulty) },
    { tag: 'trap',       weight: 10, gen: () => generateConceptTrapCalc(id, difficulty) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
