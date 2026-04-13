# 真题库提取实施计划：A01-A08 主题精选真题

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从原始试卷素材中提取 280 道精选真题，按 CONTRIBUTING.md 规范录入到 A01-A08 主题目录，填写完整的生成器参照字段。

**Architecture:** 逐主题串行提取 — 每个主题读取对应的素材文件，识别候选计算题，按规范格式化并写入 foundation.md / advanced.md。每个主题完成后暂停等待用户抽检。

**Spec:** `math-quest/docs/specs/2026-04-08-reference-bank-extraction-design.md`

---

## 文件结构概览

所有产出文件位于 `math-quest/reference-bank/` 下：

| 文件 | 操作 | 说明 |
|------|------|------|
| `A-numbers-and-operations/A05-decimal-ops/foundation.md` | 覆写 | 目标 ~25 题 |
| `A-numbers-and-operations/A05-decimal-ops/advanced.md` | 覆写 | 目标 ~20 题 |
| `A-numbers-and-operations/A07-multi-step/foundation.md` | 追加 | 已有 8 题，追加到 ~24 题 |
| `A-numbers-and-operations/A07-multi-step/advanced.md` | 追加 | 已有 7 题，追加到 ~21 题 |
| `A-numbers-and-operations/A04-operation-laws/foundation.md` | 覆写 | 目标 ~20 题 |
| `A-numbers-and-operations/A04-operation-laws/advanced.md` | 覆写 | 目标 ~15 题 |
| `A-numbers-and-operations/A03-vertical-calc/foundation.md` | 覆写 | 目标 ~20 题 |
| `A-numbers-and-operations/A03-vertical-calc/advanced.md` | 覆写 | 目标 ~15 题 |
| `A-numbers-and-operations/A08-equation-transpose/foundation.md` | 覆写 | 目标 ~20 题 |
| `A-numbers-and-operations/A08-equation-transpose/advanced.md` | 覆写 | 目标 ~15 题 |
| `A-numbers-and-operations/A01-mental-arithmetic/foundation.md` | 覆写 | 目标 ~18 题 |
| `A-numbers-and-operations/A01-mental-arithmetic/advanced.md` | 覆写 | 目标 ~12 题 |
| `A-numbers-and-operations/A02-number-sense/foundation.md` | 覆写 | 目标 ~15 题 |
| `A-numbers-and-operations/A02-number-sense/advanced.md` | 覆写 | 目标 ~10 题 |
| `A-numbers-and-operations/A06-bracket-ops/foundation.md` | 覆写 | 目标 ~18 题 |
| `A-numbers-and-operations/A06-bracket-ops/advanced.md` | 覆写 | 目标 ~12 题 |
| `README.md` | 修改 | 更新统计概览表 |
| `CHANGELOG.md` | 追加 | 记录本次提取 |

---

## 通用参考

### 单题格式模板

每道题严格遵循此格式（来自 CONTRIBUTING.md）：

```markdown
## Q-{主题编号}-{F|A}-{三位序号}

**题目**: {完整题目文本}

**题型**: {numeric-input | multiple-choice | true-false | vertical-fill}
**答案**: {答案}
**解题步骤**:
1. {步骤1}
2. {步骤2}

**知识点**: {考查的知识点}
**易错点**: {学生常犯错误}
**来源**: {素材文件名}

**生成器参照**:
- 映射 TopicId: `{topicId}`
- 映射子函数: `{函数名}()`
- 参数模式: {描述}
- 与生成器差异: {差异说明或"无"}

**标签**: `#标签1` `#标签2`

---
```

### 选择题格式

```markdown
**题型**: multiple-choice
**选项**:
- A. {选项A} ✓（正确答案加 ✓）
- B. {选项B}
- C. {选项C}
- D. {选项D}

**答案**: A
```

### 文件头格式

```markdown
# {主题名} - {打基础|进阶}

> 主题: {topicId} | 难度档: {foundation|advanced} | 对应难度值: {1-5|6-10}
> 最后更新: 2026-04-08 | 题目数: {N}

