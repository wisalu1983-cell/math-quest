import type { Question, ComputationStep } from '@/types';
import type { GeneratorParams } from '../index';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOperator(): '+' | '-' | '×' | '÷' {
  const ops: ('+' | '-' | '×' | '÷')[] = ['+', '-', '×', '÷'];
  return ops[randInt(0, 3)];
}

function generatePair(difficulty: number, op: '+' | '-' | '×' | '÷'): [number, number, number] {
  let a: number, b: number, answer: number;

  // difficulty 4-5: 20% 概率生成整十/整百运算
  if (difficulty >= 4 && difficulty <= 5 && Math.random() < 0.2) {
    const roundBase = Math.random() < 0.5 ? 10 : 100;
    if (op === '+') {
      const a = randInt(1, 9) * roundBase;
      const b = randInt(1, 9) * roundBase;
      return [a, b, a + b];
    } else if (op === '-') {
      const a = randInt(2, 9) * roundBase;
      const b = randInt(1, Math.floor(a / roundBase) - 1) * roundBase;
      return [a, b, a - b];
    } else if (op === '×') {
      const a = randInt(1, 9) * roundBase;
      const b = randInt(2, 9);
      return [a, b, a * b];
    } else {
      // ÷: 如 2700÷9=300
      const quotient = randInt(1, 9) * roundBase;
      const b = randInt(2, 9);
      return [quotient * b, b, quotient];
    }
  }

  switch (op) {
    case '+': {
      if (difficulty <= 5) {
        a = randInt(10, 99); b = randInt(10, 99);
      } else if (difficulty <= 7) {
        if (Math.random() < 0.3) {
          a = randInt(1, 9) * 100 - randInt(1, 5); b = randInt(10, 99);
        } else {
          a = randInt(10, 999); b = randInt(10, 99);
        }
      } else {
        if (Math.random() < 0.4) {
          a = randInt(1, 9) * 1000 - randInt(1, 9); b = randInt(100, 999);
        } else {
          a = randInt(100, 9999); b = randInt(10, 999);
        }
      }
      answer = a + b;
      break;
    }
    case '-': {
      if (difficulty <= 5) {
        a = randInt(20, 99); b = randInt(10, a);
      } else if (difficulty <= 7) {
        if (Math.random() < 0.3) {
          a = randInt(1, 9) * 100; b = randInt(11, 99);
        } else {
          a = randInt(100, 999); b = randInt(10, a);
        }
      } else {
        if (Math.random() < 0.4) {
          a = randInt(1, 9) * 1000; b = randInt(100, 999);
        } else {
          a = randInt(1000, 9999); b = randInt(100, a);
        }
      }
      answer = a - b;
      break;
    }
    case '×': {
      if (difficulty <= 5) {
        a = randInt(2, 9); b = randInt(10, 99);
      } else if (difficulty <= 7) {
        a = randInt(2, 9);
        b = Math.random() < 0.5 ? randInt(10, 99) : randInt(100, 999);
      } else {
        a = randInt(6, 9); b = randInt(50, 99);
      }
      answer = a * b;
      break;
    }
    case '÷': {
      if (difficulty <= 5) {
        // Normal: 2-digit ÷ 1-digit, may have remainder
        a = randInt(10, 99);
        b = randInt(2, 9);
        answer = Math.floor(a / b);
      } else if (difficulty <= 7) {
        b = randInt(2, 9); answer = randInt(10, 99); a = b * answer;
      } else {
        b = randInt(2, 20); answer = randInt(10, 99); a = b * answer;
      }
      break;
    }
  }

  return [a, b, answer];
}

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 为"先算哪一步"MC 题生成 3 个干扰选项 */
function generateWrongFirstSteps(expression: string, correctFirst: string): string[] {
  // 从表达式中提取所有可能的二元子表达式
  const tokens = expression.replace(/[()]/g, '').split(/\s+/);
  const candidates: string[] = [];
  for (let i = 0; i < tokens.length - 2; i += 2) {
    const sub = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
    if (sub !== correctFirst) candidates.push(sub);
  }
  // 补充到 3 个干扰项
  while (candidates.length < 3) {
    const a = randInt(1, 20);
    const b = randInt(1, 20);
    const op = ['+', '-', '×', '÷'][randInt(0, 3)];
    const filler = `${a} ${op} ${b}`;
    if (filler !== correctFirst && !candidates.includes(filler)) {
      candidates.push(filler);
    }
  }
  return candidates.slice(0, 3);
}

