# A03 块 B：VerticalCalcBoard 组件重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强 VerticalCalcBoard 支持小数加减法竖式填写，新增 DecimalTrainingGrid 组件为小数乘除法提供"小数位数判定"训练格，并在 Practice 页面集成两者。

**Architecture:** VerticalCalcBoard 通过 `decimalPlaces` 字段检测小数模式，将操作数乘以 10^dp 转为整数后复用现有步骤生成逻辑，渲染时在对应位置插入小数点列。DecimalTrainingGrid 是独立的轻量组件，接受字段配置，管理填写状态和解锁逻辑。生成器为小数加减法生成 vertical-fill 题型（含 decimalPlaces），为乘除法生成 trainingFields 配置。

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, Vitest

**Spec:** `math-quest/ProjectManager/Specs/2026-04-09-a03-block-b-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/types/index.ts` | 修改 | 新增 `TrainingField` 接口，`VerticalCalcData` 新增 `decimalPlaces` + `trainingFields` |
| `src/components/DecimalTrainingGrid.tsx` | 新建 | 训练格组件（乘除法小数位数判定） |
| `src/engine/generators/vertical-calc.ts` | 修改 | 加减法改为 vertical-fill + decimalPlaces；乘除法增加 trainingFields |
| `src/components/VerticalCalcBoard.tsx` | 修改 | 支持小数点列渲染 |
| `src/pages/Practice.tsx` | 修改 | 集成 DecimalTrainingGrid |

---

## Task 1: 类型定义 + 生成器数据层

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/engine/generators/vertical-calc.ts`

- [ ] **Step 1: 更新类型定义**

在 `src/types/index.ts` 的 `VerticalCalcStep` 接口之后（约第 90 行）插入：

```typescript

export interface TrainingField {
  label: string;
  answer: string;
  placeholder?: string;
}
```

修改 `VerticalCalcData`（第 75-80 行）为：

```typescript
export interface VerticalCalcData {
  kind: 'vertical-calc';
  operation: '+' | '-' | '×' | '÷';
  operands: number[];
  steps: VerticalCalcStep[];
  decimalPlaces?: number;
  trainingFields?: TrainingField[];
}
```

- [ ] **Step 2: 修改 generateDecimalAddSub — 改为 vertical-fill**

在 `vertical-calc.ts` 中，将 `generateDecimalAddSub` 函数的返回从 `type: 'numeric-input'` 改为 `type: 'vertical-fill'`，并生成正确的 steps 和 decimalPlaces。

替换整个 `generateDecimalAddSub` 函数为：

```typescript
function generateDecimalAddSub(difficulty: number, id: string): Question {
  const isAdd = Math.random() < 0.5;
  const op: '+' | '-' = isAdd ? '+' : '-';
  const dp1 = randInt(1, difficulty <= 5 ? 2 : 3);
  const dp2 = randInt(1, difficulty <= 5 ? 2 : 3);
  const maxDp = Math.max(dp1, dp2);
  const f1 = Math.pow(10, dp1);
  const f2 = Math.pow(10, dp2);
  const aScaled = randInt(100, difficulty <= 5 ? 9999 : 99999);
  const bScaled = randInt(100, difficulty <= 5 ? 9999 : 99999);
  // Ensure no trailing zero issues
  let aS = aScaled; while (aS % 10 === 0) aS++;
  let bS = bScaled; while (bS % 10 === 0) bS++;
  let a = aS / f1;
  let b = bS / f2;
  if (!isAdd && a < b) [a, b] = [b, a];
  if (!isAdd && a === b) a = a + 1 / f1;

  // Scale to integers for step generation
  const fMax = Math.pow(10, maxDp);
  const aInt = Math.round(a * fMax);
  const bInt = Math.round(b * fMax);

  // Generate steps using existing integer logic
  const steps = isAdd
    ? generateAdditionSteps(aInt, bInt, difficulty)
    : generateSubtractionSteps(aInt, bInt, difficulty);

  const answer = isAdd ? a + b : a - b;
  const roundedAnswer = Math.round(answer * fMax) / fMax;
  const aStr = a.toFixed(dp1);
  const bStr = b.toFixed(dp2);

  return {
    id, topicId: 'vertical-calc', type: 'vertical-fill', difficulty,
    prompt: `用竖式计算: ${aStr} ${op} ${bStr}`,
    data: { kind: 'vertical-calc', operation: op, operands: [aInt, bInt], steps, decimalPlaces: maxDp },
    solution: {
      answer: formatNum(roundedAnswer),
      explanation: `${aStr} ${op} ${bStr} = ${formatNum(roundedAnswer)}`,
    },
    hints: [isAdd ? '小数点对齐，从末位开始加，满十进一' : '小数点对齐，从末位开始减，不够减向前借一'],
    xpBase: 10 + (difficulty - 1) * 5,
  };
}
```

关键改动：`type: 'vertical-fill'`，操作数存为缩放后的整数，新增 `decimalPlaces`。

- [ ] **Step 3: 修改 generateDecimalMul — 增加 trainingFields**

找到 `generateDecimalMul` 函数，在 `return` 语句中的 `data` 对象里添加 `trainingFields`。

对于 **difficulty ≤ 5**（小数×整数），在 return 的 data 中添加：
```typescript
    data: {
      kind: 'vertical-calc', operation: '×', operands: [a, b], steps: [],
      trainingFields: [
        { label: `${a.toFixed(dp)} 有几位小数`, answer: String(dp) },
        { label: `整数 ${b} 有几位小数`, answer: '0' },
        { label: '积共有几位小数', answer: String(dp) },
      ],
    },