---
```

### 候选题筛选标准

**选入**：独立计算题、计算类填空/选择/判断题
**排除**：纯文字概念题、需图片的题、应用题/文字题、几何题、统计题

### 难度分级

**Foundation (1-5)**：课本例题/课后练习水平，单一知识点，常规数值
**Advanced (6-10)**：期末中等偏难/竞赛基础，含进阶要素（多步骤/非常规数值/易错陷阱/多知识点交叉）

### 去重规则

- 同一计算式不重复录入
- 结构相同但数值不同的保留 2-3 道有代表性的
- 优先保留有明确来源标注的

---

## Task 1: A05 小数运算（45 题）

**目标**: foundation ~25 题 + advanced ~20 题

**Files:**
- Read: `reference-bank/题库-五年级上/U2-小数乘除法.md`（1.5MB 主力素材）
- Read: `reference-bank/题库-五年级上/U1-复习与提高.md`（补充）
- Read: `reference-bank/题库-五年级上/U6-整理与提高.md`（补充）
- Write: `reference-bank/A-numbers-and-operations/A05-decimal-ops/foundation.md`
- Write: `reference-bank/A-numbers-and-operations/A05-decimal-ops/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 关键参数 |
|--------|------|------|---------|
| `generateNormalAddSub()` | 小数加减法 | ≤5 | 1-2位小数，范围10-500 |
| `generateNormalMulInt()` | 小数×整数 | ≤5 | 1-2位小数，乘数2-9；含特殊值池(0.125×8等) |
| `generateNormalDivInt()` | 小数÷整数（整除） | ≤5 | 1-2位小数，除数2-9 |
| `generateHardMulDecimal()` | 小数×小数 | 6-7 | 共3位小数，a=11-300, b=11-99 |
| `generateHardDivDecimal()` | 小数÷小数 | 6-7 | ≤2位小数，商1-2位小数 |
| `generateHardMixedAddSub()` | 不同位数小数加减 | 6-7 | 各1-2位（不同），范围30×factor |
| `generateHardShift()` | 小数×10/100/1000 | 6-7 | 1-3位小数，移位 |
| `generateHardTrap()` | 两个<1小数相乘 | 6-7 | 0.1-0.9×0.1-0.9，积<两因子 |
| `generateDemonMulDecimal()` | 复杂小数乘法 | ≥8 | 40%两个<1; 60%多位数小数 |
| `generateDemonDivDecimal()` | 复杂小数除法 | ≥8 | 50%整商2位除数; 50%1位商1位除数 |
| `generateCompareSize()` | **MC: 大小比较** a×b ○ a | 1-10 | **P1 新增**。b>1/b<1/b=1，选 >/</= |
| `generateCyclicDivision()` | **循环小数除法（保留N位）** | 6-10 | **P1 新增**。除数 3/6/7/9/11，⚠️素材仅 2 处 |
| `generateHardShift()` 扩展 | 小数×0.1/×0.01（左移） | 6-10 | **P2 新增**。原有右移+新增左移 |

**提取指引**：

Foundation 题目来源优先级：
1. "直接写得数"中的小数加减乘除（`NormalAddSub`, `NormalMulInt`, `NormalDivInt`）
2. "列竖式计算"中的基础小数乘除（可标注对应 vertical-calc 但主归 decimal-ops）
3. 小数点移动规律填空题（`HardShift` 的 foundation 版）
4. **"比较大小"/"○里填><=": a×b ○ a 型（`CompareSize`）**

Advanced 题目来源优先级：
1. 小数乘小数（`HardMulDecimal`）
2. 除数是小数的除法（`HardDivDecimal`）
3. 循环小数判断/比大小（标注差异：生成器缺少循环小数题型）
4. 积商与因数/被除数的大小关系判断（`HardTrap`类）
5. 复杂小数混合运算（`DemonMulDecimal`, `DemonDivDecimal`）
6. 循环小数除法（`CyclicDivision`）⚠️素材极少，可能需手工构造
7. 大小比较 a×b ○ a（`CompareSize`）

- [ ] **Step 1: 读取主力素材**

读取 `reference-bank/题库-五年级上/U2-小数乘除法.md`。这个文件有 1.5MB/~30000行，包含 187 份试卷。扫描全文，识别所有独立的小数运算计算题（加减乘除），跳过应用题、概念填空和需要图片的题目。

记录候选题清单：题目文本 + 答案 + 出自哪份试卷。

- [ ] **Step 2: 补充素材**

如果 Step 1 的候选题不足 45 题或某类题型覆盖不全，读取补充素材：
- `reference-bank/题库-五年级上/U1-复习与提高.md`
- `reference-bank/题库-五年级上/U6-整理与提高.md`

