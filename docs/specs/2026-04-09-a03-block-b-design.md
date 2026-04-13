# A03 竖式笔算 — 块 B：VerticalCalcBoard 组件重构设计

> 日期: 2026-04-09
> 来源: 对话中确认的设计方案 + A03 审视报告
> 依赖: A03 块 A（生成器小数支持）已完成

---

## 1. 目标

增强 A03 竖式笔算的交互体验，让小数乘除法的关键思维步骤通过"训练格"体现在交互流程中，培养学生掌握小数位数判定能力。

## 2. 四种运算的交互设计

### 2.1 小数加减法 — vertical-fill（增强 VerticalCalcBoard）

- **交互方式**: 在现有 VerticalCalcBoard 网格中增加小数点列
- **核心训练**: 小数点对齐、位数不同处补零、进退位
- **难度分级**: 三档都是逐格填写，无差异
- **改动范围**: VerticalCalcBoard.tsx 组件 + vertical-calc.ts 生成器中加减法的 steps 生成逻辑

### 2.2 小数乘法 — numeric-input + 训练格

- **交互方式**: 先填训练格，再填最终答案
- **训练格内容（3 个字段）**:
  1. "因数1 有 [?] 位小数"
  2. "因数2 有 [?] 位小数"
  3. "积共有 [?] 位小数"（= 字段1 + 字段2）
- **训练格规则**: 全部填完才解锁答案输入
- **难度分级**:
  - 普通: 训练格显示，填错**立即提示**并要求改正
  - 困难: 训练格显示，填错**不提示**，填完即解锁
  - 魔王: **无训练格**，直接填答案
- **核心训练**: 积的小数点位置（含补前导零的情况，如 0.04×0.07=0.0028）

### 2.3 小数除法（除数是小数）— numeric-input + 训练格

- **交互方式**: 先填训练格，再填最终答案
- **训练格内容（3 个字段）**:
  1. "除数有 [?] 位小数"
  2. "除数变成 [?]"（移位后的整数）
  3. "被除数变成 [?]"（同步移位后的值）
- **训练格规则**: 全部填完才解锁答案输入
- **难度分级**:
  - 普通: 训练格显示，填错**立即提示**
  - 困难: 训练格显示，填错**不提示**
  - 魔王: **无训练格**，直接填答案
- **核心训练**: 除数变整数的转化过程

### 2.4 小数除法（除数是整数）— 纯 numeric-input

- **交互方式**: 直接填答案，无训练格
- **所有难度**: 相同
- **提示文字**: "商的小数点与被除数的小数点对齐"

## 3. 组件架构

### 3.1 新增组件: DecimalTrainingGrid

独立的训练格组件，接受字段配置和难度级别，管理解锁逻辑。

```
Props:
  - fields: Array<{ label: string, answer: number | string }>
  - difficulty: number  (决定是否显示、是否给反馈)
  - onComplete: () => void  (全部填完后回调，解锁答案输入)
```

适用于乘法和除法（除数小数）两种场景，字段配置不同但组件复用。

### 3.2 增强: VerticalCalcBoard

在现有组件基础上增加小数点列支持：
- 小数点列不可编辑，固定显示
- 操作数按小数点对齐（右对齐整数部分，左对齐小数部分）
- 位数不同时短的一方自动补零（灰色显示）
- 结果行的小数点位置与操作数对齐

### 3.3 修改: Practice.tsx

答题页面根据题目的 `type` 和数据类型决定渲染哪种交互组件：
- `type: 'vertical-fill'` + 操作数含小数 → 增强版 VerticalCalcBoard
- `type: 'numeric-input'` + 有训练格配置 → DecimalTrainingGrid + 数字输入
- `type: 'numeric-input'` + 无训练格 → 原有数字输入

## 4. 数据结构变更

### 4.1 扩展 VerticalCalcData

```typescript
export interface VerticalCalcData {
  kind: 'vertical-calc';
  operation: '+' | '-' | '×' | '÷';
  operands: number[];
  steps: VerticalCalcStep[];
  // 新增: 训练格配置（乘法和除法使用）
  trainingFields?: TrainingField[];
}

export interface TrainingField {
  label: string;        // 显示文本，如 "因数1有 ? 位小数"
  answer: string;       // 正确答案
  placeholder?: string; // 输入提示
}
```

### 4.2 生成器适配

- 加减法: 生成 `VerticalCalcStep[]`（含小数点列信息）+ `type: 'vertical-fill'`
- 乘法: 生成 `trainingFields` + `type: 'numeric-input'`
- 除法（除数小数）: 生成 `trainingFields` + `type: 'numeric-input'`
- 除法（除数整数）: 无 trainingFields + `type: 'numeric-input'`

## 5. 难度矩阵

| 运算 | 普通 (≤5) | 困难 (6-7) | 魔王 (8+) |
|------|-----------|-----------|-----------|
| 加减法 | vertical-fill | vertical-fill | vertical-fill |
| 乘法 | 训练格 + 反馈 | 训练格 + 无反馈 | 无训练格 |
| 除法（除数小数） | 训练格 + 反馈 | 训练格 + 无反馈 | 无训练格 |
| 除法（除数整数） | 直接填答案 | 直接填答案 | 直接填答案 |

## 6. 不包含在本次范围内

- 乘法部分积的多行竖式展示
- 除法的逐步试商竖式交互
- 验算机制
- 这些作为未来增强项，本次聚焦训练格 + 加减法小数点列
