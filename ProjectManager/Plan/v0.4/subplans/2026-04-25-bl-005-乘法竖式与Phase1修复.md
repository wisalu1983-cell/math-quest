# BL-005 乘法竖式与 Phase 1 修复子计划

> 创建：2026-04-25
> 所属版本：v0.4
> 父计划：v0.4-1
> 设计规格：`ProjectManager/Specs/2026-04-17-generator-redesign-v2.md`、`ProjectManager/Specs/2026-04-09-a03-block-b-design.md`、`ProjectManager/Specs/2026-04-14-ui-redesign-spec.md`
> 状态：✅ 已完成（2026-04-25）

---

## 一、背景

### 前置相关规格

| 规格 | 本计划继承的硬约束 |
|---|---|
| `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` | A03 竖式笔算低档纯整数；中档引入小数乘法与多位整数乘法；高档包含中间 0 乘法、小数乘法和复杂结构；A03 负责需要列竖式的计算。 |
| `ProjectManager/Specs/2026-04-09-a03-block-b-design.md` | 旧规格把小数乘法做成 `numeric-input + trainingFields`，并明确“不包含乘法部分积的多行竖式展示”；本计划在 v0.4 Phase 1 中覆盖这部分旧边界。 |
| `ProjectManager/Specs/2026-04-14-ui-redesign-spec.md` | 遵守阳光版 v5：暖白背景、白卡片、橙色主操作、绿色成功态、文字最小 11px、题目 UI 不突破现有答题卡片约束。 |
| `ProjectManager/ISSUE_LIST.md` | `ISSUE-059`：`dec-div` 高档不应残留隐藏 `trainingFields`，修复后需有关闭证据。 |
| `ProjectManager/Backlog.md` | `BL-005.1`、`BL-005.3`、`BL-005.5` 是本计划来源；`BL-005.2` 进位格三档规则留在 Phase 4，不混入本计划。 |

### 跨系统维度清单

- [x] 难度档位 / 题型梯度数：只调整 A03 乘法竖式与 `dec-div` 字段一致性，不改变 `TOPIC_STAR_CAP`。
- [ ] 星级 / 进阶 / 段位数值：无直接数值变更；需用现有进阶抽题路径做回归。
- [ ] 关卡结构 / campaign.ts：不改关卡结构。
- [x] UI 组件 / 卡片尺寸：新增多位乘法竖式板，必须在 Practice 答题卡内可读、可滚动、不挤压移动端。
- [x] 答题形式 / 验证逻辑：多位整数乘法和小数乘法改为竖式板交互；小数最终答数支持 `56` / `56.0` 等价。
- [ ] 存档 / 同步 / 数据迁移：不新增持久化字段。
- [x] QA / 验收产物：按 QAleader 输出测试用例、自动化、视觉 QA、拟真人工 QA 和汇总。

## 二、目标与范围

### 目标

- 让多位整数乘法不再退化为单个答案输入，而是模拟真实竖式：部分积逐行填写，最后相加得到总积。
- 保留乘数为一位数的现有 `VerticalCalcBoard` 设计，不在 Phase 1 改动进位格三档判定。
- 让小数乘法复用多位整数乘法竖式：题面只给原始小数算式，竖式数字格从整数乘数开始全部由学生填写。
- 将“小数点定位”改为明确动作：`小数点向左移动 [ ] 位`，再由学生填写最终答数。
- `56` / `56.0` 这类等价仅作用于最终答数，不放宽“小数点移动几位”的中间判断。
- 提升竖式数字 / 符号可读性，避免浅灰导致孩子看不清。
- 清除 `dec-div` 高档残留隐藏 `trainingFields`。

### 非目标

- 不实现 `BL-005.2` 进位格三档规则；该规则仍归 Phase 4。
- 不重做长除法逐步试商竖式。
- 不调整 A03 难度分布和 “360÷3 出现在 3 星” 的问题；该项归 Phase 3。
- 不把小数乘法拆成新的 topic 或新的全局题型。

## 三、已确认交互设计

### 3.1 多位整数乘法

题面示例：`782 × 14`

- 竖式顶部显示已知整数操作数。
- 不显示辅助进位格。
- 不显示“×4 / ×10”这类左侧乘数提示格。
- 学生填写每一行部分积和最终总积。
- 空白占位只表达位值对齐，不算输入。

### 3.2 小数乘法

题面示例：`4.06 × 23`

- 题目不显示 `406 × 23`。
- 竖式控件数字格全空白，从整数乘数开始填：
  - `4.06` 去掉小数点后填 `406`
  - `23` 填 `23`
  - 再填写部分积与整数总积
- 小数定位区显示：
  - `4.06 有 [ ] 位小数`
  - `23 有 [ ] 位小数`
  - `小数点向左移动 [ ] 位`
  - `最终答数 [ ]`
- 检查逻辑：
  - 两个因数的小数位数必须填准确。
  - 小数点向左移动位数 = 两个因数小数位数之和。
  - 最终答数使用数值等价判定，允许去掉末尾 0。

### 3.3 用户确认记录

- 2026-04-25 预览确认：小数乘法最终需要用户自己填答数，题目不显示答数。
- 2026-04-25 预览确认：`56 / 56.0` 等价只针对最终答数，不代表小数点移动位数可填 `0` 或 `1`。
- 2026-04-25 预览确认：小数题竖式控件应完全空白，让学生从乘数开始填。
- 2026-04-25 预览确认：当前 `?preview=mult` 效果可进入正式 Phase 1 开发。