- [ ] **Step 3: 筛选去重**

从候选题中筛选出最终 45 题（foundation ~25 + advanced ~20）：
- 去重：同一计算式只保留一份
- 结构相同的保留 2-3 道
- 确保覆盖所有子函数类型（尤其是 foundation 要覆盖 AddSub/MulInt/DivInt，advanced 要覆盖 HardMul/HardDiv/Shift/Trap/Demon）
- 按难度分级：单步简单运算→foundation，多步/非常规数值/易错→advanced

- [ ] **Step 4: 格式化并验算**

将筛选出的题目按通用模板格式化：
- 独立验算每道题的答案（不信任原始素材的答案）
- 填写解题步骤（关键步骤，不需要每个算术细节）
- 填写知识点和易错点
- 填写来源（标注素材文件名和试卷标题）
- 填写生成器参照（映射到上表的具体子函数）

- [ ] **Step 5: 写入文件**

将格式化的题目写入：
- `reference-bank/A-numbers-and-operations/A05-decimal-ops/foundation.md`（覆写空模板）
- `reference-bank/A-numbers-and-operations/A05-decimal-ops/advanced.md`（覆写空模板）

更新文件头的题目数统计。

- [ ] **Step 6: 自检**

验证：
- 题号连续且格式正确（Q-A05-F-001, Q-A05-A-001）
- 所有答案独立验算通过
- 生成器参照精确到子函数名
- foundation/advanced 分级合理
- 无重复题目
- 总数达标（≥40 题）

- [ ] **Step 7: 检查点 — 暂停等待用户审核**

输出本批次统计摘要：
- foundation 题数 / advanced 题数
- 子函数覆盖情况（哪些有映射，哪些标注了差异）
- 发现的生成器盲区（如有）

等待用户抽检 3-5 题后继续。

---

## Task 2: A07 多步混合运算（补充 30 题，已有 15 题）

**目标**: 追加到 foundation ~24 题（现有 8）+ advanced ~21 题（现有 7）

