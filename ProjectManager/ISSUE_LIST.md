# 出题模块 Issue List

> 来源: 2026-04-09 全面审计
> 状态: 待逐条讨论

---

## P0 — 必须修复（影响核心体验）

### ISSUE-001: 7/8 生成器缺少 timeLimit
- **状态**: ✅ 完全关闭（含后续清理）
- **原因**: 速度奖励系统在游戏化重设计 Phase 1 中整体删除，timeLimit 不再影响任何奖励逻辑
- **2026-04-13 补充清理**: 删除 mental-arithmetic.ts 和 number-sense.ts 中残留的 `timeLimit` 字段（共 7 处），同步删除 Practice.tsx 的倒计时 state / useEffect / 进度条 UI，彻底移除计时器功能
- ~~**影响**: 速度计时器不启动，速度奖励（XP 加成）和速度成就不可触发~~

### ISSUE-002: 答案比较不够健壮
- **状态**: ✅ Phase 1 已内含修复
- **修复位置**: `src/store/index.ts` `submitAnswer` 的 `normalize` 函数已加入尾零去除（`.replace(/\.?0+$/, '')`）和 Unicode 省略号替换（`.replace(/\u2026/g, '...')`）
- ~~**原因**: 用户输入格式稍有不同就判错~~

### ISSUE-003: A08 generateMoveConstant 只有 2 个选项
- **影响**: MC 题只有 2 个选项，50% 蒙对率，无教学价值
- **现状**: `const options = shuffle([correct, wrong1])` — 只有正确答案和一个干扰项
- **涉及文件**: equation-transpose.ts lines 19-64
- **修复方向**: 增加 2 个干扰项（如：忘记移项、符号全错等常见错误模式）
- **工作量**: 小

---

## P1 — 重要（正确性/质量）

### ISSUE-004: generateReverseRound 浮点精度问题
- **影响**: 逆向推理答案可能因浮点运算偏差导致错误
- **示例**: `2.5 - 0.05` 在 JS 中可能得到 `2.4499999...` 而非 `2.45`
- **涉及文件**: number-sense.ts generateReverseRound
- **修复方向**: 用整数运算（乘以 10^n 后计算再除回）避免浮点
- **工作量**: 小

### ISSUE-005: generateOperationOrder MC 干扰项质量差
- **影响**: 干扰项是随机生成的 `a op b`，可能与题目表达式完全无关，学生不用思考就能排除
- **示例**: 题目 `2 × 3 + 4`，干扰项 `17 + 5`（明显不在表达式中）
- **涉及文件**: mental-arithmetic.ts generateWrongFirstSteps
- **修复方向**: 从表达式中提取所有合法子表达式作为干扰项
- **工作量**: 中

### ISSUE-006: generateCompareSize b=1 概率过高（33%）
- **影响**: b=1 时答案恒为 `=`，无训练价值但占 1/3 概率
- **涉及文件**: decimal-ops.ts generateCompareSize, number-sense.ts generateCompare
- **修复方向**: b=1 概率降到 10-15%
- **工作量**: 小

### ISSUE-007: multi-step 中 generateTwoStep/generateThreeStep 是死代码
- **影响**: 导出但不被调度器调用（Phase 0 移除），可能误导维护者
- **涉及文件**: multi-step.ts lines 34-124
- **修复方向**: 删除或加注释标记为 deprecated
- **工作量**: 小

---

## P2 — 增强（测试/规范）

### ISSUE-008: 约 40% 子函数无直接测试覆盖
- **影响**: 回归风险高，新增的 P0-P3 子函数部分缺少独立测试
- **缺失测试的子函数**: generateDemonMulDecimal, generateDemonDivDecimal, generateHardMixedAddSub, generateDecimalChain, generateDecimalMultiStep, generateNestedBracket, generateDivisionProperty, generateBracketEquation, generateDivisionEquation, generateEquationConcept, generateLawIdentification
- **修复方向**: 为每个子函数至少添加基础断言（答案有效、类型正确）
- **工作量**: 中（~2小时）

### ISSUE-009: 提示文本质量不一致
- **影响**: 部分提示是教学性引导（好），部分只是答案解释（差）
- **修复方向**: 统一为"引导思考方向"而非"告诉答案"的风格
- **工作量**: 中

### ISSUE-010: 答案格式不统一
- **影响**: formatNum vs toLocaleString vs 原始值，潜在比较问题
- **示例**: number-sense 用 `toLocaleString()`（加千位逗号），其他用 `formatNum()`
- **修复方向**: 统一使用 `formatNum()`，store 的 normalize 函数兼容两种格式
- **工作量**: 小
