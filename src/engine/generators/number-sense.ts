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

/** 估算取整精度：至多到最大位数小一位（4 位数→百，3 位数→十） */
function getEstimatePlace(n: number): number {
  const abs = Math.abs(n);
  const digits = abs < 10 ? 1 : abs < 100 ? 2 : abs < 1000 ? 3 : abs < 10000 ? 4 : 5;
  // 最大位的量级
  const maxPlace = Math.pow(10, digits - 1); // 3位数→100, 4位数→1000
  // 允许的精度范围：从 maxPlace/10 到 maxPlace（即小一位到同位）
  const candidates: number[] = [];
  const minPlace = Math.max(10, maxPlace / 10);
  for (let p = minPlace; p <= maxPlace; p *= 10) candidates.push(p);
  if (candidates.length === 0) return 10;
  return candidates[randInt(0, candidates.length - 1)];
}

function generateEstimateBasic(difficulty: number, id: string): Question {
  // 乘法为主（≥70%），d=2 仍以加减为主（入门级），d≥3 起乘法主导
  const isMul = difficulty <= 2 ? Math.random() < 0.3 : Math.random() < 0.70;
  const op: '+' | '-' | '×' = isMul ? '×' : (Math.random() < 0.5 ? '+' : '-');

  let exact = 0;
  let expression = '';

  if (op === '×') {
    // 优先选有自然凑整路径的数字组合：接近整数的小数、近百/近十整数
    for (let attempt = 0; attempt < 50; attempt++) {
      const style = randInt(0, 2);
      let a: number, b: number;
      if (style === 0) {
        // 接近整数的小数 × 小整数（如 4.99 × 3, 19.8 × 5）
        const base = randInt(2, difficulty <= 5 ? 15 : 50);
        const offset = pick([-0.01, -0.02, 0.01, 0.02, -0.1, 0.1, -0.2, 0.2] as const);
        a = Math.round((base + offset) * 100) / 100;
        b = randInt(2, difficulty <= 5 ? 9 : 20);
      } else if (style === 1) {
        // 近百/近十整数 × 单位数（如 199 × 6, 305 × 4）
        const base = randInt(1, difficulty <= 5 ? 9 : 50) * (difficulty <= 5 ? 100 : randInt(1, 2) === 1 ? 100 : 10);
        const delta = pick([-2, -1, 1, 2, -5, 5] as const);
        a = base + delta;
        b = randInt(2, difficulty <= 5 ? 9 : 25);
      } else {
        // 两位数 × 两位数（如 23 × 48）
        a = randInt(difficulty <= 5 ? 20 : 20, difficulty <= 5 ? 60 : 200);
        b = randInt(difficulty <= 5 ? 20 : 20, difficulty <= 5 ? 60 : 200);
      }
      exact = Math.round(a * b * 1000) / 1000;
      expression = `${a} × ${b}`;
      if (exact > 0) break;
    }
  } else {
    // 加减法：限三位数以上操作数（两位数加减估算意义极低）
    const min = 100;
    const max = difficulty <= 5 ? 999 : 9999;
    let a = randInt(min, max);
    let b = randInt(min, max);
    if (op === '-') {
      if (a < b) [a, b] = [b, a];
      exact = a - b;
      if (exact < 50) { exact = a + b; expression = `${a} + ${b}`; }
      else { expression = `${a} − ${b}`; }
    } else {
      exact = a + b;
      expression = `${a} + ${b}`;
    }
  }

  // 乘法接受 ±15%，加减法接受 ±10%
  const tolerance = op === '×' ? 0.15 : 0.10;
  const lo = Math.round(exact * (1 - tolerance));
  const hi = Math.round(exact * (1 + tolerance));

  return {
    id,
    topicId: 'number-sense',
    type: 'numeric-input',
    difficulty,
    prompt: `估算 ${expression}，大约是多少？`,
    data: { kind: 'number-sense', subtype: 'estimate', tolerance },
    solution: {
      answer: exact,
      explanation: `${expression} = ${exact}，合理估算范围 ${lo} ~ ${hi}`,
    },
    hints: ['把每个数凑到最近的整数/整十/整百，再计算'],
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
    {
      prompt: '每个空瓶可以装 2.5 千克色拉油，王老师要把 25.5 千克色拉油装满瓶子，至少需要几个瓶子？',
      answer: 11,
      explanation: '25.5÷2.5=10.2，剩余需要再多一个瓶（进一法）→ 11',
    },
    {
      prompt: '每 0.85 千克曲奇饼干装成 1 盒，蛋糕店有 15.4 千克曲奇饼干，至少需要几个盒子才能装完？',
      answer: 19,
      explanation: '15.4÷0.85≈18.12，剩余需要再多一个盒子（进一法）→ 19',
    },
    {
      prompt: '美心蛋糕房每个生日蛋糕需要 0.32 千克面粉，李师傅领了 4 千克面粉，最多可以做几个生日蛋糕？',
      answer: 12,
      explanation: '4÷0.32=12.5，只能做完整个（去尾法）→ 12',
    },
    {
      prompt: '李老师带 50 元钱去买圆珠笔，每支圆珠笔 1.4 元，最多能买几支？',
      answer: 35,
      explanation: '50÷1.4≈35.71，钱不够就不能买（去尾法）→ 35',
    },
    {
      prompt: '50 千克油要装进油桶，每个油桶最多装 3 千克，至少需要几个油桶才能把油全部装完？',
      answer: 17,
      explanation: '50÷3≈16.67，剩余油也需要一个桶（进一法）→ 17',
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
    // 中档 d=6~7：
    // d=7: 多式估算比较；现实取整情境（进一/去尾 vs 四舍五入对比）
    if (difficulty >= 7) {
      if (Math.random() < 0.5) return generateEstimateRealContext(difficulty, id);
    }
    // d=6: 含乘法的较复杂估算
    if (Math.random() < 0.4) return generateEstimateDirection(difficulty, id);
    return generateEstimateBasic(difficulty, id);
  }
  if (difficulty >= 4) {
    // 档1-高 (d=4~5)：含乘法的估算 + 方向判断
    if (Math.random() < 0.3) return generateEstimateDirection(difficulty, id);
    return generateEstimateBasic(difficulty, id);
  }
  // 档1-低 (d=2~3)：d=2 只有加减，d=3 开始包含乘法
  if (difficulty <= 2) {
    // d=2: 严格只用加减法估算
    return generateEstimateBasic(difficulty, id);
  }
  // d=3: 25% 方向判断（含乘法方向），75% 基础估算（ops 包含 ×）
  if (Math.random() < 0.25) return generateEstimateDirection(difficulty, id);
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

  let num = randInt(100, numMax);
  let answer = Math.floor(num / place + 0.5) * place;
  // 中档: 50% 概率生成 "5" 边界；高档 40%
  const fiveRate = difficulty >= 8 ? 0.4 : difficulty >= 6 ? 0.5 : 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (Math.random() < fiveRate) {
      const base = randInt(1, Math.floor(numMax / place) - 1) * place;
      num = base + Math.floor(place / 2);
    } else {
      num = randInt(100, numMax);
    }
    answer = Math.floor(num / place + 0.5) * place;
    if (answer !== num) break;
    if (attempt === 49) num += 1; // 极端兜底
  }
  answer = Math.floor(num / place + 0.5) * place;

  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `将 ${num.toLocaleString()} 四舍五入到${placeNames[place]}位`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: { answer, explanation: `${num.toLocaleString()} 四舍五入到${placeNames[place]}位 = ${answer.toLocaleString()}` },
    hints: [`看${placeNames[place]}位后面的数字，>=5进1，<5舍去`],
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
    // 高档：50% 方法对比 MC / 50% 基础取整（大数）
    return Math.random() < 0.50 ? generateRoundMethodCompare(difficulty, id) : generateRoundBasic(difficulty, id);
  }
  if (difficulty >= 6) {
    // v2.2 中档：70% 小数四舍五入（含 5 边界 / 进位跨位），30% 整数保留为常规训练
    return Math.random() < 0.70 ? generateRoundDecimal(difficulty, id) : generateRoundBasic(difficulty, id);
  }
  // 低档 (d=4~5)：d=4 整数四舍五入（无5边界），d=5 引入小数精度或5边界
  if (difficulty >= 5) {
    // d=5：40% 小数四舍五入（含5边界陷阱）
    return Math.random() < 0.40 ? generateRoundDecimal(difficulty, id) : generateRoundBasic(difficulty, id);
  }
  // d=4：只用整数，不产生5边界陷阱（已在 generateRoundBasic 内通过 fiveRate=0 控制）
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
  // 低档 (d=2~5)：d=2~3 走 generateCompareLow，d=4~5 走 generateCompareExpr（两表达式互比）
  if (difficulty >= 4) return generateCompareExpr(difficulty, id);
  return generateCompareLow(difficulty, id);
}

