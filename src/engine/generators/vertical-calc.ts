import type { Question, VerticalCalcStep } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';
import { formatNum } from './utils';
import { placeDecimalPoint } from '../verticalMultiplication';

// v2.1 规格：
//   低档 (d≤5): 纯整数，禁止小数。
//   中档 (6≤d≤7): 小数加减、小数×整数、整数÷出小数、多位×多位整数。
//   高档 (d≥8): 小数÷小数扩倍、高位数含中间0乘法、循环小数取近似。
export function getSubtypeEntries(difficulty: number): SubtypeDef[] {
  if (difficulty <= 5) return [
    { tag: 'int-add',     weight: 30 },
    { tag: 'int-sub',     weight: 30 },
    { tag: 'int-mul',     weight: 20 },
    { tag: 'int-div',     weight: 20 },
  ];
  if (difficulty <= 7) return [
    { tag: 'int-mul',     weight: 15 },  // 多位×多位整数
    { tag: 'int-div',     weight: 10 },  // 整数÷出小数
    { tag: 'dec-add-sub', weight: 30 },
    { tag: 'dec-mul',     weight: 20 },  // 小数×整数
    { tag: 'dec-div',     weight: 15 },  // 小数÷整数 / 整数÷整数出小数
    { tag: 'approximate', weight: 10 },
  ];
  return [
    { tag: 'int-mul',     weight: 15 },  // 多位×多位，含中间0
    { tag: 'dec-add-sub', weight: 10 },  // 少量，保留训练对齐
    { tag: 'dec-mul',     weight: 25 },  // 小数×小数，位数多
    { tag: 'dec-div',     weight: 30 },  // 小数÷小数扩倍长除
    { tag: 'approximate', weight: 20 },  // 循环小数取近似
  ];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDigits(n: number): number[] {
  if (n === 0) return [0];
  const digits: number[] = [];
  let v = Math.abs(n);
  while (v > 0) {
    digits.push(v % 10);
    v = Math.floor(v / 10);
  }
  return digits;
}

type OneDigitDivisionLoad = 'D0' | 'D1' | 'D2' | 'D3';

function classifyOneDigitIntDivision(dividend: number, divisor: number): OneDigitDivisionLoad {
  const quotient = dividend / divisor;
  if (!Number.isInteger(quotient)) return 'D0';

  const quotientMiddle = String(quotient).slice(1, -1);
  if (quotientMiddle.includes('0')) return 'D3';

  const digits = String(dividend).split('').map(Number);
  let current = 0;
  let quotientStarted = false;
  let remainderTransfers = 0;

  for (let i = 0; i < digits.length; i++) {
    current = current * 10 + digits[i];
    if (!quotientStarted && current < divisor) continue;

    const qDigit = Math.floor(current / divisor);
    const remainder = current % divisor;
    if (qDigit > 0 || quotientStarted) {
      quotientStarted = true;
      if (remainder > 0 && i < digits.length - 1) remainderTransfers++;
    }
    current = remainder;
  }

  if (remainderTransfers === 0) return 'D0';
  if (remainderTransfers === 1) return 'D1';
  return 'D2';
}

function pickLowIntDivisionLoad(difficulty: number): OneDigitDivisionLoad {
  const r = Math.random();
  if (difficulty <= 3) {
    if (r < 0.15) return 'D1';
    if (r < 0.65) return 'D2';
    return 'D3';
  }
  if (r < 0.10) return 'D1';
  if (r < 0.55) return 'D2';
  return 'D3';
}

function generateLowIntDivisionOperands(difficulty: number): {
  dividend: number;
  divisor: number;
  quotient: number;
  load: OneDigitDivisionLoad;
} {
  const targetLoad = pickLowIntDivisionLoad(difficulty);
  const minDividend = difficulty <= 3 ? 100 : 1000;
  const maxDividend = difficulty <= 3 ? 999 : 9999;

  for (let attempt = 0; attempt < 2000; attempt++) {
    const divisor = randInt(4, 9);
    const minQuotient = Math.ceil(minDividend / divisor);
    const maxQuotient = Math.floor(maxDividend / divisor);
    const quotient = randInt(minQuotient, maxQuotient);
    const dividend = divisor * quotient;
    const load = classifyOneDigitIntDivision(dividend, divisor);
    if (load === targetLoad) return { dividend, divisor, quotient, load };
  }

  if (difficulty <= 3) {
    if (targetLoad === 'D3') return { dividend: 816, divisor: 4, quotient: 204, load: 'D3' };
    if (targetLoad === 'D2') return { dividend: 672, divisor: 4, quotient: 168, load: 'D2' };
    return { dividend: 452, divisor: 4, quotient: 113, load: 'D1' };
  }
  if (targetLoad === 'D3') return { dividend: 3264, divisor: 8, quotient: 408, load: 'D3' };
  if (targetLoad === 'D2') return { dividend: 2672, divisor: 4, quotient: 668, load: 'D2' };
  return { dividend: 1524, divisor: 4, quotient: 381, load: 'D1' };
}

// Normal (<=5): carry mandatory; Hard/Demon: carry optional
function isCarrySkippable(difficulty: number): boolean {
  return difficulty > 5;
}

function generateAdditionSteps(a: number, b: number, difficulty: number): VerticalCalcStep[] {
  const dA = getDigits(a);
  const dB = getDigits(b);
  const maxLen = Math.max(dA.length, dB.length);
  const steps: VerticalCalcStep[] = [];
  const skippable = isCarrySkippable(difficulty);
  let carry = 0;

  for (let col = 0; col < maxLen; col++) {
    const da = col < dA.length ? dA[col] : 0;
    const db = col < dB.length ? dB[col] : 0;
    const sum = da + db + carry;
    const digit = sum % 10;
    const newCarry = Math.floor(sum / 10);
    const placeNames = ['个', '十', '百', '千', '万'];
    const place = placeNames[Math.min(col, placeNames.length - 1)];
    let hint = `${place}位: ${da} + ${db}`;
    if (carry > 0) hint += ` + ${carry}(进位)`;
    hint += ` = ${sum}`;
    if (newCarry > 0) hint += `，写${digit}进${newCarry}`;

    steps.push({ stepIndex: steps.length, stepType: 'digit', column: col, row: 0, expectedDigit: digit, skippable: false, hint });
    if (newCarry > 0) {
      const nextPlace = placeNames[Math.min(col + 1, placeNames.length - 1)];
      steps.push({ stepIndex: steps.length, stepType: 'carry', column: col + 1, row: 0, expectedDigit: newCarry, skippable, hint: `向${nextPlace}位进${newCarry}` });
    }
    carry = newCarry;
  }
  if (carry > 0) {
    steps.push({ stepIndex: steps.length, stepType: 'digit', column: maxLen, row: 0, expectedDigit: carry, skippable: false, hint: `最高位进位: ${carry}` });
  }
  return steps;
}

function generateSubtractionSteps(a: number, b: number, difficulty: number): VerticalCalcStep[] {
  if (a < b) [a, b] = [b, a];
  const dA = getDigits(a);
  const dB = getDigits(b);
  const steps: VerticalCalcStep[] = [];
  const skippable = isCarrySkippable(difficulty);
  let borrow = 0;

  for (let col = 0; col < dA.length; col++) {
    const da = dA[col] - borrow;
    const db = col < dB.length ? dB[col] : 0;
    let digit: number, newBorrow: number;
    if (da >= db) { digit = da - db; newBorrow = 0; }
    else { digit = da + 10 - db; newBorrow = 1; }

    const placeNames = ['个', '十', '百', '千', '万'];
    const place = placeNames[Math.min(col, placeNames.length - 1)];
    let hint = `${place}位: ${dA[col]}`;
    if (borrow > 0) hint += ` - ${borrow}(退位) = ${da}`;
    hint += ` - ${db}`;
    if (da < db) hint += `，不够减，向${placeNames[Math.min(col + 1, placeNames.length - 1)]}位借1当10`;
    hint += ` = ${digit}`;

    if (newBorrow > 0) {
      const nextPlace = placeNames[Math.min(col + 1, placeNames.length - 1)];
      steps.push({ stepIndex: steps.length, stepType: 'carry', column: col + 1, row: 0, expectedDigit: -1, skippable, hint: `${place}位不够减，从${nextPlace}位退1` });
    }
    steps.push({ stepIndex: steps.length, stepType: 'digit', column: col, row: 0, expectedDigit: digit, skippable: false, hint });
    borrow = newBorrow;
  }
  return steps;
}

function generateMultiplicationSteps(a: number, b: number, difficulty: number): VerticalCalcStep[] {
  const dA = getDigits(a);
  const steps: VerticalCalcStep[] = [];
  const skippable = isCarrySkippable(difficulty);
  let carry = 0;

  for (let col = 0; col < dA.length; col++) {
    const product = dA[col] * b + carry;
    const digit = product % 10;
    const newCarry = Math.floor(product / 10);
    const placeNames = ['个', '十', '百', '千', '万'];
    const place = placeNames[Math.min(col, placeNames.length - 1)];
    let hint = `${place}位: ${dA[col]} × ${b}`;
    if (carry > 0) hint += ` + ${carry}(进位)`;
    hint += ` = ${product}`;
    if (newCarry > 0) hint += `，写${digit}进${newCarry}`;

    steps.push({ stepIndex: steps.length, stepType: 'digit', column: col, row: 0, expectedDigit: digit, skippable: false, hint });
    if (newCarry > 0) {
      const nextPlace = placeNames[Math.min(col + 1, placeNames.length - 1)];
      steps.push({ stepIndex: steps.length, stepType: 'carry', column: col + 1, row: 0, expectedDigit: newCarry, skippable, hint: `向${nextPlace}位进${newCarry}` });
    }
    carry = newCarry;
  }
  if (carry > 0) {
    steps.push({ stepIndex: steps.length, stepType: 'digit', column: dA.length, row: 0, expectedDigit: carry, skippable: false, hint: `最高位进位: ${carry}` });
  }
  return steps;
}

/** Generate step-by-step solution for multi-digit multiplication (numeric-input) */
function multiDigitMultSolution(a: number, b: number): string[] {
  const bDigits = getDigits(b);
  const steps: string[] = [];
  const partials: number[] = [];
  for (let i = 0; i < bDigits.length; i++) {
    const partial = a * bDigits[i];
    const shifted = partial * Math.pow(10, i);
    partials.push(shifted);
    const placeName = i === 0 ? '个' : i === 1 ? '十' : '百';
    steps.push(`${a} × ${bDigits[i]}(${placeName}位) = ${partial}${i > 0 ? `，左移${i}位得 ${shifted}` : ''}`);
  }
  const total = partials.reduce((s, v) => s + v, 0);
  steps.push(`部分积相加: ${partials.join(' + ')} = ${total}`);
  return steps;
}

/** Generate step-by-step solution for long division (numeric-input) */
function longDivisionSolution(a: number, b: number): string[] {
  const steps: string[] = [];
  const aStr = String(a);

  steps.push(`${a} ÷ ${b}:`);
  let brought = '';
  for (let i = 0; i < aStr.length; i++) {
    brought += aStr[i];
    const current = Number(brought);
    const qDigit = Math.floor(current / b);
    const product = qDigit * b;
    const newRemainder = current - product;
    if (qDigit > 0 || steps.length > 1) {
      steps.push(`${current} ÷ ${b} = ${qDigit} 余 ${newRemainder}${product > 0 ? `（${qDigit} × ${b} = ${product}）` : ''}`);
    } else {
      steps.push(`${current} 不够除，继续落下一位`);
    }
    brought = newRemainder > 0 ? String(newRemainder) : '';
  }
  const quotient = Math.floor(a / b);
  steps.push(`商 = ${quotient}`);
  return steps;
}

/** Generate a multi-row vertical-fill question for multi-digit multiplication */
function generateTwoDigitByTwoDigitMult(difficulty: number, id: string): Question {
  const pickOperand = () => {
    let value = randInt(12, 99);
    while (value % 10 === 0) value = randInt(12, 99);
    return value;
  };
  const a = pickOperand();
  const b = pickOperand();
  const answer = a * b;
  const steps = multiDigitMultSolution(a, b);

  return {
    id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} × ${b}`,
    data: {
      kind: 'vertical-calc',
      operation: '×' as const,
      operands: [a, b],
      steps: [],
      multiplicationBoard: {
        mode: 'integer',
        integerOperands: [a, b],
        operandInputMode: 'static',
      },
    },
    solution: { answer, steps, explanation: `${a} × ${b} = ${answer}` },
    hints: ['先用第二个数的个位乘第一个数，再用十位乘，最后把部分积相加'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateMultiDigitMult(difficulty: number, id: string): Question {
  let a: number, b: number;
  if (difficulty <= 7) {
    // Hard: 3-digit × 2-digit
    a = randInt(100, 999);
    b = randInt(11, 99);
  } else {
    // Demon: 3~4-digit × 2-digit, 40% internal zeros
    if (Math.random() < 0.4) {
      const hundreds = randInt(1, 9);
      const units = randInt(1, 9);
      a = Math.random() < 0.5
        ? hundreds * 1000 + units * 10 + randInt(0, 9) // e.g. 3045
        : hundreds * 100 + units; // e.g. 507
      if (a < 100) a = randInt(100, 999); // fallback
    } else {
      a = Math.random() < 0.5 ? randInt(100, 999) : randInt(1000, 9999);
    }
    b = randInt(11, 99);
  }
  const answer = a * b;
  const steps = multiDigitMultSolution(a, b);

  return {
    id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} × ${b}`,
    data: {
      kind: 'vertical-calc',
      operation: '×' as const,
      operands: [a, b],
      steps: [],
      multiplicationBoard: {
        mode: 'integer',
        integerOperands: [a, b],
        operandInputMode: 'static',
      },
    },
    solution: { answer, steps, explanation: `${a} × ${b} = ${answer}` },
    hints: ['先用第二个数的个位乘第一个数，再用十位乘，最后把部分积相加'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 整数除法竖式（vertical-fill 格式，低档使用；中档走整数÷出小数）*/
function generateDivision(difficulty: number, id: string): Question {
  // v2.1：低档整数÷整数（整除）；中档整数÷出小数；高档已不走此函数（dec-div 承担）
  if (difficulty <= 5) {
    const { dividend: a, divisor: b, quotient, load } = generateLowIntDivisionOperands(difficulty);
    const steps = longDivisionSolution(a, b);
    const loadHint = load === 'D3'
      ? '注意商中间 0 的占位'
      : load === 'D2'
        ? '注意多次余数传递和落位'
        : '注意余数传递和落位';
    return {
      id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
      prompt: `用竖式计算: ${a} ÷ ${b}`,
      data: { kind: 'vertical-calc', operation: '÷' as const, operands: [a, b], steps: [] },
      solution: { answer: quotient, steps, explanation: `${a} ÷ ${b} = ${quotient}` },
      hints: ['从最高位开始，逐位试商', loadHint],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
  const { dividend: a, divisor: b, quotient: q } = generateFiniteDecimalIntDivision();
  const steps = [
    `${a} ÷ ${b}，商的整数部分 ${Math.floor(a / b)}`,
    `余数不够除时，商上加小数点，余数后补0继续除`,
    `${a} ÷ ${b} = ${q}`,
  ];
  return {
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `用竖式计算: ${a} ÷ ${b}（除不尽时继续补0）`,
    data: { kind: 'vertical-calc', operation: '÷' as const, operands: [a, b], steps: [] },
    solution: { answer: formatNum(q), steps, explanation: `${a} ÷ ${b} = ${q}` },
    hints: ['整数除完后，商上加小数点，余数后补0继续除'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function pickFiniteDecimalPlaces(): number {
  const r = Math.random();
  if (r < 0.35) return 1;
  if (r < 0.80) return 2;
  return 3;
}

function generateFiniteDecimalIntDivision(): {
  dividend: number;
  divisor: number;
  quotient: number;
} {
  for (let attempt = 0; attempt < 200; attempt++) {
    const divisor = randInt(4, 19);
    const decimalPlaces = pickFiniteDecimalPlaces();
    const scale = 10 ** decimalPlaces;
    const minScaled = Math.ceil((100 * scale) / divisor);
    const maxScaled = Math.floor((999 * scale) / divisor);
    if (minScaled >= maxScaled) continue;

    const quotientScaled = randInt(minScaled, maxScaled);
    if (quotientScaled % scale === 0) continue;

    const rawDividend = quotientScaled * divisor;
    if (rawDividend % scale !== 0) continue;

    const dividend = rawDividend / scale;
    const quotient = quotientScaled / scale;
    if (dividend < 100 || dividend >= 1000) continue;
    if (Number.isInteger(quotient)) continue;

    return { dividend, divisor, quotient };
  }

  return { dividend: 275, divisor: 8, quotient: 34.375 };
}

// ===== 小数加减法 (vertical-fill) =====
function generateDecimalAddSub(difficulty: number, id: string): Question {
  const isAdd = Math.random() < 0.5;
  const op: '+' | '-' = isAdd ? '+' : '-';
  const dp1 = randInt(1, difficulty <= 5 ? 2 : 3);
  const dp2 = randInt(1, difficulty <= 5 ? 2 : 3);
  const maxDp = Math.max(dp1, dp2);
  const f1 = Math.pow(10, dp1);
  const f2 = Math.pow(10, dp2);
  let aScaled = randInt(100, difficulty <= 5 ? 9999 : 99999);
  let bScaled = randInt(100, difficulty <= 5 ? 9999 : 99999);
  while (aScaled % 10 === 0) aScaled++;
  while (bScaled % 10 === 0) bScaled++;
  let a = aScaled / f1;
  let b = bScaled / f2;
  if (!isAdd && a < b) [a, b] = [b, a];
  if (!isAdd && a === b) a = a + 1 / f1;

  // Scale to integers for step generation
  const fMax = Math.pow(10, maxDp);
  const aInt = Math.round(a * fMax);
  const bInt = Math.round(b * fMax);

  // Generate steps using existing integer logic
  const steps = isAdd
    ? generateAdditionSteps(aInt, bInt, difficulty)
    : generateSubtractionSteps(aInt, bInt, difficulty);

  const answer = isAdd ? a + b : a - b;
  const roundedAnswer = Math.round(answer * fMax) / fMax;
  const aStr = a.toFixed(dp1);
  const bStr = b.toFixed(dp2);

  return {
    id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${aStr} ${op} ${bStr}`,
    data: { kind: 'vertical-calc', operation: op, operands: [aInt, bInt], steps, decimalPlaces: maxDp },
    solution: {
      answer: formatNum(roundedAnswer),
      explanation: `${aStr} ${op} ${bStr} = ${formatNum(roundedAnswer)}`,
    },
    hints: [isAdd ? '小数点对齐，从末位开始加，满十进一' : '小数点对齐，从末位开始减，不够减向前借一'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== 小数乘法 (vertical-fill) =====
// v2.1: 中档 = 小数×整数；高档 = 小数×小数（多位，避免可口算的简单题）
function generateDecimalMul(difficulty: number, id: string): Question {
  if (difficulty <= 7) {
    // 中档：小数×整数（2 位小数 × 一位整数，或 1 位小数 × 两位整数）
    const dp = Math.random() < 0.5 ? 1 : 2;
    const factor = Math.pow(10, dp);
    // 三位数级别的 scaled，确保不能简单口算
    let aScaled = randInt(dp === 1 ? 25 : 105, dp === 1 ? 999 : 9999);
    while (aScaled % 10 === 0) aScaled++;
    const a = aScaled / factor;
    const b = dp === 1 ? randInt(3, 9) : randInt(3, 9);
    const productScaled = aScaled * b;
    const answer = productScaled / factor;
    const expression = `${a.toFixed(dp)} × ${b}`;
    return {
      id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
      prompt: `列竖式计算: ${expression}`,
      data: {
        kind: 'vertical-calc',
        operation: '×',
        operands: [a, b],
        steps: [],
        multiplicationBoard: {
          mode: 'decimal',
          integerOperands: [aScaled, b],
          operandInputMode: 'blank',
          originalOperands: [a.toFixed(dp), String(b)],
          operandDecimalPlaces: [dp, 0],
          decimalPlaces: dp,
          finalAnswer: placeDecimalPoint(String(productScaled), dp),
        },
      },
      solution: {
        answer: formatNum(answer),
        steps: ['先按整数乘法计算', '再数两个因数共有几位小数，积就有几位小数'],
        explanation: `${expression} = ${formatNum(answer)}`,
      },
      hints: ['先忽略小数点按整数算，再数两个因数的小数位数之和'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
  // 高档：小数 × 小数，两端均多位且不可口算（禁止 0.2×0.3 这种）
  // 生成策略：a 是两位小数 X.YZ（每位都非零且不是 0.25/0.5），b 是两位小数
  const pickNonTrivial = (): number => {
    for (let tries = 0; tries < 50; tries++) {
      const s = randInt(105, 999); // 1.05 ~ 9.99
      if (s % 10 === 0) continue;
      const v = s / 100;
      // 排除"简单数字"：末位为 0、5，整数部分为 0 的过简小数
      if (s % 25 === 0) continue;
      return v;
    }
    return 3.14;
  };
  const a = pickNonTrivial();
  const b = pickNonTrivial();
  const aS = Math.round(a * 100);
  const bS = Math.round(b * 100);
  const answer = (aS * bS) / 10000;
  const expression = `${a.toFixed(2)} × ${b.toFixed(2)}`;
  return {
    id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `列竖式计算: ${expression}`,
    data: {
      kind: 'vertical-calc',
      operation: '×',
      operands: [a, b],
      steps: [],
      multiplicationBoard: {
        mode: 'decimal',
        integerOperands: [aS, bS],
        operandInputMode: 'blank',
        originalOperands: [a.toFixed(2), b.toFixed(2)],
        operandDecimalPlaces: [2, 2],
        decimalPlaces: 4,
        finalAnswer: placeDecimalPoint(String(aS * bS), 4),
      },
    },
    solution: {
      answer: formatNum(answer),
      steps: [
        '先按整数乘法计算：忽略小数点',
        '再数两个因数共有几位小数，积就有几位小数',
      ],
      explanation: `${expression} = ${formatNum(answer)}`,
    },
    hints: ['两个两位小数相乘，积最多有 4 位小数（末尾0可略）'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== 小数除法 (numeric-input) =====
// v2.1: 中档 = 小数÷整数；高档 = 小数÷小数扩倍长除
function generateDecimalDiv(difficulty: number, id: string): Question {
  if (difficulty <= 7) {
    // 中档：小数÷整数
    let intDivisor = 4;
    let quotient = 0;
    let dividend = 0;
    for (let attempt = 0; attempt < 100; attempt++) {
      intDivisor = randInt(4, 9);
      const qDp = randInt(1, 2);
      const qFactor = Math.pow(10, qDp);
      let qScaled = randInt(11, 999);
      while (qScaled % 10 === 0) qScaled++;
      quotient = qScaled / qFactor;
      dividend = (qScaled * intDivisor) / qFactor;
      if (!(Number.isInteger(dividend) && dividend >= 10 && dividend < 100)) break;
    }
    const expression = `${formatNum(dividend)} ÷ ${intDivisor}`;
    const steps = [`商的小数点与被除数的小数点对齐`, `${expression} = ${formatNum(quotient)}`];
    return {
      id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
      prompt: `列竖式计算: ${expression}`,
      data: { kind: 'vertical-calc', operation: '÷', operands: [dividend, intDivisor], steps: [] },
      solution: {
        answer: formatNum(quotient),
        steps,
        explanation: `${expression} = ${formatNum(quotient)}`,
      },
      hints: ['商的小数点要和被除数的小数点对齐'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
  // 高档：小数÷小数，扩倍后仍需多步试商
  // 要求扩倍后被除数 ≥ 100（保证长除法非一步到位）
  let divisor: number, dividend: number, quotient: number, divisorDp: number;
  for (let tries = 0; tries < 50; tries++) {
    divisorDp = randInt(1, 2);
    const divisorFactor = Math.pow(10, divisorDp);
    let divisorScaled = randInt(divisorDp === 1 ? 11 : 11, divisorDp === 1 ? 99 : 99);
    while (divisorScaled % 10 === 0) divisorScaled++;
    divisor = divisorScaled / divisorFactor;

    // 商是整数或一位小数
    const qDp = randInt(0, 1);
    const qFactor = Math.pow(10, qDp);
    let qScaled = randInt(20, 199);
    while (qScaled % 10 === 0 && qDp > 0) qScaled++;
    quotient = qScaled / qFactor;

    const dividendScaled = qScaled * divisorScaled;
    const totalFactor = qFactor * divisorFactor;
    dividend = dividendScaled / totalFactor;

    // 扩倍后被除数 = dividend * divisorFactor，必须 ≥ 100（非可口算）
    if (dividend * divisorFactor >= 100) break;
  }
  divisor = divisor!;
  const divisorFactor = divisorDp! === 1 ? 10 : 100;
  const shiftedDividend = Math.round(dividend! * divisorFactor);
  const shiftedDivisor = Math.round(divisor * divisorFactor);
  const expression = `${formatNum(dividend!)} ÷ ${formatNum(divisor)}`;
  const steps = [
    `除数是小数，被除数和除数同时 ×${divisorFactor}`,
    `变为 ${shiftedDividend} ÷ ${shiftedDivisor}`,
    `长除法得到商 = ${formatNum(quotient!)}`,
  ];
  return {
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `列竖式计算: ${expression}`,
    data: {
      kind: 'vertical-calc', operation: '÷', operands: [dividend!, divisor], steps: [],
    },
    solution: {
      answer: formatNum(quotient!),
      steps,
      explanation: `${expression} = ${formatNum(quotient!)}`,
    },
    hints: ['先把除数变成整数，被除数同倍扩大；再按整数长除法进行多步试商'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== 取近似值: 竖式计算后四舍五入 (numeric-input) =====
// v2.1 高档重点：除不尽需要取近似（循环小数）
function generateApproximate(difficulty: number, id: string): Question {
  const isMul = Math.random() < 0.3; // 高档更多走除法取近似
  const places = randInt(1, 2);
  const placeText = places === 2 ? '百分位' : '十分位';
  let a: number, b: number, exactAnswer: number, expression: string, opChar: '×' | '÷';
  if (isMul) {
    // 小数×小数取近似
    const aScaled = randInt(201, 999);
    const bScaled = randInt(21, 99);
    a = aScaled / 100;
    b = bScaled / 100;
    exactAnswer = (aScaled * bScaled) / 10000;
    opChar = '×';
    expression = `${a.toFixed(2)} × ${b.toFixed(2)}`;
  } else {
    // 高档重点：三位数整数÷整数除不尽，保留取近似训练但避开口算级短除。
    if (difficulty >= 8 && Math.random() < 0.5) {
      const pair = generateApproximateIntDivision();
      a = pair.dividend;
      b = pair.divisor;
      exactAnswer = a / b;
      opChar = '÷';
      expression = `${a} ÷ ${b}`;
    } else {
      const divisorScaled = randInt(21, 99);
      let dividendScaled = randInt(200, 9999);
      if (dividendScaled % divisorScaled === 0) dividendScaled += 1;
      a = dividendScaled / 100;
      b = divisorScaled / 100;
      exactAnswer = a / b;
      opChar = '÷';
      expression = `${formatNum(a)} ÷ ${formatNum(b)}`;
    }
  }
  const rounded = Number(exactAnswer.toFixed(places));
  return {
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `列竖式计算: ${expression}（精确到${placeText}）`,
    data: { kind: 'vertical-calc', operation: opChar, operands: [a, b], steps: [] },
    solution: {
      answer: rounded.toFixed(places),
      steps: [
        `先算出精确值: ${expression} = ${exactAnswer.toFixed(places + 2)}…`,
        `四舍五入到${placeText}: ≈ ${rounded.toFixed(places)}`,
      ],
      explanation: `${expression} ≈ ${rounded.toFixed(places)}（精确到${placeText}）`,
    },
    hints: ['先用竖式算出比要求多一位的结果，再四舍五入'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateApproximateIntDivision(): { dividend: number; divisor: number } {
  for (let attempt = 0; attempt < 100; attempt++) {
    const dividend = randInt(100, 999);
    const divisor = randInt(4, 19);
    if (dividend % divisor !== 0) return { dividend, divisor };
  }
  return { dividend: 685, divisor: 7 };
}

function generateIntAdd(difficulty: number, id: string): Question {
  let a: number, b: number;
  if (difficulty <= 5) {
    if (difficulty <= 3) {
      // 档1-低 (d=2~3)：三位数 + 两位数，单次进位
      a = randInt(100, 999);
      b = randInt(10, 99);
    } else {
      // 档1-高 (d=4~5)：三位数 + 三位数，多次进位，偶含中间0
      a = randInt(100, 999);
      b = randInt(100, 999);
    }
  } else {
    const [lo, hi] = difficulty <= 7 ? [1000, 9999] : [10000, 99999];
    a = randInt(lo, hi); b = randInt(lo, hi);
  }
  return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} + ${b}`,
    data: { kind: 'vertical-calc' as const, operation: '+' as const, operands: [a, b], steps: generateAdditionSteps(a, b, difficulty) },
    solution: { answer: a + b, explanation: `${a} + ${b} = ${a + b}` },
    hints: ['从个位开始，逐位相加，满十进一'], xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateIntSub(difficulty: number, id: string): Question {
  let a: number, b: number;
  if (difficulty <= 5) {
    if (difficulty <= 3) {
      // 档1-低 (d=2~3)：三位数 - 两位数，单次退位
      a = randInt(100, 999);
      b = randInt(10, 99);
    } else {
      // 档1-高 (d=4~5)：三位数 - 三位数，多次退位，偶含中间0
      a = randInt(200, 999);
      b = randInt(100, a - 10);
    }
  } else {
    const [lo, hi] = difficulty <= 7 ? [1000, 9999] : [10000, 99999];
    a = randInt(lo, hi); b = randInt(lo, a);
  }
  return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} - ${b}`,
    data: { kind: 'vertical-calc' as const, operation: '-' as const, operands: [a, b], steps: generateSubtractionSteps(a, b, difficulty) },
    solution: { answer: a - b, explanation: `${a} - ${b} = ${a - b}` },
    hints: ['从个位开始，逐位相减，不够减向前借一'], xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateIntMul(difficulty: number, id: string): Question {
  if (difficulty > 5) return generateMultiDigitMult(difficulty, id);
  if (difficulty <= 3) {
    // BL-009：低档乘法排除 2位数×1位数，改为仍可低负担起步的 3位数×1位数。
    const a = randInt(100, 999); const b = randInt(2, 9);
    return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
      prompt: `用竖式计算: ${a} × ${b}`,
      data: { kind: 'vertical-calc' as const, operation: '×' as const, operands: [a, b], steps: generateMultiplicationSteps(a, b, difficulty) },
      solution: { answer: a * b, explanation: `${a} × ${b} = ${a * b}` },
      hints: ['从个位开始，逐位相乘'], xpBase: 10 + (difficulty - 1) * 5,
    };
  }
  if (Math.random() < 0.15) {
    return generateTwoDigitByTwoDigitMult(difficulty, id);
  }
  // 档1-高 (d=4~5)：三位数 × 一位数（含进位）
  const a = randInt(100, 999); const b = randInt(2, 9);
  return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} × ${b}`,
    data: { kind: 'vertical-calc' as const, operation: '×' as const, operands: [a, b], steps: generateMultiplicationSteps(a, b, difficulty) },
    solution: { answer: a * b, explanation: `${a} × ${b} = ${a * b}` },
    hints: ['从个位开始，逐位相乘，注意进位'], xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateIntDiv(difficulty: number, id: string): Question {
  return generateDivision(difficulty, id);
}

export function generateVerticalCalc(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  // v2.1：
  //   低档 (d≤5)：纯整数
  //   中档 (6≤d≤7)：小数加减、小数×整数、整数÷出小数、多位×多位整数
  //   高档 (d≥8)：小数÷小数扩倍、多位小数×小数、循环小数取近似、高位含中间0乘法
  const entries: SubtypeEntry[] = difficulty <= 5 ? [
    { tag: 'int-add', weight: 30, gen: () => generateIntAdd(difficulty, id) },
    { tag: 'int-sub', weight: 30, gen: () => generateIntSub(difficulty, id) },
    { tag: 'int-mul', weight: 20, gen: () => generateIntMul(difficulty, id) },
    { tag: 'int-div', weight: 20, gen: () => generateIntDiv(difficulty, id) },
  ] : difficulty <= 7 ? [
    { tag: 'int-mul', weight: 15, gen: () => generateIntMul(difficulty, id) },
    { tag: 'int-div', weight: 10, gen: () => generateIntDiv(difficulty, id) },
    { tag: 'dec-add-sub', weight: 30, gen: () => generateDecimalAddSub(difficulty, id) },
    { tag: 'dec-mul', weight: 20, gen: () => generateDecimalMul(difficulty, id) },
    { tag: 'dec-div', weight: 15, gen: () => generateDecimalDiv(difficulty, id) },
    { tag: 'approximate', weight: 10, gen: () => generateApproximate(difficulty, id) },
  ] : [
    { tag: 'int-mul', weight: 15, gen: () => generateIntMul(difficulty, id) },
    { tag: 'dec-add-sub', weight: 10, gen: () => generateDecimalAddSub(difficulty, id) },
    { tag: 'dec-mul', weight: 25, gen: () => generateDecimalMul(difficulty, id) },
    { tag: 'dec-div', weight: 30, gen: () => generateDecimalDiv(difficulty, id) },
    { tag: 'approximate', weight: 20, gen: () => generateApproximate(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
