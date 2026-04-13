# A03 竖式笔算 — 块 A：生成器小数支持实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 A03 竖式笔算生成器新增 4 个小数子函数（加减/乘法/除法/取近似值），使生成题目覆盖真题中 69% 的小数运算，全部使用 numeric-input 题型（prompt 用"列竖式计算"措辞）。

**Architecture:** 在 `vertical-calc.ts` 中新增 4 个小数子函数，复用现有 `formatNum` 模式（需新增），所有小数题返回 numeric-input 类型；保留原有整数 vertical-fill 子函数不变；重写调度器为三档概率分发（普通 50%/50%，困难/魔王 30%/70%）。

**Tech Stack:** TypeScript, Vitest, math-quest 现有生成器架构

**设计来源:** 对话中确认的 A03 块 A 设计方案 + A03 审视报告 `docs/reports/2026-04-09-A03-vertical-calc-review.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/engine/generators/vertical-calc.ts` | 修改 | 新增 `formatNum` + 4 个小数子函数 + 重写调度器 |
| `src/engine/generators/generators.test.ts` | 修改 | 新增 A03 小数题测试 |

---

## Task 1: 基础设施 — 添加 formatNum + 小数加减法

**Files:**
- Modify: `src/engine/generators/vertical-calc.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript

// ==================== A03 Decimal Support ====================
describe('Vertical Calc - Decimal Add/Sub (小数加减法)', () => {
  it('普通难度应生成小数加减法题', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decAddSub = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.expression && q.data.expression.includes('.') &&
      (q.data.expression.includes('+') || q.data.expression.includes('-'))
    );
    expect(decAddSub.length).toBeGreaterThan(0);
  });

  it('小数加减法答案应为有效数字', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decAddSub = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.expression && q.data.expression.includes('.') &&
      (q.data.expression.includes('+') || q.data.expression.includes('-'))
    );
    for (const q of decAddSub) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 添加 formatNum 辅助函数**

在 `vertical-calc.ts` 的 `isCarrySkippable` 函数之后（约第 22 行后）插入：

```typescript

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}
```

- [ ] **Step 4: 实现 generateDecimalAddSub**

在 `generateDivision` 函数之后（约第 232 行后）、`export function generateVerticalCalc` 之前插入：

```typescript