**Files:**
- Read: `reference-bank/题库-五年级上/U2-小数乘除法.md`（递等式计算部分）
- Read: `reference-bank/题库-五年级下/U1-复习与提高.md`（综合计算部分）
- Read: `reference-bank/题库-五年级上/U6-整理与提高.md`（补充）
- Read: `reference-bank/A-numbers-and-operations/A07-multi-step/foundation.md`（已有 8 题）
- Read: `reference-bank/A-numbers-and-operations/A07-multi-step/advanced.md`（已有 7 题）
- Modify: `reference-bank/A-numbers-and-operations/A07-multi-step/foundation.md`
- Modify: `reference-bank/A-numbers-and-operations/A07-multi-step/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 已有种子题? |
|--------|------|------|------------|
| `generateTwoStep()` | 整数两步运算 | ≤5 | 无 |
| `generateThreeStep()` | 整数三步运算 | 6-10 | 无 |
| `generateDecimalTwoStep()` | 小数两步运算 | 1-10 | 无 |
| `generateDecimalMultiStep()` | 复杂4步小数运算 | ≥8 | 无 |
| `generateDecimalChain()` | 小数连乘/连除 | ≥8 | 无 |
| `generateReduceSubtract()` | 连减凑整 a-b-c | ≤5 | F-001, F-002 |
| `generateDistributeRound()` | 分配律凑整 a×(R±δ) | ≤5 | F-003, F-004 |
| `generateNearRound()` | 加减凑整 a±(R-δ) | ≤5 | F-005, F-006 |
| `generateBracketNormal()` | 含括号普通运算 | ≤5 | 无 |
| `generateTrapAddBracket()` | MC:添括号陷阱 | 6-10 | A-001 |
| `generateTrapExpandPlus()` | MC:去括号(减后加) | 6-10 | A-002 |
| `generateTrapExpandMinus()` | MC:去括号(减后减) | 6-10 | A-004 |
| `generateSimplifySubtract()` | 简便计算 a-(R-δ) | 6-10 | A-003 |
| `generateExtractFactor()` | 提取公因数 | 6-10 | F-007, F-008 |
| `generateBracketHard()` | 复杂括号嵌套 | 6-10 | 无 |
| `generateTrapDistributeMissed()` | MC:漏乘陷阱 | ≥8 | A-005 |
| `generateTrapDivisionDistribute()` | MC:除法分配律陷阱 | ≥8 | A-006, A-007 |
| `generateBracketDemon()` | 魔王级括号运算 | ≥8 | 无 |

> **P2 扩展说明**：
> - `generateExtractFactor()` 已扩展隐藏公因数模式（P2新增），提取时注意含"提取公因数"的非显式题型
> - `generateReduceSubtract()` 已扩展小数版（P2新增），提取时注意小数连减凑整题

**提取指引**：

重点补充已有种子题**未覆盖**的子函数（上表中标"无"的）：
- Foundation: `generateTwoStep`, `generateDecimalTwoStep`, `generateBracketNormal`
- Advanced: `generateThreeStep`, `generateDecimalMultiStep`, `generateDecimalChain`, `generateBracketHard`, `generateBracketDemon`

寻找素材中的"递等式计算"/"脱式计算"/"能简便的用简便方法算"类题目。

- [ ] **Step 1: 读取已有种子题**

读取现有 `foundation.md`（8题）和 `advanced.md`（7题），记录已有题目的计算式，避免重复。

- [ ] **Step 2: 读取主力素材**

读取 `reference-bank/题库-五年级上/U2-小数乘除法.md` 和 `reference-bank/题库-五年级下/U1-复习与提高.md`，专门搜索"递等式计算""脱式计算""简便计算""能简便的用简便方法算"类题目。

- [ ] **Step 3: 补充素材**

如候选题不足或某类子函数未覆盖，读取：
- `reference-bank/题库-五年级上/U6-整理与提高.md`
- `reference-bank/题库-五年级下/U2-正数和负数.md`（含期末综合卷）

- [ ] **Step 4: 筛选去重**

从候选题中筛选 30 题（foundation ~16 + advanced ~14）：
- 与已有 15 题去重
- 优先填补未覆盖的子函数类型
- 确保新增题覆盖小数混合运算（已有题全是整数）

- [ ] **Step 5: 格式化并验算**

按通用模板格式化。题号从已有编号之后开始（foundation 从 F-009，advanced 从 A-008）。

- [ ] **Step 6: 追加到文件**

将新题追加到现有文件末尾（不覆盖已有内容）。更新文件头的题目数。

- [ ] **Step 7: 自检**

同 Task 1 Step 6。额外检查：新题与已有题无重复，题号连续。

- [ ] **Step 8: 检查点 — 暂停等待用户审核**

同 Task 1 Step 7。

---

## Task 3: A04 运算律（35 题）

**目标**: foundation ~20 题 + advanced ~15 题

**Files:**
- Read: `reference-bank/题库-五年级上/U2-小数乘除法.md`（运算律推广到小数部分）
- Read: `reference-bank/题库-五年级下/U1-复习与提高.md`（简便计算部分）
- Read: `reference-bank/题库-其他/未分类.md`（运算律专题）
- Write: `reference-bank/A-numbers-and-operations/A04-operation-laws/foundation.md`
- Write: `reference-bank/A-numbers-and-operations/A04-operation-laws/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 关键参数 |
|--------|------|------|---------|
| `generateCommutative()` | MC: 交换律等价形式 | 1-10 | ≤5: max50; 6-7: max200; ≥8: max500。50%加法/50%乘法 |
| `generateAssociative()` | 结合律简便计算 | 1-10 | ≤5: target 50-100; 6-7: 100-200; ≥8: 250-500 |
| `generateDistributive()` | 分配律正用/逆用 | 1-10 | ≤7: a=2-12; ≥8: a=2-25。half cases c=100-b |
| `generateLawIdentification()` | **MC: 运算律类型识别** | 1-10 | **P3 新增**。给变形式，判断用了哪种运算律 |

**提取指引**：

Foundation:
1. "用运算律填空"（交换律识别）→ `generateCommutative`
2. "用简便方法计算"中的纯结合律题（25×4, 125×8 类凑整）→ `generateAssociative`
3. 基础分配律正用（如 35×12 = 35×10+35×2）→ `generateDistributive`
4. "运用了什么运算律"/"判断用了哪种运算律"类题目 → `generateLawIdentification`

Advanced:
1. 分配律逆用（如 73×15+27×15）→ `generateDistributive`
2. 复杂结合律（如 2.5×3.2×12.5）→ `generateAssociative`
3. 多律混用简便计算 → 标注差异
4. "用字母表示运算律"判断题（交换律/结合律/分配律识别）→ `generateCommutative`
5. "运用了什么运算律"进阶判断（含混合律、逆用识别） → `generateLawIdentification`