// ---------------------------------------------------------------------------
// 去尾法 / 进一法 (floor-ceil)
//   全档位走情景题，按 difficulty 分层（d=4~5 简单情景；d≥6 两层全开）
// ---------------------------------------------------------------------------

/** 情景题：判断用进一法还是去尾法（全档位替代机械题） */
function generateFloorCeilContext(difficulty: number, id: string): Question {
  // 简单情景（d=4~5 专属）：整数÷整数，答案≤20，短文本
  const simplePool: Array<{ prompt: string; answer: number; explanation: string }> = [
    { prompt: '一辆大巴能坐 40 人，有 137 人春游，至少需要几辆？', answer: 4, explanation: '137÷40=3.425，必须多一辆（进一法）→ 4' },
    { prompt: '一本书 180 页，每天读 13 页，至少几天能读完？', answer: 14, explanation: '180÷13≈13.85，剩余页也要读完（进一法）→ 14' },
    { prompt: '篮筐能装 35 个苹果，386 个苹果至少需要几个篮筐？', answer: 12, explanation: '386÷35≈11.03，必须多一筐装剩下（进一法）→ 12' },
    { prompt: '学校组织 580 名学生参加秋游，每辆车限载 30 人，至少要几辆车？', answer: 20, explanation: '580÷30≈19.33，剩余学生也需要一辆（进一法）→ 20' },
    { prompt: '50 本书装箱，每箱装 8 本，至少需要几个箱子？', answer: 7, explanation: '50÷8=6.25，剩余 2 本也需要一个箱子（进一法）→ 7' },
    { prompt: '班级有 35 人去参观，每辆车坐 8 人，至少需要几辆车？', answer: 5, explanation: '35÷8=4.375，剩余同学也需要一辆（进一法）→ 5' },
    { prompt: '一捆铁丝 20 米，每段截 3 米，最多截几段？', answer: 6, explanation: '20÷3≈6.67，只能取完整段（去尾法）→ 6' },
    { prompt: '工厂有 55 个零件装盒，每盒装 6 个，至少需要几个盒子？', answer: 10, explanation: '55÷6≈9.17，剩余零件也需要一个盒子（进一法）→ 10' },
  ];
  // 复杂情景（d≥6 可用）：含小数，答案无上限
  const complexPool: Array<{ prompt: string; answer: number; explanation: string }> = [
    { prompt: '做一件上衣需要 2.5 米布料，25 米布料最多做几件？', answer: 10, explanation: '25÷2.5=10（整除）→ 10' },
    { prompt: '一瓶饮料装 0.6 升，把 5 升饮料装满瓶子，最多装满几瓶？', answer: 8, explanation: '5÷0.6≈8.33，只数"装满"的（去尾法）→ 8' },
    { prompt: '4.6 米的木料截成 0.8 米的小段，最多截几段？', answer: 5, explanation: '4.6÷0.8=5.75，只能要完整段（去尾法）→ 5' },
    { prompt: '一根 18.5 分米的木棒，截成每段 1.1 分米的小段，最多截几段？', answer: 16, explanation: '18.5÷1.1≈16.82，只能取完整段（去尾法）→ 16' },
    { prompt: '每个玻璃瓶最多装 0.4 千克，2.5 千克油至少要几个玻璃瓶？', answer: 7, explanation: '2.5÷0.4=6.25，剩余不足 0.4 千克也需要一个瓶（进一法）→ 7' },
    { prompt: '用 75 分米彩带制作蝴蝶结，每个需要 1.3 分米，最多做几个？', answer: 57, explanation: '75÷1.3≈57.69，只能做完整个（去尾法）→ 57' },
    { prompt: '每本字典 25.5 元，孙老师拿 150 元，最多能买几本？', answer: 5, explanation: '150÷25.5≈5.88，钱不够就不能买（去尾法）→ 5' },
    { prompt: '每瓶墨水可以写 0.4 万字，小明要写 2.5 万字，至少需要几瓶墨水？', answer: 7, explanation: '2.5÷0.4=6.25，剩余部分也需要一瓶（进一法）→ 7' },
    { prompt: '一台机器每小时生产 2.5 个零件，要生产 18 个，至少需要几小时？', answer: 8, explanation: '18÷2.5=7.2，剩余时间不够生产完整一个（进一法）→ 8' },
    { prompt: '每件运动服需要 1.8 米布料，现有 14 米布料，最多能做几件？', answer: 7, explanation: '14÷1.8≈7.78，只能做完整件（去尾法）→ 7' },
    { prompt: '一辆货车每次最多运 3.5 吨货物，要运 25 吨货，至少要运几次？', answer: 8, explanation: '25÷3.5≈7.14，剩余货物也需要再运一次（进一法）→ 8' },
    { prompt: '蛋糕店用 12.7 千克面粉做蛋糕，每个蛋糕需要 0.9 千克，最多做几个？', answer: 14, explanation: '12.7÷0.9≈14.11，只能做完整个（去尾法）→ 14' },
  ];

  const pool = difficulty <= 5 ? simplePool : [...simplePool, ...complexPool];
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
  return generateFloorCeilContext(difficulty, id);
}

