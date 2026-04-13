# Phase 2: P1 参数范围扩展实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展 4 个生成器的参数范围和模式覆盖——A05 左移小数点+特殊值、A06 四项括号+除法性质+小数支持、A07 隐藏公因数+小数版本、A01 三位数整十整百。

**Architecture:** 每个生成器在现有子函数内部新增分支或模式（不新建子函数，除 A06 的除法性质），保持主调度器权重不变或微调。所有改动遵循现有参数约定和 Question 返回结构。

**Tech Stack:** TypeScript, Vitest, math-quest 现有生成器架构

**Spec:** `math-quest/docs/specs/2026-04-08-generator-improvements.md` Section 1.P1, 4.P1, 6.P1, 8.P2

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/types/index.ts:119-124` | 修改 | BracketOpsData 新增 `'division-property'` subtype |
| `src/engine/generators/decimal-ops.ts:45-64,170-189` | 修改 | generateNormalMulInt 特殊值 + generateHardShift 左移 |
| `src/engine/generators/bracket-ops.ts` | 修改+新增 | 4 项扩展 + generateDivisionProperty + 小数支持 + 调度器更新 |
| `src/engine/generators/multi-step.ts:570-640,349-409` | 修改 | generateExtractFactor 隐藏公因数 + generateReduceSubtract/generateDistributeRound 小数化 |
| `src/engine/generators/mental-arithmetic.ts:13-83` | 修改 | generatePair 扩展整十整百运算范围 |
| `src/engine/generators/generators.test.ts` | 修改 | 各 Task 的新增测试 |

---

## Task 1: A05 左移小数点 + 特殊值

**Files:**
- Modify: `src/engine/generators/decimal-ops.ts:45-64,170-189`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript
// ==================== A05 Phase 2: Shift + Special Values ====================
describe('Decimal Ops - Shift Extension (小数点左移)', () => {
  it('difficulty 6-7 应生成左移题（×0.1 或 ×0.01）', () => {
    const qs = genN(generateDecimalOps, 7, 500);
    const shiftQs = qs.filter((q: any) => q.data.subtype === 'shift');
    const leftShifts = shiftQs.filter((q: any) =>
      q.data.expression.includes('× 0.1') || q.data.expression.includes('× 0.01') || q.data.expression.includes('× 0.001')
    );
    expect(leftShifts.length).toBeGreaterThan(0);
  });

  it('左移题答案应为有效数字', () => {
    const qs = genN(generateDecimalOps, 7, 500);
    const leftShifts = qs.filter((q: any) =>
      q.data.subtype === 'shift' && (q.data.expression.includes('× 0.1') || q.data.expression.includes('× 0.01'))
    );
    for (const q of leftShifts) {
      expect(isNaN(Number(q.solution.answer))).toBe(false);
    }
  });
});

describe('Decimal Ops - Special Values (特殊值)', () => {
  it('difficulty≤5 应偶尔生成特殊值乘法（如 0.125×8）', () => {
    const qs = genN(generateDecimalOps, 5, 600);
    const specials = qs.filter((q: any) =>
      q.data.subtype === 'mul' && q.solution.explanation.includes('特殊值')
    );
    expect(specials.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 修改 generateHardShift 支持左移**

将 `decimal-ops.ts` 中的 `generateHardShift` 函数（约第 170-189 行）替换为：

```typescript
function generateHardShift(id: string, difficulty: number): Question {
  // 50% 右移 (×10/100/1000), 50% 左移 (×0.1/0.01/0.001)
  const isLeftShift = Math.random() < 0.5;

  if (isLeftShift) {
    const shiftValues = [0.1, 0.01];
    if (difficulty >= 8) shiftValues.push(0.001);
    const shift = shiftValues[randInt(0, shiftValues.length - 1)];
    const shiftPlaces = Math.round(-Math.log10(shift));
    // 生成一个整数或一位小数的基数
    const hasDecimal = Math.random() < 0.4;
    const aScaled = hasDecimal ? randInt(11, 99) : randInt(10, 999);
    const a = hasDecimal ? aScaled / 10 : aScaled;
    const answerScaled = aScaled;
    const totalDp = (hasDecimal ? 1 : 0) + shiftPlaces;
    const answer = a * shift;
    const expression = `${formatNum(a)} × ${formatNum(shift)}`;

    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'shift' },
      solution: { answer: formatNum(answer), explanation: `乘${formatNum(shift)}就是小数点向左移${shiftPlaces}位` },
      hints: [`乘${formatNum(shift)}时，小数点向左移动${shiftPlaces}位`],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 原有右移逻辑
  const shifts = [10, 100, 1000];
  const shift = shifts[randInt(0, 2)];
  const dp = randInt(1, 3);
  const factor = Math.pow(10, dp);
  const aScaled = randInt(1, 99 * factor);
  const a = aScaled / factor;
  const answerScaled = aScaled * shift;
  const answer = answerScaled / factor;
  const expression = `${formatNum(a)} × ${shift}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'shift' },
    solution: { answer: formatNum(answer), explanation: `乘${shift}就是小数点向右移${Math.log10(shift)}位` },
    hints: [`乘${shift}时，小数点向右移动${Math.log10(shift)}位`],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 4: 修改 generateNormalMulInt 增加特殊值**

将 `decimal-ops.ts` 中的 `generateNormalMulInt` 函数（约第 45-64 行）替换为：

```typescript
function generateNormalMulInt(id: string, difficulty: number): Question {
  // 15% 概率生成特殊值乘法
  if (Math.random() < 0.15) {
    const specials = [
      { a: 0.125, b: 8, answer: 1 },
      { a: 0.25, b: 4, answer: 1 },
      { a: 0.5, b: 2, answer: 1 },
      { a: 0.125, b: 16, answer: 2 },
      { a: 0.25, b: 8, answer: 2 },
      { a: 0.5, b: 4, answer: 2 },
    ];
    const s = specials[randInt(0, specials.length - 1)];
    const expression = `${formatNum(s.a)} × ${s.b}`;
    return {
      id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
      prompt: `计算: ${expression}`,
      data: { kind: 'decimal-ops', expression, subtype: 'mul' },
      solution: { answer: formatNum(s.answer), explanation: `${expression} = ${s.answer}（常见特殊值）` },
      hints: ['这是一个常见的特殊值组合，记住它！'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 原有逻辑
  const places = Math.random() < 0.5 ? 1 : 2;
  const factor = Math.pow(10, places);
  const aScaled = places === 1 ? randInt(11, 500) : randInt(101, 5000);
  const b = randInt(2, 9);
  const productInt = aScaled * b;
  const a = aScaled / factor;
  const answer = productInt / factor;
  const expression = `${formatNum(a)} × ${b}`;

  return {
    id, topicId: 'decimal-ops', type: 'numeric-input', difficulty,
    prompt: `计算: ${expression}`,
    data: { kind: 'decimal-ops', expression, subtype: 'mul' },
    solution: { answer: formatNum(answer), explanation: `${expression} = ${formatNum(answer)}` },
    hints: ['先不看小数点，按整数乘法算，再数小数位数'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 5: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 2: A06 四项扩展 + 除法性质 + 小数支持

**Files:**
- Modify: `src/types/index.ts:119-124`
- Modify: `src/engine/generators/bracket-ops.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 更新 BracketOpsData 类型**

将 `src/types/index.ts` 第 119-124 行：
```typescript
export interface BracketOpsData {
  kind: 'bracket-ops';
  subtype: 'add-bracket' | 'remove-bracket';
  originalExpression: string;
  options?: string[];
}
```
替换为：
```typescript
export interface BracketOpsData {
  kind: 'bracket-ops';
  subtype: 'add-bracket' | 'remove-bracket' | 'division-property';
  originalExpression: string;
  options?: string[];
}
```

- [ ] **Step 2: 写测试**

先在 `generators.test.ts` 的 import 区域添加（如果尚未存在）：
```typescript
import { generateBracketOps } from './bracket-ops';
```

在文件末尾追加：

```typescript
// ==================== A06 Phase 2: 4-item + Division Property ====================
describe('Bracket Ops - 4-item Extension (四项括号变换)', () => {
  it('difficulty≥6 应生成四项括号变换题', () => {
    const qs = genN(generateBracketOps, 7, 400);
    // 四项表达式含3个运算符
    const fourItems = qs.filter((q: any) => {
      const expr = q.data.originalExpression;
      const ops = expr.match(/[+\-]/g) || [];
      return ops.length >= 3;
    });
    expect(fourItems.length).toBeGreaterThan(0);
  });
});

describe('Bracket Ops - Division Property (除法性质)', () => {
  it('difficulty≥6 应生成除法性质题', () => {
    const qs = genN(generateBracketOps, 7, 400);
    const divProps = qs.filter((q: any) => q.data.subtype === 'division-property');
    expect(divProps.length).toBeGreaterThan(0);
  });

  it('除法性质题选项应包含正确答案', () => {
    const qs = genN(generateBracketOps, 7, 400);
    const divProps = qs.filter((q: any) => q.data.subtype === 'division-property');
    for (const q of divProps) {
      const opts = q.data.options as string[];
      expect(opts).toContain(String(q.solution.answer));
    }
  });
});

describe('Bracket Ops - Decimal Support (小数支持)', () => {
  it('difficulty≥6 应偶尔生成小数括号变换题', () => {
    const qs = genN(generateBracketOps, 7, 500);
    const decimalQs = qs.filter((q: any) => q.data.originalExpression.includes('.'));
    expect(decimalQs.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: 添加 formatNum 辅助函数**

在 `bracket-ops.ts` 的 `shuffle` 函数之后（第 15 行后）添加：

```typescript

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}
```

- [ ] **Step 4: 修改 generateRemoveBracketMinus 支持四项**

将 `bracket-ops.ts` 中的 `generateRemoveBracketMinus`（约第 39-60 行）替换为：

```typescript
function generateRemoveBracketMinus(difficulty: number, id: string): Question {
  const max = difficulty <= 5 ? 200 : difficulty <= 7 ? 1000 : 5000;
  const useDecimal = difficulty >= 6 && Math.random() < 0.3;
  const useFourItems = difficulty >= 6 && Math.random() < 0.4;
  const scale = useDecimal ? 10 : 1;

  const a = useDecimal ? randInt(50, 500) / scale : randInt(50, max);
  const b = useDecimal ? randInt(12, 99) / scale : randInt(12, Math.min(99, max));
  const c = useDecimal ? randInt(10, 80) / scale : randInt(10, b * scale - 1) / (useDecimal ? scale : 1);

  if (useFourItems) {
    // 四项: a - (b + c - d) = a - b - c + d
    const d = useDecimal ? randInt(5, 40) / scale : randInt(5, 40);
    const original = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)})`;
    const correct = `${formatNum(a)} - ${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)}`;
    const wrong1 = `${formatNum(a)} - ${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)}`; // 只翻转部分
    const wrong2 = `${formatNum(a)} - ${formatNum(b)} - ${formatNum(c)} - ${formatNum(d)}`; // d 忘翻
    const wrong3 = `${formatNum(a)} + ${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)}`; // 全错

    return {
      id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
      prompt: `去括号: ${original} = ?`,
      data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
      solution: { answer: correct, explanation: `减号后面去括号，括号内每个符号都变: ${original} = ${correct}` },
      hints: ['括号前是减号，去括号后括号里的每个符号都要变！'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 原有三项逻辑
  const innerOp = Math.random() < 0.5 ? '+' : '-';
  const original = `${formatNum(a)} - (${formatNum(b)} ${innerOp} ${formatNum(c)})`;
  const flippedOp = innerOp === '+' ? '-' : '+';
  const correct = `${formatNum(a)} - ${formatNum(b)} ${flippedOp} ${formatNum(c)}`;
  const wrong1 = `${formatNum(a)} - ${formatNum(b)} ${innerOp} ${formatNum(c)}`;
  const wrong2 = `${formatNum(a)} + ${formatNum(b)} ${flippedOp} ${formatNum(c)}`;
  const wrong3 = `${formatNum(a)} + ${formatNum(b)} ${innerOp} ${formatNum(c)}`;

  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `去括号: ${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'remove-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, steps: [`括号前是减号，去括号后括号内各项变号`, `${innerOp} 变成 ${flippedOp}`], explanation: `减号后面的括号去掉，括号内的符号要变: ${original} = ${correct}` },
    hints: ['括号前是减号，去括号后括号里的每个符号都要变！'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 5: 修改 generateAddBracket 支持四项**

将 `bracket-ops.ts` 中的 `generateAddBracket`（约第 62-81 行）替换为：

```typescript
function generateAddBracket(difficulty: number, id: string): Question {
  const max = difficulty <= 5 ? 500 : difficulty <= 7 ? 2000 : 9999;
  const useDecimal = difficulty >= 6 && Math.random() < 0.3;
  const useFourItems = difficulty >= 6 && Math.random() < 0.4;
  const scale = useDecimal ? 10 : 1;

  const a = useDecimal ? randInt(100, 999) / scale : randInt(100, max);
  const b = useDecimal ? randInt(10, 99) / scale : randInt(10, Math.min(99, max));
  const c = useDecimal ? randInt(10, 99) / scale : randInt(10, Math.min(99, max));

  if (useFourItems) {
    // 四项: a - b + c - d = a - (b - c + d)
    const d = useDecimal ? randInt(5, 50) / scale : randInt(5, 50);
    const original = `${formatNum(a)} - ${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)}`;
    const correct = `${formatNum(a)} - (${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)})`;
    const wrong1 = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)} - ${formatNum(d)})`;
    const wrong2 = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)} + ${formatNum(d)})`;
    const wrong3 = `${formatNum(a)} + (${formatNum(b)} - ${formatNum(c)} + ${formatNum(d)})`;

    return {
      id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
      prompt: `添括号: ${original} = ?`,
      data: { kind: 'bracket-ops', subtype: 'add-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
      solution: { answer: correct, explanation: `添括号时符号要变: -${formatNum(b)}+${formatNum(c)}-${formatNum(d)} → -(${formatNum(b)}-${formatNum(c)}+${formatNum(d)})` },
      hints: ['添括号后，括号里的每个符号都要反过来'],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 原有三项逻辑
  const original = `${formatNum(a)} - ${formatNum(b)} - ${formatNum(c)}`;
  const correct = `${formatNum(a)} - (${formatNum(b)} + ${formatNum(c)})`;
  const wrong1 = `${formatNum(a)} - (${formatNum(b)} - ${formatNum(c)})`;
  const wrong2 = `${formatNum(a)} + (${formatNum(b)} + ${formatNum(c)})`;
  const wrong3 = `${formatNum(a)} + (${formatNum(b)} - ${formatNum(c)})`;

  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `添括号: ${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'add-bracket', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, explanation: `减号后面添括号，括号内的符号要变: - ${formatNum(b)} - ${formatNum(c)} → -(${formatNum(b)} + ${formatNum(c)})` },
    hints: ['减号后面添括号时，括号里的符号要反过来'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 6: 新增 generateDivisionProperty**

在 `generateNestedBracket` 之后、`export function generateBracketOps` 之前插入：

```typescript

function generateDivisionProperty(difficulty: number, id: string): Question {
  // 常用凑整因子对: b × c 为整数
  const pairs: [number, number][] = difficulty <= 7
    ? [[4, 25], [5, 20], [2, 50], [8, 125]]
    : [[0.25, 4], [0.125, 8], [0.5, 2], [4, 25], [5, 20]];
  const [b, c] = pairs[randInt(0, pairs.length - 1)];
  const product = b * c;
  const multiplier = randInt(2, 12);
  const a = product * multiplier;

  // 50% 去括号, 50% 添括号
  const isRemove = Math.random() < 0.5;
  const original = isRemove
    ? `${formatNum(a)} ÷ (${formatNum(b)} × ${formatNum(c)})`
    : `${formatNum(a)} ÷ ${formatNum(b)} ÷ ${formatNum(c)}`;
  const correct = isRemove
    ? `${formatNum(a)} ÷ ${formatNum(b)} ÷ ${formatNum(c)}`
    : `${formatNum(a)} ÷ (${formatNum(b)} × ${formatNum(c)})`;

  // 干扰项
  const wrong1 = `${formatNum(a)} × ${formatNum(b)} ÷ ${formatNum(c)}`;
  const wrong2 = `${formatNum(a)} ÷ ${formatNum(b)} × ${formatNum(c)}`;
  const wrong3 = `(${formatNum(a)} ÷ ${formatNum(b)}) × ${formatNum(c)}`;

  const actionText = isRemove ? '去括号' : '添括号';
  return {
    id, topicId: 'bracket-ops', type: 'multiple-choice', difficulty,
    prompt: `${actionText}: ${original} = ?`,
    data: { kind: 'bracket-ops', subtype: 'division-property', originalExpression: original, options: shuffle([correct, wrong1, wrong2, wrong3]) },
    solution: { answer: correct, explanation: `除法性质: a÷b÷c = a÷(b×c)，连除等于除以积` },
    hints: ['连续除以两个数，等于除以这两个数的积'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

- [ ] **Step 7: 更新 generateBracketOps 调度器**

将调度器（约第 104-125 行）替换为：

```typescript
export function generateBracketOps(params: GeneratorParams): Question {
  const { difficulty, id = '' } = params;
  if (difficulty <= 5) {
    return Math.random() < 0.6
      ? generateRemoveBracketPlus(difficulty, id)
      : generateRemoveBracketMinus(difficulty, id);
  } else if (difficulty <= 7) {
    const r = Math.random();
    if (r < 0.25) return generateRemoveBracketPlus(difficulty, id);
    if (r < 0.50) return generateRemoveBracketMinus(difficulty, id);
    if (r < 0.75) return generateAddBracket(difficulty, id);
    return generateDivisionProperty(difficulty, id);
  } else {
    const r = Math.random();
    if (r < 0.25) return generateRemoveBracketMinus(difficulty, id);
    if (r < 0.45) return generateAddBracket(difficulty, id);
    if (r < 0.60) return generateNestedBracket(difficulty, id);
    if (r < 0.80) return generateDivisionProperty(difficulty, id);
    return generateRemoveBracketPlus(difficulty, id);
  }
}
```

- [ ] **Step 8: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 3: A07 隐藏公因数 + 小数版本

**Files:**
- Modify: `src/engine/generators/multi-step.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript
// ==================== A07 Phase 2: Hidden Factor + Decimal ====================
describe('Multi-Step - Hidden Factor (隐藏公因数)', () => {
  it('difficulty≥6 应生成隐藏公因数题', () => {
    const qs = genN(generateMultiStep, 7, 500);
    const factorQs = qs.filter((q: any) =>
      q.solution.explanation && q.solution.explanation.includes('公因数')
    );
    // 部分公因数题应含小数点（隐藏形式）
    const hidden = factorQs.filter((q: any) => q.data.expression.includes('.'));
    expect(hidden.length).toBeGreaterThan(0);
  });
});

describe('Multi-Step - Decimal Versions (小数简便计算)', () => {
  it('difficulty≤5 连减凑整应支持小数', () => {
    const qs = genN(generateMultiStep, 5, 500);
    const decimalQs = qs.filter((q: any) =>
      q.data.expression.includes('.') && q.solution.explanation && q.solution.explanation.includes('凑')
    );
    expect(decimalQs.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 修改 generateExtractFactor 增加隐藏公因数模式**

在 `multi-step.ts` 的 `generateExtractFactor` 函数中，Hard/Demon 分支（`const isHard = difficulty <= 7;` 之后）前面添加隐藏模式：

在现有 `// Hard/Demon: 原有逻辑` 注释的位置，将该行及后续 Hard/Demon 逻辑替换为：

```typescript
  // Hard/Demon
  // 30% 隐藏公因数模式: a×m + a'×n，其中 a 和 a' 是同一个数的不同小数形式
  if (Math.random() < 0.3) {
    // 例: 2.8×9.2 + 28×0.08 = 28×0.92 + 28×0.08 = 28×1 = 28
    const baseFactors = [28, 36, 45, 72, 125];
    const base = baseFactors[randInt(0, baseFactors.length - 1)];
    const m10 = randInt(1, 9);
    const n10 = 10 - m10;
    // base × (m10/10) + base × (n10/10) = base × 1 = base
    // 写成: (base/10) × m10 + base × (n10/10)
    const aVisible = base / 10;    // 如 2.8
    const mVisible = m10;           // 如 9 → 表达式 2.8 × 9
    // 但我们需要 m 和 n 凑10，且一项用小数形式隐藏
    // 实际: aVisible × m10 + base × (n10/100) ... 太复杂
    // 简化: 直接用 base × m/10 + base × n/10 的变形
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

  // 70% 原有 Hard/Demon 逻辑
  const isHard = difficulty <= 7;
```

注意：不修改后续的原有 Hard/Demon 逻辑代码。

- [ ] **Step 4: 修改 generateReduceSubtract 支持小数**

在 `multi-step.ts` 的 `generateReduceSubtract` 函数开头（`const targets =` 之前）添加小数分支：

```typescript
function generateReduceSubtract(difficulty: number, id: string): Question {
  // 30% 概率生成小数版连减凑整
  if (Math.random() < 0.3) {
    // 小数版: a - b - c，其中 b + c 凑整（如 3.7 + 6.3 = 10）
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
        explanation: `连减时，两减数之和为整数 ${T}，先合并再减`,
      },
      hints: [`${formatNum(b)} + ${formatNum(c)} 等于多少？`],
      xpBase: 10 + (difficulty - 1) * 5,
    };
  }

  // 原有整数逻辑
  const targets = difficulty <= 5 ? [100, 200, 50] : [1000, 500, 300];
```

注意：不修改后续的原有逻辑。

- [ ] **Step 5: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 4: A01 扩展整十整百运算范围

**Files:**
- Modify: `src/engine/generators/mental-arithmetic.ts`
- Modify: `src/engine/generators/generators.test.ts`

- [ ] **Step 1: 写测试**

在 `generators.test.ts` 末尾追加：

```typescript
// ==================== A01 Phase 2: Extended Ranges ====================
describe('Mental Arithmetic - Extended Ranges (整十整百运算)', () => {
  it('difficulty=5 应偶尔生成三位数整十/整百运算', () => {
    const qs = genN(generateMentalArithmetic, 5, 500);
    // 排除运算顺序题
    const singleStep = qs.filter((q: any) => q.data.kind !== 'multi-step');
    const threeDigit = singleStep.filter((q: any) => {
      const ops = q.data.operands as number[];
      return ops.some((n: number) => n >= 100);
    });
    expect(threeDigit.length).toBeGreaterThan(0);
  });

  it('三位数运算应为整十或整百数', () => {
    const qs = genN(generateMentalArithmetic, 5, 500);
    const singleStep = qs.filter((q: any) => q.data.kind !== 'multi-step');
    const threeDigit = singleStep.filter((q: any) => {
      const ops = q.data.operands as number[];
      return ops.some((n: number) => n >= 100);
    });
    for (const q of threeDigit) {
      const ops = q.data.operands as number[];
      const bigNum = ops.find((n: number) => n >= 100)!;
      // 整十或整百: 能被10整除
      expect(bigNum % 10).toBe(0);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `cd math-quest && npx vitest run src/engine/generators/generators.test.ts`

- [ ] **Step 3: 修改 generatePair 扩展范围**

在 `mental-arithmetic.ts` 的 `generatePair` 函数中，为 difficulty 4-5 增加整十整百运算分支。

在 `generatePair` 函数的最开头（在 `if (op === '+')` 之前）添加：

```typescript
function generatePair(difficulty: number, op: string): [number, number, number] {
  // difficulty 4-5: 20% 概率生成整十/整百运算
  if (difficulty >= 4 && difficulty <= 5 && Math.random() < 0.2) {
    const roundBase = Math.random() < 0.5 ? 10 : 100;
    if (op === '+') {
      const a = randInt(1, 9) * roundBase;  // 100-900 或 10-90
      const b = randInt(1, 9) * roundBase;
      return [a, b, a + b];
    } else if (op === '-') {
      const a = randInt(2, 9) * roundBase;
      const b = randInt(1, a / roundBase - 1) * roundBase;
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

  // 原有逻辑
  if (op === '+') {
```

注意：不修改后续的原有分支逻辑。

- [ ] **Step 4: 运行测试 + 构建**

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
1. "小数计算"困难模式 → 确认偶尔出现 ×0.1/×0.01 的小数点左移题
2. "小数计算"普通模式 → 确认偶尔出现 0.125×8=1 等特殊值题
3. "括号变换"困难模式 → 确认偶尔出现四项括号题和除法性质题
4. "简便计算"困难模式 → 确认偶尔出现隐藏公因数题
5. "基础计算"普通模式 → 确认偶尔出现 500-50、2700÷9 等三位数整十整百运算
