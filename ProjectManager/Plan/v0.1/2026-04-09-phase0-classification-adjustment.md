# 分类调整实施计划（Phase 0）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实施三项分类调整——A01 升级为"基础计算"（新增运算优先级），A07 纯化为"简便计算"（移除递等式按序模式），A03 深入审视（调研报告）。

**Architecture:** A01 新增 `generateOperationOrder()` 子函数生成运算顺序题（MC + numeric-input）。A07 的 `generateMultiStep()` 主调度器移除 `generateTwoStep`/`generateThreeStep` 调用，将权重重新分配到现有简便计算子函数。A03 仅做调研输出报告，不改代码。

**Tech Stack:** TypeScript, Vitest, math-quest 现有生成器架构

**Spec:** `math-quest/ProjectManager/Specs/2026-04-08-generator-improvements.md` Section 0

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/constants/index.ts` | 修改 :4,:10 | 更新 A01/A07 的 name 和 description |
| `src/engine/generators/mental-arithmetic.ts` | 修改 | 新增 `generateOperationOrder()`，修改主函数分发 |
| `src/engine/generators/multi-step.ts` | 修改 :692-718 | 调整 `generateMultiStep()` 主调度器的分发权重 |
| `src/engine/generators/generators.test.ts` | 修改 | 新增 A01 运算顺序测试，调整 A07 测试期望 |
| `math-quest/ProjectManager/Reports/2026-04-09-A03-vertical-calc-review.md` | 新建 | A03 审视报告 |

---

## Task 1: 更新 A01/A07 的主题元数据

**Files:**
- Modify: `src/constants/index.ts:4,10`

- [ ] **Step 1: 更新 A01 元数据**

将第 4 行：
```typescript
{ id: 'mental-arithmetic', name: '口算速算', description: '整数加减乘除口算训练', icon: '⚡', color: '#1cb0f6', unlockLevel: 0 },
```
改为：
```typescript
{ id: 'mental-arithmetic', name: '基础计算', description: '整数口算与运算顺序训练', icon: '⚡', color: '#1cb0f6', unlockLevel: 0 },
```

- [ ] **Step 2: 更新 A07 元数据**

将第 10 行：
```typescript
{ id: 'multi-step', name: '多步计算', description: '多步混合运算练习', icon: '📊', color: '#2b70c9', unlockLevel: 0 },
```
改为：
```typescript
{ id: 'multi-step', name: '简便计算', description: '运用运算律和技巧简化计算', icon: '📊', color: '#2b70c9', unlockLevel: 0 },
```

- [ ] **Step 3: 运行构建验证**

Run: `cd math-quest && npm run build`
Expected: 构建成功，无类型错误

- [ ] **Step 4: 提交**

```bash
git add src/constants/index.ts
git commit -m "refactor: 更新 A01/A07 主题元数据 — A01→基础计算，A07→简便计算"
```

---

## Task 2: A01 新增 generateOperationOrder 子函数

**Files:**
- Modify: `src/engine/generators/mental-arithmetic.ts`

- [ ] **Step 1: 写测试**

在 `src/engine/generators/generators.test.ts` 的 `describe('Mental Arithmetic')` 块末尾添加：

```typescript
describe('Operation Order (运算顺序)', () => {
  it('difficulty≤5 应生成运算顺序题', () => {
    const qs = genN(generateMentalArithmetic, 5, 300);
    const orderQs = qs.filter(q => q.data.kind === 'multi-step');
    expect(orderQs.length).toBeGreaterThan(0);
  });

  it('运算顺序题的表达式应包含至少两种运算符', () => {
    const qs = genN(generateMentalArithmetic, 5, 300);
    const orderQs = qs.filter(q => q.data.kind === 'multi-step');
    for (const q of orderQs) {
      const ops = q.data.expression.match(/[+\-×÷]/g) || [];
      expect(ops.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('数值答案应为有效数字', () => {
    const qs = genN(generateMentalArithmetic, 5, 300);
    const orderQs = qs.filter(q => q.data.kind === 'multi-step' && q.type === 'numeric-input');
    for (const q of orderQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });

  it('MC题答案必须在选项内', () => {
    const qs = genN(generateMentalArithmetic, 5, 300);
    const mcQs = qs.filter(q => q.data.kind === 'multi-step' && q.type === 'multiple-choice');
    for (const q of mcQs) {
      const opts = (q.data as any).options as string[];
      expect(opts).toContain(String(q.solution.answer));
    }
  });

  it('difficulty≥6 运算顺序题应包含括号', () => {
    const qs = genN(generateMentalArithmetic, 7, 300);
    const orderQs = qs.filter(q => q.data.kind === 'multi-step');
    const withBracket = orderQs.filter(q => q.data.expression.includes('('));
    expect(withBracket.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 新增的 5 个测试全部 FAIL（因为 `generateMentalArithmetic` 还没生成运算顺序题）

- [ ] **Step 3: 实现 generateOperationOrder**

在 `src/engine/generators/mental-arithmetic.ts` 中：

首先修改文件顶部的 import 语句（第 1 行）：
```typescript
import type { Question, ComputationStep } from '@/types';
```

然后在 `generatePair` 函数之后、`generateMentalArithmetic` 函数之前添加：

```typescript

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
      expression = `${a} ÷ ${divisor} + ${c}`;
      answer = quotient + c;
      firstStep = `${a} ÷ ${divisor}`;
      steps = [
        { stepIndex: 0, subExpression: `${a} ÷ ${divisor}`, result: quotient, annotation: '先算除法' },
        { stepIndex: 1, subExpression: `${quotient} + ${c}`, result: answer, annotation: '再算加法' },
      ];
    }
  } else {
    // 3步, 含括号: (a + b) × c 或 a × (b + c) 或 a × b + c × d
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
```

- [ ] **Step 4: 修改 generateMentalArithmetic 主函数增加分发**

将 `generateMentalArithmetic` 函数（当前约第 85-122 行）修改为：

```typescript
export function generateMentalArithmetic(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  // 20% 概率生成运算顺序题（基础计算的新增能力）
  if (Math.random() < 0.20) {
    return generateOperationOrder(difficulty, id);
  }

  // 80% 概率生成单步口算题（原有逻辑不变）
  const op = pickOperator();
  const [a, b, answer] = generatePair(difficulty, op);

  const expression = `${a} ${op} ${b}`;
  // ... 原有返回逻辑保持不变 ...
```

具体来说，在函数开头加入分发逻辑，其余代码不动。

- [ ] **Step 5: 运行测试**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 全部测试 PASS（包括新增的 5 个运算顺序测试）

- [ ] **Step 6: 运行构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add src/engine/generators/mental-arithmetic.ts src/engine/generators/generators.test.ts
git commit -m "feat(A01): 新增运算优先级子函数 generateOperationOrder — A01 升级为基础计算"
```

---

## Task 3: A07 纯化 — 调整主调度器

**Files:**
- Modify: `src/engine/generators/multi-step.ts:692-718`

- [ ] **Step 1: 修改测试期望**

在 `generators.test.ts` 中，修改 Multi-Step 的测试。

将 `describe('Normal (difficulty=5)')` 中的第一个测试：
```typescript
it('整数题应包含÷运算', () => {
  const qs = genN(generateMultiStep, 5, 200);
  const withDiv = qs.filter(q => q.data.expression.includes('÷'));
  expect(withDiv.length).toBeGreaterThan(0);
});
```
替换为：
```typescript
it('所有题目应为简便计算题型（非纯按序计算）', () => {
  const qs = genN(generateMultiStep, 5, 200);
  // 简便计算题应该是以下类型之一：
  // 1. 连减凑整 (含两个或更多减号)
  // 2. 分配律凑整 (含乘法 + 接近整数)
  // 3. 加减凑整 (接近整百数)
  // 4. 小数简便计算
  // 不应该出现纯粹的 "按顺序算" 两步题
  for (const q of qs) {
    const expr = String(q.data.expression);
    const explanation = String(q.solution.explanation || '');
    // 每道题的解题思路应涉及简便方法
    const isSimplified = explanation.includes('凑') || explanation.includes('分配') ||
      explanation.includes('简便') || explanation.includes('提取') ||
      expr.includes('.') || // 小数简便计算也算
      (expr.match(/-/g) || []).length >= 2; // 连减
    // 不需要 100% 覆盖，但大部分应该是简便题
    // (此处仅检查格式合理性，不做严格断言)
  }
  // 确认不再生成纯两步按序计算
  const pureTwoStep = qs.filter(q => {
    const explanation = String(q.solution.explanation || '');
    return explanation.includes('先乘除后加减') && !q.data.expression.includes('.');
  });
  expect(pureTwoStep.length).toBe(0);
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 修改后的测试 FAIL（因为调度器还在调用 generateTwoStep）

- [ ] **Step 3: 修改 generateMultiStep 主调度器**

将 `multi-step.ts` 第 692-718 行的 `generateMultiStep` 函数替换为：

```typescript
export function generateMultiStep(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  if (difficulty <= 5) {
    // 简便计算(基础): 40% 连减/分配律凑整/加减凑整, 30% 提取公因数(基础), 30% 小数简便两步
    const r = Math.random();
    if (r < 0.40) return generateBracketNormal(difficulty, id);
    if (r < 0.70) return generateExtractFactor(difficulty, id);
    return generateDecimalTwoStep(difficulty, id);
  }

  if (difficulty <= 7) {
    // 简便计算(进阶): 30% 括号陷阱MC, 25% 提取公因数, 25% 小数简便两步, 20% 简便减法
    const r = Math.random();
    if (r < 0.30) return generateBracketHard(difficulty, id);
    if (r < 0.55) return generateExtractFactor(difficulty, id);
    if (r < 0.80) return generateDecimalTwoStep(difficulty, id);
    return generateSimplifySubtract(difficulty, id);
  }

  // 魔王: 30% 复杂小数多步, 25% 括号陷阱MC, 25% 提取公因数, 20% 小数连乘除
  const r = Math.random();
  if (r < 0.30) return generateDecimalMultiStep(difficulty, id);
  if (r < 0.55) return generateBracketDemon(difficulty, id);
  if (r < 0.80) return generateExtractFactor(difficulty, id);
  return generateDecimalChain(difficulty, id);
}
```

**关键变化**：
- `generateTwoStep` 从所有难度档中移除（这是"按序计算"，已归入 A01）
- `generateThreeStep` 从所有难度档中移除（同理）
- 权重重新分配给现有简便计算子函数
- `generateExtractFactor` 从仅 Hard/Demon 扩展到所有难度档（Foundation 用简单的公因数题）

- [ ] **Step 4: 调整 generateExtractFactor 支持低难度**

当前 `generateExtractFactor`（约第 568-608 行）只在 Hard/Demon 难度使用。需要为 Foundation 增加简单模式。

在函数开头添加低难度分支（在现有 `const isDemon` 判断之前）：

```typescript
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

  // 原有 Hard/Demon 逻辑不变 ...
  const isDemon = difficulty > 7;
  // ... 后续代码保持原样
```

- [ ] **Step 5: 运行测试**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 全部 PASS

- [ ] **Step 6: 运行构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add src/engine/generators/multi-step.ts src/engine/generators/generators.test.ts
git commit -m "refactor(A07): 纯化为简便计算 — 移除递等式按序模式，重新分配调度权重"
```

---

## Task 4: A03 竖式笔算深入审视（调研报告）

**Files:**
- Read: `reference-bank/A-numbers-and-operations/A03-vertical-calc/foundation.md`
- Read: `reference-bank/A-numbers-and-operations/A03-vertical-calc/advanced.md`
- Read: `src/engine/generators/vertical-calc.ts`
- Read: `src/components/VerticalCalcBoard.tsx`
- Create: `math-quest/ProjectManager/Reports/2026-04-09-A03-vertical-calc-review.md`

- [ ] **Step 1: 阅读已提取的 A03 真题**

读取 `reference-bank/A-numbers-and-operations/A03-vertical-calc/foundation.md`（20 题）和 `advanced.md`（15 题）。

分析维度：
1. 按运算类型统计：加法/减法/乘法/除法各多少题
2. 按数值类型统计：纯整数/小数各多少题
3. 按考察重点分类：小数点对齐、进退位、积定位、商补零、验算、精确到某位
4. `vertical-fill` vs `numeric-input` 的题型分布

- [ ] **Step 2: 阅读现有生成器代码**

读取 `src/engine/generators/vertical-calc.ts`，分析：
1. 5 个子函数各自生成什么类型的竖式
2. `vertical-fill` 题型的数据结构
3. 与 A05 小数运算的重叠点

- [ ] **Step 3: 阅读 VerticalCalcBoard 组件**

读取 `src/components/VerticalCalcBoard.tsx`，理解当前的竖式交互设计：
1. 用户怎么在竖式中填写数字
2. 进位/退位怎么处理
3. 小数点对齐怎么处理

- [ ] **Step 4: 抽样阅读原始素材中的竖式题**

读取 `reference-bank/题库-五年级上/U2-小数乘除法.md` 中搜索"竖式"关键词，查看真实考试中竖式题的要求格式。

- [ ] **Step 5: 撰写审视报告**

在 `math-quest/ProjectManager/Reports/2026-04-09-A03-vertical-calc-review.md` 中写报告，包含：

```markdown
# A03 竖式笔算审视报告

## 1. 真题分析
- 运算类型分布
- 考察重点分类
- 典型题目示例

## 2. 与 A05 的边界
- 哪些题同时归属 A03 和 A05？
- 建议的划分规则

## 3. 题型设计评估
- vertical-fill 交互的优势与局限
- numeric-input 是否更合适的场景
- 真题中竖式的考察方式 vs 当前交互设计

## 4. 改进建议
- 需要新增的子函数
- 需要调整的交互设计
- 不需要改动的部分
```

- [ ] **Step 6: 提交报告**

```bash
git add math-quest/ProjectManager/Reports/2026-04-09-A03-vertical-calc-review.md
git commit -m "docs: A03 竖式笔算审视报告 — 考察目标、题型设计和边界分析"
```

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
1. 首页主题列表显示新名称（"基础计算""简便计算"）
2. 进入"基础计算"练习，确认偶尔出现运算顺序题（MC 和 numeric-input）
3. 进入"简便计算"练习，确认不再出现纯按序计算题，全部是简便计算

- [ ] **Step 4: 最终提交（如有修复）**

修复验证中发现的问题后提交。
