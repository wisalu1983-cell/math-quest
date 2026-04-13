# Phase 3: P2 题型扩展实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展 3 个生成器的题型覆盖——A04 运算律类型识别 MC、A08 方程概念判断、A02 去尾法/进一法 + 逆向推理。

**Architecture:** 每个生成器新增 1-2 个子函数并接入调度器；无类型定义变更，复用现有数据结构。

**Tech Stack:** TypeScript, Vitest, math-quest 现有生成器架构

**Spec:** `math-quest/docs/specs/2026-04-08-generator-improvements.md` Section 2.P1, 3.P1-P2, 7.P2

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/engine/generators/operation-laws.ts` | 修改 | 新增 `generateLawIdentification()` + 调度器更新 |
| `src/engine/generators/equation-transpose.ts` | 修改 | 新增 `generateEquationConcept()` + 调度器更新 |
| `src/engine/generators/number-sense.ts` | 修改 | 新增 `generateFloorCeil()` + `generateReverseRound()` + 调度器更新 |
| `src/engine/generators/generators.test.ts` | 修改 | 新增 3 组测试 |

---

## Task 1: A04 运算律类型识别 MC

**Files:**
- Modify: `src/engine/generators/operation-laws.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 的 import 区域添加（如果尚未存在）：
```typescript
import { generateOperationLaws } from './operation-laws';
```

在文件末尾追加：

```typescript

// ==================== A04 Phase 3: Law Identification ====================
describe('Operation Laws - Identification (运算律类型识别)', () => {
  it('应生成运算律识别题', () => {
    const qs = genN(generateOperationLaws, 5, 400);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    expect(idQs.length).toBeGreaterThan(0);
  });

  it('运算律识别题应为 multiple-choice 类型', () => {
    const qs = genN(generateOperationLaws, 5, 400);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    for (const q of idQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('答案必须是三种运算律之一', () => {
    const qs = genN(generateOperationLaws, 5, 400);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    for (const q of idQs) {
      expect(['交换律', '结合律', '分配律']).toContain(String(q.solution.answer));
    }
  });

  it('三种运算律答案应都能出现', () => {
    const qs = genN(generateOperationLaws, 5, 600);
    const idQs = qs.filter((q: any) => q.prompt.includes('运用了什么运算律'));
    const answers = new Set(idQs.map((q: any) => String(q.solution.answer)));
    expect(answers.size).toBe(3);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 实现 generateLawIdentification**

在 `operation-laws.ts` 的 `generateDistributive` 函数之后、`export function generateOperationLaws` 之前插入：

```typescript

