import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';

export function getSubtypeEntries(_difficulty: number): SubtypeDef[] {
  // A02 所有难度档使用相同子题型集合
  return [
    { tag: 'estimate',      weight: 35 },
    { tag: 'round',         weight: 20 },
    { tag: 'compare',       weight: 15 },
    { tag: 'floor-ceil',    weight: 15 },
    { tag: 'reverse-round', weight: 15 },
  ];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick a rounding place from all valid options for the given number
// e.g. 3456 → could round to 十(10), 百(100), or 千(1000)
function getEstimatePlace(n: number): number {
  const abs = Math.abs(n);
  const candidates: number[] = [];
  if (abs >= 10) candidates.push(10);
  if (abs >= 100) candidates.push(100);
  if (abs >= 1000) candidates.push(1000);
  if (abs >= 10000) candidates.push(10000);
  if (candidates.length === 0) return 10;
  return candidates[randInt(0, candidates.length - 1)];
}

function generateEstimate(difficulty: number, id: string): Question {
  const ops: ('+' | '-' | '×')[] = difficulty <= 5 ? ['+', '-'] : ['+', '-', '×'];
  const op = ops[randInt(0, ops.length - 1)];
  const max = difficulty <= 5 ? 500 : difficulty <= 7 ? 5000 : 50000;
  let a = randInt(10, max);
  let b = randInt(10, max);
  let exact: number;
  let expression: string;
  switch (op) {
    case '+': exact = a + b; expression = `${a} + ${b}`; break;
    case '-': {
      if (a < b) [a, b] = [b, a];
      exact = a - b;
      // Avoid trivially small results
      if (exact < 10) { exact = a + b; expression = `${a} + ${b}`; }
      else { expression = `${a} - ${b}`; }
      break;
    }
    case '×': {
      a = randInt(10, difficulty <= 7 ? 99 : 999);
      b = randInt(2, difficulty <= 7 ? 20 : 99);
      exact = a * b; expression = `${a} × ${b}`; break;
    }
  }

  // Determine rounding place
  const place = getEstimatePlace(exact);
  const placeNames: Record<number, string> = { 1: '个', 10: '十', 100: '百', 1000: '千', 10000: '万' };
  const placeName = placeNames[place] ?? String(place);

  // Compute the two nearest rounded values
  const roundDown = Math.floor(exact / place) * place;
  const roundUp = roundDown + place;
  const closest = (exact - roundDown <= roundUp - exact) ? roundDown : roundUp;
  const secondClosest = closest === roundDown ? roundUp : roundDown;

  // Normal & Hard (difficulty<=7): accept both nearest rounded values
  // Demon (difficulty>7): accept only the single closest
  const isStrict = difficulty > 7;
  const acceptedAnswers = isStrict
    ? [closest]
    : [closest, secondClosest];

  const acceptedStr = isStrict
    ? `最接近的整${placeName}数是 ${closest}`
    : `${closest} 或 ${secondClosest} 均算正确`;

  return {
    id,
    topicId: 'number-sense',
    type: 'numeric-input',
    difficulty,
    prompt: `估算 ${expression}，结果取整${placeName}数`,
    data: { kind: 'number-sense', subtype: 'estimate', acceptedAnswers },
    solution: {
      answer: closest,
      explanation: `${expression} = ${exact}，${acceptedStr}`,
    },
    hints: [`把每个数四舍五入到${placeName}位再计算`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateRound(difficulty: number, id: string): Question {
  const numMax = difficulty <= 5 ? 1000 : difficulty <= 7 ? 50000 : 500000;
  const placeNames: Record<number, string> = { 10: '十', 100: '百', 1000: '千', 10000: '万' };

  // Collect valid places
  const validPlaces: number[] = [];
  if (numMax >= 10) validPlaces.push(10);
  if (numMax >= 100) validPlaces.push(100);
  if (numMax >= 1000) validPlaces.push(1000);
  if (numMax >= 10000) validPlaces.push(10000);
  const place = validPlaces[randInt(0, validPlaces.length - 1)];

  let num: number;
  // Hard/Demon: 30% force the deciding digit to be exactly 5 (common trap)
  if (difficulty > 5 && Math.random() < 0.3) {
    const base = randInt(1, Math.floor(numMax / place) - 1) * place;
    num = base + Math.floor(place / 2); // e.g. 350, 2500, 15000
  } else {
    num = randInt(100, numMax);
  }

  // Use explicit round-half-up (not banker's rounding)
  const answer = Math.floor(num / place + 0.5) * place;

  return {
    id,
    topicId: 'number-sense',
    type: 'numeric-input',
    difficulty,
    prompt: `将 ${num.toLocaleString()} 四舍五入到${placeNames[place]}位`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: { answer, explanation: `${num.toLocaleString()} 四舍五入到${placeNames[place]}位 = ${answer.toLocaleString()}` },
    hints: [`看${placeNames[place]}位后面的数字，>=5进1，<5舍去`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// 大小比较判断: a × b ○ a 或 a ÷ b ○ a
function generateCompare(difficulty: number, id: string): Question {
  const isMultiply = Math.random() < 0.5;
  const op = isMultiply ? '×' : '÷';

  // 基数
  const a = difficulty <= 5
    ? Number((randInt(11, 99) / 10).toFixed(1))
    : Number((randInt(101, 999) / 100).toFixed(2));

  // 因子 b: b>1 42.5%, b<1 42.5%, b=1 15%
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

  const aStr = Number.isInteger(a) ? String(a) : a.toFixed(a % 1 < 0.1 ? 1 : 2).replace(/0+$/, '').replace(/\.$/, '');
  const bStr = Number.isInteger(b) ? String(b) : b.toFixed(1);
  const comparison = `${aStr} ${op} ${bStr} ○ ${aStr}`;

  const ruleText = isMultiply
    ? (b > 1 ? '乘以大于1的数，积大于原数' : b < 1 ? '乘以小于1的数，积小于原数' : '乘以1，积等于原数')
    : (b > 1 ? '除以大于1的数，商小于原数' : b < 1 ? '除以小于1的数，商大于原数' : '除以1，商等于原数');

  return {
    id, topicId: 'number-sense', type: 'multiple-choice', difficulty,
    prompt: `不计算，比较大小: ${comparison}`,
    data: { kind: 'number-sense', subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer, explanation: ruleText },
    hints: ['关键：乘除的数和 1 比较，大于1还是小于1？'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// 去尾法/进一法: 不同于四舍五入的取近似值方法
function generateFloorCeil(difficulty: number, id: string): Question {
  const isFloor = Math.random() < 0.5;
  const methodName = isFloor ? '去尾法' : '进一法';

  const dp = difficulty <= 5 ? 1 : 2;
  const factor = Math.pow(10, dp);
  const num = randInt(11, difficulty <= 5 ? 999 : 9999) / factor;

  // 取近似到某位
  const toInteger = dp === 1 || Math.random() < 0.5;
  let answer: number;

  if (toInteger) {
    answer = isFloor ? Math.floor(num) : Math.ceil(num);
  } else {
    answer = isFloor
      ? Math.floor(num * 10) / 10
      : Math.ceil(num * 10) / 10;
  }

  const placeText = toInteger ? '个位' : '十分位';
  const numStr = num.toFixed(dp);

  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `用${methodName}将 ${numStr} 取近似到${placeText}`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: {
      answer,
      explanation: isFloor
        ? `去尾法: 直接去掉${placeText}后面的数字，${numStr} → ${answer}`
        : `进一法: 只要${placeText}后面有数字就进1，${numStr} → ${answer}`,
    },
    hints: [isFloor ? '去尾法: 不管后面是几，直接舍去' : '进一法: 不管后面是几，都向前进1'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// 逆向推理: 给出四舍五入结果，求原数的最大/最小值
function generateReverseRound(difficulty: number, id: string): Question {
  const askMax = Math.random() < 0.5;

  const dp = difficulty <= 5 ? 1 : 2;
  const roundedScaled = randInt(10, 99);
  const roundedStr = (roundedScaled / Math.pow(10, dp)).toFixed(dp);
  const precision = dp === 1 ? '一位小数' : '两位小数';
  const nextDp = dp + 1;
  const scale = Math.pow(10, nextDp);

  // 纯整数运算避免浮点误差: base = roundedScaled 扩展到 nextDp 精度
  const base = roundedScaled * 10;
  const answerScaled = askMax ? base + 4 : base - 5;
  const answerStr = (answerScaled / scale).toFixed(nextDp);
  const extremeText = askMax ? '最大' : '最小';

  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `一个${nextDp === 2 ? '两' : '三'}位小数四舍五入保留${precision}后得 ${roundedStr}，这个数${extremeText}是多少？`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: {
      answer: answerStr,
      explanation: askMax
        ? `保留${precision}得 ${roundedStr}，最大的${nextDp === 2 ? '两' : '三'}位小数是 ${answerStr}（再大就会进位）`
        : `保留${precision}得 ${roundedStr}，最小的${nextDp === 2 ? '两' : '三'}位小数是 ${answerStr}（再小就会舍去到更小的值）`,
    },
    hints: [askMax ? '想想最大到多少还能四舍（舍去）到这个数' : '想想最小到多少能五入（进位）到这个数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

export function generateNumberSense(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = [
    { tag: 'estimate', weight: 35, gen: () => generateEstimate(difficulty, id) },
    { tag: 'round', weight: 20, gen: () => generateRound(difficulty, id) },
    { tag: 'compare', weight: 15, gen: () => generateCompare(difficulty, id) },
    { tag: 'floor-ceil', weight: 15, gen: () => generateFloorCeil(difficulty, id) },
    { tag: 'reverse-round', weight: 15, gen: () => generateReverseRound(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