function generateOperationOrder(difficulty: number, id: string): Question {
  // 50% MC "先算哪一步", 50% numeric-input "按顺序计算"
  const isMC = Math.random() < 0.5;

  let expression: string;
  let answer: number;
  let steps: ComputationStep[];
  let firstStep: string;

  if (difficulty <= 5) {
    // 2步, 无括号: a op1 b op2 c，其中 op1 和 op2 优先级不同
    const useMultiply = Math.random() < 0.5;
    if (useMultiply) {
      const a = randInt(2, 9);
      const b = randInt(2, 15);
      const c = randInt(5, 50);
      const addFirst = Math.random() < 0.5;
      if (addFirst) {
        // c + a × b 或 c - a × b
        const product = a * b;
        const useMinus = Math.random() < 0.5 && c > product;
        const op = useMinus ? '-' : '+';
        expression = `${c} ${op} ${a} × ${b}`;
        answer = useMinus ? c - product : c + product;
        firstStep = `${a} × ${b}`;
        steps = [
          { stepIndex: 0, subExpression: `${a} × ${b}`, result: product, annotation: '先算乘法' },
          { stepIndex: 1, subExpression: `${c} ${op} ${product}`, result: answer, annotation: '再算加减' },
        ];
      } else {
        // a × b + c
        const product = a * b;
        expression = `${a} × ${b} + ${c}`;
        answer = product + c;
        firstStep = `${a} × ${b}`;
        steps = [
          { stepIndex: 0, subExpression: `${a} × ${b}`, result: product, annotation: '先算乘法' },
          { stepIndex: 1, subExpression: `${product} + ${c}`, result: answer, annotation: '再算加法' },
        ];
      }
    } else {
      // 除法版: a ÷ b + c 或 c + a ÷ b
      const divisor = randInt(2, 9);
      const quotient = randInt(2, 15);
      const a = divisor * quotient;
      const c = randInt(5, 50);
      const putDivFirst = Math.random() < 0.5;
      if (putDivFirst) {
        expression = `${a} ÷ ${divisor} + ${c}`;
        answer = quotient + c;
        firstStep = `${a} ÷ ${divisor}`;
        steps = [
          { stepIndex: 0, subExpression: `${a} ÷ ${divisor}`, result: quotient, annotation: '先算除法' },
          { stepIndex: 1, subExpression: `${quotient} + ${c}`, result: answer, annotation: '再算加法' },
        ];
      } else {
        expression = `${c} + ${a} ÷ ${divisor}`;
        answer = c + quotient;
        firstStep = `${a} ÷ ${divisor}`;
        steps = [
          { stepIndex: 0, subExpression: `${a} ÷ ${divisor}`, result: quotient, annotation: '先算除法' },
          { stepIndex: 1, subExpression: `${c} + ${quotient}`, result: answer, annotation: '再算加法' },
        ];
      }
    }
  } else {
    // 3步, 含括号: (a + b) × c 或 a × b + c - d 或 a ÷ b + c × d
    const pattern = randInt(0, 2);
    if (pattern === 0) {
      // (a + b) × c
      const a = randInt(5, 30);
      const b = randInt(5, 30);
      const c = randInt(2, 9);
      const sum = a + b;
      expression = `(${a} + ${b}) × ${c}`;
      answer = sum * c;
      firstStep = `${a} + ${b}`;
      steps = [
        { stepIndex: 0, subExpression: `${a} + ${b}`, result: sum, annotation: '先算括号内' },
        { stepIndex: 1, subExpression: `${sum} × ${c}`, result: answer, annotation: '再算乘法' },
      ];
    } else if (pattern === 1) {
      // a × b + c - d
      const a = randInt(2, 9);
      const b = randInt(3, 15);
      const c = randInt(10, 50);
      const product = a * b;
      const d = randInt(1, Math.min(product + c - 1, 50));
      expression = `${a} × ${b} + ${c} - ${d}`;
      answer = product + c - d;
      firstStep = `${a} × ${b}`;
      steps = [
        { stepIndex: 0, subExpression: `${a} × ${b}`, result: product, annotation: '先算乘法' },
        { stepIndex: 1, subExpression: `${product} + ${c}`, result: product + c, annotation: '再从左到右' },
        { stepIndex: 2, subExpression: `${product + c} - ${d}`, result: answer, annotation: '最后一步' },
      ];
    } else {
      // a ÷ b + c × d
      const divisor = randInt(2, 9);
      const quotient = randInt(2, 15);
      const a = divisor * quotient;
      const c = randInt(2, 9);
      const d = randInt(2, 15);
      expression = `${a} ÷ ${divisor} + ${c} × ${d}`;
      answer = quotient + c * d;
      firstStep = `${a} ÷ ${divisor}`;
      steps = [
        { stepIndex: 0, subExpression: `${a} ÷ ${divisor} = ${quotient}，${c} × ${d} = ${c * d}`, result: quotient, annotation: '先算乘除（同级左到右）' },
        { stepIndex: 1, subExpression: `${quotient} + ${c * d}`, result: answer, annotation: '再算加法' },
      ];
    }
  }

  if (isMC) {
    // MC: "应该先算哪一步？"
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

  // numeric-input: "按运算顺序计算"
  return {
    id, topicId: 'mental-arithmetic', type: 'numeric-input', difficulty,
    prompt: `按运算顺序计算: ${expression}`,
    data: { kind: 'multi-step' as const, expression, steps },
    solution: {
      answer,
      steps: steps.map(s => `${s.annotation}: ${s.subExpression} = ${s.result}`),
      explanation: `运算顺序：括号内优先，先乘除后加减`,
    },
    hints: ['注意运算顺序'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

export function generateMentalArithmetic(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  // 20% 概率生成运算顺序题（基础计算的新增能力）
  if (Math.random() < 0.20) {
    return generateOperationOrder(difficulty, id);
  }

  // 80% 概率生成单步口算题（原有逻辑不变）
  const op = pickOperator();
  const [a, b, numAnswer] = generatePair(difficulty, op);

  // Division: always "quotient...remainder" string; others: number
  const remainder = op === '÷' ? a - b * numAnswer : 0;
  const finalAnswer: number | string = op === '÷' ? `${numAnswer}...${remainder}` : numAnswer;

  const expression = `${a} ${op} ${b}`;

  const hintText =
    op === '+' ? `试试把 ${a} 拆分成更容易计算的数` :
    op === '-' ? `想想 ${b} + ? = ${a}` :
    op === '×' ? (b >= 10 ? `${a} × ${b} 可以拆成 ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10}` : '回忆一下乘法口诀表') :
    remainder > 0 ? `想想 ${b} × ? 最接近 ${a} 但不超过它，余数 = ?` : `想想 ${b} × ? = ${a}`;

  const explanation = op === '÷'
    ? remainder > 0
      ? `${expression} = ${numAnswer}……${remainder}`
      : `${expression} = ${numAnswer}（整除，余数为0）`
    : `${expression} = ${numAnswer}`;

  return {
    id,
    topicId: 'mental-arithmetic',
    type: 'numeric-input',
    difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'mental-arithmetic', expression, operands: [a, b], operator: op },
    solution: { answer: finalAnswer, explanation },
    hints: [hintText],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
