import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';

export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) return [
    { tag: 'add-sub',  weight: 30 },
    { tag: 'mul',      weight: 30 },
    { tag: 'div',      weight: 25 },
    { tag: 'compare',  weight: 15 },
  ];
  if (difficulty <= 7) return [
    { tag: 'mul',       weight: 25 },
    { tag: 'div',       weight: 20 },
    { tag: 'add-sub',   weight: 15 },
    { tag: 'shift',     weight: 10 },
    { tag: 'trap',      weight: 10 },
    { tag: 'compare',   weight: 10 },
    { tag: 'cyclic-div', weight: 10 },
  ];
  return [
    { tag: 'mul',       weight: 35 },
    { tag: 'div',       weight: 30 },
    { tag: 'compare',   weight: 15 },
    { tag: 'cyclic-div', weight: 10 },
    { tag: 'trap',      weight: 10 },
  ];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format a number for display: keep meaningful decimal places, strip trailing zeros.
 */
function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Use toFixed with enough precision, then strip trailing zeros
  const s = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

// ===== Normal (≤5): decimal add/sub, decimal×integer, decimal÷integer =====

function generateNormalAddSub(id: string, difficulty: number): Question {
  const places = Math.random() < 0.5 ? 1 : 2;
  const factor = Math.pow(10, places);
  const aInt = randInt(10, 50 * factor);
  const bInt = randInt(10, 50 * factor);
  const a = aInt / factor;
  const b = bInt / factor;
  const op = Math.random() < 0.5 ? '+' : '-';
  const [big, small] = a >= b ? [a, b] : [b, a];
  const first = op === '-' ? big : a;
  const second = op === '-' ? small : b;
  const answerInt = op === '+' ? (Math.round(first * factor) + Math.round(second * factor)) : (Math.round(first * factor) - Math.round(second * factor));
  const answer = answerInt / factor;
  const expression = `${formatNum(first)} ${op} ${formatNum(second)}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'add-sub' },
    solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}，注意小数点对齐` },
    hints: ['把小数点对齐，然后像整数一样计算'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateNormalMulInt(id: string, difficulty: number): Question {
  // 15% 概率生成特殊值乘法
  if (Math.random() < 0.15) {
    const specials = [
      { a: 0.125, b: 8, answer: 1 },
      { a: 0.25, b: 4, answer: 1 },
      { a: 0.5, b: 2, answer: 1 },
      { a: 0.125, b: 16, answer: 2 },
      { a: 0.25, b: 8, answer: 2 },
      { a: 0.5, b: 4, answer: 2 },
    ];
    const s = specials[randInt(0, specials.length - 1)];
    const expression = `${formatNum(s.a)} × ${s.b}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: { answer: formatNum(s.answer), explanation: `${expression} = ${s.answer}（常见特殊值）` },
      hints: ['这是一个常见的特殊值组合，记住它！'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 原有逻辑
  const places = Math.random() < 0.5 ? 1 : 2;
  const factor = Math.pow(10, places);
  const aScaled = places === 1 ? randInt(11, 500) : randInt(101, 5000);
  const b = randInt(2, 9);
  const productInt = aScaled * b;
  const a = aScaled / factor;
  const answer = productInt / factor;
  const expression = `${formatNum(a)} × ${b}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'mul' },
    solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}` },
    hints: ['先不看小数点，按整数乘法算，再数小数位数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateNormalDivInt(id: string, difficulty: number): Question {
  // decimal ÷ integer, e.g. 3.15÷3, 12.6÷6 (exact division)
  const b = randInt(2, 9);
  const places = Math.random() < 0.5 ? 1 : 2;
  const factor = Math.pow(10, places);
  const answerScaled = randInt(11, 500); // quotient * factor
  const a = answerScaled * b; // dividend * factor (exact integer)
  const dividend = a / factor;
  const answer = answerScaled / factor;
  const expression = `${formatNum(dividend)} ÷ ${b}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'div' },
    solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}` },
    hints: ['商的小数点要和被除数的小数点对齐'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== Hard (6-7): decimal×decimal, decimal÷decimal, mixed add/sub, shift =====

function generateHardMulDecimal(id: string, difficulty: number): Question {
  // decimal × decimal, e.g. 3.06×4.5, 0.38×3.2
  const dpA = Math.random() < 0.5 ? 1 : 2;
  const dpB = dpA === 2 ? 1 : (Math.random() < 0.5 ? 1 : 2);
  const factorA = Math.pow(10, dpA);
  const factorB = Math.pow(10, dpB);
  const aScaled = randInt(11, 300); // a * factorA
  const bScaled = randInt(11, 99);  // b * factorB
  const productScaled = aScaled * bScaled; // exact integer = product * factorA * factorB
  const totalFactor = factorA * factorB;
  const a = aScaled / factorA;
  const b = bScaled / factorB;
  const answer = productScaled / totalFactor;
  const expression = `${formatNum(a)} × ${formatNum(b)}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'mul' },
    solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}，两个因数共有${dpA + dpB}位小数` },
    hints: ['先按整数乘法计算，再数两个因数一共有几位小数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateHardDivDecimal(id: string, difficulty: number): Question {
  // decimal ÷ decimal, e.g. 16.65÷3.3, 40.8÷0.34
  // Strategy: generate with integers, then place decimal points
  const q10 = randInt(11, 199); // quotient × 10 → quotient has 1dp
  const d10 = randInt(11, 99);  // divisor × 10 → divisor has 1dp
  const dividend100 = q10 * d10; // exact integer = dividend × 100
  const quotient = q10 / 10;
  const divisor = d10 / 10;
  const dividend = dividend100 / 100;
  const expression = `${formatNum(dividend)} ÷ ${formatNum(divisor)}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'div' },
    solution: {
      answer: formatNum(quotient),
      steps: [`将除数 ${formatNum(divisor)} 变成整数: 乘以10`, `被除数同时乘以10: ${formatNum(dividend)} → ${formatNum(dividend * 10)}`, `${formatNum(dividend * 10)} ÷ ${d10} = ${formatNum(quotient)}`],
      explanation: `${expression} = ${formatNum(quotient)}`,
    },
    hints: ['先把除数变成整数（乘以10或100），被除数也同时乘相同的数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateHardMixedAddSub(id: string, difficulty: number): Question {
  // Mixed decimal places trap (e.g. 3.5 + 2.46)
  const placesA = Math.random() < 0.5 ? 1 : 2;
  const placesB = placesA === 1 ? 2 : 1;
  const factorA = Math.pow(10, placesA);
  const factorB = Math.pow(10, placesB);
  const maxFactor = Math.max(factorA, factorB);
  const aScaled = randInt(10, 30 * factorA);
  const bScaled = randInt(10, 30 * factorB);
  const a = aScaled / factorA;
  const b = bScaled / factorB;
  const op = Math.random() < 0.5 ? '+' : '-';
  const [big, small] = a >= b ? [a, b] : [b, a];
  const first = op === '-' ? big : a;
  const second = op === '-' ? small : b;
  const answerScaled = op === '+'
    ? Math.round(first * maxFactor) + Math.round(second * maxFactor)
    : Math.round(first * maxFactor) - Math.round(second * maxFactor);
  const answer = answerScaled / maxFactor;
  const expression = `${formatNum(first)} ${op} ${formatNum(second)}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'add-sub' },
    solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}，小数位数不同时，末尾补零对齐` },
    hints: ['位数不同时，把短的那个在末尾加0补齐，例如 3.5 = 3.50'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateHardShift(id: string, difficulty: number): Question {
  // 50% 右移 (×10/100/1000), 50% 左移 (×0.1/0.01/0.001)
  const isLeftShift = Math.random() < 0.5;

  if (isLeftShift) {
    const shiftValues = [0.1, 0.01];
    if (difficulty >= 8) shiftValues.push(0.001);
    const shift = shiftValues[randInt(0, shiftValues.length - 1)];
    const shiftPlaces = Math.round(-Math.log10(shift));
    const hasDecimal = Math.random() < 0.4;
    const aScaled = hasDecimal ? randInt(11, 99) : randInt(10, 999);
    const a = hasDecimal ? aScaled / 10 : aScaled;
    const answer = a * shift;
    const expression = `${formatNum(a)} × ${formatNum(shift)}`;

    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'shift' },
      solution: { answer: formatNum(answer), explanation: `乘${formatNum(shift)}就是小数点向左移${shiftPlaces}位` },
      hints: [`乘${formatNum(shift)}时，小数点向左移动${shiftPlaces}位`],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 原有右移逻辑
  const shifts = [10, 100, 1000];
  const shift = shifts[randInt(0, 2)];
  const dp = randInt(1, 3);
  const factor = Math.pow(10, dp);
  const aScaled = randInt(1, 99 * factor);
  const a = aScaled / factor;
  const answerScaled = aScaled * shift;
  const answer = answerScaled / factor;
  const expression = `${formatNum(a)} × ${shift}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'shift' },
    solution: { answer: formatNum(answer), explanation: `乘${shift}就是小数点向右移${Math.log10(shift)}位` },
    hints: [`乘${shift}时，小数点向右移动${Math.log10(shift)}位`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== Hard trap: <1 × <1 (少量陷阱, 10% within hard) =====

function generateHardTrap(id: string, difficulty: number): Question {
  // Both factors < 1, e.g. 0.3 × 0.4 = 0.12
  const a10 = randInt(1, 9); // 0.1~0.9
  const b10 = randInt(1, 9);
  const product = a10 * b10; // integer = answer × 100
  const a = a10 / 10;
  const b = b10 / 10;
  const answer = product / 100;
  const expression = `${formatNum(a)} × ${formatNum(b)}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'mul' },
    solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}，注意两个因数都小于1，积比任何一个因数都小` },
    hints: ['两个因数共2位小数，先算整数部分，再点小数点'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== Demon (≥8): complex decimal×decimal, complex decimal÷decimal =====

function generateDemonMulDecimal(id: string, difficulty: number): Question {
  // 40% both < 1 trap (e.g. 0.25×0.4), 60% multi-digit (e.g. 2.05×3.6)
  if (Math.random() < 0.4) {
    // Both < 1: e.g. 0.25 × 0.4 = 0.1
    const a100 = randInt(11, 99); // 0.11~0.99 (2dp)
    const b10 = randInt(1, 9);    // 0.1~0.9 (1dp)
    const productScaled = a100 * b10; // exact integer = answer × 1000
    const a = a100 / 100;
    const b = b10 / 10;
    const answer = productScaled / 1000;
    const expression = `${formatNum(a)} × ${formatNum(b)}`;

    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}，两个因数共3位小数` },
      hints: ['先按整数算，再数总共几位小数'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    // Multi-digit: 2dp × 1dp or 1dp × 2dp, larger range
    const dpA = Math.random() < 0.5 ? 2 : 1;
    const dpB = dpA === 2 ? 1 : 2;
    const factorA = Math.pow(10, dpA);
    const factorB = Math.pow(10, dpB);
    const aScaled = randInt(101, 999);
    const bScaled = randInt(11, 99);
    const productScaled = aScaled * bScaled;
    const totalFactor = factorA * factorB;
    const a = aScaled / factorA;
    const b = bScaled / factorB;
    const answer = productScaled / totalFactor;
    const expression = `${formatNum(a)} × ${formatNum(b)}`;

    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}，共${dpA + dpB}位小数` },
      hints: ['先按整数乘法计算，再数两个因数一共有几位小数'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
}

function generateDemonDivDecimal(id: string, difficulty: number): Question {
  // Complex decimal ÷ decimal, e.g. 40.8÷0.34=120, 4.56÷0.12=38
  // Strategy: integer quotient OR 1dp quotient, divisor has 2dp
  if (Math.random() < 0.5) {
    // Integer quotient, 2dp divisor
    const quotient = randInt(11, 200);
    const d100 = randInt(11, 99); // divisor × 100 (2dp divisor)
    const dividendScaled = quotient * d100; // exact integer = dividend × 100
    const divisor = d100 / 100;
    const dividend = dividendScaled / 100;
    const expression = `${formatNum(dividend)} ÷ ${formatNum(divisor)}`;

    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'div' },
      solution: {
        answer: formatNum(quotient),
        steps: [`将除数变成整数: ×100`, `被除数同时 ×100: ${formatNum(dividend)} → ${dividendScaled / 1}`, `${dividendScaled} ÷ ${d100} = ${quotient}`],
        explanation: `${expression} = ${formatNum(quotient)}`,
      },
      hints: ['把除数变成整数（乘以100），被除数也同时乘以100'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    // 1dp quotient, 1dp divisor, larger numbers
    const q10 = randInt(11, 500); // quotient × 10
    const d10 = randInt(11, 99);  // divisor × 10
    const dividendScaled = q10 * d10; // exact integer = dividend × 100
    const quotient = q10 / 10;
    const divisor = d10 / 10;
    const dividend = dividendScaled / 100;
    const expression = `${formatNum(dividend)} ÷ ${formatNum(divisor)}`;

    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'div' },
      solution: {
        answer: formatNum(quotient),
        steps: [`将除数变成整数: ×10`, `被除数同时 ×10`, `${formatNum(dividendScaled / 10)} ÷ ${d10} = ${formatNum(quotient)}`],
        explanation: `${expression} = ${formatNum(quotient)}`,
      },
      hints: ['先把除数变成整数，被除数也同时乘相同的数'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
}

// ===== Compare Size (大小比较) =====

function generateCompareSize(id: string, difficulty: number): Question {
  const isMultiply = Math.random() < 0.5;
  const op = isMultiply ? '×' : '÷';

  const a = difficulty <= 5
    ? Number((randInt(11, 99) / 10).toFixed(1))
    : Number((randInt(101, 999) / 100).toFixed(2));

  // b>1 42.5%, b<1 42.5%, b=1 15%
  const roll = Math.random();
  let b: number;
  if (roll < 0.425) {
    b = Number((randInt(11, 25) / 10).toFixed(1));
  } else if (roll < 0.85) {
    b = Number((randInt(1, 9) / 10).toFixed(1));
  } else {
    b = 1;
  }

  let answer: string;
  if (isMultiply) {
    answer = b > 1 ? '>' : b < 1 ? '<' : '=';
  } else {
    answer = b > 1 ? '<' : b < 1 ? '>' : '=';
  }

  const expression = `${formatNum(a)} ${op} ${formatNum(b)}`;
  const comparison = `${expression} ○ ${formatNum(a)}`;

  const ruleText = isMultiply
    ? (b > 1 ? '乘以大于1的数，积大于原数' : b < 1 ? '乘以小于1的数，积小于原数' : '乘以1，积等于原数')
    : (b > 1 ? '除以大于1的数，商小于原数' : b < 1 ? '除以小于1的数，商大于原数' : '除以1，商等于原数');

  return {
    id, topicId: 'decimal-ops', type: 'multiple-choice', difficulty,
    prompt: `比较大小: ${comparison}，○ 里应填什么？`,
    data: { kind: 'decimal-ops', expression: comparison, subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer, explanation: ruleText },
    hints: ['想一想：乘以（除以）的那个数比 1 大还是小？'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== Cyclic Division (循环小数除法) =====

function generateCyclicDivision(id: string, difficulty: number): Question {
  const divisorPool = difficulty <= 7 ? [3, 6, 9] : [3, 6, 7, 9, 11];
  const divisor = divisorPool[randInt(0, divisorPool.length - 1)];

  const maxDividend = difficulty <= 7 ? 30 : 80;
  let dividend = randInt(1, maxDividend);
  while (dividend % divisor === 0) {
    dividend = randInt(1, maxDividend);
  }

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
        `${expression} = ${quotient.toFixed(places + 2)}…`,
        `四舍五入保留${placeText}位小数 ≈ ${formatNum(rounded)}`,
      ],
      explanation: `商是除不尽的（循环小数），需要四舍五入到${placeText}位小数`,
    },
    hints: ['这道除法除不尽，注意四舍五入'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== Main generator =====

export function generateDecimalOps(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = difficulty <= 5 ? [
    { tag: 'add-sub', weight: 30, gen: () => generateNormalAddSub(id, difficulty) },
    { tag: 'mul', weight: 30, gen: () => generateNormalMulInt(id, difficulty) },
    { tag: 'div', weight: 25, gen: () => generateNormalDivInt(id, difficulty) },
    { tag: 'compare', weight: 15, gen: () => generateCompareSize(id, difficulty) },
  ] : difficulty <= 7 ? [
    { tag: 'mul', weight: 25, gen: () => generateHardMulDecimal(id, difficulty) },
    { tag: 'div', weight: 20, gen: () => generateHardDivDecimal(id, difficulty) },
    { tag: 'add-sub', weight: 15, gen: () => generateHardMixedAddSub(id, difficulty) },
    { tag: 'shift', weight: 10, gen: () => generateHardShift(id, difficulty) },
    { tag: 'trap', weight: 10, gen: () => generateHardTrap(id, difficulty) },
    { tag: 'compare', weight: 10, gen: () => generateCompareSize(id, difficulty) },
    { tag: 'cyclic-div', weight: 10, gen: () => generateCyclicDivision(id, difficulty) },
  ] : [
    { tag: 'mul', weight: 35, gen: () => generateDemonMulDecimal(id, difficulty) },
    { tag: 'div', weight: 30, gen: () => generateDemonDivDecimal(id, difficulty) },
    { tag: 'compare', weight: 15, gen: () => generateCompareSize(id, difficulty) },
    { tag: 'cyclic-div', weight: 10, gen: () => generateCyclicDivision(id, difficulty) },
    { tag: 'trap', weight: 10, gen: () => generateHardTrap(id, difficulty) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