// ---------------------------------------------------------------------------
// 逆向四舍五入 (reverse-round)
//   中档：一位小数四舍五入到个位，原数最大/最小
//   高档：两位小数四舍五入到十分位
// ---------------------------------------------------------------------------

function generateReverseRound(difficulty: number, id: string): Question {
  const askMax = Math.random() < 0.5;

  // 低/中档（d≤7）：一位小数 → 个位，5 种模板
  if (difficulty <= 7) {
    const target = randInt(3, 99);
    const answerStr = askMax ? `${target}.4` : `${target - 1}.5`;
    const maxHint = `四舍五入后恰好是 ${target}——原数最大能走到哪里还不会进位到 ${target + 1}？`;
    const minHint = `什么样的数，四舍五入后会"入"到 ${target}？它最小是多少？`;

    const templateIdx = randInt(1, 5);
    let prompt: string;
    if (templateIdx === 1) {
      prompt = `一个一位小数四舍五入到个位后是 ${target}，这个数${askMax ? '最大' : '最小'}是多少？`;
    } else if (templateIdx === 2) {
      prompt = `某一位小数用四舍五入法保留到整数，近似值是 ${target}，这个小数${askMax ? '最大' : '最小'}是多少？`;
    } else if (templateIdx === 3) {
      prompt = `四舍五入到个位后等于 ${target} 的一位小数，${askMax ? '最大' : '最小'}可以是多少？`;
    } else if (templateIdx === 4) {
      // 模板 4：填数字题，不用 askMax 分支，而是固定方向
      if (askMax) {
        prompt = `${target}.□ 用四舍五入法取到个位后结果仍然是 ${target}，□ 里最大能填几？`;
      } else {
        prompt = `${target - 1}.□ 用四舍五入法取到个位后，结果变成了 ${target}，□ 里最小能填几？`;
      }
    } else {
      prompt = `小明把一个一位小数用四舍五入法凑成整数后写下了 ${target}，这个一位小数原来${askMax ? '最大' : '最小'}可能是多少？`;
    }

    return {
      id, topicId: 'number-sense', type: 'numeric-input', difficulty,
      prompt,
      data: { kind: 'number-sense', subtype: 'round' },
      solution: {
        answer: answerStr,
        explanation: askMax
          ? `最大的一位小数是 ${answerStr}（再大就会进位到 ${target + 1}）`
          : `最小的一位小数是 ${answerStr}（再小就会舍去到 ${target - 1}）`,
      },
      hints: [askMax ? maxHint : minHint],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 高档（d≥8）：两位小数 → 一位
  const targetScaled = randInt(10, 99);
  const targetStr = (targetScaled / 10).toFixed(1);
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
    hints: [askMax
      ? `四舍五入后恰好是 ${targetStr}——原数最大能走到哪里还不会进位到更大值？`
      : `什么样的两位小数，四舍五入后会"入"到 ${targetStr}？它最小是多少？`],
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