// Type 4: 运算律类型识别 — 给出变形，判断用了哪种运算律
function generateLawIdentification(difficulty: number, id: string): Question {
  // 等概率生成三种运算律的变形示例
  const lawType = randInt(0, 2);
  let original: string;
  let transformed: string;
  let correctLaw: 'commutative' | 'associative' | 'distributive';
  let correctName: string;

  if (lawType === 0) {
    // 交换律: a × b = b × a 或 a + b = b + a
    const isAdd = Math.random() < 0.5;
    const op = isAdd ? '+' : '×';
    const a = randInt(10, difficulty <= 5 ? 99 : 500);
    const b = randInt(10, difficulty <= 5 ? 99 : 500);
    original = `${a} ${op} ${b}`;
    transformed = `${b} ${op} ${a}`;
    correctLaw = 'commutative';
    correctName = '交换律';
  } else if (lawType === 1) {
    // 结合律: (a + b) + c = a + (b + c) 或 (a × b) × c = a × (b × c)
    const isAdd = Math.random() < 0.5;
    const op = isAdd ? '+' : '×';
    const a = randInt(5, difficulty <= 5 ? 50 : 200);
    const b = randInt(5, difficulty <= 5 ? 50 : 200);
    const c = randInt(5, difficulty <= 5 ? 50 : 200);
    original = `(${a} ${op} ${b}) ${op} ${c}`;
    transformed = `${a} ${op} (${b} ${op} ${c})`;
    correctLaw = 'associative';
    correctName = '结合律';
  } else {
    // 分配律: a × (b + c) = a × b + a × c
    const a = randInt(2, difficulty <= 5 ? 9 : 20);
    const b = randInt(10, 99);
    const c = randInt(10, 99);
    const isForward = Math.random() < 0.5;
    if (isForward) {
      original = `${a} × (${b} + ${c})`;
      transformed = `${a} × ${b} + ${a} × ${c}`;
    } else {
      original = `${a} × ${b} + ${a} × ${c}`;
      transformed = `${a} × (${b} + ${c})`;
    }
    correctLaw = 'distributive';
    correctName = '分配律';
  }

  const options = shuffle(['交换律', '结合律', '分配律']);

  return {
    id, topicId: 'operation-laws', type: 'multiple-choice', difficulty,
    prompt: `${original} = ${transformed}，这运用了什么运算律？`,
    data: { kind: 'operation-laws', law: correctLaw, originalExpression: original, transformedExpression: transformed, options },
    solution: { answer: correctName, explanation: `${original} = ${transformed} 运用了${correctName}` },
    hints: ['想想三种运算律的特点：交换律变顺序、结合律变括号、分配律拆乘法'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 4: 更新 generateOperationLaws 调度器**

将调度器（约第 128-140 行）替换为：

```typescript
export function generateOperationLaws(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  if (difficulty <= 5) {
    const r = Math.random();
    if (r < 0.35) return generateCommutative(difficulty, id);
    if (r < 0.65) return generateAssociative(difficulty, id);
    return generateLawIdentification(difficulty, id);
  } else if (difficulty <= 7) {
    const r = Math.random();
    if (r < 0.30) return generateDistributive(difficulty, id);
    if (r < 0.55) return generateAssociative(difficulty, id);
    if (r < 0.75) return generateCommutative(difficulty, id);
    return generateLawIdentification(difficulty, id);
  } else {
    const r = Math.random();
    if (r < 0.40) return generateDistributive(difficulty, id);
    if (r < 0.65) return generateAssociative(difficulty, id);
    return generateLawIdentification(difficulty, id);
  }
}
```

- [ ] **Step 5: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 2: A08 方程概念判断

**Files:**
- Modify: `src/engine/generators/equation-transpose.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript

// ==================== A08 Phase 3: Equation Concept ====================
describe('Equation Transpose - Concept (方程概念判断)', () => {
  it('应生成方程概念判断题', () => {
    const qs = genN(generateEquationTranspose, 5, 400);
    const conceptQs = qs.filter((q: any) =>
      q.prompt.includes('方程') && q.type === 'multiple-choice' && !q.prompt.includes('解方程')
    );
    expect(conceptQs.length).toBeGreaterThan(0);
  });

  it('方程概念题应为 multiple-choice 类型', () => {
    const qs = genN(generateEquationTranspose, 5, 400);
    const conceptQs = qs.filter((q: any) =>
      q.prompt.includes('方程') && q.type === 'multiple-choice' && !q.prompt.includes('解方程')
    );
    for (const q of conceptQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('方程概念题选项应包含正确答案', () => {
    const qs = genN(generateEquationTranspose, 5, 400);
    const conceptQs = qs.filter((q: any) =>
      q.prompt.includes('方程') && q.type === 'multiple-choice' && !q.prompt.includes('解方程')
    );
    for (const q of conceptQs) {
      const opts = q.data.options as string[];
      expect(opts).toContain(String(q.solution.answer));
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 实现 generateEquationConcept**

在 `equation-transpose.ts` 的 `generateDivisionEquation` 函数之后、`export function generateEquationTranspose` 之前插入：

```typescript

// Type 7: 方程概念判断 — 区分等式与方程、验证方程的解
function generateEquationConcept(difficulty: number, id: string): Question {
  // 50% "哪个是方程", 50% "验证方程的解"
  const isIdentify = Math.random() < 0.5;

  if (isIdentify) {
    // "下面哪个是方程？"
    const x = randInt(1, 20);
    const a = randInt(2, 9);
    const b = randInt(1, 50);
    const c = a * x + b;

    const equation = `${a}x + ${b} = ${c}`;           // ✓ 方程: 含未知数的等式
    const pureEquation = `${b} + ${c - b} = ${c}`;     // ✗ 等式但无未知数
    const inequality = `${a}x + ${b} > ${c - 1}`;      // ✗ 不等式
    const expression = `${a}x + ${b}`;                  // ✗ 式子，不是等式

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
    // "x=? 是不是方程 ax+b=c 的解"
    const x = randInt(1, 15);
    const a = randInt(2, 6);
    const b = randInt(1, 30);
    const c = a * x + b;
    const equation = `${a}x + ${b} = ${c}`;

    // 50% 给正确的解, 50% 给错误的解
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
```

- [ ] **Step 4: 更新 generateEquationTranspose 调度器**

将调度器替换为：

```typescript
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
```

- [ ] **Step 5: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 3: A02 去尾法/进一法 + 逆向推理

**Files:**
- Modify: `src/engine/generators/number-sense.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript

// ==================== A02 Phase 3: Floor/Ceil + Reverse ====================
describe('Number Sense - Floor/Ceil (去尾法/进一法)', () => {
  it('应生成去尾法或进一法题', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const fcQs = qs.filter((q: any) =>
      q.prompt.includes('去尾') || q.prompt.includes('进一')
    );
    expect(fcQs.length).toBeGreaterThan(0);
  });

  it('去尾法/进一法答案应为有效数字', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const fcQs = qs.filter((q: any) =>
      q.prompt.includes('去尾') || q.prompt.includes('进一')
    );
    for (const q of fcQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

describe('Number Sense - Reverse Round (逆向推理)', () => {
  it('应生成逆向推理题', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const revQs = qs.filter((q: any) =>
      q.prompt.includes('最大') || q.prompt.includes('最小')
    );
    expect(revQs.length).toBeGreaterThan(0);
  });

  it('逆向推理答案应为有效数字', () => {
    const qs = genN(generateNumberSense, 7, 500);
    const revQs = qs.filter((q: any) =>
      q.prompt.includes('最大') || q.prompt.includes('最小')
    );
    for (const q of revQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 实现 generateFloorCeil**

在 `number-sense.ts` 的 `generateCompare` 函数之后、`export function generateNumberSense` 之前插入：

```typescript

// 去尾法/进一法: 不同于四舍五入的取近似值方法
function generateFloorCeil(difficulty: number, id: string): Question {
  const isFloor = Math.random() < 0.5;
  const methodName = isFloor ? '去尾法' : '进一法';

  // 生成一个有 1-2 位小数的数
  const dp = difficulty <= 5 ? 1 : 2;
  const factor = Math.pow(10, dp);
  const num = randInt(11, difficulty <= 5 ? 999 : 9999) / factor;

  // 取近似到某位
  const place = dp === 1 ? 1 : (Math.random() < 0.5 ? 1 : 0.1);
  let answer: number;

  if (place >= 1) {
    // 取近似到个位
    answer = isFloor ? Math.floor(num) : Math.ceil(num);
  } else {
    // 取近似到十分位
    answer = isFloor
      ? Math.floor(num * 10) / 10
      : Math.ceil(num * 10) / 10;
  }

  const placeText = place >= 1 ? '个位' : '十分位';
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
    timeLimit: difficulty <= 5 ? 20000 : 15000,
    xpBase: 10 + (difficulty - 1) * 5,
  };
}

// 逆向推理: 给出四舍五入结果，求原数的最大/最小值
function generateReverseRound(difficulty: number, id: string): Question {
  const askMax = Math.random() < 0.5;

  // 生成一个四舍五入结果
  const dp = difficulty <= 5 ? 1 : 2;
  const roundedScaled = randInt(10, 99);
  const rounded = roundedScaled / Math.pow(10, dp);
  const roundedStr = rounded.toFixed(dp);
  const precision = dp === 1 ? '一位小数' : '两位小数';
  const nextDp = dp + 1;
  const unit = Math.pow(10, -nextDp);

  // 计算最大/最小值
  // 四舍五入到 dp 位得 rounded:
  // 最小值: rounded - 0.05 (dp=1) 或 rounded - 0.005 (dp=2)
  // 最大值: rounded + 0.04... 或 rounded + 0.004...
  const halfUnit = 5 * Math.pow(10, -(nextDp));
  let answer: number;

  if (askMax) {
    // 最大值: rounded + halfUnit - unit (如 2.5 + 0.05 - 0.01 = 2.54)
    answer = Math.round((rounded + halfUnit - unit) * Math.pow(10, nextDp)) / Math.pow(10, nextDp);
  } else {
    // 最小值: rounded - halfUnit (如 2.5 - 0.05 = 2.45)
    answer = Math.round((rounded - halfUnit) * Math.pow(10, nextDp)) / Math.pow(10, nextDp);
  }

  const answerStr = answer.toFixed(nextDp);
  const extremeText = askMax ? '最大' : '最小';

  return {
    id, topicId: 'number-sense', type: 'numeric-input', difficulty,
    prompt: `一个${nextDp === 2 ? '两' : '三'}位小数四舍五入保留${precision}后得 ${roundedStr}，这个数${extremeText}是多少？`,
    data: { kind: 'number-sense', subtype: 'round' },
    solution: {
      answer: answerStr,
      explanation: askMax
        ? `保留${precision}得 ${roundedStr}，最大的${nextDp === 2 ? '两' : '三'}位小数是 ${answerStr}（再大就会四舍五入到 ${(rounded + Math.pow(10, -dp)).toFixed(dp)}）`
        : `保留${precision}得 ${roundedStr}，最小的${nextDp === 2 ? '两' : '三'}位小数是 ${answerStr}（再小就会四舍五入到 ${(rounded - Math.pow(10, -dp)).toFixed(dp)}）`,
    },
    hints: [askMax ? '想想最大到多少还能四舍（舍去）到这个数' : '想想最小到多少能五入（进位）到这个数'],
    timeLimit: difficulty <= 5 ? 30000 : 20000,
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 4: 更新 generateNumberSense 调度器**

将调度器替换为：

```typescript
export function generateNumberSense(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;
  const r = Math.random();
  if (r < 0.35) return generateEstimate(difficulty, id);
  if (r < 0.55) return generateRound(difficulty, id);
  if (r < 0.70) return generateCompare(difficulty, id);
  if (r < 0.85) return generateFloorCeil(difficulty, id);
  return generateReverseRound(difficulty, id);
}
```

- [ ] **Step 5: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 4: 端到端验证

- [ ] **Step 1: 运行全部测试**

Run: `cd math-quest && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 2: 运行构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 3: 手动验证**

Run: `cd math-quest && npm run dev`

在浏览器中验证：
1. "运算律"练习 → 确认偶尔出现"运用了什么运算律？"MC 题
2. "方程移项"练习 → 确认偶尔出现"下面哪个是方程？"和"x=? 是方程的解吗？"
3. "数感估算"困难模式 → 确认偶尔出现去尾法/进一法题和逆向推理题
