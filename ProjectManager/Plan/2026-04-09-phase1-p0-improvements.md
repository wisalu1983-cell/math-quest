# Phase 1: P0 高频考点改进实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 填补 5 个生成器的 P0 高频考点盲区——A05 大小比较 + 循环小数除法、A08 含括号方程 + 除法方程、A02 大小比较判断。

**Architecture:** 每个生成器新增 1-2 个子函数，接入现有主调度器的概率分发；类型定义新增 `'compare'` 子类型和可选 `options` 字段；所有新函数遵循现有 `(id, difficulty)` 或 `(difficulty, id)` 参数约定。

**Tech Stack:** TypeScript, Vitest, math-quest 现有生成器架构

**Spec:** `math-quest/docs/specs/2026-04-08-generator-improvements.md` Section 1-3

**前置决策:**
- A03/A05 划分规则已确认：A03 不涉及循环小数，循环小数完全归 A05
- A03 聚焦竖式过程训练（vertical-fill），A05 聚焦结果导向（numeric-input / MC）

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/types/index.ts:105-109` | 修改 | DecimalOpsData 新增 `'compare'` subtype + `options` 字段 |
| `src/types/index.ts:59-65` | 修改 | NumberSenseData 新增 `'compare'` subtype |
| `src/engine/generators/decimal-ops.ts` | 修改 | 新增 `generateCompareSize()` + `generateCyclicDivision()`，更新调度器 |
| `src/engine/generators/equation-transpose.ts` | 修改 | 新增 `generateBracketEquation()` + `generateDivisionEquation()`，更新调度器 |
| `src/engine/generators/number-sense.ts` | 修改 | 新增 `generateCompare()`，更新调度器 |
| `src/engine/generators/generators.test.ts` | 修改 | 新增 5 组测试（A05×2, A08×2, A02×1），新增 import |

---

## Task 1: 类型扩展

**Files:**
- Modify: `src/types/index.ts:59-65,105-109`

- [ ] **Step 1: 更新 DecimalOpsData**

将第 105-109 行：
```typescript
export interface DecimalOpsData {
  kind: 'decimal-ops';
  expression: string;
  subtype: 'add-sub' | 'mul' | 'div' | 'shift';
}
```
替换为：
```typescript
export interface DecimalOpsData {
  kind: 'decimal-ops';
  expression: string;
  subtype: 'add-sub' | 'mul' | 'div' | 'shift' | 'compare';
  options?: string[];
}
```

- [ ] **Step 2: 更新 NumberSenseData**

将第 59-65 行：
```typescript
export interface NumberSenseData {
  kind: 'number-sense';
  subtype: 'estimate' | 'round';
  options?: string[];
  expressions?: string[];
  acceptedAnswers?: number[];
}
```
替换为：
```typescript
export interface NumberSenseData {
  kind: 'number-sense';
  subtype: 'estimate' | 'round' | 'compare';
  options?: string[];
  expressions?: string[];
  acceptedAnswers?: number[];
}
```

- [ ] **Step 3: 构建验证**

Run: `cd math-quest && npm run build`
Expected: 构建成功，无类型错误

- [ ] **Step 4: 提交**

```bash
git add src/types/index.ts
git commit -m "types: 扩展 DecimalOpsData 和 NumberSenseData 类型以支持 Phase 1 新题型"
```

---

## Task 2: A05 新增大小比较 generateCompareSize

**Files:**
- Modify: `src/engine/generators/decimal-ops.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾（第 472 行 `});` 之后）添加：

