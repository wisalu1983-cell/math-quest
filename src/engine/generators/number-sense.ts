import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';
import type { SubtypeDef } from '@/types/gamification';

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getSubtypeEntries(_difficulty: number): SubtypeDef[] {
  return [
    { tag: 'estimate',      weight: 30 },
    { tag: 'round',         weight: 20 },
    { tag: 'compare',       weight: 20 },
    { tag: 'floor-ceil',    weight: 15 },
    { tag: 'reverse-round', weight: 15 },
  ];
}

// ---------------------------------------------------------------------------
// 估算 (estimate)
//   低档：一步凑整（加减），取整十/整百
//   中档：含乘法 + 方向判断（偏大/偏小）
//   高档：多式估算比较 + 现实取整情境
// ---------------------------------------------------------------------------

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

function generateEstimateBasic(difficulty: number, id: string): Question {
  const ops: ('+' | '-' | '×')[] = difficulty <= 5 ? ['+', '-'] : ['+', '-', '×'];
  const op = pick(ops);
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

  const place = getEstimatePlace(exact);
  const placeNames: Record<number, string> = { 1: '个', 10: '十', 100: '百', 1000: '千', 10000: '万' };
  const placeName = placeNames[place] ?? String(place);

  const roundDown = Math.floor(exact / place) * place;
  const roundUp = roundDown + place;
  const closest = (exact - roundDown <= roundUp - exact) ? roundDown : roundUp;
  const secondClosest = closest === roundDown ? roundUp : roundDown;

  const halfway = roundDown + place / 2;
  const bias = Math.abs(exact - halfway) / place;
  const threshold = difficulty <= 5 ? 0.15 : difficulty <= 7 ? 0.10 : 0;
  const acceptBoth = bias <= threshold;
  const acceptedAnswers = acceptBoth ? [closest, secondClosest] : [closest];
  const acceptedStr = acceptBoth
    ? `${closest} 或 ${secondClosest} 均算正确`
    : `最接近的整${placeName}数是 ${closest}`;

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

/** 中档方向判断：a × b 的估算结果比精确值偏大还是偏小？（MC） */
function generateEstimateDirection(difficulty: number, id: string): Question {
  // 选择易于判定方向的形式：a×b，其中 a 或 b 估算时向上/向下取整
  // 例：199 × 5 → 估算 200×5=1000，实际 199×5=995，偏大
  //     201 × 6 → 估算 200×6=1200，实际 201×6=1206，偏小
  const bigPool = [99, 199, 299, 399, 499, 198, 298, 398, 202, 303, 404, 505, 101, 201, 301, 498, 597, 498];
  const a = pick(bigPool);
  const b = randInt(3, 9);
  const roundedA = Math.round(a / 100) * 100;
  const estimate = roundedA * b;
  const exact = a * b;
  const direction = estimate > exact ? '偏大' : estimate < exact ? '偏小' : '相等';

  const options = ['偏大', '偏小', '相等'];
  return {
    id, topicId: 'number-sense', type: 'multiple-choice', difficulty,
    prompt: `把 ${a} × ${b} 估算成 ${roundedA} × ${b} = ${estimate}，这个估算结果比精确值如何？`,
    data: { kind: 'number-sense', subtype: 'estimate', options },
    solution: {
      answer: direction,
      explanation: `${a} 被估成 ${roundedA}（${roundedA > a ? '变大' : '变小'}了 ${Math.abs(roundedA - a)}），所以结果 ${direction}。精确值 ${exact}，估算值 ${estimate}`,
    },
    hints: [`${a} 估成 ${roundedA} 是变大还是变小？`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 高档现实取整情境：进一法 vs 去尾法的选择 */
function generateEstimateRealContext(difficulty: number, id: string): Question {
  const pool: Array<{ prompt: string; answer: number; explanation: string }> = [
    {
      prompt: '买 8.3 米的绳子，商店只能整米卖。至少要买几米？',
      answer: 9,
      explanation: '实际需要至少 8.3 米，只能整米买→向上取整（进一法）→ 9',
    },
    {
      prompt: '一个油桶装 4.5 升油，要装 37 升油，至少需要几个桶？',
      answer: 9,
      explanation: '37 ÷ 4.5 ≈ 8.22，不够的必须多一个桶（进一法）→ 9',
    },
    {
      prompt: '85 千克苹果装袋，每袋最多装 9 千克，最多能装满几袋？',
      answer: 9,
      explanation: '85 ÷ 9 = 9.44，只能算装满的袋（去尾法）→ 9',
    },
    {
      prompt: '一根 2.4 米的木料做 0.5 米长的小棒，最多能做几根？',
      answer: 4,
      explanation: '2.4 ÷ 0.5 = 4.8，只能算完整的（去尾法）→ 4',
    },
    {
      prompt: '150 人春游，每辆车坐 32 人，至少需要几辆车？',
      answer: 5,
      explanation: '150 ÷ 32 ≈ 4.69，必须让所有人都坐上（进一法）→ 5',
    },
    {
      prompt: '一块花布长 5 米，每 1.2 米做一个沙发套，最多做几个？',
      answer: 4,
      explanation: '5 ÷ 1.2 ≈ 4.17，只能算完整沙发套（去尾法）→ 4',
    },
  ];
  const sel = pick(pool);
  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: sel.prompt,
    data: { kind: 'number-sense', subtype: 'estimate' },
    solution: { answer: sel.answer, explanation: sel.explanation },
    hints: ['思考：结果必须"够用/不够就凑"还是"只能按整份"？'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateEstimate(difficulty: number, id: string): Question {
  if (difficulty >= 8) {
    // 高档：50% 现实取整情境 / 50% 含乘法的估算
    if (Math.random() < 0.5) return generateEstimateRealContext(difficulty, id);
    return generateEstimateBasic(difficulty, id);
  }
  if (difficulty >= 6) {
    // 中档：40% 方向判断 / 60% 含乘法估算
    if (Math.random() < 0.4) return generateEstimateDirection(difficulty, id);
    return generateEstimateBasic(difficulty, id);
  }
  return generateEstimateBasic(difficulty, id);
}

// ---------------------------------------------------------------------------
// 四舍五入 (round)
//   低档：规则一眼可用
//   中档：强化"5"边界陷阱
//   高档：多精度对比、方法对比 MC、含多选
// ---------------------------------------------------------------------------

function generateRoundBasic(difficulty: number, id: string): Question {
  const numMax = difficulty <= 5 ? 1000 : difficulty <= 7 ? 50000 : 500000;
  const placeNames: Record<number, string> = { 10: '十', 100: '百', 1000: '千', 10000: '万' };

  const validPlaces: number[] = [];
  if (numMax >= 10) validPlaces.push(10);
  if (numMax >= 100) validPlaces.push(100);
  if (numMax >= 1000) validPlaces.push(1000);
  if (numMax >= 10000) validPlaces.push(10000);
  const place = pick(validPlaces);

  let num: number;
  // 中档: 50% 概率生成 "5" 边界；高档 40%
  const fiveRate = difficulty >= 8 ? 0.4 : difficulty >= 6 ? 0.5 : 0;
  if (Math.random() < fiveRate) {
    const base = randInt(1, Math.floor(numMax / place) - 1) * place;
    num = base + Math.floor(place / 2);
  } else {
    num = randInt(100, numMax);
  }

  const answer = Math.floor(num / place + 0.5) * place;

  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `将 ${num.toLocaleString()} 四舍五入到${placeNames[place]}位`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: { answer, explanation: `${num.toLocaleString()} 四舍五入到${placeNames[place]}位 = ${answer.toLocaleString()}` },
    hints: [`看${placeNames[place]}位后面的数字，>=5进1，<5舍去`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 高档：多精度对比（同一个数四舍五入到两个不同位，求差） */
function generateRoundMultiPrecision(difficulty: number, id: string): Question {
  const num = randInt(300, 9999);
  const placeA = pick([10, 100] as const);
  const placeB = placeA === 10 ? 100 : 1000;
  const rA = Math.round(num / placeA) * placeA;
  const rB = Math.round(num / placeB) * placeB;
  const diff = Math.abs(rA - rB);
  const placeName: Record<number, string> = { 10: '十', 100: '百', 1000: '千' };
  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `${num} 四舍五入到${placeName[placeA]}位得 ${rA}，到${placeName[placeB]}位得 ${rB}。两个结果相差多少？`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: { answer: diff, explanation: `|${rA} − ${rB}| = ${diff}` },
    hints: ['取两个结果的差'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 高档：方法对比 MC（四舍五入 vs 去尾法） */
function generateRoundMethodCompare(difficulty: number, id: string): Question {
  // 选 4 个候选，每个候选带着"到某位"，挑出"四舍五入 ≠ 去尾法"的一个
  const candidates: Array<{ label: string; num: number; place: 'int' | 'tenth'; roundEq: boolean }> = [
    { label: '3.2 到个位', num: 3.2, place: 'int', roundEq: true },   // 四舍=3, 去尾=3
    { label: '3.7 到个位', num: 3.7, place: 'int', roundEq: false },  // 四舍=4, 去尾=3
    { label: '4.0 到个位', num: 4.0, place: 'int', roundEq: true },
    { label: '5.3 到个位', num: 5.3, place: 'int', roundEq: true },
    { label: '2.6 到个位', num: 2.6, place: 'int', roundEq: false },  // 四舍=3, 去尾=2
    { label: '7.1 到个位', num: 7.1, place: 'int', roundEq: true },
    { label: '9.5 到个位', num: 9.5, place: 'int', roundEq: false },
    { label: '6.8 到个位', num: 6.8, place: 'int', roundEq: false },
  ];
  const diffOne = pick(candidates.filter(c => !c.roundEq));
  const sameOnes = shuffle(candidates.filter(c => c.roundEq)).slice(0, 3);
  const optionsArr = shuffle([diffOne, ...sameOnes]);
  const letters = ['A', 'B', 'C', 'D'];
  const options = optionsArr.map((c, i) => `${letters[i]}. ${c.label}`);
  const correctIdx = optionsArr.indexOf(diffOne);
  return {
    id, topicId: 'number-sense', type: 'multiple-choice', difficulty,
    prompt: '以下哪种情况四舍五入和去尾法结果不同？',
    data: { kind: 'number-sense', subtype: 'round', options },
    solution: {
      answer: letters[correctIdx],
      explanation: `${diffOne.label}：四舍五入=${Math.round(diffOne.num)}，去尾法=${Math.floor(diffOne.num)}，不同`,
    },
    hints: ['去尾法永远舍去后面，四舍五入可能进位'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 中档：小数四舍五入（保留一位/两位小数），含 5 边界陷阱 + 进位跨位 */
function generateRoundDecimal(difficulty: number, id: string): Question {
  const keepDigits = pick([1, 2] as const);
  const variant = pick(['five-boundary', 'carry-cross', 'normal'] as const);

  let intValue: number; // 原数 × 10^(keepDigits+2)，整数表示
  const scale = Math.pow(10, keepDigits + 2); // 比保留位多 2 位精度（用 +2 降低浮点误差）

  if (variant === 'five-boundary') {
    // 末位恰为 5（决定进不进位）：例 3.45 保留 1 位 → 3.5（>=5 进 1）
    // 构造 N.###5（最后那位是 5，后面再追加一位非零防止精度误差）
    const whole = randInt(1, 9);
    const fracBody = Array.from({ length: keepDigits }, () => randInt(1, 9)).join('');
    const trailing = pick([5, 5, 5, 6, 7]); // 偏向 5 测边界
    const extra = randInt(0, 9);
    intValue = (whole * scale) + Number(`${fracBody}${trailing}${extra}`);
  } else if (variant === 'carry-cross') {
    // 进位跨位：例 0.997 保留两位 → 1.00
    const whole = randInt(0, 4);
    // 小数部分末 keepDigits 位都是 9，后一位决定是否进位
    const fracPrefix = '9'.repeat(keepDigits);
    const rounder = pick([5, 6, 7, 8, 9]);
    const extra = randInt(0, 9);
    intValue = (whole * scale) + Number(`${fracPrefix}${rounder}${extra}`);
  } else {
    // 普通小数
    const whole = randInt(1, 99);
    const frac = randInt(0, scale - 1);
    intValue = whole * scale + frac;
  }

  const displayNum = intValue / scale;
  // 保留 keepDigits 位：看保留位后一位（第 keepDigits+1 位）>=5 即进位
  const keepScale = Math.pow(10, keepDigits);
  const rounded = Math.round(intValue * keepScale / scale) / keepScale;
  // 格式化为固定小数位
  const displayStr = displayNum.toFixed(keepDigits + 2).replace(/0+$/, '').replace(/\.$/, '.0');
  const answerStr = rounded.toFixed(keepDigits);

  const placeName = keepDigits === 1 ? '一位小数' : '两位小数';

  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `将 ${displayStr} 四舍五入保留${placeName}`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: {
      answer: answerStr,
      explanation: `${displayStr} 保留${placeName} = ${answerStr}。看第 ${keepDigits + 1} 位小数${variant === 'five-boundary' ? '（恰好为 5 的边界：>=5 进 1）' : variant === 'carry-cross' ? '（需要进位跨位，前面的 9 都要连锁进 1）' : ''}。`,
    },
    hints: [`看保留位后面一位：>=5 进 1，<5 舍去${variant === 'carry-cross' ? '；当连续是 9 时要连锁进位' : ''}`],
    xpBase: 12 + (difficulty - 1) * 5,
  };
}

function generateRound(difficulty: number, id: string): Question {
  if (difficulty >= 8) {
    const r = Math.random();
    if (r < 0.35) return generateRoundMultiPrecision(difficulty, id);
    if (r < 0.70) return generateRoundMethodCompare(difficulty, id);
    return generateRoundBasic(difficulty, id);
  }
  if (difficulty >= 6) {
    // v2.2 中档：70% 小数四舍五入（含 5 边界 / 进位跨位），30% 整数保留为常规训练
    return Math.random() < 0.70 ? generateRoundDecimal(difficulty, id) : generateRoundBasic(difficulty, id);
  }
  return generateRoundBasic(difficulty, id);
}

// ---------------------------------------------------------------------------
// 比大小 (compare)
//   低档：a×b ○ a，b≠1 严禁
//   中档：两个表达式互比 expr1 ○ expr2
//   高档：概念判断（是否正确）+ 多选
// ---------------------------------------------------------------------------

function generateCompareLow(difficulty: number, id: string): Question {
  const isMultiply = Math.random() < 0.5;
  const op = isMultiply ? '×' : '÷';

  const a = difficulty <= 3
    ? Number((randInt(11, 99) / 10).toFixed(1))
    : Number((randInt(101, 999) / 100).toFixed(2));

  // b 明显 ≠ 1：50% b>1 / 50% b<1
  const bAboveOne = Math.random() < 0.5;
  const b = bAboveOne
    ? Number((randInt(12, 25) / 10).toFixed(1))   // 1.2 ~ 2.5
    : Number((randInt(2, 9) / 10).toFixed(1));    // 0.2 ~ 0.9

  const answer = isMultiply
    ? (b > 1 ? '>' : '<')
    : (b > 1 ? '<' : '>');

  const aStr = String(a);
  const bStr = String(b);
  const comparison = `${aStr} ${op} ${bStr} ○ ${aStr}`;

  const ruleText = isMultiply
    ? (b > 1 ? '乘以大于1的数，积大于原数' : '乘以小于1的数，积小于原数')
    : (b > 1 ? '除以大于1的数，商小于原数' : '除以小于1的数，商大于原数');

  return {
    id, topicId: 'number-sense', type: 'multiple-choice', difficulty,
    prompt: `不计算，比较大小: ${comparison}`,
    data: { kind: 'number-sense', subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer, explanation: ruleText },
    hints: ['关键：乘除的数和 1 比较，大于1还是小于1？'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 中档：两个表达式互比。形式 a×b ○ a×c（同 a 不同因子） */
function generateCompareExpr(difficulty: number, id: string): Question {
  // 生成 aStr, b, c，保证 b ≠ c
  const a = Number((randInt(21, 99) / 10).toFixed(1));
  const pattern = randInt(0, 2);

  let leftExpr: string, rightExpr: string, answer: '>' | '<' | '=', explanation: string;

  if (pattern === 0) {
    // a × b ○ a × c（b > c 且都 > 0 → >）
    const b = Number((randInt(30, 50) / 10).toFixed(1));
    let c = Number((randInt(10, 29) / 10).toFixed(1));
    if (c === b) c = Number((c - 0.1).toFixed(1));
    leftExpr = `${a} × ${b}`;
    rightExpr = `${a} × ${c}`;
    answer = b > c ? '>' : b < c ? '<' : '=';
    explanation = `${a} 相同，比较 ${b} 和 ${c}：${b} ${answer} ${c}`;
  } else if (pattern === 1) {
    // a ÷ b ○ a ÷ c（b > c → 左边更小）
    const b = Number((randInt(20, 50) / 10).toFixed(1));
    let c = Number((randInt(10, 19) / 10).toFixed(1));
    if (c === b) c = Number((c - 0.1).toFixed(1));
    leftExpr = `${a} ÷ ${b}`;
    rightExpr = `${a} ÷ ${c}`;
    answer = b > c ? '<' : b < c ? '>' : '=';
    explanation = `${a} 相同，除数越大商越小：${b} > ${c} 所以左式 < 右式`;
  } else {
    // a × b ○ a + b 或 a × b ○ a − c：直接比较积与和的大小
    const b = Number((randInt(12, 20) / 10).toFixed(1)); // b > 1
    const prod = a * b;
    const sum = a + b;
    leftExpr = `${a} × ${b}`;
    rightExpr = `${a} + ${b}`;
    answer = prod > sum ? '>' : prod < sum ? '<' : '=';
    explanation = `${leftExpr} ≈ ${prod.toFixed(2)}，${rightExpr} = ${sum.toFixed(1)}`;
  }

  return {
    id, topicId: 'number-sense', type: 'multiple-choice', difficulty,
    prompt: `不计算，比较大小: ${leftExpr} ○ ${rightExpr}`,
    data: { kind: 'number-sense', subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer, explanation },
    hints: ['先找两边相同的部分，再比较不同的部分'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

/** 高档：概念判断 MC（可多选） */
function generateCompareConcept(difficulty: number, id: string): Question {
  // 设计 2~3 种模式：概念单选 + 多选
  const useMultiSelect = Math.random() < 0.5;

  if (useMultiSelect) {
    // 多选：4 个陈述，答正确的项集合
    const pool: Array<{ stmt: string; correct: boolean }> = [
      { stmt: '0.2 × 0.3 比 0.2 小', correct: true },
      { stmt: '0.2 × 0.3 比 0.3 小', correct: true },
      { stmt: '0.2 × 0.3 = 0.6', correct: false },
      { stmt: '两个小于 1 的数相乘，积比两个数都小', correct: true },
      { stmt: '一个数除以小于 1 的数，商比原数大', correct: true },
      { stmt: '一个数乘以 1，积等于原数', correct: true },
      { stmt: '所有大于 0 的数相乘都比原数大', correct: false },
      { stmt: '两个大于 1 的数相乘，积一定大于两个数', correct: true },
      { stmt: '小数都比整数小', correct: false },
      { stmt: '0 除以任何非零数都得 0', correct: true },
      { stmt: '任何数除以 1 都等于原数', correct: true },
      { stmt: '1 ÷ 0 = 0', correct: false },
    ];
    const chosen = shuffle(pool).slice(0, 4);
    const letters = ['A', 'B', 'C', 'D'];
    const options = chosen.map((c, i) => `${letters[i]}. ${c.stmt}`);
    const correctLetters = chosen
      .map((c, i) => c.correct ? letters[i] : null)
      .filter((x): x is string => x !== null);
    // Ensure at least one correct and at least one wrong among the 4
    if (correctLetters.length === 0 || correctLetters.length === 4) {
      return generateCompareConcept(difficulty, id); // 重摇
    }
    return {
      id, topicId: 'number-sense', type: 'multi-select', difficulty,
      prompt: '以下哪些说法正确？（可多选）',
      data: { kind: 'number-sense', subtype: 'compare', options },
      solution: {
        answer: correctLetters.slice().sort().join(','),
        answers: correctLetters,
        explanation: `正确：${correctLetters.join('、')}`,
      },
      hints: ['逐条判断，警惕"一定"这种极端词'],
      xpBase: 14 + (difficulty - 1) * 5,
    };
  }

  // 单选概念 + 反例
  const pool: Array<{ stmt: string; truth: '对' | '错'; explain: string }> = [
    { stmt: '一个数乘以一个小数，积一定比原数小', truth: '错', explain: '反例：5 × 1.5 = 7.5，比 5 大。当小数 > 1 时积更大' },
    { stmt: '一个数除以一个比 1 小的数，商一定比原数大', truth: '对', explain: '当除数 < 1 时商 > 被除数（除数 > 0）' },
    { stmt: '两个小于 1 的正数相乘，积比它们都小', truth: '对', explain: '如 0.5 × 0.3 = 0.15 < 0.3 < 0.5' },
    { stmt: '一个数乘以比 1 大的数，积比原数大', truth: '对', explain: '因为 b > 1 时 a × b > a（a > 0）' },
    { stmt: '小数除以小数，商一定是小数', truth: '错', explain: '反例：0.6 ÷ 0.2 = 3，商是整数' },
    { stmt: '一个数乘以 0.1，相当于这个数缩小到十分之一', truth: '对', explain: '× 0.1 = ÷ 10' },
    { stmt: '所有大于 0 的数相除，商一定小于被除数', truth: '错', explain: '反例：除数 < 1 时商更大，如 6 ÷ 0.5 = 12' },
    { stmt: '任何数乘以 0，积都是 0', truth: '对', explain: '乘法定义' },
    { stmt: '一个数除以它自己，商是 1', truth: '错', explain: '反例：0 ÷ 0 没有意义。必须非零' },
    { stmt: '两个大于 0 小于 1 的数相除，商一定大于 1', truth: '错', explain: '反例：0.3 ÷ 0.5 = 0.6 < 1' },
    { stmt: '较大数除以较小数的商，一定大于 1', truth: '对', explain: '大 ÷ 小 > 1（正数）' },
    { stmt: '小数乘以整数，积一定是小数', truth: '错', explain: '反例：0.2 × 5 = 1，整数' },
  ];
  const sel = pick(pool);
  return {
    id, topicId: 'number-sense', type: 'multiple-choice', difficulty,
    prompt: `判断正误："${sel.stmt}"`,
    data: { kind: 'number-sense', subtype: 'compare', options: ['对', '错'] },
    solution: { answer: sel.truth, explanation: sel.explain },
    hints: ['警惕"一定"，找一个反例就能推翻'],
    xpBase: 14 + (difficulty - 1) * 5,
  };
}

function generateCompare(difficulty: number, id: string): Question {
  if (difficulty >= 8) return generateCompareConcept(difficulty, id);
  if (difficulty >= 6) return generateCompareExpr(difficulty, id);
  return generateCompareLow(difficulty, id);
}

// ---------------------------------------------------------------------------
// 去尾法 / 进一法 (floor-ceil)
//   低档：直接取整
//   中档/高档：现实情境（判断哪种方法适用）
// ---------------------------------------------------------------------------

function generateFloorCeilBasic(difficulty: number, id: string): Question {
  const isFloor = Math.random() < 0.5;
  const methodName = isFloor ? '去尾法' : '进一法';

  const dp = difficulty <= 5 ? 1 : 2;
  const factor = Math.pow(10, dp);
  const num = randInt(11, difficulty <= 5 ? 999 : 9999) / factor;

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

/** 中/高档：现实情境（应用题） */
function generateFloorCeilContext(difficulty: number, id: string): Question {
  const pool: Array<{ prompt: string; answer: number; explanation: string }> = [
    { prompt: '一辆大巴能坐 40 人，有 137 人春游，至少需要几辆？', answer: 4, explanation: '137÷40=3.425，必须多一辆（进一法）→ 4' },
    { prompt: '做一件上衣需要 2.5 米布料，25 米布料最多做几件？', answer: 10, explanation: '25÷2.5=10（正好整数）→ 10' },
    { prompt: '一瓶饮料装 0.6 升，把 5 升饮料装满瓶子，最多装满几瓶？', answer: 8, explanation: '5÷0.6≈8.33，只数"装满"的（去尾法）→ 8' },
    { prompt: '一本书 180 页，每天读 13 页，至少几天能读完？', answer: 14, explanation: '180÷13≈13.85，剩下的页也要读完（进一法）→ 14' },
    { prompt: '4.6 米的木料截成 0.8 米的小段，最多截几段？', answer: 5, explanation: '4.6÷0.8=5.75，只能要完整段（去尾法）→ 5' },
    { prompt: '篮筐能装 35 个苹果，386 个苹果至少需要几个篮筐？', answer: 12, explanation: '386÷35≈11.03，必须多一筐装剩下（进一法）→ 12' },
  ];
  const sel = pick(pool);
  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: sel.prompt,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: { answer: sel.answer, explanation: sel.explanation },
    hints: ['问"至少/够不够" → 进一法；问"最多完整几份" → 去尾法'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateFloorCeil(difficulty: number, id: string): Question {
  if (difficulty >= 6 && Math.random() < 0.5) return generateFloorCeilContext(difficulty, id);
  return generateFloorCeilBasic(difficulty, id);
}

// ---------------------------------------------------------------------------
// 逆向四舍五入 (reverse-round)
//   中档：一位小数四舍五入到个位，原数最大/最小
//   高档：两位小数四舍五入到十分位
// ---------------------------------------------------------------------------

function generateReverseRound(difficulty: number, id: string): Question {
  const askMax = Math.random() < 0.5;

  // 低/中档：一位小数 → 个位；高档：两位小数 → 十分位
  const targetIsInt = difficulty <= 7;
  if (targetIsInt) {
    const target = randInt(3, 99); // 四舍五入到个位后的数
    // 最大：target + 0.4；最小：target - 0.5（但要让结果仍合法）
    const answerStr = askMax ? `${target}.4` : `${target - 1}.5`;
    return {
      id, topicId: 'number-sense', type: 'numeric-input', difficulty,
      prompt: `一个一位小数四舍五入到个位后是 ${target}，这个数${askMax ? '最大' : '最小'}是多少？`,
      data: { kind: 'number-sense', subtype: 'round' },
      solution: {
        answer: answerStr,
        explanation: askMax
          ? `最大的一位小数是 ${answerStr}（再大就会进位到 ${target + 1}）`
          : `最小的一位小数是 ${answerStr}（再小就会舍去到 ${target - 1}）`,
      },
      hints: [askMax ? '最大到多少还能"四舍"' : '最小到多少还能"五入"到这个数'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 高档：两位小数 → 一位
  const targetScaled = randInt(10, 99); // 1.0 ~ 9.9
  const targetStr = (targetScaled / 10).toFixed(1);
  // 最大：target + 0.04（即原数 X.X4）；最小：(target-0.1) + 0.05 即 (X-1).(X)5
  const answerScaled = askMax ? targetScaled * 10 + 4 : targetScaled * 10 - 5;
  const answerStr = (answerScaled / 100).toFixed(2);
  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `一个两位小数四舍五入保留一位小数后得 ${targetStr}，这个数${askMax ? '最大' : '最小'}是多少？`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: {
      answer: answerStr,
      explanation: askMax
        ? `最大的两位小数是 ${answerStr}（再大就会进位）`
        : `最小的两位小数是 ${answerStr}（再小就会舍去）`,
    },
    hints: [askMax ? '两位小数的"千分位"位置上放最大可舍去的数字' : '两位小数的"千分位"位置上放最小可进位的数字'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export function generateNumberSense(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = [
    { tag: 'estimate',      weight: 30, gen: () => generateEstimate(difficulty, id) },
    { tag: 'round',         weight: 20, gen: () => generateRound(difficulty, id) },
    { tag: 'compare',       weight: 20, gen: () => generateCompare(difficulty, id) },
    { tag: 'floor-ceil',    weight: 15, gen: () => generateFloorCeil(difficulty, id) },
    { tag: 'reverse-round', weight: 15, gen: () => generateReverseRound(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