**注意**：A04 与 A07 的简便计算有重叠。区分标准：
- 纯运算律题（识别/应用某个具体运算律）→ A04
- 综合简便计算（混用多种技巧，凑整+变号+分配律）→ A07

- [ ] **Step 1-7: 同 Task 1 的步骤**

按 Task 1 的 Step 1-7 流程执行，使用本 Task 指定的素材文件和生成器参照。

- [ ] **Step 8: 检查点 — 暂停等待用户审核**

---

## Task 4: A03 竖式笔算（35 题）

**目标**: foundation ~20 题 + advanced ~15 题

**Files:**
- Read: `reference-bank/题库-五年级上/U2-小数乘除法.md`（竖式计算核心素材）
- Read: `reference-bank/题库-五年级上/U1-复习与提高.md`（补充）
- Write: `reference-bank/A-numbers-and-operations/A03-vertical-calc/foundation.md`
- Write: `reference-bank/A-numbers-and-operations/A03-vertical-calc/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 关键参数 |
|--------|------|------|---------|
| `generateAdditionSteps()` | 多位数加法竖式（vertical-fill） | 1-10 | 含进位；>5可跳进位 |
| `generateSubtractionSteps()` | 多位数减法竖式（vertical-fill） | 1-10 | 含退位；>5可跳退位 |
| `generateMultiplicationSteps()` | 一位数×多位数竖式（vertical-fill） | 1-10 | 含进位；>5可跳进位 |
| `generateMultiDigitMult()` | 三位数×两位数（numeric-input） | 6-10 | ≤7: 100-999×11-99; ≥8: 含40%内部零 |
| `generateDivision()` | 长除法（numeric-input） | 1-10 | ≤5: 2-3位÷1位; 6-7: 3位÷1位; ≥8: 3-4位÷2位 |
| `generateDecimalAddSub()` | **小数加减竖式** (vertical-fill) | 1-10 | **A03块A 新增**。1-3位小数，含补零对齐 |
| `generateDecimalMul()` | **小数乘法** (numeric-input+训练格) | 1-10 | **A03块A 新增**。≤5:小数×整数; 6+:小数×小数 |
| `generateDecimalDiv()` | **小数除法** (numeric-input+训练格) | 1-10 | **A03块A 新增**。≤5:小数÷整数; 6+:除数是小数 |
| `generateApproximate()` | **取近似值** (numeric-input) | 6-10 | **A03块A 新增**。竖式算完后四舍五入 |

**提取指引**：

Foundation:
1. "列竖式计算"中的小数加法/减法 → `generateAdditionSteps`, `generateSubtractionSteps`
2. "列竖式计算"中的小数乘整数 → `generateMultiplicationSteps`
3. 基础除法竖式（精确到某位） → `generateDivision`
4. 小数加减竖式（含补零对齐） → `generateDecimalAddSub`
5. 小数×整数竖式 → `generateDecimalMul`

Advanced:
1. 三位数×两位数竖式 → `generateMultiDigitMult`
2. 除数是小数的除法竖式（先转化） → `generateDivision` + 标注差异（生成器无小数除数竖式）
3. 要求验算的竖式题
4. 商是循环小数的除法 → 标注差异
5. 小数×小数竖式 → `generateDecimalMul`
6. 除数是小数的小数除法 → `generateDecimalDiv`
7. 竖式计算后取近似值（四舍五入） → `generateApproximate`

**题型说明**：竖式题在原始素材中通常写作"列竖式计算"或"用竖式计算"。录入时题型写 `vertical-fill`（对应生成器 Steps 类函数）或 `numeric-input`（对应 MultiDigitMult/Division）。

- [ ] **Step 1-7: 同 Task 1 的步骤**

按 Task 1 的 Step 1-7 流程执行。

- [ ] **Step 8: 检查点 — 暂停等待用户审核**

---

## Task 5: A08 方程与等式（35 题）

**目标**: foundation ~20 题 + advanced ~15 题

**Files:**
- Read: `reference-bank/题库-五年级上/U4-简易方程.md`（核心素材）
- Read: `reference-bank/题库-五年级下/U3-简易方程二.md`（核心素材）
- Read: `reference-bank/题库-五年级下/综合期末.md`（方程专项练习）
- Read: `reference-bank/题库-其他/未分类.md`（方程练习部分）
- Write: `reference-bank/A-numbers-and-operations/A08-equation-transpose/foundation.md`
- Write: `reference-bank/A-numbers-and-operations/A08-equation-transpose/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 关键参数 |
|--------|------|------|---------|
| `generateMoveConstant()` | MC: x+a=b 移项 | ≤5 | a=5-50, x=1-50，测 +/- 变号 |
| `generateMoveFromLinear()` | MC: ax+b=c 移项 | 6-7 | x=1-20, a=2-9, b=5-80 |
| `generateMoveBothSides()` | MC: ax+b=cx+d 两边移项 | ≥8 | x=1-15, a=3-12, c=1-(a-1) |
| `generateSolveAfterTranspose()` | 数值输入: 解方程 ax+b=c | 1-10 | x=1-20, a=2-9, b=5-80 |
| `generateBracketEquation()` | **含括号方程** a(x+b)=c | 6-10 | **P1 新增**。3种模式，⚠️素材中无直接匹配 |
| `generateDivisionEquation()` | **除法方程** a÷x=b, x÷a+b=c | 1-10 | **P1 新增**。简单型+进阶型 |
| `generateEquationConcept()` | **MC: 方程概念判断** | 1-10 | **P3 新增**。辨别方程+验证解 |

