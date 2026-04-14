import type { Question, VerticalCalcStep } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';

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

// Normal (<=5): carry mandatory; Hard/Demon: carry optional
function isCarrySkippable(difficulty: number): boolean {
  return difficulty > 5;
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
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

/** Generate a numeric-input question for multi-digit multiplication */
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
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `用竖式计算: ${a} × ${b}`,
    data: { kind: 'vertical-calc', operation: '×' as const, operands: [a, b], steps: [] },
    solution: { answer, steps, explanation: `${a} × ${b} = ${answer}` },
    hints: ['先用第二个数的个位乘第一个数，再用十位乘，最后把部分积相加'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** Generate a numeric-input question for long division */
function generateDivision(difficulty: number, id: string): Question {
  let a: number, b: number, quotient: number;

  if (difficulty <= 5) {
    // Normal: 2~3-digit ÷ 1-digit, exact
    b = randInt(2, 9);
    quotient = randInt(11, Math.floor(999 / b));
    a = b * quotient;
  } else if (difficulty <= 7) {
    // Hard: 3-digit ÷ 1-digit, exact
    b = randInt(2, 9);
    quotient = randInt(11, Math.floor(999 / b));
    a = b * quotient;
    if (a < 100) { quotient = randInt(20, Math.floor(999 / b)); a = b * quotient; }
  } else {
    // Demon: 3~4-digit ÷ 2-digit, exact
    b = randInt(11, 99);
    quotient = randInt(11, 99);
    a = b * quotient;
    // Ensure 3-4 digit dividend
    if (a < 100) { quotient = randInt(20, 99); a = b * quotient; }
    if (a > 9999) { quotient = randInt(11, Math.floor(9999 / b)); a = b * quotient; }
  }

  const steps = longDivisionSolution(a, b);

  return {
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `用竖式计算: ${a} ÷ ${b}`,
    data: { kind: 'vertical-calc', operation: '÷' as const, operands: [a, b], steps: [] },
    solution: { answer: quotient, steps, explanation: `${a} ÷ ${b} = ${quotient}` },
    hints: ['从最高位开始，逐位试商'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
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

// ===== 小数乘法 (numeric-input) =====
function generateDecimalMul(difficulty: number, id: string): Question {
  let a: number, b: number, answer: number, expression: string;
  if (difficulty <= 5) {
    const dp = randInt(1, 2);
    const factor = Math.pow(10, dp);
    let aScaled = randInt(101, 9999);
    while (aScaled % 10 === 0) aScaled++;
    a = aScaled / factor;
    b = randInt(2, 9);
    const productScaled = aScaled * b;
    answer = productScaled / factor;
    expression = `${a.toFixed(dp)} × ${b}`;
    return {
      id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
      prompt: `列竖式计算: ${expression}`,
      data: {
        kind: 'vertical-calc', operation: '×', operands: [a, b], steps: [],
        trainingFields: [
          { label: `${a.toFixed(dp)} 有几位小数`, answer: String(dp) },
          { label: `${b} 有几位小数`, answer: '0' },
          { label: '积共有几位小数', answer: String(dp) },
        ],
      },
      solution: {
        answer: formatNum(answer),
        steps: ['先按整数乘法计算', '再数两个因数共有几位小数，积就有几位小数'],
        explanation: `${expression} = ${formatNum(answer)}`,
      },
      hints: ['先忽略小数点按整数算，再数两个因数的小数位数之和'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    const dp1 = randInt(1, 2);
    const dp2 = randInt(1, 2);
    const f1 = Math.pow(10, dp1);
    const f2 = Math.pow(10, dp2);
    let aScaled = randInt(11, dp1 === 1 ? 999 : 9999);
    while (aScaled % 10 === 0) aScaled++;
    let bScaled = randInt(11, dp2 === 1 ? 99 : 999);
    while (bScaled % 10 === 0) bScaled++;
    a = aScaled / f1;
    b = bScaled / f2;
    const productScaled = aScaled * bScaled;
    const totalDp = dp1 + dp2;
    answer = productScaled / Math.pow(10, totalDp);
    expression = `${a.toFixed(dp1)} × ${b.toFixed(dp2)}`;
    return {
      id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
      prompt: `列竖式计算: ${expression}`,
      data: {
        kind: 'vertical-calc', operation: '×', operands: [a, b], steps: [],
        trainingFields: [
          { label: `${a.toFixed(dp1)} 有几位小数`, answer: String(dp1) },
          { label: `${b.toFixed(dp2)} 有几位小数`, answer: String(dp2) },
          { label: '积共有几位小数', answer: String(dp1 + dp2) },
        ],
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
}

// ===== 小数除法 (numeric-input) =====
function generateDecimalDiv(difficulty: number, id: string): Question {
  let dividend: number, divisor: number, quotient: number, expression: string;
  let steps: string[];
  if (difficulty <= 5) {
    const intDivisor = randInt(2, 9);
    const qDp = randInt(1, 2);
    const qFactor = Math.pow(10, qDp);
    let qScaled = randInt(11, 999);
    // 确保商有小数位（末位非零）
    while (qScaled % 10 === 0) qScaled++;
    quotient = qScaled / qFactor;
    dividend = (qScaled * intDivisor) / qFactor;
    divisor = intDivisor;
    expression = `${formatNum(dividend)} ÷ ${divisor}`;
    steps = [`商的小数点与被除数的小数点对齐`, `${expression} = ${formatNum(quotient)}`];
    return {
      id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
      prompt: `列竖式计算: ${expression}`,
      data: { kind: 'vertical-calc', operation: '÷', operands: [dividend, divisor], steps: [] },
      solution: {
        answer: formatNum(quotient),
        steps,
        explanation: `${expression} = ${formatNum(quotient)}`,
      },
      hints: ['商的小数点要和被除数的小数点对齐'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    const divisorDp = randInt(1, 2);
    const divisorFactor = Math.pow(10, divisorDp);
    let divisorScaled = randInt(11, divisorDp === 1 ? 99 : 999);
    while (divisorScaled % 10 === 0) divisorScaled++;
    divisor = divisorScaled / divisorFactor;
    let qScaled = randInt(11, 999);
    while (qScaled % 10 === 0) qScaled++;
    const qDp = randInt(0, 1);
    const qFactor = Math.pow(10, qDp);
    quotient = qScaled / qFactor;
    const dividendScaled = qScaled * divisorScaled;
    const totalFactor = qFactor * divisorFactor;
    dividend = dividendScaled / totalFactor;
    const shiftedDividend = dividend * divisorFactor;
    const shiftedDivisor = divisorScaled;
    expression = `${formatNum(dividend)} ÷ ${formatNum(divisor)}`;
    steps = [
      `除数是小数，被除数和除数同时 ×${divisorFactor}`,
      `变为 ${formatNum(shiftedDividend)} ÷ ${shiftedDivisor} = ${formatNum(quotient)}`,
    ];
    return {
      id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
      prompt: `列竖式计算: ${expression}`,
      data: {
        kind: 'vertical-calc', operation: '÷', operands: [dividend, divisor], steps: [],
        trainingFields: [
          { label: `除数 ${formatNum(divisor)} 有几位小数`, answer: String(divisorDp) },
          { label: '除数变成', answer: String(divisorScaled) },
          { label: '被除数变成', answer: formatNum(dividend * divisorFactor) },
        ],
      },
      solution: {
        answer: formatNum(quotient),
        steps,
        explanation: `${expression} = ${formatNum(quotient)}`,
      },
      hints: ['先把除数变成整数，被除数也同时乘相同的数'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
}

// ===== 取近似值: 竖式计算后四舍五入 (numeric-input) =====
function generateApproximate(difficulty: number, id: string): Question {
  const isMul = Math.random() < 0.5;
  const places = difficulty <= 7 ? 2 : 1;
  const placeText = places === 2 ? '百分位' : '十分位';
  let a: number, b: number, exactAnswer: number, expression: string, opChar: '×' | '÷';
  if (isMul) {
    const aScaled = randInt(101, 999);
    const bScaled = randInt(11, 99);
    a = aScaled / 100;
    b = bScaled / 100;
    exactAnswer = (aScaled * bScaled) / 10000;
    opChar = '×';
    expression = `${a.toFixed(2)} × ${b.toFixed(2)}`;
  } else {
    const divisorScaled = randInt(11, 99);
    let dividendScaled = randInt(100, 9999);
    if (dividendScaled % divisorScaled === 0) dividendScaled += 1;
    a = dividendScaled / 100;
    b = divisorScaled / 100;
    exactAnswer = a / b;
    opChar = '÷';
    expression = `${formatNum(a)} ÷ ${formatNum(b)}`;
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

function generateIntAdd(difficulty: number, id: string): Question {
  const [lo, hi] = difficulty <= 5 ? [100, 999] : difficulty <= 7 ? [1000, 9999] : [10000, 99999];
  const a = randInt(lo, hi); const b = randInt(lo, hi);
  return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} + ${b}`,
    data: { kind: 'vertical-calc' as const, operation: '+' as const, operands: [a, b], steps: generateAdditionSteps(a, b, difficulty) },
    solution: { answer: a + b, explanation: `${a} + ${b} = ${a + b}` },
    hints: ['从个位开始，逐位相加，满十进一'], xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateIntSub(difficulty: number, id: string): Question {
  const [lo, hi] = difficulty <= 5 ? [100, 999] : difficulty <= 7 ? [1000, 9999] : [10000, 99999];
  const a = randInt(lo, hi); const b = randInt(lo, a);
  return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} - ${b}`,
    data: { kind: 'vertical-calc' as const, operation: '-' as const, operands: [a, b], steps: generateSubtractionSteps(a, b, difficulty) },
    solution: { answer: a - b, explanation: `${a} - ${b} = ${a - b}` },
    hints: ['从个位开始，逐位相减，不够减向前借一'], xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateIntMul(difficulty: number, id: string): Question {
  if (difficulty > 5) return generateMultiDigitMult(difficulty, id);
  const a = randInt(10, 99); const b = randInt(2, 9);
  return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${a} × ${b}`,
    data: { kind: 'vertical-calc' as const, operation: '×' as const, operands: [a, b], steps: generateMultiplicationSteps(a, b, difficulty) },
    solution: { answer: a * b, explanation: `${a} × ${b} = ${a * b}` },
    hints: ['从个位开始，逐位相乘'], xpBase: 10 + (difficulty - 1) * 5,
  };
}

export function generateVerticalCalc(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = difficulty <= 5 ? [
    { tag: 'int-add', weight: 15, gen: () => generateIntAdd(difficulty, id) },
    { tag: 'int-sub', weight: 15, gen: () => generateIntSub(difficulty, id) },
    { tag: 'int-mul', weight: 10, gen: () => generateIntMul(difficulty, id) },
    { tag: 'int-div', weight: 10, gen: () => generateDivision(difficulty, id) },
    { tag: 'dec-add-sub', weight: 25, gen: () => generateDecimalAddSub(difficulty, id) },
    { tag: 'dec-mul', weight: 15, gen: () => generateDecimalMul(difficulty, id) },
    { tag: 'dec-div', weight: 10, gen: () => generateDecimalDiv(difficulty, id) },
  ] : difficulty <= 7 ? [
    { tag: 'int-add', weight: 5, gen: () => generateIntAdd(difficulty, id) },
    { tag: 'int-sub', weight: 5, gen: () => generateIntSub(difficulty, id) },
    { tag: 'int-mul', weight: 10, gen: () => generateIntMul(difficulty, id) },
    { tag: 'int-div', weight: 10, gen: () => generateDivision(difficulty, id) },
    { tag: 'dec-add-sub', weight: 30, gen: () => generateDecimalAddSub(difficulty, id) },
    { tag: 'dec-mul', weight: 15, gen: () => generateDecimalMul(difficulty, id) },
    { tag: 'dec-div', weight: 15, gen: () => generateDecimalDiv(difficulty, id) },
    { tag: 'approximate', weight: 10, gen: () => generateApproximate(difficulty, id) },
  ] : [
    { tag: 'int-add', weight: 5, gen: () => generateIntAdd(difficulty, id) },
    { tag: 'int-sub', weight: 5, gen: () => generateIntSub(difficulty, id) },
    { tag: 'int-mul', weight: 10, gen: () => generateIntMul(difficulty, id) },
    { tag: 'int-div', weight: 10, gen: () => generateDivision(difficulty, id) },
    { tag: 'dec-add-sub', weight: 20, gen: () => generateDecimalAddSub(difficulty, id) },
    { tag: 'dec-mul', weight: 20, gen: () => generateDecimalMul(difficulty, id) },
    { tag: 'dec-div', weight: 20, gen: () => generateDecimalDiv(difficulty, id) },
    { tag: 'approximate', weight: 10, gen: () => generateApproximate(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