```typescript
import { generateDecimalOps } from './decimal-ops';
// 注意: 此 import 已存在于第 5 行，无需重复添加。此处仅标注依赖关系。

// ==================== Decimal Ops - Compare Size ====================
describe('Decimal Ops - Compare Size (大小比较)', () => {
  it('应在 difficulty≤5 时生成大小比较题', () => {
    const qs = genN(generateDecimalOps, 5, 300);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    expect(compareQs.length).toBeGreaterThan(0);
  });

  it('大小比较题应为 multiple-choice 类型', () => {
    const qs = genN(generateDecimalOps, 5, 300);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('答案必须是 >、< 或 = 之一', () => {
    const qs = genN(generateDecimalOps, 5, 500);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(['>', '<', '=']).toContain(String(q.solution.answer));
    }
  });

  it('选项必须包含 >、< 和 =', () => {
    const qs = genN(generateDecimalOps, 5, 300);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      const opts = q.data.options as string[];
      expect(opts).toContain('>');
      expect(opts).toContain('<');
      expect(opts).toContain('=');
      expect(opts.length).toBe(3);
    }
  });

  it('三种答案应都能出现', () => {
    const qs = genN(generateDecimalOps, 5, 600);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    const answers = new Set(compareQs.map((q: any) => String(q.solution.answer)));
    expect(answers.has('>')).toBe(true);
    expect(answers.has('<')).toBe(true);
    expect(answers.has('=')).toBe(true);
  });
});
```

实际位置：在 `generators.test.ts` 文件末尾（最后一个 `});` 之后）追加上述代码。

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 新增的 5 个大小比较测试 FAIL（因为调度器还没有生成 compare 题）

- [ ] **Step 3: 实现 generateCompareSize**

在 `decimal-ops.ts` 第 309 行（`// ===== Main generator =====` 之前）插入：

```typescript
// ===== Compare Size (大小比较) =====

function generateCompareSize(id: string, difficulty: number): Question {
  const isMultiply = Math.random() < 0.5;
  const op = isMultiply ? '×' : '÷';

  // 基数: difficulty≤5 用一位小数, 6+ 用两位小数
  const a = difficulty <= 5
    ? Number((randInt(11, 99) / 10).toFixed(1))
    : Number((randInt(101, 999) / 100).toFixed(2));

  // 因子 b: 1/3 概率 >1, 1/3 概率 <1, 1/3 概率 =1
  const bType = randInt(0, 2);
  let b: number;
  if (bType === 0) {
    b = Number((randInt(11, 25) / 10).toFixed(1)); // 1.1 ~ 2.5
  } else if (bType === 1) {
    b = Number((randInt(1, 9) / 10).toFixed(1));   // 0.1 ~ 0.9
  } else {
    b = 1;
  }

  // 判断正确答案
  let answer: string;
  if (isMultiply) {
    answer = b > 1 ? '>' : b < 1 ? '<' : '=';
  } else {
    answer = b > 1 ? '<' : b < 1 ? '>' : '=';
  }

  const expression = `${formatNum(a)} ${op} ${formatNum(b)}`;
  const comparison = `${expression} ○ ${formatNum(a)}`;

  // 解题思路
  const ruleText = isMultiply
    ? (b > 1 ? '乘以大于1的数，积大于原数' : b < 1 ? '乘以小于1的数，积小于原数' : '乘以1，积等于原数')
    : (b > 1 ? '除以大于1的数，商小于原数' : b < 1 ? '除以小于1的数，商大于原数' : '除以1，商等于原数');

  return {
    id, topicId: 'decimal-ops', type: 'multiple-choice', difficulty,
    prompt: `比较大小: ${comparison}，○ 里应填什么？`,
    data: { kind: 'decimal-ops', expression: comparison, subtype: 'compare', options: ['>', '<', '='] },
    solution: { answer, explanation: ruleText },
    hints: ['想一想：乘以（除以）的那个数比 1 大还是小？'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 4: 更新 generateDecimalOps 调度器**

将第 312-336 行的 `generateDecimalOps` 函数替换为：

```typescript
export function generateDecimalOps(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  if (difficulty <= 5) {
    // Normal: 30% add/sub, 30% decimal×integer, 25% decimal÷integer, 15% compare
    const r = Math.random();
    if (r < 0.30) return generateNormalAddSub(id, difficulty);
    if (r < 0.60) return generateNormalMulInt(id, difficulty);
    if (r < 0.85) return generateNormalDivInt(id, difficulty);
    return generateCompareSize(id, difficulty);
  }

  if (difficulty <= 7) {
    // Hard: 25% mul×decimal, 25% div÷decimal, 15% mixed add/sub, 10% shift, 10% trap, 10% compare, 5% cyclic
    const r = Math.random();
    if (r < 0.25) return generateHardMulDecimal(id, difficulty);
    if (r < 0.50) return generateHardDivDecimal(id, difficulty);
    if (r < 0.65) return generateHardMixedAddSub(id, difficulty);
    if (r < 0.75) return generateHardShift(id, difficulty);
    if (r < 0.85) return generateHardTrap(id, difficulty);
    return generateCompareSize(id, difficulty);
  }

  // Demon: 40% complex mul, 35% complex div, 15% compare, 10% cyclic
  const r = Math.random();
  if (r < 0.40) return generateDemonMulDecimal(id, difficulty);
  if (r < 0.75) return generateDemonDivDecimal(id, difficulty);
  return generateCompareSize(id, difficulty);
}
```

注意: 此版本暂不包含 cyclicDivision 的调用（Task 3 会再次更新调度器加入它）。

- [ ] **Step 5: 运行测试**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 全部 PASS（包括新增的大小比较测试）

- [ ] **Step 6: 构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add src/engine/generators/decimal-ops.ts src/engine/generators/generators.test.ts
git commit -m "feat(A05): 新增大小比较子函数 generateCompareSize — 乘除以大于/小于1的数"
```

