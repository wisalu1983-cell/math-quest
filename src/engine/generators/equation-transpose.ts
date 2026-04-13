import type { Question } from '@/types';
import type { GeneratorParams } from '../index';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Type 1: x + a = b → move +a to right → x = b - a
// Distractors: x = b + a (forgot to flip sign)
function generateMoveConstant(difficulty: number, id: string): Question {
  const a = randInt(5, difficulty <= 5 ? 50 : 200);
  const x = randInt(1, difficulty <= 5 ? 50 : 200);
  const ops = ['+', '-'] as const;
  const op = ops[randInt(0, 1)];

  let equation: string;
  let correct: string;
  let wrong1: string;
  let explanation: string;

  if (op === '+') {
    const b = x + a;
    equation = `x + ${a} = ${b}`;
    correct = `x = ${b} - ${a}`;
    wrong1 = `x = ${b} + ${a}`;
    explanation = `+${a} 移到右边变为 -${a}`;
  } else {
    const b = x - a;
    if (b < 0) {
      // Avoid negative, use + instead
      const b2 = x + a;
      equation = `x + ${a} = ${b2}`;
      correct = `x = ${b2} - ${a}`;
      wrong1 = `x = ${b2} + ${a}`;
      explanation = `+${a} 移到右边变为 -${a}`;
    } else {
      equation = `x - ${a} = ${b}`;
      correct = `x = ${b} + ${a}`;
      wrong1 = `x = ${b} - ${a}`;
      explanation = `-${a} 移到右边变为 +${a}`;
    }
  }

  const options = shuffle([correct, wrong1]);

  return {
    id, topicId: 'equation-transpose', type: 'multiple-choice', difficulty,
    prompt: `移项: ${equation}`,
    promptLatex: equation,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [correct], options },
    solution: { answer: correct, explanation: `${equation} → ${correct}（${explanation}）` },
    hints: ['移项要变号: + 变 -, - 变 +'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// Type 2: ax + b = c → move b, what does it become?
function generateMoveFromLinear(difficulty: number, id: string): Question {
  const x = randInt(1, 20);
  const a = randInt(2, 9);
  const b = randInt(5, 80);
  const op = Math.random() < 0.5 ? '+' : '-';

  let c: number;
  let equation: string;
  let correct: string;
  let wrong1: string;
  let explanation: string;

  if (op === '+') {
    c = a * x + b;
    equation = `${a}x + ${b} = ${c}`;
    correct = `${a}x = ${c} - ${b}`;
    wrong1 = `${a}x = ${c} + ${b}`;
    explanation = `+${b} 移到右边变为 -${b}`;
  } else {
    c = a * x - b;
    if (c < 0) {
      c = a * x + b;
      equation = `${a}x + ${b} = ${c}`;
      correct = `${a}x = ${c} - ${b}`;
      wrong1 = `${a}x = ${c} + ${b}`;
      explanation = `+${b} 移到右边变为 -${b}`;
    } else {
      equation = `${a}x - ${b} = ${c}`;
      correct = `${a}x = ${c} + ${b}`;
      wrong1 = `${a}x = ${c} - ${b}`;
      explanation = `-${b} 移到右边变为 +${b}`;
    }
  }

  const options = shuffle([correct, wrong1]);

  return {
    id, topicId: 'equation-transpose', type: 'multiple-choice', difficulty,
    prompt: `移项: ${equation}`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [correct], options },
    solution: { answer: correct, explanation: `${equation} → ${correct}（${explanation}）` },
    hints: ['把常数项移到等号右边，移项要变号'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// Type 3: ax + b = cx + d → move cx and b, what does it become?
function generateMoveBothSides(difficulty: number, id: string): Question {
  const x = randInt(1, 15);
  const a = randInt(3, 12);
  const cc = randInt(1, a - 1);
  const b = randInt(5, 50);
  const d = (a - cc) * x + b;

  const equation = `${a}x + ${b} = ${cc}x + ${d}`;
  const correct = `${a}x - ${cc}x = ${d} - ${b}`;
  const wrong1 = `${a}x + ${cc}x = ${d} - ${b}`; // forgot to flip cx sign
  const wrong2 = `${a}x - ${cc}x = ${d} + ${b}`; // forgot to flip b sign
  const wrong3 = `${a}x + ${cc}x = ${d} + ${b}`; // both wrong

  const options = shuffle([correct, wrong1, wrong2, wrong3]);

  return {
    id, topicId: 'equation-transpose', type: 'multiple-choice', difficulty,
    prompt: `移项: ${equation}`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [correct], options },
    solution: {
      answer: correct,
      explanation: `${equation} → ${correct}（+${cc}x 移到左边变 -${cc}x，+${b} 移到右边变 -${b}）`,
    },
    hints: ['含x的项移到左边，常数移到右边，每个移动的项都要变号'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// Type 4: After transposition, solve for x (numeric input)
function generateSolveAfterTranspose(difficulty: number, id: string): Question {
  const x = randInt(1, 20);
  const a = randInt(2, 9);
  const b = randInt(5, 80);
  const c = a * x + b;
  const equation = `${a}x + ${b} = ${c}`;
  const step1 = `${a}x = ${c} - ${b} = ${c - b}`;
  const step2 = `x = ${c - b} ÷ ${a} = ${x}`;

  return {
    id, topicId: 'equation-transpose', type: 'numeric-input', difficulty,
    prompt: `解方程: ${equation}，x = ?`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps: [step1, step2] },
    solution: {
      answer: x,
      steps: [step1, step2],
      explanation: `移项: ${a}x = ${c - b}，再除以${a}: x = ${x}`,
    },
    hints: ['先移项: 把常数项移到右边，再两边同除以x的系数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// Type 5: Bracket equations — a(x + b) = c or (x + a) ÷ b = c or a(b - x) = c
function generateBracketEquation(difficulty: number, id: string): Question {
  const pattern = randInt(0, 2);

  let equation: string;
  let x: number;
  let steps: string[];
  let explanation: string;

  if (pattern === 0) {
    // a(x + b) = c  →  x + b = c/a  →  x = c/a - b
    const a = randInt(2, 6);
    x = randInt(1, 15);
    const b = difficulty >= 8
      ? Number((randInt(1, 30) / 10).toFixed(1))
      : randInt(1, 20);
    const sum = x + Number(b);
    const c = a * sum;
    equation = `${a}(x + ${b}) = ${c}`;
    steps = [
      `两边 ÷ ${a}: x + ${b} = ${c} ÷ ${a} = ${sum}`,
      `移项: x = ${sum} - ${b} = ${x}`,
    ];
    explanation = `先除以系数 ${a}，再移项减去 ${b}`;
  } else if (pattern === 1) {
    // (x + a) ÷ b = c  →  x + a = b × c  →  x = bc - a
    const b = randInt(2, 8);
    const c = randInt(2, 15);
    const a = randInt(1, 20);
    x = b * c - a;
    if (x <= 0) {
      // Fallback to pattern 0
      const a2 = randInt(2, 6);
      x = randInt(1, 15);
      const b2 = randInt(1, 15);
      const c2 = a2 * (x + b2);
      equation = `${a2}(x + ${b2}) = ${c2}`;
      steps = [
        `两边 ÷ ${a2}: x + ${b2} = ${c2} ÷ ${a2} = ${x + b2}`,
        `移项: x = ${x + b2} - ${b2} = ${x}`,
      ];
      explanation = `先除以系数 ${a2}，再移项`;
    } else {
      const product = b * c;
      equation = `(x + ${a}) ÷ ${b} = ${c}`;
      steps = [
        `两边 × ${b}: x + ${a} = ${b} × ${c} = ${product}`,
        `移项: x = ${product} - ${a} = ${x}`,
      ];
      explanation = `先乘以 ${b}，再移项减去 ${a}`;
    }
  } else {
    // a(b - x) = c  →  b - x = c/a  →  x = b - c/a
    const a = randInt(2, 6);
    x = randInt(1, 10);
    const b = x + randInt(2, 15);
    const diff = b - x;
    const c = a * diff;
    equation = `${a}(${b} - x) = ${c}`;
    steps = [
      `两边 ÷ ${a}: ${b} - x = ${c} ÷ ${a} = ${diff}`,
      `移项: x = ${b} - ${diff} = ${x}`,
    ];
    explanation = `先除以系数 ${a}，再用 ${b} 减去结果`;
  }

  return {
    id, topicId: 'equation-transpose', type: 'numeric-input', difficulty,
    prompt: `解方程: ${equation}，x = ?`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps },
    solution: {
      answer: x,
      steps,
      explanation,
    },
    hints: ['先处理括号外面的系数或运算'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// Type 6: Division equations — a ÷ x = b or x ÷ a + b = c
function generateDivisionEquation(difficulty: number, id: string): Question {
  const isSimple = difficulty <= 5 || Math.random() < 0.5;

  let equation: string;
  let x: number;
  let steps: string[];
  let explanation: string;

  if (isSimple) {
    // a ÷ x = b  →  x = a ÷ b
    const b = randInt(2, 9);
    x = randInt(2, 15);
    const a = b * x;
    equation = `${a} ÷ x = ${b}`;
    steps = [`x = ${a} ÷ ${b} = ${x}`];
    explanation = `被除数 ÷ 商 = 除数，所以 x = ${a} ÷ ${b}`;
  } else {
    // x ÷ a + b = c  →  x ÷ a = c - b  →  x = (c - b) × a
    const a = randInt(2, 8);
    const quotient = randInt(2, 12);
    x = quotient * a;
    const b = randInt(1, 20);
    const c = quotient + b;
    equation = `x ÷ ${a} + ${b} = ${c}`;
    steps = [
      `移项: x ÷ ${a} = ${c} - ${b} = ${quotient}`,
      `两边 × ${a}: x = ${quotient} × ${a} = ${x}`,
    ];
    explanation = `先移项得 x ÷ ${a} = ${quotient}，再乘以 ${a}`;
  }

  return {
    id, topicId: 'equation-transpose', type: 'numeric-input', difficulty,
    prompt: `解方程: ${equation}，x = ?`,
    data: { kind: 'equation-transpose', equation, variable: 'x', steps },
    solution: {
      answer: x,
      steps,
      explanation,
    },
    hints: ['想一想被除数、除数和商的关系'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// Type 7: 方程概念判断 — 区分等式与方程、验证方程的解
function generateEquationConcept(difficulty: number, id: string): Question {
  const isIdentify = Math.random() < 0.5;

  if (isIdentify) {
    const x = randInt(1, 20);
    const a = randInt(2, 9);
    const b = randInt(1, 50);
    const c = a * x + b;

    const equation = `${a}x + ${b} = ${c}`;
    const pureEquation = `${b} + ${c - b} = ${c}`;
    const inequality = `${a}x + ${b} > ${c - 1}`;
    const expression = `${a}x + ${b}`;

    const options = shuffle([equation, pureEquation, inequality, expression]);

    return {
      id, topicId: 'equation-transpose', type: 'multiple-choice', difficulty,
      prompt: `下面哪个是方程？`,
      data: { kind: 'equation-transpose', equation, variable: 'x', steps: [], options },
      solution: { answer: equation, explanation: `方程是含有未知数的等式。${equation} 含有未知数 x，且是等式，所以是方程` },
      hints: ['方程的两个条件：1. 是等式（有等号）2. 含有未知数'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  } else {
    const x = randInt(1, 15);
    const a = randInt(2, 6);
    const b = randInt(1, 30);
    const c = a * x + b;
    const equation = `${a}x + ${b} = ${c}`;

    const isCorrect = Math.random() < 0.5;
    const testValue = isCorrect ? x : x + randInt(1, 3);
    const leftResult = a * testValue + b;

    const options = shuffle(['是', '不是']);

    return {
      id, topicId: 'equation-transpose', type: 'multiple-choice', difficulty,
      prompt: `x = ${testValue} 是方程 ${equation} 的解吗？`,
      data: { kind: 'equation-transpose', equation, variable: 'x', steps: [`代入 x=${testValue}: ${a}×${testValue}+${b} = ${leftResult}`], options },
      solution: {
        answer: isCorrect ? '是' : '不是',
        explanation: `代入 x=${testValue}: 左边 = ${a}×${testValue}+${b} = ${leftResult}，右边 = ${c}。${leftResult === c ? '左边=右边，所以是方程的解' : '左边≠右边，所以不是方程的解'}`,
      },
      hints: ['把值代入方程左边，看看等不等于右边'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }
}

export function generateEquationTranspose(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  if (difficulty <= 5) {
    const r = Math.random();
    if (r < 0.35) return generateMoveConstant(difficulty, id);
    if (r < 0.60) return generateSolveAfterTranspose(difficulty, id);
    if (r < 0.80) return generateDivisionEquation(difficulty, id);
    return generateEquationConcept(difficulty, id);
  }

  if (difficulty <= 7) {
    const r = Math.random();
    if (r < 0.20) return generateMoveFromLinear(difficulty, id);
    if (r < 0.40) return generateSolveAfterTranspose(difficulty, id);
    if (r < 0.55) return generateMoveConstant(difficulty, id);
    if (r < 0.70) return generateBracketEquation(difficulty, id);
    if (r < 0.85) return generateDivisionEquation(difficulty, id);
    return generateEquationConcept(difficulty, id);
  }

  const r = Math.random();
  if (r < 0.25) return generateMoveBothSides(difficulty, id);
  if (r < 0.45) return generateBracketEquation(difficulty, id);
  if (r < 0.60) return generateMoveFromLinear(difficulty, id);
  if (r < 0.75) return generateSolveAfterTranspose(difficulty, id);
  if (r < 0.90) return generateDivisionEquation(difficulty, id);
  return generateEquationConcept(difficulty, id);
}