```

对于 **difficulty > 5**（小数×小数），在 return 的 data 中添加：
```typescript
    data: {
      kind: 'vertical-calc', operation: '×', operands: [a, b], steps: [],
      trainingFields: [
        { label: `${a.toFixed(dp1)} 有几位小数`, answer: String(dp1) },
        { label: `${b.toFixed(dp2)} 有几位小数`, answer: String(dp2) },
        { label: '积共有几位小数', answer: String(totalDp) },
      ],
    },
```

- [ ] **Step 4: 修改 generateDecimalDiv — 增加 trainingFields（除数是小数时）**

找到 `generateDecimalDiv` 函数，在 difficulty > 5 分支（除数是小数）的 return data 中添加 `trainingFields`：

```typescript
    data: {
      kind: 'vertical-calc', operation: '÷', operands: [dividend, divisor], steps: [],
      trainingFields: [
        { label: `除数 ${formatNum(divisor)} 有几位小数`, answer: String(divisorDp) },
        { label: `除数变成`, answer: String(divisorScaled) },
        { label: `被除数变成`, answer: formatNum(shiftedDividend) },
      ],
    },
```

difficulty ≤ 5 分支（除数是整数）不加 trainingFields。

- [ ] **Step 5: 运行测试 + 构建**

Run: `cd math-quest && npx vitest run && npm run build`
Expected: 全部 PASS + 构建成功

---

## Task 2: DecimalTrainingGrid 组件

**Files:**
- Create: `src/components/DecimalTrainingGrid.tsx`

- [ ] **Step 1: 创建组件**

```typescript
import { useState, useCallback } from 'react';
import type { TrainingField } from '@/types';

interface Props {
  fields: TrainingField[];
  difficulty: number;
  onComplete: () => void;
}