---

## Task 3: A05 新增循环小数除法 generateCyclicDivision

**Files:**
- Modify: `src/engine/generators/decimal-ops.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript
// ==================== Decimal Ops - Cyclic Division ====================
describe('Decimal Ops - Cyclic Division (循环小数除法)', () => {
  it('应在 difficulty≥6 时生成循环小数除法题', () => {
    const qs = genN(generateDecimalOps, 7, 400);
    const cyclicQs = qs.filter((q: any) =>
      q.prompt.includes('保留') && q.data.subtype === 'div'
    );
    expect(cyclicQs.length).toBeGreaterThan(0);
  });

  it('循环小数除法题应为 numeric-input 类型', () => {
    const qs = genN(generateDecimalOps, 7, 400);
    const cyclicQs = qs.filter((q: any) =>
      q.prompt.includes('保留') && q.data.subtype === 'div'
    );
    for (const q of cyclicQs) {
      expect(q.type).toBe('numeric-input');
    }
  });

  it('答案应为有效数字', () => {
    const qs = genN(generateDecimalOps, 7, 400);
    const cyclicQs = qs.filter((q: any) =>
      q.prompt.includes('保留') && q.data.subtype === 'div'
    );
    for (const q of cyclicQs) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });

  it('商除不尽（不是精确整除）', () => {
    const qs = genN(generateDecimalOps, 7, 400);
    const cyclicQs = qs.filter((q: any) =>
      q.prompt.includes('保留') && q.data.subtype === 'div'
    );
    for (const q of cyclicQs) {
      // 表达式形如 "a ÷ b"
      const parts = q.data.expression.split('÷').map((s: string) => s.trim());
      const dividend = Number(parts[0]);
      const divisor = Number(parts[1]);
      // 验证商不是有限小数（精度内）
      const exactQ = dividend / divisor;
      const asStr = exactQ.toFixed(10);
      // 如果是有限小数，toFixed(10)末尾会全是0
      const trimmed = asStr.replace(/0+$/, '');
      // 循环小数在 toFixed(10) 后不会全是零结尾（允许浮点误差）
      expect(trimmed.length).toBeGreaterThan(3);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 新增的循环小数测试 FAIL

- [ ] **Step 3: 实现 generateCyclicDivision**

在 `decimal-ops.ts` 中，`generateCompareSize` 函数之后、`// ===== Main generator =====` 之前插入：

