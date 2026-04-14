import type { Question } from '@/types';
import type { GeneratorParams, SubtypeEntry } from '../index';
import { pickSubtype } from '../index';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function evaluate(expr: string): number {
  const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
  // eslint-disable-next-line no-new-func
  return new Function(`return (${sanitized})`)() as number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
function lcm(a: number, b: number): number { return a * b / gcd(a, b); }

// ===== Decimal two-step =====

function generateDecimalTwoStep(difficulty: number, id: string): Question {
  const op1Choices = difficulty <= 5 ? ['×'] : ['×', '÷'];
  const op1 = op1Choices[randInt(0, op1Choices.length - 1)];
  const op2 = Math.random() < 0.5 ? '+' : '-';

  let a: number, b: number, intermediate: number;

  if (op1 === '×') {
    const dp = Math.random() < 0.5 ? 1 : (difficulty > 5 ? 2 : 1);
    const factor = Math.pow(10, dp);
    const aScaled = randInt(11, difficulty <= 5 ? 99 : 300);
    const bVal = randInt(2, difficulty <= 5 ? 9 : 20);
    const prodScaled = aScaled * bVal;
    a = aScaled / factor;
    b = bVal;
    intermediate = prodScaled / factor;
  } else {
    const divisor = randInt(2, 9);
    const q10 = randInt(11, 99);
    a = (q10 * divisor) / 10;
    b = divisor;
    intermediate = q10 / 10;
  }

  const c10 = randInt(11, difficulty <= 5 ? 99 : 500);
  let c = c10 / 10;

  if (op2 === '-' && intermediate <= c) {
    c = randInt(1, Math.max(1, Math.floor(intermediate * 10) - 1)) / 10;
  }

  const reverseOrder = Math.random() < 0.5;
  let expression: string;
  let answer: number;
  let stepsArr: string[];

  if (reverseOrder) {
    if (op2 === '-') {
      if (c <= intermediate) {
        expression = `${formatNum(c)} + ${formatNum(a)} ${op1} ${formatNum(b)}`;
        answer = c + intermediate;
        stepsArr = [`先算 ${formatNum(a)} ${op1} ${formatNum(b)} = ${formatNum(intermediate)}`, `再算 ${formatNum(c)} + ${formatNum(intermediate)} = ${formatNum(answer)}`];
      } else {
        expression = `${formatNum(c)} - ${formatNum(a)} ${op1} ${formatNum(b)}`;
        answer = c - intermediate;
        stepsArr = [`先算 ${formatNum(a)} ${op1} ${formatNum(b)} = ${formatNum(intermediate)}`, `再算 ${formatNum(c)} - ${formatNum(intermediate)} = ${formatNum(answer)}`];
      }
    } else {
      expression = `${formatNum(c)} + ${formatNum(a)} ${op1} ${formatNum(b)}`;
      answer = c + intermediate;
      stepsArr = [`先算 ${formatNum(a)} ${op1} ${formatNum(b)} = ${formatNum(intermediate)}`, `再算 ${formatNum(c)} + ${formatNum(intermediate)} = ${formatNum(answer)}`];
    }
  } else {
    expression = `${formatNum(a)} ${op1} ${formatNum(b)} ${op2} ${formatNum(c)}`;
    answer = op2 === '+' ? intermediate + c : intermediate - c;
    stepsArr = [`先算 ${formatNum(a)} ${op1} ${formatNum(b)} = ${formatNum(intermediate)}`, `再算 ${formatNum(intermediate)} ${op2} ${formatNum(c)} = ${formatNum(answer)}`];
  }

  answer = Math.round(answer * 10000) / 10000;

  return {
    id, topicId: 'multi-step', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: {
      kind: 'multi-step', expression,
      steps: [
        { stepIndex: 0, subExpression: stepsArr[0], result: intermediate, annotation: '先算乘除' },
        { stepIndex: 1, subExpression: stepsArr[1], result: answer, annotation: '再算加减' },
      ],
    },
    solution: {
      answer: formatNum(answer),
      steps: stepsArr,
      explanation: `先乘除后加减`,
    },
    hints: ['注意运算顺序: 先乘除，后加减'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== Complex decimal multi-step (Demon) =====

function generateDecimalMultiStep(difficulty: number, id: string): Question {
  const op1 = Math.random() < 0.5 ? '×' : '÷';
  const op2 = Math.random() < 0.5 ? '×' : '÷';
  const opMid = Math.random() < 0.5 ? '+' : '-';

  let a: number, b1: number, r1: number;
  if (op1 === '×') {
    const a100 = randInt(11, 99);
    b1 = randInt(2, 9);
    a = a100 / 100;
    r1 = (a100 * b1) / 100;
  } else {
    b1 = randInt(2, 9);
    const q100 = randInt(1, 50);
    a = (q100 * b1) / 100;
    r1 = q100 / 100;
  }

  let c: number, d: number, r2: number;
  if (op2 === '×') {
    const c100 = randInt(11, 99);
    d = randInt(2, 9);
    c = c100 / 100;
    r2 = (c100 * d) / 100;
  } else {
    d = randInt(2, 9);
    const q100_2 = randInt(1, 50);
    c = (q100_2 * d) / 100;
    r2 = q100_2 / 100;
  }

  if (opMid === '-' && r1 < r2) {
    [a, b1, r1, c, d, r2] = [c, d, r2, a, b1, r1];
  }

  const answer = opMid === '+' ? r1 + r2 : r1 - r2;
  const answerRounded = Math.round(answer * 10000) / 10000;
  const expression = `${formatNum(a)} ${op1} ${b1} ${opMid} ${formatNum(c)} ${op2} ${d}`;

  return {
    id, topicId: 'multi-step', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: {
      kind: 'multi-step', expression,
      steps: [
        { stepIndex: 0, subExpression: `${formatNum(a)} ${op1} ${b1} = ${formatNum(r1)}`, result: r1, annotation: '先算乘除' },
        { stepIndex: 1, subExpression: `${formatNum(c)} ${op2} ${d} = ${formatNum(r2)}`, result: r2, annotation: '先算乘除' },
        { stepIndex: 2, subExpression: `${formatNum(r1)} ${opMid} ${formatNum(r2)} = ${formatNum(answerRounded)}`, result: answerRounded, annotation: '再算加减' },
      ],
    },
    solution: {
      answer: formatNum(answerRounded),
      steps: [
        `先算 ${formatNum(a)} ${op1} ${b1} = ${formatNum(r1)}`,
        `再算 ${formatNum(c)} ${op2} ${d} = ${formatNum(r2)}`,
        `最后 ${formatNum(r1)} ${opMid} ${formatNum(r2)} = ${formatNum(answerRounded)}`,
      ],
      explanation: `先分别算乘除，再算加减`,
    },
    hints: ['先分别算出乘除法的结果，再做加减'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// ===== Decimal chain (Demon) =====

function generateDecimalChain(difficulty: number, id: string): Question {
  const pattern = Math.random() < 0.5 ? 'mul-div' : 'div-div';

  if (pattern === 'mul-div') {
    const a10 = randInt(11, 99);
    const b10 = randInt(1, 9);
    const prodScaled = a10 * b10;
    const c = randInt(2, 9);
    const l = lcm(b10, c);
    const prodAdjusted = Math.ceil(prodScaled / l) * l;
    const aFinal = prodAdjusted / b10;
    const a = aFinal / 10;
    const b = b10 / 10;
    const intermediate = (aFinal * b10) / 100;
    const answer = intermediate / c;
    const expression = `${formatNum(a)} × ${formatNum(b)} ÷ ${c}`;

    return {
      id, topicId: 'multi-step', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: {
        kind: 'multi-step', expression,
        steps: [
          { stepIndex: 0, subExpression: `${formatNum(a)} × ${formatNum(b)} = ${formatNum(intermediate)}`, result: intermediate, annotation: '从左到右' },
          { stepIndex: 1, subExpression: `${formatNum(intermediate)} ÷ ${c} = ${formatNum(answer)}`, result: answer, annotation: '继续' },
        ],
      },
      solution: {
        answer: formatNum(answer),
        steps: [`${formatNum(a)} × ${formatNum(b)} = ${formatNum(intermediate)}`, `${formatNum(intermediate)} ÷ ${c} = ${formatNum(answer)}`],
        explanation: `同级运算从左到右`,
      },
      hints: ['乘除法同级，从左到右依次计算'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    const b = randInt(2, 9);
    const c = randInt(2, 9);
    const finalAnswer = randInt(2, 20);
    const intermediate = finalAnswer * c;
    const aVal = intermediate * b;
    const a = aVal / 10;
    const answer = finalAnswer / 10;
    const inter = intermediate / 10;
    const expression = `${formatNum(a)} ÷ ${b} ÷ ${c}`;

    return {
      id, topicId: 'multi-step', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: {
        kind: 'multi-step', expression,
        steps: [
          { stepIndex: 0, subExpression: `${formatNum(a)} ÷ ${b} = ${formatNum(inter)}`, result: inter, annotation: '从左到右' },
          { stepIndex: 1, subExpression: `${formatNum(inter)} ÷ ${c} = ${formatNum(answer)}`, result: answer, annotation: '继续' },
        ],
      },
      solution: {
        answer: formatNum(answer),
        steps: [`${formatNum(a)} ÷ ${b} = ${formatNum(inter)}`, `${formatNum(inter)} ÷ ${c} = ${formatNum(answer)}`],
        explanation: `同级运算从左到右`,
      },
      hints: ['除法从左到右依次计算'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
}

// ============================================================
// ===== BRACKET TRANSFORMATION — 完全重构 ===================
// ============================================================

// --- Normal: 连减合并 a-b-c → a-(b+c) ---
// 真题来源: 187-39-61=187-(39+61), 520-36-64=520-(36+64)
function generateReduceSubtract(difficulty: number, id: string): Question {
  // 30% 概率生成小数版连减凑整
  if (Math.random() < 0.3) {
    const T = [1, 10][randInt(0, 1)];
    const b10 = randInt(1, T * 10 - 1);
    const b = b10 / 10;
    const c = (T * 10 - b10) / 10;
    const a = T + randInt(1, 50) / 10;
    const answer = Math.round((a - T) * 10) / 10;
    const expression = `${formatNum(a)} - ${formatNum(b)} - ${formatNum(c)}`;

    return {
      id, topicId: 'multi-step', type: 'numeric-input', difficulty,
      prompt: `简便计算: ${expression}`,
      data: {
        kind: 'multi-step', expression,
        steps: [
          { stepIndex: 0, subExpression: `发现 ${formatNum(b)} + ${formatNum(c)} = ${T}`, result: T, annotation: '两减数之和凑整' },
          { stepIndex: 1, subExpression: `${formatNum(a)} - ${T} = ${formatNum(answer)}`, result: answer, annotation: '合并后计算' },
        ],
      },
      solution: {
        answer: formatNum(answer),
        steps: [`发现 ${formatNum(b)} + ${formatNum(c)} = ${T}`, `${formatNum(a)} - ${T} = ${formatNum(answer)}`],
        explanation: `连减凑整: 两减数之和为整数 ${T}，先合并再减`,
      },
      hints: [`${formatNum(b)} + ${formatNum(c)} 等于多少？`],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  const targets = difficulty <= 5 ? [100, 200, 50] : [1000, 500, 300];
  const T = targets[randInt(0, targets.length - 1)];
  const b = randInt(Math.ceil(T * 0.2), Math.floor(T * 0.7));
  const c = T - b;
  const a = randInt(T + 50, T * 3);
  const answer = a - T;
  const expression = `${a} - ${b} - ${c}`;

  return {
    id, topicId: 'multi-step', type: 'numeric-input', difficulty,
    prompt: `简便计算: ${expression}`,
    data: {
      kind: 'multi-step', expression,
      steps: [
        { stepIndex: 0, subExpression: `发现 ${b} + ${c} = ${T}`, result: T, annotation: '两减数之和凑整' },
        { stepIndex: 1, subExpression: `${a} - (${b} + ${c}) = ${a} - ${T} = ${answer}`, result: answer, annotation: '加括号合并后计算' },
      ],
    },
    solution: {
      answer,
      steps: [`发现 ${b} + ${c} = ${T}`, `${expression} = ${a} - (${b} + ${c}) = ${a} - ${T} = ${answer}`],
      explanation: `连减时，两减数之和为整数，先合并再减`,
    },
    hints: [`${b} + ${c} 等于多少？能不能先把它们合并？`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// --- Normal: 乘法分配律凑整 a×(round±δ) ---
// 真题来源: 6×99=6×(100-1), 8×101=8×(100+1)
function generateDistributeRound(difficulty: number, id: string): Question {
  const a = randInt(2, difficulty <= 5 ? 9 : 15);
  const roundBases = difficulty <= 5 ? [10, 100] : [10, 100, 1000];
  const roundBase = roundBases[randInt(0, roundBases.length - 1)];
  const delta = randInt(1, difficulty <= 5 ? 3 : 9);
  const sign = Math.random() < 0.5 ? -1 : 1;
  const b = roundBase + sign * delta;
  const answer = a * b;
  const expression = `${a} × ${b}`;
  const opChar = sign < 0 ? '-' : '+';

  return {
    id, topicId: 'multi-step', type: 'numeric-input', difficulty,
    prompt: `简便计算: ${expression}`,
    data: {
      kind: 'multi-step', expression,
      steps: [
        { stepIndex: 0, subExpression: `${b} = ${roundBase} ${opChar} ${delta}`, result: b, annotation: '拆成整数±偏移' },
        { stepIndex: 1, subExpression: `${a}×${roundBase} ${opChar} ${a}×${delta} = ${a * roundBase} ${opChar} ${a * delta} = ${answer}`, result: answer, annotation: '分配律展开' },
      ],
    },
    solution: {
      answer,
      steps: [`把 ${b} 看作 ${roundBase} ${opChar} ${delta}`, `${a} × (${roundBase} ${opChar} ${delta}) = ${a * roundBase} ${opChar} ${a * delta} = ${answer}`],
      explanation: `${b} = ${roundBase} ${opChar} ${delta}，用乘法分配律展开`,
    },
    hints: [`${b} 接近 ${roundBase}，可以写成 ${roundBase} ${opChar} ${delta}`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// --- Normal: 加减凑整 a+(R-δ) 或 a-(R-δ) ---
// 真题来源: 237+98=237+100-2, 564-199=564-200+1
function generateNearRound(difficulty: number, id: string): Question {
  const R = difficulty <= 5 ? [100, 200][randInt(0, 1)] : [100, 1000][randInt(0, 1)];
  const delta = randInt(1, 9);
  const b = R - delta;
  const op = Math.random() < 0.5 ? '+' : '-';
  const a = op === '+' ? randInt(50, R * 2) : randInt(b + 20, b + R);
  const answer = op === '+' ? a + b : a - b;
  const expression = `${a} ${op} ${b}`;

  const steps = op === '+'
    ? [`${b} = ${R} - ${delta}`, `${a} + ${R} - ${delta} = ${a + R} - ${delta} = ${answer}`]
    : [`${b} = ${R} - ${delta}`, `${a} - (${R} - ${delta}) = ${a} - ${R} + ${delta} = ${a - R} + ${delta} = ${answer}`];
  const explanation = op === '+'
    ? `${b} = ${R} - ${delta}，先加 ${R} 再减 ${delta}`
    : `减去 ${b} 等于先减 ${R} 再加 ${delta}（去括号变号）`;

  return {
    id, topicId: 'multi-step', type: 'numeric-input', difficulty,
    prompt: `简便计算: ${expression}`,
    data: {
      kind: 'multi-step', expression,
      steps: [
        { stepIndex: 0, subExpression: steps[0], result: b, annotation: '识别接近整数的数' },
        { stepIndex: 1, subExpression: steps[1], result: answer, annotation: '凑整计算' },
      ],
    },
    solution: { answer, steps, explanation },
    hints: [`${b} 比 ${R} 少 ${delta}`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateBracketNormal(difficulty: number, id: string): Question {
  const r = Math.random();
  if (r < 0.40) return generateReduceSubtract(difficulty, id);
  if (r < 0.70) return generateDistributeRound(difficulty, id);
  return generateNearRound(difficulty, id);
}

// --- Hard MC 陷阱①: a-b+c 中哪个加括号形式正确？ ---
// 真题来源: 134-75+25 与 134-(75+25) 不等（奥数网判断题）
// 陷阱: 看到 b+c 能凑整就误写 a-(b+c)，实际应为 a-(b-c)
function generateTrapAddBracket(difficulty: number, id: string): Question {
  const c = randInt(10, 40);
  const b = randInt(c + 10, c + 80);   // b > c，保证 b-c > 0
  const a = randInt(b + 10, b + 150);
  const expression = `${a} - ${b} + ${c}`;

  const correct = `${a} - (${b} - ${c})`;  // ✓ a-(b-c) = a-b+c
  const trap    = `${a} - (${b} + ${c})`;  // ✗ a-(b+c) = a-b-c，最常见错误
  const wrong2  = `${a} + (${b} - ${c})`;
  const wrong3  = `${a} + (${b} + ${c})`;
  const options = shuffle([correct, trap, wrong2, wrong3]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `下面哪个式子与 ${expression} 相等？`,
    data: { kind: 'multi-step', expression, steps: [], options },
    solution: {
      answer: correct,
      explanation: `${expression} = ${correct}。加括号时括号前是减号，括号内 +${c} 必须变为 -${c}。注意：${trap} = ${a}-${b}-${c}，与原式不相等！`,
    },
    hints: ['口诀：括号前面是减号，去添括号都变号'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// --- Hard MC 陷阱②: a-(b+c) 去括号哪个正确？ ---
// 真题来源: 962-(62+45)=962-62-45=855（不是+45）（脉脉简便计算易错汇总）
// 陷阱: 去括号时 +c 忘记变 -c
function generateTrapExpandPlus(difficulty: number, id: string): Question {
  const b = randInt(15, 60);
  const c = randInt(10, 40);
  const a = randInt(b + c + 20, b + c + 150);
  const expression = `${a} - (${b} + ${c})`;

  const correct = `${a} - ${b} - ${c}`;  // ✓
  const trap    = `${a} - ${b} + ${c}`;  // ✗ 忘记 +c 变 -c
  const wrong2  = `${a} + ${b} - ${c}`;
  const wrong3  = `${a} + ${b} + ${c}`;
  const options = shuffle([correct, trap, wrong2, wrong3]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `去掉括号后，${expression} 变成哪个式子？`,
    data: { kind: 'multi-step', expression, steps: [], options },
    solution: {
      answer: correct,
      explanation: `括号前是减号，去括号时括号内符号全部变号：+${b}→-${b}，+${c}→-${c}，结果是 ${correct}`,
    },
    hints: ['括号前面是减号，括号里面的加号要变减号！'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// --- Hard MC 陷阱③: a-(b-c) 去括号哪个正确？ ---
// 真题来源: 762-598=762-(600-2)=762-600+2=164（不是-2）（CSDN易错解析）
// 真题来源: 2548-(748-452)=2548-748+452=2252（不是-452）（脉脉）
// 陷阱: -c 忘记变 +c
function generateTrapExpandMinus(difficulty: number, id: string): Question {
  const c = randInt(10, 50);
  const b = randInt(c + 15, c + 100);  // b > c
  const a = randInt(b + 10, b + 200);
  const expression = `${a} - (${b} - ${c})`;

  const correct = `${a} - ${b} + ${c}`;  // ✓
  const trap    = `${a} - ${b} - ${c}`;  // ✗ -c 忘记变 +c，最常见错误
  const wrong2  = `${a} + ${b} - ${c}`;
  const wrong3  = `${a} + ${b} + ${c}`;
  const options = shuffle([correct, trap, wrong2, wrong3]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `去掉括号后，${expression} 变成哪个式子？`,
    data: { kind: 'multi-step', expression, steps: [], options },
    solution: {
      answer: correct,
      explanation: `括号前是减号，去括号时括号内符号全部变号：-${b}保持-${b}，-${c}变为+${c}，结果是 ${correct}`,
    },
    hints: ['a - (b - c) = a - b + c，减号括号里的减号要变加号！'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// --- Hard: 简便计算 a-(round-δ)，需正确应用去括号变号 ---
// 真题来源: 762-598, 564-199 类型
function generateSimplifySubtract(difficulty: number, id: string): Question {
  const rounds = difficulty <= 7 ? [100, 200, 300, 500] : [1000, 2000, 5000];
  const round = rounds[randInt(0, rounds.length - 1)];
  const delta = randInt(1, 9);
  const b = round - delta;
  const a = randInt(round + 10, round * 3);
  const answer = a - b;
  const expression = `${a} - ${b}`;

  return {
    id, topicId: 'multi-step', type: 'numeric-input', difficulty,
    prompt: `简便计算: ${expression}`,
    data: {
      kind: 'multi-step', expression,
      steps: [
        { stepIndex: 0, subExpression: `${b} = ${round} - ${delta}`, result: b, annotation: '识别接近整数' },
        { stepIndex: 1, subExpression: `${a} - (${round} - ${delta}) = ${a} - ${round} + ${delta} = ${answer}`, result: answer, annotation: '去括号变号' },
      ],
    },
    solution: {
      answer,
      steps: [`${b} = ${round} - ${delta}`, `${a} - (${round} - ${delta}) = ${a} - ${round} + ${delta} = ${answer}`],
      explanation: `减去 ${b} = 先减 ${round} 再加 ${delta}，注意括号内减号变加号`,
    },
    hints: [`${b} 接近 ${round}，可以看作 ${round} - ${delta}`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// --- Hard/Demon: 提取公因数 a×m ± a×n = a×(m±n) ---
// 真题来源: 36×7+36×3=36×10=360, 125×6+125×4=125×10=1250
function generateExtractFactor(difficulty: number, id: string): Question {
  // Foundation: 简单公因数提取 a×m + a×n，其中 m+n 凑整十
  if (difficulty <= 5) {
    const factors = [5, 10, 15, 20, 25];
    const a = factors[randInt(0, factors.length - 1)];
    const target = 10;
    const m = randInt(1, target - 1);
    const n = target - m;
    const expression = `${a} × ${m} + ${a} × ${n}`;
    const answer = a * target;
    return {
      id, topicId: 'multi-step', type: 'numeric-input', difficulty,
      prompt: `简便计算: ${expression}`,
      data: {
        kind: 'multi-step', expression,
        steps: [
          { stepIndex: 0, subExpression: `${a} × (${m} + ${n})`, result: a, annotation: '提取公因数' },
          { stepIndex: 1, subExpression: `${a} × ${target}`, result: answer, annotation: '计算' },
        ],
      },
      solution: {
        answer,
        steps: [`提取公因数 ${a}: ${expression} = ${a} × (${m} + ${n})`, `= ${a} × ${target} = ${answer}`],
        explanation: `乘法分配律逆用: 提取公因数 ${a}，凑整 ${m}+${n}=${target}`,
      },
      hints: ['找到两项的公因数'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 30% 隐藏公因数模式: 一项用小数形式隐藏公因数
  if (Math.random() < 0.3) {
    const baseFactors = [28, 36, 45, 72, 125];
    const base = baseFactors[randInt(0, baseFactors.length - 1)];
    const m10 = randInt(1, 9);
    const n10 = 10 - m10;
    const aVisible = base / 10;
    const expression = `${formatNum(aVisible)} × ${m10} + ${base} × ${formatNum(n10 / 10)}`;
    const answer = base;

    return {
      id, topicId: 'multi-step', type: 'numeric-input', difficulty,
      prompt: `简便计算: ${expression}`,
      data: {
        kind: 'multi-step', expression,
        steps: [
          { stepIndex: 0, subExpression: `${formatNum(aVisible)} × ${m10} = ${base} × ${formatNum(m10 / 10)}`, result: aVisible * m10, annotation: '识别隐藏公因数' },
          { stepIndex: 1, subExpression: `${base} × (${formatNum(m10 / 10)} + ${formatNum(n10 / 10)}) = ${base} × 1 = ${base}`, result: answer, annotation: '合并' },
        ],
      },
      solution: {
        answer,
        steps: [
          `发现 ${formatNum(aVisible)} × ${m10} = ${base} × ${formatNum(m10 / 10)}`,
          `${base} × ${formatNum(m10 / 10)} + ${base} × ${formatNum(n10 / 10)} = ${base} × 1 = ${base}`,
        ],
        explanation: `识别隐藏公因数 ${base}: 两项都是 ${base} 的倍数，合并后凑整`,
      },
      hints: [`试着把两项都写成同一个数的倍数`],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // Hard/Demon: 原有逻辑
  const isHard = difficulty <= 7;
  const factors = isHard ? [25, 36, 15, 24, 18] : [125, 75, 48, 36];
  const a = factors[randInt(0, factors.length - 1)];
  const sumTargets = isHard ? [10, 20, 25, 50] : [100, 50, 40, 20];
  const target = sumTargets[randInt(0, sumTargets.length - 1)];
  const op = Math.random() < 0.5 ? '+' : '-';

  let m: number, n: number;
  if (op === '+') {
    m = randInt(1, target - 1);
    n = target - m;
  } else {
    n = randInt(1, target - 1);
    m = target + n;
  }

  const answer = a * target;
  const expression = op === '+'
    ? `${a} × ${m} + ${a} × ${n}`
    : `${a} × ${m} - ${a} × ${n}`;

  return {
    id, topicId: 'multi-step', type: 'numeric-input', difficulty,
    prompt: `简便计算: ${expression}`,
    data: {
      kind: 'multi-step', expression,
      steps: [
        { stepIndex: 0, subExpression: `提取公因数 ${a}`, result: a, annotation: '发现公因数' },
        { stepIndex: 1, subExpression: `${a} × (${m} ${op} ${n}) = ${a} × ${target} = ${answer}`, result: answer, annotation: '加括号合并' },
      ],
    },
    solution: {
      answer,
      steps: [`发现公因数 ${a}`, `${expression} = ${a} × (${m} ${op} ${n}) = ${a} × ${target} = ${answer}`],
      explanation: `两项都含因数 ${a}，提取后加括号合并`,
    },
    hints: [`两项都有因数 ${a}，可以提取出来`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateBracketHard(difficulty: number, id: string): Question {
  const r = Math.random();
  if (r < 0.25) return generateTrapAddBracket(difficulty, id);
  if (r < 0.50) return generateTrapExpandPlus(difficulty, id);
  if (r < 0.70) return generateTrapExpandMinus(difficulty, id);
  if (r < 0.85) return generateSimplifySubtract(difficulty, id);
  return generateExtractFactor(difficulty, id);
}

// --- Demon MC 陷阱④: 乘法分配律漏乘 ---
// 真题来源: 25×(8+4)=25×8+25×4，学生常写 25×8+4（漏乘4）（人教版期中测试卷）
function generateTrapDistributeMissed(difficulty: number, id: string): Question {
  const a = randInt(3, 15);
  const b = randInt(10, 50);
  const c = randInt(5, 30);
  const expression = `${a} × (${b} + ${c})`;

  const correct = a * b + a * c;        // ✓
  const trap    = a * b + c;            // ✗ 漏乘 c（未乘以 a）
  const wrong2  = a * b - a * c;        // ✗ 符号错误
  const wrong3  = a + b + c;            // ✗ 完全理解错误

  const options = shuffle([String(correct), String(trap), String(wrong2), String(wrong3)]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `计算 ${expression}，正确结果是？`,
    data: { kind: 'multi-step', expression, steps: [], options },
    solution: {
      answer: String(correct),
      explanation: `${a} × (${b} + ${c}) = ${a}×${b} + ${a}×${c} = ${a * b} + ${a * c} = ${correct}。括号外的 ${a} 必须同时乘以括号内每一项，漏乘会得到错误答案 ${trap}`,
    },
    hints: ['分配律：括号外的数要乘以括号内的每一项！'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// --- Demon MC 陷阱⑤: 除法对加法无分配律 ---
// 真题来源: 12÷(2+4)=2，而非 12÷2+12÷4=9（CSDN乘法分配律练习题）
// 陷阱: 把乘法分配律错误套用到除法
function generateTrapDivisionDistribute(difficulty: number, id: string): Question {
  // 精心选取使 a÷b 和 a÷c 都是整数的数对（保证陷阱答案也是整数，更有迷惑性）
  const cases = [
    { a: 12, b: 2, c: 4, correct: 2,  trap: 9  },  // 12÷(2+4)=2, 12÷2+12÷4=6+3=9
    { a: 30, b: 2, c: 3, correct: 6,  trap: 25 },  // 30÷(2+3)=6, 30÷2+30÷3=15+10=25
    { a: 24, b: 2, c: 4, correct: 4,  trap: 18 },  // 24÷(2+4)=4, 24÷2+24÷4=12+6=18
    { a: 60, b: 4, c: 6, correct: 6,  trap: 25 },  // 60÷(4+6)=6, 60÷4+60÷6=15+10=25
    { a: 24, b: 2, c: 6, correct: 3,  trap: 16 },  // 24÷(2+6)=3, 24÷2+24÷6=12+4=16
    { a: 18, b: 3, c: 6, correct: 2,  trap: 9  },  // 18÷(3+6)=2, 18÷3+18÷6=6+3=9
    { a: 60, b: 3, c: 2, correct: 12, trap: 50 },  // 60÷(3+2)=12, 60÷3+60÷2=20+30=50
  ];
  const { a, b, c, correct, trap } = cases[randInt(0, cases.length - 1)];
  const expression = `${a} ÷ (${b} + ${c})`;
  const sum = b + c;

  const wrong2 = correct + b;
  const wrong3 = correct * b;
  const options = shuffle([String(correct), String(trap), String(wrong2), String(wrong3)]);

  return {
    id, topicId: 'multi-step', type: 'multiple-choice', difficulty,
    prompt: `计算 ${expression}，正确结果是？`,
    data: { kind: 'multi-step', expression, steps: [], options },
    solution: {
      answer: String(correct),
      explanation: `${expression} = ${a} ÷ ${sum} = ${correct}。除法对加法没有分配律！错误做法 ${a}÷${b} + ${a}÷${c} = ${a/b} + ${a/c} = ${trap}，这是把乘法分配律错误套用到了除法`,
    },
    hints: ['注意：a ÷ (b + c) ≠ a÷b + a÷c，除法对加法没有分配律！'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

function generateBracketDemon(difficulty: number, id: string): Question {
  const r = Math.random();
  if (r < 0.30) return generateTrapDistributeMissed(difficulty, id);
  if (r < 0.55) return generateTrapDivisionDistribute(difficulty, id);
  if (r < 0.75) return generateTrapExpandMinus(difficulty, id);
  return generateExtractFactor(difficulty, id);
}

// ===== Main generator =====

export function generateMultiStep(params: GeneratorParams): Question {
  const { difficulty, id = '', subtypeFilter } = params;

  const entries: SubtypeEntry[] = difficulty <= 5 ? [
    { tag: 'bracket-normal', weight: 40, gen: () => generateBracketNormal(difficulty, id) },
    { tag: 'extract-factor', weight: 30, gen: () => generateExtractFactor(difficulty, id) },
    { tag: 'decimal-two-step', weight: 30, gen: () => generateDecimalTwoStep(difficulty, id) },
  ] : difficulty <= 7 ? [
    { tag: 'bracket-hard', weight: 30, gen: () => generateBracketHard(difficulty, id) },
    { tag: 'extract-factor', weight: 25, gen: () => generateExtractFactor(difficulty, id) },
    { tag: 'decimal-two-step', weight: 25, gen: () => generateDecimalTwoStep(difficulty, id) },
    { tag: 'simplify-subtract', weight: 20, gen: () => generateSimplifySubtract(difficulty, id) },
  ] : [
    { tag: 'decimal-multi-step', weight: 30, gen: () => generateDecimalMultiStep(difficulty, id) },
    { tag: 'bracket-demon', weight: 25, gen: () => generateBracketDemon(difficulty, id) },
    { tag: 'extract-factor', weight: 25, gen: () => generateExtractFactor(difficulty, id) },
    { tag: 'decimal-chain', weight: 20, gen: () => generateDecimalChain(difficulty, id) },
  ];

  return pickSubtype(entries, subtypeFilter);
}