// ===== 小数加减法 (numeric-input) =====
function generateDecimalAddSub(difficulty: number, id: string): Question {
  const isAdd = Math.random() < 0.5;
  const op: '+' | '-' = isAdd ? '+' : '-';

  // 普通: 1-2 位小数; 困难/魔王: 2-3 位小数
  const dp1 = randInt(1, difficulty <= 5 ? 2 : 3);
  const dp2 = randInt(1, difficulty <= 5 ? 2 : 3);
  const f1 = Math.pow(10, dp1);
  const f2 = Math.pow(10, dp2);

  const aScaled = randInt(100, difficulty <= 5 ? 9999 : 99999);
  const bScaled = randInt(100, difficulty <= 5 ? 9999 : 99999);
  let a = aScaled / f1;
  let b = bScaled / f2;

  // 减法确保 a > b
  if (!isAdd && a < b) [a, b] = [b, a];
  // 确保减法结果为正
  if (!isAdd && a === b) a = a + 1 / f1;

  const maxDp = Math.max(dp1, dp2);
  const answer = isAdd ? a + b : a - b;
  const roundedAnswer = Math.round(answer * Math.pow(10, maxDp)) / Math.pow(10, maxDp);

  const expression = `${formatNum(a)} ${op} ${formatNum(b)}`;
  const aStr = a.toFixed(dp1);
  const bStr = b.toFixed(dp2);

  return {
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `列竖式计算: ${aStr} ${op} ${bStr}`,
    data: { kind: 'vertical-calc', operation: op, operands: [a, b], steps: [] },
    solution: {
      answer: formatNum(roundedAnswer),
      steps: [`小数点对齐，${dp1 !== dp2 ? '位数不同处补零，' : ''}逐位${isAdd ? '相加' : '相减'}`],
      explanation: `${aStr} ${op} ${bStr} = ${formatNum(roundedAnswer)}`,
    },
    hints: [isAdd ? '小数点对齐，从末位开始加，满十进一' : '小数点对齐，从末位开始减，不够减向前借一'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 5: 临时更新调度器测试路由**

在 `generateVerticalCalc` 调度器的 `difficulty <= 5` 分支中，在 `else` 的 division 返回之前，临时添加小数加减法路由：

找到普通档的 `} else {` 分支（约第 253 行，即 `return generateDivision(difficulty, id);` 之前）：

在 `if (r < 0.85)` 分支之后、`else` 分支之前，将 `} else {` 改为：

```typescript
    } else if (r < 0.90) {
      return generateDecimalAddSub(difficulty, id);
    } else {
```

这只是临时路由让测试能通过，Task 4 会完整重写调度器。

- [ ] **Step 6: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 2: 小数乘法 + 小数除法

**Files:**
- Modify: `src/engine/generators/vertical-calc.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript

describe('Vertical Calc - Decimal Mul (小数乘法)', () => {
  it('普通难度应生成小数乘法题', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decMul = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.expression && q.data.expression.includes('.') &&
      q.data.expression.includes('×')
    );
    expect(decMul.length).toBeGreaterThan(0);
  });

  it('小数乘法答案应为有效数字', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decMul = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.expression && q.data.expression.includes('.') &&
      q.data.expression.includes('×')
    );
    for (const q of decMul) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

describe('Vertical Calc - Decimal Div (小数除法)', () => {
  it('普通难度应生成小数除法题', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decDiv = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.expression && q.data.expression.includes('.') &&
      q.data.expression.includes('÷')
    );
    expect(decDiv.length).toBeGreaterThan(0);
  });

  it('困难/魔王应生成除数是小数的除法题', () => {
    const qs = genN(generateVerticalCalc, 7, 400);
    const decDivDecDivisor = qs.filter((q: any) => {
      if (q.type !== 'numeric-input' || !q.data.expression?.includes('÷')) return false;
      const parts = q.data.expression.split('÷').map((s: string) => s.trim());
      return parts.length === 2 && parts[1].includes('.');
    });
    expect(decDivDecDivisor.length).toBeGreaterThan(0);
  });

  it('小数除法答案应为有效数字', () => {
    const qs = genN(generateVerticalCalc, 5, 400);
    const decDiv = qs.filter((q: any) =>
      q.type === 'numeric-input' && q.prompt.includes('列竖式计算') &&
      q.data.expression && q.data.expression.includes('.') &&
      q.data.expression.includes('÷')
    );
    for (const q of decDiv) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 实现 generateDecimalMul**

在 `generateDecimalAddSub` 之后插入：

```typescript

// ===== 小数乘法 (numeric-input) =====
function generateDecimalMul(difficulty: number, id: string): Question {
  let a: number, b: number, answer: number, expression: string;

  if (difficulty <= 5) {
    // 普通: 小数 × 整数（如 4.12 × 3, 7.06 × 4）
    const dp = randInt(1, 2);
    const factor = Math.pow(10, dp);
    const aScaled = randInt(101, 9999);
    a = aScaled / factor;
    b = randInt(2, 9);
    const productScaled = aScaled * b;
    answer = productScaled / factor;
    expression = `${a.toFixed(dp)} × ${b}`;
  } else {
    // 困难/魔王: 小数 × 小数（如 3.06 × 0.54, 0.65 × 0.24）
    const dp1 = randInt(1, 2);
    const dp2 = randInt(1, 2);
    const f1 = Math.pow(10, dp1);
    const f2 = Math.pow(10, dp2);
    const aScaled = randInt(11, dp1 === 1 ? 999 : 9999);
    const bScaled = randInt(11, dp2 === 1 ? 99 : 999);
    a = aScaled / f1;
    b = bScaled / f2;
    const productScaled = aScaled * bScaled;
    const totalDp = dp1 + dp2;
    answer = productScaled / Math.pow(10, totalDp);
    expression = `${a.toFixed(dp1)} × ${b.toFixed(dp2)}`;
  }

  return {
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `列竖式计算: ${expression}`,
    data: { kind: 'vertical-calc', operation: '×', operands: [a, b], steps: [] },
    solution: {
      answer: formatNum(answer),
      steps: ['先按整数乘法计算', '再数两个因数共有几位小数，积就有几位小数'],
      explanation: `${expression} = ${formatNum(answer)}`,
    },
    hints: ['先忽略小数点按整数算，再数两个因数的小数位数之和'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 4: 实现 generateDecimalDiv**

在 `generateDecimalMul` 之后插入：

```typescript

// ===== 小数除法 (numeric-input) =====
function generateDecimalDiv(difficulty: number, id: string): Question {
  let dividend: number, divisor: number, quotient: number, expression: string;
  let steps: string[];

  if (difficulty <= 5) {
    // 普通: 小数 ÷ 整数（如 7.52 ÷ 2, 41.4 ÷ 23）
    const intDivisor = randInt(2, 9);
    // 确保整除: 先生成商，再算被除数
    const qDp = randInt(1, 2);
    const qFactor = Math.pow(10, qDp);
    const qScaled = randInt(11, 999);
    quotient = qScaled / qFactor;
    dividend = quotient * intDivisor;
    // 精确化: 使用整数运算避免浮点
    dividend = (qScaled * intDivisor) / qFactor;
    divisor = intDivisor;
    expression = `${formatNum(dividend)} ÷ ${divisor}`;
    steps = [`商的小数点与被除数的小数点对齐`, `${expression} = ${formatNum(quotient)}`];
  } else {
    // 困难/魔王: 除数是小数，需转化（如 4.65 ÷ 1.5 → 46.5 ÷ 15）
    const divisorDp = randInt(1, 2);
    const divisorFactor = Math.pow(10, divisorDp);
    const divisorScaled = randInt(11, divisorDp === 1 ? 99 : 999);
    divisor = divisorScaled / divisorFactor;

    // 确保整除
    const qScaled = randInt(11, 999);
    const qDp = randInt(0, 1);
    const qFactor = Math.pow(10, qDp);
    quotient = qScaled / qFactor;

    // 被除数 = 商 × 除数，用整数运算
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
  }

  return {
    id, topicId: 'vertical-calc', type: 'numeric-input', difficulty,
    prompt: `列竖式计算: ${expression}`,
    data: { kind: 'vertical-calc', operation: '÷', operands: [dividend, divisor], steps: [] },
    solution: {
      answer: formatNum(quotient),
      steps,
      explanation: `${expression} = ${formatNum(quotient)}`,
    },
    hints: [difficulty <= 5 ? '商的小数点要和被除数的小数点对齐' : '先把除数变成整数，被除数也同时乘相同的数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 5: 临时添加路由**

在调度器的各难度分支中临时添加小数乘法和除法的路由（类似 Task 1 Step 5 的方式，在现有分支中挤入少量概率），使测试能通过。具体做法：在普通档的 `generateDecimalAddSub` 路由之后，将剩余概率分给 `generateDecimalMul` 和 `generateDecimalDiv`。

将 Task 1 添加的临时路由：
```typescript
    } else if (r < 0.90) {
      return generateDecimalAddSub(difficulty, id);
    } else {
```
替换为：
```typescript
    } else if (r < 0.88) {
      return generateDecimalAddSub(difficulty, id);
    } else if (r < 0.93) {
      return generateDecimalMul(difficulty, id);
    } else if (r < 0.98) {
      return generateDecimalDiv(difficulty, id);
    } else {
```

对 Hard 和 Demon 分支也做类似的临时路由（在 division 返回之前插入小数路由）。

- [ ] **Step 6: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 3: 取近似值

**Files:**
- Modify: `src/engine/generators/vertical-calc.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript

describe('Vertical Calc - Approximate (取近似值)', () => {
  it('困难/魔王应生成取近似值题', () => {
    const qs = genN(generateVerticalCalc, 7, 500);
    const approxQs = qs.filter((q: any) =>
      q.prompt.includes('精确到') || q.prompt.includes('保留')
    );
    expect(approxQs.length).toBeGreaterThan(0);
  });

  it('取近似值答案应为有效数字', () => {
    const qs = genN(generateVerticalCalc, 7, 500);
    const approxQs = qs.filter((q: any) =>
      q.prompt.includes('精确到') || q.prompt.includes('保留')
    );
    for (const q of approxQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 实现 generateApproximate**

在 `generateDecimalDiv` 之后插入：

```typescript

// ===== 取近似值: 竖式计算后四舍五入 (numeric-input) =====
function generateApproximate(difficulty: number, id: string): Question {
  // 生成一个小数乘法或除法，结果需要四舍五入
  const isMul = Math.random() < 0.5;
  const places = difficulty <= 7 ? 2 : 1; // 精确到百分位 or 十分位
  const placeText = places === 2 ? '百分位' : '十分位';

  let a: number, b: number, exactAnswer: number, expression: string, opChar: '×' | '÷';

  if (isMul) {
    // 小数 × 小数，积有 3-4 位小数，需四舍五入
    const dp1 = 2, dp2 = 2;
    const aScaled = randInt(101, 999);
    const bScaled = randInt(11, 99);
    a = aScaled / 100;
    b = bScaled / 100;
    exactAnswer = (aScaled * bScaled) / 10000;
    opChar = '×';
    expression = `${a.toFixed(dp1)} × ${b.toFixed(dp2)}`;
  } else {
    // 小数 ÷ 小数，商不整除
    // 先用整数除法确保不整除
    const divisorScaled = randInt(11, 99);
    const dividendScaled = randInt(100, 9999);
    // 确保不整除
    const remainder = dividendScaled % divisorScaled;
    const actualDividendScaled = remainder === 0 ? dividendScaled + 1 : dividendScaled;
    a = actualDividendScaled / 100;
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
```

- [ ] **Step 4: 临时添加路由**

在 Hard/Demon 调度分支中添加 approximate 的临时路由。

- [ ] **Step 5: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 4: 重写调度器 — 三档概率分发

**Files:**
- Modify: `src/engine/generators/vertical-calc.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写调度器分布测试**

在 `generators.test.ts` 末尾追加：

```typescript

describe('Vertical Calc - Dispatcher Distribution (调度器分布)', () => {
  it('普通难度整数与小数题应各约一半', () => {
    const qs = genN(generateVerticalCalc, 5, 1000);
    const intQs = qs.filter((q: any) => q.type === 'vertical-fill');
    const decQs = qs.filter((q: any) => q.type === 'numeric-input');
    // 整数 vertical-fill 应在 40%-60% (目标50%)
    const intPct = intQs.length / qs.length;
    expect(intPct).toBeGreaterThan(0.35);
    expect(intPct).toBeLessThan(0.65);
  });

  it('困难/魔王整数题应约 30%', () => {
    const qs = genN(generateVerticalCalc, 7, 1000);
    const intVf = qs.filter((q: any) => q.type === 'vertical-fill');
    // 只有加减法 vertical-fill 是整数 (10%)，加上整数乘除 numeric-input (20%)
    // vertical-fill 大约 10%
    expect(intVf.length / qs.length).toBeLessThan(0.20);
  });

  it('所有题目应有有效答案', () => {
    for (const d of [5, 7, 10]) {
      const qs = genN(generateVerticalCalc, d, 300);
      for (const q of qs) {
        if (q.type === 'numeric-input') {
          const ans = String(q.solution.answer);
          expect(isNaN(Number(ans))).toBe(false);
        }
      }
    }
  });
});
```

- [ ] **Step 2: 完整重写 generateVerticalCalc 调度器**

将 `export function generateVerticalCalc` 整个函数（约第 234-315 行）替换为：

```typescript
export function generateVerticalCalc(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  if (difficulty <= 5) {
    // 普通: 整数 50% (加15% 减15% 乘10% 除10%) | 小数 50% (加减25% 乘15% 除10%)
    const r = Math.random();
    if (r < 0.15) {
      // 整数加法 vertical-fill
      const a = randInt(100, 999); const b = randInt(100, 999);
      return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
        prompt: `用竖式计算: ${a} + ${b}`,
        data: { kind: 'vertical-calc', operation: '+' as const, operands: [a, b], steps: generateAdditionSteps(a, b, difficulty) },
        solution: { answer: a + b, explanation: `${a} + ${b} = ${a + b}` },
        hints: ['从个位开始，逐位相加，满十进一'], xpBase: 10 + (difficulty - 1) * 5,
      };
    }
    if (r < 0.30) {
      // 整数减法 vertical-fill
      const a = randInt(100, 999); const b = randInt(100, a);
      return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
        prompt: `用竖式计算: ${a} - ${b}`,
        data: { kind: 'vertical-calc', operation: '-' as const, operands: [a, b], steps: generateSubtractionSteps(a, b, difficulty) },
        solution: { answer: a - b, explanation: `${a} - ${b} = ${a - b}` },
        hints: ['从个位开始，逐位相减，不够减向前借一'], xpBase: 10 + (difficulty - 1) * 5,
      };
    }
    if (r < 0.40) {
      // 整数乘法 vertical-fill
      const a = randInt(10, 99); const b = randInt(2, 9);
      return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
        prompt: `用竖式计算: ${a} × ${b}`,
        data: { kind: 'vertical-calc', operation: '×' as const, operands: [a, b], steps: generateMultiplicationSteps(a, b, difficulty) },
        solution: { answer: a * b, explanation: `${a} × ${b} = ${a * b}` },
        hints: ['从个位开始，逐位相乘'], xpBase: 10 + (difficulty - 1) * 5,
      };
    }
    if (r < 0.50) return generateDivision(difficulty, id);          // 整数除法 10%
    if (r < 0.75) return generateDecimalAddSub(difficulty, id);     // 小数加减 25%
    if (r < 0.90) return generateDecimalMul(difficulty, id);        // 小数乘法 15%
    return generateDecimalDiv(difficulty, id);                       // 小数除法 10%
  }

  if (difficulty <= 7) {
    // 困难: 整数 30% (加5% 减5% 乘10% 除10%) | 小数 70% (加减30% 乘15% 除15% 近似10%)
    const r = Math.random();
    if (r < 0.05) {
      const a = randInt(1000, 9999); const b = randInt(1000, 9999);
      return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
        prompt: `用竖式计算: ${a} + ${b}`,
        data: { kind: 'vertical-calc', operation: '+' as const, operands: [a, b], steps: generateAdditionSteps(a, b, difficulty) },
        solution: { answer: a + b, explanation: `${a} + ${b} = ${a + b}` },
        hints: ['从个位开始，逐位相加'], xpBase: 10 + (difficulty - 1) * 5,
      };
    }
    if (r < 0.10) {
      const a = randInt(1000, 9999); const b = randInt(1000, a);
      return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
        prompt: `用竖式计算: ${a} - ${b}`,
        data: { kind: 'vertical-calc', operation: '-' as const, operands: [a, b], steps: generateSubtractionSteps(a, b, difficulty) },
        solution: { answer: a - b, explanation: `${a} - ${b} = ${a - b}` },
        hints: ['从个位开始，逐位相减'], xpBase: 10 + (difficulty - 1) * 5,
      };
    }
    if (r < 0.20) return generateMultiDigitMult(difficulty, id);    // 整数乘法(多位) 10%
    if (r < 0.30) return generateDivision(difficulty, id);          // 整数除法 10%
    if (r < 0.60) return generateDecimalAddSub(difficulty, id);     // 小数加减 30%
    if (r < 0.75) return generateDecimalMul(difficulty, id);        // 小数乘法 15%
    if (r < 0.90) return generateDecimalDiv(difficulty, id);        // 小数除法 15%
    return generateApproximate(difficulty, id);                      // 取近似值 10%
  }

  // 魔王: 整数 30% (加5% 减5% 乘10% 除10%) | 小数 70% (加减20% 乘20% 除20% 近似10%)
  const r = Math.random();
  if (r < 0.05) {
    const a = randInt(10000, 99999); const b = randInt(10000, 99999);
    return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
      prompt: `用竖式计算: ${a} + ${b}`,
      data: { kind: 'vertical-calc', operation: '+' as const, operands: [a, b], steps: generateAdditionSteps(a, b, difficulty) },
      solution: { answer: a + b, explanation: `${a} + ${b} = ${a + b}` },
      hints: ['从个位开始，逐位相加'], xpBase: 10 + (difficulty - 1) * 5,
    };
  }
  if (r < 0.10) {
    const a = randInt(10000, 99999); const b = randInt(10000, a);
    return { id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
      prompt: `用竖式计算: ${a} - ${b}`,
      data: { kind: 'vertical-calc', operation: '-' as const, operands: [a, b], steps: generateSubtractionSteps(a, b, difficulty) },
      solution: { answer: a - b, explanation: `${a} - ${b} = ${a - b}` },
      hints: ['从个位开始，逐位相减'], xpBase: 10 + (difficulty - 1) * 5,
    };
  }
  if (r < 0.20) return generateMultiDigitMult(difficulty, id);    // 整数乘法(多位) 10%
  if (r < 0.30) return generateDivision(difficulty, id);          // 整数除法 10%
  if (r < 0.50) return generateDecimalAddSub(difficulty, id);     // 小数加减 20%
  if (r < 0.70) return generateDecimalMul(difficulty, id);        // 小数乘法 20%
  if (r < 0.90) return generateDecimalDiv(difficulty, id);        // 小数除法 20%
  return generateApproximate(difficulty, id);                      // 取近似值 10%
}
```

- [ ] **Step 3: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 5: 端到端验证

- [ ] **Step 1: 运行全部测试**

Run: `cd math-quest && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 2: 运行构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 3: 手动验证**

Run: `cd math-quest && npm run dev`

在浏览器中验证：
1. "竖式笔算"普通模式做 20 题 → 约一半是整数 vertical-fill，一半是小数 numeric-input
2. "竖式笔算"困难模式做 20 题 → 约 70% 小数题，含除数是小数的除法
3. "竖式笔算"魔王模式做 10 题 → 含取近似值题（"精确到百分位"）
4. 小数题的 prompt 都以"列竖式计算"开头