```typescript
// ===== Cyclic Division (循环小数除法) =====

function generateCyclicDivision(id: string, difficulty: number): Question {
  // 选择能产生循环小数的除数
  const divisorPool = difficulty <= 7 ? [3, 6, 9] : [3, 6, 7, 9, 11];
  const divisor = divisorPool[randInt(0, divisorPool.length - 1)];

  // 生成被除数（确保不能整除）
  const maxDividend = difficulty <= 7 ? 30 : 80;
  let dividend = randInt(1, maxDividend);
  while (dividend % divisor === 0) {
    dividend = randInt(1, maxDividend);
  }

  // 高难度时让被除数或除数带小数
  let displayDividend: number = dividend;
  let displayDivisor: number = divisor;
  if (difficulty >= 8 && Math.random() < 0.5) {
    // 例: 27÷6 → 2.7÷0.6（同除以10，商不变）
    displayDividend = Number((dividend / 10).toFixed(1));
    displayDivisor = Number((divisor / 10).toFixed(1));
  }

  // 保留位数: difficulty≤7 保留一位, 8+ 保留两位
  const places = difficulty <= 7 ? 1 : 2;
  const quotient = displayDividend / displayDivisor;
  const rounded = Number(quotient.toFixed(places));

  const placeText = places === 1 ? '一' : '两';
  const expression = `${formatNum(displayDividend)} ÷ ${formatNum(displayDivisor)}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}（商保留${placeText}位小数）`,
    data: { kind: 'decimal-ops', expression, subtype: 'div' },
    solution: {
      answer: formatNum(rounded),
      steps: [
        `${expression} = ${quotient.toFixed(places + 2)}…`,
        `四舍五入保留${placeText}位小数 ≈ ${formatNum(rounded)}`,
      ],
      explanation: `商是除不尽的（循环小数），需要四舍五入到${placeText}位小数`,
    },
    hints: ['这道除法除不尽，注意四舍五入'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 4: 更新 generateDecimalOps 调度器（加入 cyclicDivision）**

将调度器替换为最终版本：

```typescript
export function generateDecimalOps(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  if (difficulty <= 5) {
    // Normal: 30% add/sub, 30% mul×int, 25% div÷int, 15% compare
    const r = Math.random();
    if (r < 0.30) return generateNormalAddSub(id, difficulty);
    if (r < 0.60) return generateNormalMulInt(id, difficulty);
    if (r < 0.85) return generateNormalDivInt(id, difficulty);
    return generateCompareSize(id, difficulty);
  }

  if (difficulty <= 7) {
    // Hard: 25% mul, 20% div, 15% mixed, 10% shift, 10% trap, 10% compare, 10% cyclic
    const r = Math.random();
    if (r < 0.25) return generateHardMulDecimal(id, difficulty);
    if (r < 0.45) return generateHardDivDecimal(id, difficulty);
    if (r < 0.60) return generateHardMixedAddSub(id, difficulty);
    if (r < 0.70) return generateHardShift(id, difficulty);
    if (r < 0.80) return generateHardTrap(id, difficulty);
    if (r < 0.90) return generateCompareSize(id, difficulty);
    return generateCyclicDivision(id, difficulty);
  }

  // Demon: 35% mul, 30% div, 15% compare, 10% cyclic, 10% trap
  const r = Math.random();
  if (r < 0.35) return generateDemonMulDecimal(id, difficulty);
  if (r < 0.65) return generateDemonDivDecimal(id, difficulty);
  if (r < 0.80) return generateCompareSize(id, difficulty);
  if (r < 0.90) return generateCyclicDivision(id, difficulty);
  return generateHardTrap(id, difficulty);
}
```

- [ ] **Step 5: 运行测试**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 全部 PASS

- [ ] **Step 6: 构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add src/engine/generators/decimal-ops.ts src/engine/generators/generators.test.ts
git commit -m "feat(A05): 新增循环小数除法 generateCyclicDivision — 商保留N位小数"
```

---

## Task 4: A08 新增含括号方程 generateBracketEquation