**提取指引**：

Foundation:
1. 一步方程：x+a=b, x-a=b, ax=b, x÷a=b → `generateMoveConstant` / `generateSolveAfterTranspose`
2. 简单两步方程：ax+b=c, ax-b=c → `generateSolveAfterTranspose`
3. 等式判断题（哪个是方程）→ `generateEquationConcept`
4. 除法方程：a÷x=b → `generateDivisionEquation`
5. 方程概念判断（辨别方程+验证解）→ `generateEquationConcept`

Advanced:
1. 含括号方程：a(x+b)=c → `generateBracketEquation` ⚠️素材可能不足，需用宽泛关键词搜索
2. 合并同类项方程：ax+bx=c → `generateMoveBothSides`
3. 两边均有 x 的方程：ax+b=cx+d → `generateMoveBothSides`
4. 复杂多步方程 → 标注差异
5. 带小数系数方程 → 标注差异
6. 进阶除法方程：x÷a+b=c → `generateDivisionEquation`

**注意**：只选纯方程解题，不选"列方程解应用题"（应用题属于 C01-C02）。

- [ ] **Step 1-7: 同 Task 1 的步骤**

按 Task 1 的 Step 1-7 流程执行。

- [ ] **Step 8: 检查点 — 暂停等待用户审核**

---

## Task 6: A01 整数口算与速算（30 题）

**目标**: foundation ~18 题 + advanced ~12 题