## 四、实施拆解

| Task | 内容 | 状态 | 证据 |
|---|---|---|---|
| T1 | 纯函数与类型：新增乘法竖式 board 数据结构 / 构造 / 答案归一化测试 | ✅ | `src/engine/verticalMultiplication.test.ts` |
| T2 | 组件：新增生产版 `MultiplicationVerticalBoard`，并由 `VerticalCalcBoard` 分发 | ✅ | `src/components/MultiplicationVerticalBoard.tsx`；视觉 QA |
| T3 | 生成器：多位整数乘法与小数乘法输出竖式板数据；一位乘数保留旧设计 | ✅ | `src/engine/generators/generators.test.ts` |
| T4 | 判定：小数最终答数 `56` / `56.0` 等价，中间位数严格判定 | ✅ | `src/engine/answerValidation.test.ts`；QA I-06/I-07 |
| T5 | `ISSUE-059`：高档 `dec-div` 清除隐藏 `trainingFields` | ✅ | `src/engine/generators/generators.test.ts`；`ISSUE_LIST.md` |
| T6 | UI 可读性：竖式数字 / 符号使用 `text-text` 等高对比 token | ✅ | 视觉 QA 结论已回写；原始 QA run 不入库 |
| T7 | QAleader 三层 QA：Code Review → 自动化 → 拟真人工 / 视觉 | ✅ | 三层 QA 通过；原始 QA run 不入库 |
| T8 | 手机竖屏专项：真实游戏页 390px / 375px 兼容性回归 | ✅ | 移动端专项通过；原始 QA run 不入库 |

## 五、实现要点

### 5.1 数据结构

- 在 `VerticalCalcData` 中增加可选字段 `multiplicationBoard`。
- `multiplicationBoard` 只服务乘法竖式，不影响现有加减法 / 一位乘法 / 除法。
- 关键字段：
  - `mode: 'integer' | 'decimal'`
  - `integerOperands: [number, number]`
  - `operandInputMode: 'static' | 'blank'`
  - `operandDecimalPlaces?: [number, number]`
  - `decimalPlaces?: number`
  - `finalAnswer?: string`

### 5.2 组件分层

- `VerticalCalcBoard` 保留为入口。
- 当 `data.multiplicationBoard` 存在时，渲染 `MultiplicationVerticalBoard`。
- 否则继续走旧的列竖式格子逻辑。

### 5.3 生成器

- `generateIntMul`：
  - `difficulty <= 5` 且乘数是一位数：保留旧 `vertical-fill + generateMultiplicationSteps`。
  - `difficulty > 5` 的多位整数乘法：输出 `vertical-fill + multiplicationBoard`。
- `generateDecimalMul`：
  - 中档小数 × 整数、高档小数 × 小数均输出 `vertical-fill + multiplicationBoard`。
  - 不再输出小数乘法 `trainingFields`。
- `generateDecimalDiv`：
  - 中档保留原行为。
  - 高档 `dec-div` 不再写 `trainingFields`。

## 六、验收

- [x] `src/engine/verticalMultiplication.test.ts` 覆盖部分积、总积、小数点移动、最终答数归一化。
- [x] `src/engine/generators/generators.test.ts` 覆盖多位整数乘法与小数乘法的新数据结构，以及一位乘法旧设计保留。
- [x] `src/engine/answerValidation.test.ts` 明确覆盖 `56` / `56.0` 等价。
- [x] `ISSUE-059` 有测试证明高档 `dec-div` 不再残留 `trainingFields`。
- [x] `npm test` 通过：43 files / 643 tests。
- [x] `npm run build` 通过：`tsc -b && vite build`。
- [x] 视觉 QA 检查当前 UI token、桌面预览、竖式数字对比度、输入格状态；真实游戏页 390px / 375px 手机竖屏专项通过。
- [x] QAleader 三层 QA 已执行并回写结论；原始 QA run 按制度不入库。

### 验收证据

| 类型 | 结果 |
|---|---|
| 目标测试 | `npm test -- src/engine/verticalMultiplication.test.ts src/engine/generators/generators.test.ts src/engine/answerValidation.test.ts`：3 files / 128 tests passed |
| 全量测试 | `npm test`：43 files / 643 tests passed |
| 构建 | `npm run build`：通过；保留既有 chunk size warning |
| scoped lint | 本次 touched scope ESLint 通过 |
| 全量 lint | 仍被既有 lint 债务阻塞，未新增到本次 touched scope |
| QA | QAleader 三层 QA 通过；原始 QA run 不入库 |
| 移动端专项 | 390px / 375px 真实游戏页通过；原始 QA run 不入库 |

## 七、回写

- 本子计划完成后回写 `ProjectManager/Plan/v0.4/phases/phase-1.md`。
- `ISSUE-059` 修复后回写 `ProjectManager/ISSUE_LIST.md`。
- QA 执行后只回写结论到本计划与 Phase 1 文件；原始 QA run 不入库。
- 若 Phase 1 全部完成，更新 `ProjectManager/Plan/v0.4/README.md` 和 `ProjectManager/Overview.md` 的当前状态。