**Files:**
- Modify: `src/engine/generators/equation-transpose.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

首先在 `generators.test.ts` 第 2 行的 import 区域后添加：

```typescript
import { generateEquationTranspose } from './equation-transpose';
```

然后在文件末尾追加：

```typescript
// ==================== Equation Transpose ====================
describe('Equation Transpose (方程与等式)', () => {
  describe('Bracket Equations (含括号方程)', () => {
    it('difficulty≥6 应能生成含括号方程', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) =>
        q.data.equation.includes('(') && q.type === 'numeric-input'
      );
      expect(bracketQs.length).toBeGreaterThan(0);
    });

    it('含括号方程答案应为有效数字', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) =>
        q.data.equation.includes('(') && q.type === 'numeric-input'
      );
      for (const q of bracketQs) {
        expect(isNaN(Number(q.solution.answer))).toBe(false);
        expect(Number(q.solution.answer)).toBeGreaterThan(0);
      }
    });

    it('含括号方程 solution.steps 应非空', () => {
      const qs = genN(generateEquationTranspose, 7, 400);
      const bracketQs = qs.filter((q: any) =>
        q.data.equation.includes('(') && q.type === 'numeric-input'
      );
      for (const q of bracketQs) {
        expect(q.solution.steps).toBeDefined();
        expect(q.solution.steps!.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Division Equations (除法方程)', () => {
    it('difficulty≤5 应能生成除法方程', () => {
      const qs = genN(generateEquationTranspose, 5, 400);
      const divQs = qs.filter((q: any) =>
        q.data.equation.includes('÷') && q.type === 'numeric-input'
      );
      expect(divQs.length).toBeGreaterThan(0);
    });

    it('除法方程答案应为正整数', () => {
      const qs = genN(generateEquationTranspose, 5, 400);
      const divQs = qs.filter((q: any) =>
        q.data.equation.includes('÷') && q.type === 'numeric-input'
      );
      for (const q of divQs) {
        const ans = Number(q.solution.answer);
        expect(isNaN(ans)).toBe(false);
        expect(ans).toBeGreaterThan(0);
      }
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 含括号方程和除法方程测试 FAIL

- [ ] **Step 3: 实现 generateBracketEquation**

在 `equation-transpose.ts` 第 164 行（`generateSolveAfterTranspose` 结束后、`export function generateEquationTranspose` 之前）插入：

```typescript

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
      // 退化为 pattern 0
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
```

- [ ] **Step 4: 运行测试**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: Bracket Equations 测试仍 FAIL（调度器还没调用），Division Equations 测试也 FAIL（Task 5 实现）

- [ ] **Step 5: 提交（仅 equation-transpose.ts 中的新函数）**

暂不提交，与 Task 5 一起提交。

---

## Task 5: A08 新增除法方程 generateDivisionEquation

**Files:**
- Modify: `src/engine/generators/equation-transpose.ts`

- [ ] **Step 1: 实现 generateDivisionEquation**

在 `generateBracketEquation` 函数之后、`export function generateEquationTranspose` 之前插入：

```typescript

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
```

- [ ] **Step 2: 更新 generateEquationTranspose 调度器**

将第 166-187 行的 `generateEquationTranspose` 函数替换为：

```typescript
export function generateEquationTranspose(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;

  if (difficulty <= 5) {
    // Normal: 45% moveConstant, 35% solveAfterTranspose, 20% divisionEquation
    const r = Math.random();
    if (r < 0.45) return generateMoveConstant(difficulty, id);
    if (r < 0.80) return generateSolveAfterTranspose(difficulty, id);
    return generateDivisionEquation(difficulty, id);
  }

  if (difficulty <= 7) {
    // Hard: 25% moveFromLinear, 25% solveAfterTranspose, 20% moveConstant, 15% bracketEquation, 15% divisionEquation
    const r = Math.random();
    if (r < 0.25) return generateMoveFromLinear(difficulty, id);
    if (r < 0.50) return generateSolveAfterTranspose(difficulty, id);
    if (r < 0.70) return generateMoveConstant(difficulty, id);
    if (r < 0.85) return generateBracketEquation(difficulty, id);
    return generateDivisionEquation(difficulty, id);
  }

  // Demon: 25% moveBothSides, 25% bracketEquation, 20% moveFromLinear, 15% solveAfterTranspose, 15% divisionEquation
  const r = Math.random();
  if (r < 0.25) return generateMoveBothSides(difficulty, id);
  if (r < 0.50) return generateBracketEquation(difficulty, id);
  if (r < 0.70) return generateMoveFromLinear(difficulty, id);
  if (r < 0.85) return generateSolveAfterTranspose(difficulty, id);
  return generateDivisionEquation(difficulty, id);
}
```

- [ ] **Step 3: 运行测试**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 全部 PASS（包括 Task 4 的含括号方程测试 + 除法方程测试）

- [ ] **Step 4: 构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add src/engine/generators/equation-transpose.ts src/engine/generators/generators.test.ts
git commit -m "feat(A08): 新增含括号方程和除法方程 — generateBracketEquation + generateDivisionEquation"
```

---

## Task 6: A02 新增大小比较判断 generateCompare

**Files:**
- Modify: `src/engine/generators/number-sense.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

首先在 `generators.test.ts` 的 import 区域添加：

```typescript
import { generateNumberSense } from './number-sense';
```

然后在文件末尾追加：

```typescript
// ==================== Number Sense - Compare ====================
describe('Number Sense - Compare (大小比较判断)', () => {
  it('应生成大小比较判断题', () => {
    const qs = genN(generateNumberSense, 5, 400);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    expect(compareQs.length).toBeGreaterThan(0);
  });

  it('大小比较题应为 multiple-choice 类型', () => {
    const qs = genN(generateNumberSense, 5, 400);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(q.type).toBe('multiple-choice');
    }
  });

  it('答案必须是 >、< 或 = 之一', () => {
    const qs = genN(generateNumberSense, 5, 600);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      expect(['>', '<', '=']).toContain(String(q.solution.answer));
    }
  });

  it('选项必须包含 >、< 和 =', () => {
    const qs = genN(generateNumberSense, 5, 400);
    const compareQs = qs.filter((q: any) => q.data.subtype === 'compare');
    for (const q of compareQs) {
      const opts = q.data.options as string[];
      expect(opts).toEqual(['>', '<', '=']);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: Number Sense Compare 测试 FAIL

- [ ] **Step 3: 实现 generateCompare**

在 `number-sense.ts` 第 121 行（`generateRound` 结束后）、`export function generateNumberSense` 之前插入：

```typescript

// 大小比较判断: a × b ○ a 或 a ÷ b ○ a
function generateCompare(difficulty: number, id: string): Question {
  const isMultiply = Math.random() < 0.5;
  const op = isMultiply ? '×' : '÷';

  // 基数
  const a = difficulty <= 5
    ? Number((randInt(11, 99) / 10).toFixed(1))
    : Number((randInt(101, 999) / 100).toFixed(2));

  // 因子 b: 等概率生成 >1, <1, =1
  const bType = randInt(0, 2);
  let b: number;
  if (bType === 0) {
    b = Number((randInt(11, 25) / 10).toFixed(1));
  } else if (bType === 1) {
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
    timeLimit: difficulty <= 5 ? 15000 : 10000,
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 4: 更新 generateNumberSense 调度器**

将第 123-127 行的 `generateNumberSense` 函数替换为：

```typescript
export function generateNumberSense(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;
  const r = Math.random();
  if (r < 0.45) return generateEstimate(difficulty, id);
  if (r < 0.75) return generateRound(difficulty, id);
  return generateCompare(difficulty, id);
}
```

- [ ] **Step 5: 运行测试**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`
Expected: 全部 PASS

- [ ] **Step 6: 构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add src/engine/generators/number-sense.ts src/engine/generators/generators.test.ts
git commit -m "feat(A02): 新增大小比较判断 generateCompare — 不计算直接比较"
```

---

## Task 7: 端到端验证

- [ ] **Step 1: 运行全部测试**

Run: `cd math-quest && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 2: 运行构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

- [ ] **Step 3: 手动验证**

Run: `cd math-quest && npm run dev`

在浏览器中验证：
1. 进入"小数计算"练习 → 普通/困难/魔王各做 10 题，确认偶尔出现大小比较题（MC，选 >/</=）
2. 进入"小数计算"困难模式 → 确认偶尔出现循环小数除法题（numeric-input，带"保留X位小数"）
3. 进入"方程移项"练习 → 确认偶尔出现含括号方程（如 `3(x+5)=27`）和除法方程（如 `48÷x=6`）
4. 进入"数感估算"练习 → 确认偶尔出现大小比较判断题（MC，"不计算，比较大小"）

- [ ] **Step 4: 更新 spec 文件（标记已完成项）**

在 `docs/specs/2026-04-08-generator-improvements.md` 的对应条目后添加 `✅ Phase 1 已实现` 标记。

- [ ] **Step 5: 最终提交（如有修复）**

修复验证中发现的问题后提交。