**Files:**
- Read: `reference-bank/题库-五年级下/U1-复习与提高.md`（"直接写得数"类题目多）
- Read: `reference-bank/题库-五年级下/U2-正数和负数.md`（期末卷中的口算部分）
- Read: `reference-bank/题库-五年级上/U6-整理与提高.md`（补充）
- Write: `reference-bank/A-numbers-and-operations/A01-mental-arithmetic/foundation.md`
- Write: `reference-bank/A-numbers-and-operations/A01-mental-arithmetic/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 关键参数 |
|--------|------|------|---------|
| `generateMentalArithmetic()` → `generatePair()` | 单步四则运算 | 1-10 | ≤5: 10-99; 6-7: 10-999; ≥8: 100-9999。涵盖 +/-/×/÷ |
| `generateOperationOrder()` | **MC+numeric: 运算顺序** | 1-10 | **P0 新增**。2-3步混合运算，先乘除后加减，含括号 |

**提取指引**：

此主题只有一个子函数 `generatePair`，但通过难度和运算符区分。录入时参数模式需标注具体的运算符和数值范围。

Foundation:
1. 两位数加减法口算 → `generatePair` op=+/-, range=10-99
2. 一位数×两位数口算 → `generatePair` op=×, range=2-9×10-99
3. 基础整除口算 → `generatePair` op=÷
4. "运算顺序"/"先算哪一步"/"按运算顺序计算"类题目 → `generateOperationOrder`

Advanced:
1. 三位数加减法心算 → `generatePair` op=+/-, range=100-999
2. 两位数×两位数心算 → `generatePair` op=×, range=10-99×10-99
3. 三位数÷一位数心算 → `generatePair` op=÷, range=100-999÷2-9
4. 含"凑整""速算技巧"的口算 → 可能跨入 A07 范畴，需判断
5. 含括号的多步混合运算顺序判断 → `generateOperationOrder`

**注意**：口算题在素材中通常出现在"直接写得数"板块。只选整数运算，小数口算归入 A05。

- [ ] **Step 1-7: 同 Task 1 的步骤**

按 Task 1 的 Step 1-7 流程执行。

- [ ] **Step 8: 检查点 — 暂停等待用户审核**

---

## Task 7: A02 数感与估算（25 题）

**目标**: foundation ~15 题 + advanced ~10 题

**Files:**
- Read: `reference-bank/题库-五年级上/U2-小数乘除法.md`（估算/近似数/大小比较部分）
- Read: `reference-bank/题库-五年级上/U1-复习与提高.md`（四舍五入/数感部分）
- Read: `reference-bank/题库-五年级上/U6-整理与提高.md`（补充）
- Write: `reference-bank/A-numbers-and-operations/A02-number-sense/foundation.md`
- Write: `reference-bank/A-numbers-and-operations/A02-number-sense/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 关键参数 |
|--------|------|------|---------|
| `generateEstimate()` | 估算表达式结果 | 1-10 | ≤5: +/-only, max500; 6-7: 含×, max5000; ≥8: ×, max50000。需四舍五入到最近整十/整百 |
| `generateRound()` | 四舍五入到指定位 | 1-10 | ≤5: 1-1000; 6-7: 1-50000; ≥8: 1-500000。Hard/Demon有30%陷阱(digit=5) |
| `generateCompare()` | **MC: 不计算比较大小** | 1-10 | **P1 新增**。a×b ○ a，b>1/b<1/b=1 |
| `generateFloorCeil()` | **去尾法/进一法** | 1-10 | **P3 新增**。非四舍五入的取近似值 |
| `generateReverseRound()` | **逆向推理** | 1-10 | **P3 新增**。给近似值求原数最大/最小 |

**提取指引**：

Foundation:
1. "四舍五入保留一位/两位小数" → `generateRound`
2. "先估再算"类题目 → `generateEstimate`
3. 比较大小："0.7×3.6 ○ 3.6"（乘以<1的数变小）→ `generateCompare`
4. "去尾法/进一法"取近似值 → `generateFloorCeil`

Advanced:
1. 大数四舍五入（保留到万/亿）→ `generateRound`
2. 复杂估算（乘法估算）→ `generateEstimate`
3. 循环小数比大小 → 标注差异（生成器无此题型）
4. "一个数×0.85, 积比这个数___"（因数<1积变小）→ `generateCompare`
5. "逆向推理"：给近似值求原数最大/最小 → `generateReverseRound`

- [ ] **Step 1-7: 同 Task 1 的步骤**

按 Task 1 的 Step 1-7 流程执行。

- [ ] **Step 8: 检查点 — 暂停等待用户审核**

---

## Task 8: A06 括号变换（30 题）

**目标**: foundation ~18 题 + advanced ~12 题

**Files:**
- Read: `reference-bank/题库-五年级下/U1-复习与提高.md`（含中括号递等式）
- Read: `reference-bank/题库-五年级上/U2-小数乘除法.md`（递等式中的括号部分）
- Read: `reference-bank/题库-五年级下/综合期末.md`（补充）
- Write: `reference-bank/A-numbers-and-operations/A06-bracket-ops/foundation.md`
- Write: `reference-bank/A-numbers-and-operations/A06-bracket-ops/advanced.md`

**生成器子函数参照**：

| 子函数 | 题型 | 难度 | 关键参数 |
|--------|------|------|---------|
| `generateRemoveBracketPlus()` | 去括号（加号前，不变号）| 1-10 | ≤5: max99; 6-7: max500; ≥8: max2000 |
| `generateRemoveBracketMinus()` | 去括号（减号前，变号）| 1-10 | ≤5: max200; 6-7: max1000; ≥8: max5000 |
| `generateAddBracket()` | 添括号 a-b-c 形式 | 6-10 | ≤5: max500; 6-7: max2000; ≥8: max9999 |
| `generateNestedBracket()` | 嵌套括号（多层）| ≥8 | a=200-2000, b=50-200, c=10-80, d=5-40 |
| `generateDivisionProperty()` | **MC: 除法性质** a÷b÷c = a÷(b×c) | 6-10 | **P2 新增**。连除=除以积，常用凑整对 |