export default function DecimalTrainingGrid({ fields, difficulty, onComplete }: Props) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, 'correct' | 'wrong' | null>>({});
  const [allDone, setAllDone] = useState(false);

  // 普通: difficulty ≤ 5 给反馈; 困难/魔王: 不给反馈
  const showFeedback = difficulty <= 5;

  const handleChange = useCallback((idx: number, value: string) => {
    const newValues = { ...values, [idx]: value };
    setValues(newValues);

    // 检查是否填写了内容
    if (value.trim()) {
      const isCorrect = value.trim() === fields[idx].answer;
      if (showFeedback) {
        setResults(prev => ({ ...prev, [idx]: isCorrect ? 'correct' : 'wrong' }));
        // 普通难度: 错了要改正，不允许继续
        if (!isCorrect) return;
      } else {
        // 困难: 不显示对错，但记录为已填
        setResults(prev => ({ ...prev, [idx]: 'correct' }));
      }
    }

    // 检查是否全部填完
    const filledCount = Object.keys(newValues).filter(k => newValues[Number(k)]?.trim()).length;
    if (showFeedback) {
      // 普通: 全部正确才解锁
      const correctCount = Object.keys({ ...results, [idx]: value.trim() === fields[idx].answer ? 'correct' : 'wrong' })
        .filter(k => {
          const i = Number(k);
          return newValues[i]?.trim() === fields[i]?.answer;
        }).length;
      if (correctCount >= fields.length && !allDone) {
        setAllDone(true);
        onComplete();
      }
    } else {
      // 困难: 全部填了就解锁（不管对错）
      if (filledCount >= fields.length && !allDone) {
        setAllDone(true);
        onComplete();
      }
    }
  }, [values, results, fields, showFeedback, allDone, onComplete]);

  return (
    <div className="bg-bg-elevated border-2 border-border rounded-xl p-4 mb-4">
      <div className="text-xs text-text-secondary font-semibold mb-3 tracking-wide">
        📐 训练格{showFeedback ? '' : '（填完解锁答案）'}
      </div>
      {fields.map((field, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-2 text-sm">
          <span className="text-text-secondary">{field.label}</span>
          <input
            type="text"
            inputMode="decimal"
            value={values[idx] ?? ''}
            onChange={e => handleChange(idx, e.target.value)}
            placeholder={field.placeholder ?? '?'}
            disabled={allDone}
            className={`w-16 text-center text-lg font-bold rounded-lg border-2 px-2 py-1 outline-none transition-colors
              ${results[idx] === 'correct'
                ? 'border-correct bg-correct/10 text-correct'
                : results[idx] === 'wrong'
                  ? 'border-wrong bg-wrong/10 text-wrong animate-shake'
                  : 'border-primary/50 bg-bg-card text-text focus:border-primary'
              }`}
          />
          {showFeedback && results[idx] === 'wrong' && (
            <span className="text-wrong text-xs">✗ 再想想</span>
          )}
          {showFeedback && results[idx] === 'correct' && (
            <span className="text-correct text-xs">✓</span>
          )}
        </div>
      ))}
      {allDone && (
        <div className="text-correct text-xs font-semibold mt-2">✓ 训练格完成，请填写答案</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 构建验证**

Run: `cd math-quest && npm run build`
Expected: 构建成功

---

## Task 3: VerticalCalcBoard 小数点列支持

**Files:**
- Modify: `src/components/VerticalCalcBoard.tsx`

- [ ] **Step 1: 修改数字拆分逻辑**

在 VerticalCalcBoard 组件中（约第 46-55 行），将现有的数字拆分逻辑替换为支持小数的版本。

将：
```typescript
  const a = operands[0];
  const b = operands[1];
  const aDigits = String(a).split('').map(Number);
  const bDigits = String(b).split('').map(Number);
  const answerDigits = String(Math.abs(
    operation === '+' ? a + b : operation === '-' ? a - b : operation === '×' ? a * b : Math.floor(a / b)
  )).split('').map(Number);
  const gridCols = Math.max(aDigits.length, bDigits.length, answerDigits.length) + 1;
```

替换为：

```typescript
  const a = operands[0];
  const b = operands[1];
  const dp = data.decimalPlaces ?? 0;

  // 将数字拆成从低位到高位的数组（与 column 对应）
  const toDigitsLTR = (n: number): number[] => String(n).split('').map(Number);
  const aDigits = toDigitsLTR(a);
  const bDigits = toDigitsLTR(b);
  const rawAnswer = Math.abs(
    operation === '+' ? a + b : operation === '-' ? a - b : operation === '×' ? a * b : Math.floor(a / b)
  );
  const answerDigits = toDigitsLTR(rawAnswer);

  // 含小数点时，gridCols 需要额外 +1（小数点列）
  const digitCols = Math.max(aDigits.length, bDigits.length, answerDigits.length);
  const gridCols = digitCols + 1 + (dp > 0 ? 1 : 0); // +1 for operator, +1 for decimal point
```

- [ ] **Step 2: 修改渲染逻辑 — 插入小数点列**

找到操作数渲染的部分（大约在 `{/* Operand rows */}` 区域），在每一行的数字渲染中，当 `dp > 0` 时，在 column `dp`（从右数第 dp+1 个位置）之后插入一个不可编辑的小数点单元格。

具体实现方式：创建一个辅助函数来为每行生成包含小数点的单元格数组。

在组件内部（useMemo 之后）添加辅助函数：

```typescript
  // 将数字数组按右对齐填充到 digitCols 位，并在 dp 位置插入小数点
  const padAndInsertDot = (digits: number[], maxLen: number): (number | '.')[] => {
    const padded: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      padded.push(i < maxLen - digits.length ? -1 : digits[i - (maxLen - digits.length)]);
    }
    if (dp > 0) {
      // 从右数第 dp 位之前插入小数点
      const dotPos = maxLen - dp;
      padded.splice(dotPos, 0, '.' as any);
    }
    return padded as (number | '.')[]; 
  };
```

然后在渲染每一行时，使用 `padAndInsertDot` 来获取含小数点的数组，对 "." 渲染为不可编辑的红色小数点，对 -1 渲染为空白。

对于结果行，同样使用 `padAndInsertDot` 但将数字单元格渲染为可填写的 input cell。小数点列跳过（不对应任何 step column）。

- [ ] **Step 3: 修改 column 索引映射**

当 `dp > 0` 时，渲染列的索引和 step 的 column 索引有偏移（因为插入了小数点列）。

添加映射函数：
```typescript
  // 渲染列索引 → step column 索引（跳过小数点列和操作符列）
  const renderColToStepCol = (renderCol: number): number => {
    // renderCol 0 = operator (不是 step column)
    // 然后是数字列，中间可能有小数点
    const digitRenderCol = renderCol - 1; // 去掉 operator 列
    if (dp === 0) return digitCols - 1 - digitRenderCol; // 右到左
    const dotRenderPos = digitCols - dp; // 小数点的渲染位置
    if (digitRenderCol === dotRenderPos) return -1; // 小数点列，无 step
    const actualDigitIdx = digitRenderCol > dotRenderPos
      ? digitRenderCol - 1 // 小数点后面的列，减 1
      : digitRenderCol;    // 小数点前面的列
    return digitCols - 1 - actualDigitIdx;
  };
```

- [ ] **Step 4: 运行构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

---

## Task 4: Practice.tsx 集成

**Files:**
- Modify: `src/pages/Practice.tsx`

- [ ] **Step 1: 导入 DecimalTrainingGrid**

在 Practice.tsx 顶部的 import 区域添加：
```typescript
import DecimalTrainingGrid from '@/components/DecimalTrainingGrid';
```

同时在类型 import 中确保包含 `TrainingField`：
```typescript
import type { VerticalCalcData, TrainingField } from '@/types';
```

- [ ] **Step 2: 添加训练格状态**

在组件的状态定义区域添加：
```typescript
const [trainingComplete, setTrainingComplete] = useState(false);
```

在 `nextQuestion()` 调用的地方（或 question 切换时）重置状态：
```typescript
// 在 handleNext 或 question 变化时
setTrainingComplete(false);
```

- [ ] **Step 3: 在 numeric-input 区域前渲染训练格**

在 Practice.tsx 的 `{/* Numeric input — regular single field */}` 区域之前，添加训练格渲染：

```typescript
              {/* Training grid for decimal mul/div */}
              {currentQuestion.type === 'numeric-input' &&
               currentQuestion.data &&
               'trainingFields' in currentQuestion.data &&
               (currentQuestion.data as VerticalCalcData).trainingFields &&
               (currentQuestion.data as VerticalCalcData).trainingFields!.length > 0 &&
               currentQuestion.difficulty < 8 && (
                <DecimalTrainingGrid
                  fields={(currentQuestion.data as VerticalCalcData).trainingFields!}
                  difficulty={currentQuestion.difficulty}
                  onComplete={() => setTrainingComplete(true)}
                />
              )}
```

- [ ] **Step 4: 禁用答案输入直到训练格完成**

修改 numeric-input 的 `<input>` 元素，当有训练格且未完成时禁用：

```typescript
const hasTraining = currentQuestion.type === 'numeric-input' &&
  currentQuestion.data &&
  'trainingFields' in currentQuestion.data &&
  (currentQuestion.data as VerticalCalcData).trainingFields?.length &&
  currentQuestion.difficulty < 8;
const inputDisabled = hasTraining && !trainingComplete;
```

在 input 上添加 `disabled={inputDisabled}`，并在禁用时显示提示文字：
```typescript
placeholder={inputDisabled ? '先完成训练格' : '输入答案'}
```

- [ ] **Step 5: 运行构建**

Run: `cd math-quest && npm run build`
Expected: 构建成功

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
1. **加减法竖式（普通）**: 进入"竖式笔算" → 做几题，确认小数加减法出现 vertical-fill 界面，含小数点列和补零
2. **乘法训练格（普通）**: 确认小数乘法题出现训练格（3 个填写框），填错有红色提示，全部正确后答案框解锁
3. **乘法训练格（困难）**: 切换到困难模式，训练格仍在但填错不提示
4. **乘法（魔王）**: 切换到魔王，确认无训练格，直接填答案
5. **除法训练格**: 除数是小数时确认训练格出现（除数位数 + 转化后的值）
6. **除法（除数整数）**: 确认无训练格