**提取指引**：

Foundation:
1. "去括号计算" a+(b+c), a+(b-c) → `generateRemoveBracketPlus`
2. "去括号计算" a-(b+c), a-(b-c) → `generateRemoveBracketMinus`
3. 含小括号的基础递等式

Advanced:
1. "添括号简便计算" a-b-c = a-(b+c) → `generateAddBracket`
2. 含中括号 [ ] 的递等式 → `generateNestedBracket`
3. 嵌套括号 a-[b-(c+d)] → `generateNestedBracket`
4. "除法性质"/"连除"类题目 a÷b÷c = a÷(b×c) → `generateDivisionProperty`
5. 括号变换的小数版（含小数的去括号/添括号）

**注意**：A06 与 A07 有重叠。区分标准：
- 纯括号变换（去括号/添括号规则练习）→ A06
- 括号只是多步运算中的一个环节（如 25×(8+4) 分配律）→ A07

- [ ] **Step 1-7: 同 Task 1 的步骤**

按 Task 1 的 Step 1-7 流程执行。

- [ ] **Step 8: 检查点 — 暂停等待用户审核**

---

## 素材覆盖缺口说明（2026-04-09 更新）

P0-P3 新增了 15 个子函数。素材覆盖分析显示：

- **13 个题型素材充足**（匹配数 37-2696），可直接从素材中提取
- **A05 循环小数除法**：素材仅 2 处提及，需要从教案素材中深挖或手工构造参考题
- **A08 含括号方程**：素材中未找到直接匹配，方程章节可能有隐含题目，需用更宽泛关键词搜索

提取时对这两个缺口题型，优先从以下素材查找：
- 循环小数：`sources/scraped/grade5-lower/U3-简易方程二-教案学案.md`
- 含括号方程：`题库-五年级上/U4-简易方程.md`、`题库-五年级下/U3-简易方程二.md`

---

## Task 9: 更新统计文件

**Files:**
- Modify: `reference-bank/README.md`（统计概览表）
- Modify: `reference-bank/CHANGELOG.md`（变更记录）
- Modify: `CLAUDE.md`（架构说明中的描述）

- [ ] **Step 1: 统计各主题实际题数**

遍历 A01-A08 的 foundation.md 和 advanced.md，统计每个文件的实际题目数量。

- [ ] **Step 2: 更新 README.md 统计表**

更新 `reference-bank/README.md` 第 103-109 行的统计概览表，填入实际数字：

```markdown
| 领域 | 主题数 | foundation | advanced | 合计 | 完成度 |
|------|--------|-----------|----------|------|--------|
| A 数与运算 | 9 | {F总数} | {A总数} | {合计}/315 | {百分比}% |
| B 几何 | 2 | 0 | 0 | 0 | 0% |
| C 应用题 | 2 | 0 | 0 | 0 | 0% |
| D 统计 | 1 | 0 | 0 | 0 | 0% |
| **总计** | **14** | **{F总}** | **{A总}** | **{总}/525** | **{%}%** |
```

- [ ] **Step 3: 更新 CHANGELOG.md**

在 CHANGELOG.md 顶部添加新条目：

```markdown
## 2026-04-08 (阶段 1)

### 真题提取：A01-A08

- 从原始试卷素材（4.6MB, 634份试卷）中提取精选真题
- A01 整数口算与速算: {N}题 (foundation {F} + advanced {A})
- A02 数感与估算: {N}题
- A03 竖式笔算: {N}题
- A04 运算律: {N}题
- A05 小数运算: {N}题
- A06 括号变换: {N}题
- A07 多步混合运算: {N}题 (从15题扩充)
- A08 方程与等式: {N}题
- 总计: {总}题，占总目标 525 题的 {%}%

### 统计
- 素材扫描: 10个文件，约4MB
- 生成器参照覆盖: 已映射到 {N} 个子函数
- 发现生成器盲区: {列表}
```

- [ ] **Step 4: 更新 CLAUDE.md**

更新 `CLAUDE.md` 中 reference-bank 描述，将"A07 已有 15 道种子题，其余待从题库素材中提取录入"更新为实际状态。

- [ ] **Step 5: 自检并提交**

验证所有更新文件的格式和数据一致性。
