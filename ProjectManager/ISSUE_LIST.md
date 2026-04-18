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
- **状态**: ✅ 已修复（2026-04-14 热修复 1.4）
- **修复**: generateMoveConstant 和 generateMoveFromLinear 均扩充至 4 个选项（增加反序错误和遗忘移项错误模式）

---

## P1 — 重要（正确性/质量）

### ISSUE-004: generateReverseRound 浮点精度问题
- **状态**: ✅ 已修复（2026-04-14 热修复 3.1）
- **修复**: 改为纯整数运算 `roundedScaled * 10 ± offset`，最后只做一次整数/10^n 除法

### ISSUE-005: generateOperationOrder MC 干扰项质量差
- **状态**: ✅ 已修复（2026-04-14 热修复 3.2）
- **修复**: `generateWrongFirstSteps` 改为三层生成策略：①表达式相邻子表达式 ②正确步换运算符 ③非相邻数对组合，不再使用随机数字

### ISSUE-006: generateCompareSize b=1 概率过高（33%）
- **状态**: ✅ 已修复（2026-04-14 热修复 3.3）
- **修复**: b>1 42.5%、b<1 42.5%、b=1 15%（decimal-ops.ts 和 number-sense.ts 同步修改）

### ISSUE-007: multi-step 中 generateTwoStep/generateThreeStep 是死代码
- **状态**: ✅ 已修复（2026-04-14 热修复 3.4）
- **修复**: 已删除 `generateTwoStep` 和 `generateThreeStep` 两个函数（确认无外部引用）

---

## P2 — 增强（测试/规范）

### ISSUE-008: 约 40% 子函数无直接测试覆盖
- **状态**: ✅ 已修复（2026-04-16）
- **修复**: 新增 `difficulty-tiers.test.ts`（58 条测试），覆盖 8 个生成器的 `getSubtypeEntries` 三档返回值 + 11 个原未覆盖子函数（通过 subtypeFilter 精准触发）+ 三档结构断言（operand 范围、MC 选项完整性、答案有效性、小数精度、嵌套括号结构等）。全量测试 225/225 通过。

### ISSUE-009: 提示文本质量不一致
- **状态**: ✅ 降级关闭（2026-04-16）
- **原因**: 经排查，`question.hints` 字段虽由各生成器填充，但 UI 层从未使用（`hintsUsed` 在 store 中硬编码为 0）。该字段属于"死数据"，不影响用户体验。后续如需启用提示功能，再重新设计。

### ISSUE-010: 答案格式不统一
- **状态**: ✅ 已修复（2026-04-16）
- **修复**: 提取共享 `formatNum()` 到 `src/engine/generators/utils.ts`，替换 4 个生成器文件中的重复定义（multi-step / bracket-ops / decimal-ops / vertical-calc）。经排查 number-sense 的 `toLocaleString()` 仅用于 prompt/explanation 展示文本，answer 本身为原始 number，不影响比较。全量测试 225/225 通过。

---

## 2026-04-14 v2 全量测试新发现

### ISSUE-011: 闯关路线与实际出题不匹配（系统性）
- **状态**: ✅ 已修复（2026-04-14 热修复第二批）
- **修复**: 新增 `SubtypeEntry` + `pickSubtype` 架构；8 个生成器全部改造支持 `subtypeFilter`；44 条路线全部配置子题型过滤；`store/index.ts` 调用层传递参数

### ISSUE-012: History/SessionDetail 页面不可达
- **状态**: ✅ 已修复（2026-04-14 热修复 1.3）
- **修复**: Progress 页面新增"查看练习记录 →"按钮

### ISSUE-013: 注册后初始 GameProgress 未持久化到 localStorage
- **状态**: ✅ 已修复（2026-04-14 热修复 1.2）
- **修复**: `loadGameProgress` 末尾增加 `repository.saveGameProgress(gp)`

### ISSUE-014: 去掉年级区分，统一以上海五年级小升初为难度基准
- **状态**: ✅ 已修复（2026-04-14 热修复 1.1 + 第四批）
- **修复**: 注册流程删除年级选择；`User.grade` 标记可选；难度基准文档编写完成（[Specs/2026-04-14-difficulty-standard.md](Specs/2026-04-14-difficulty-standard.md)）；44 条路线 difficulty 校准通过

---

## 2026-04-14 深度体验拟真人工 QA Batch 1 分流结果

### ISSUE-015 (P1): 竖式题填完后不会自动判定
- **状态**: ✅ 按产品决策接受（不修复）
- **来源**: `manual-qa-deep-experience-batch1` / `I-05`
- **现象**: 用户把竖式题所有必填格填完后，页面仍停留在竖式板，需要显式执行提交步骤
- **产品结论**: 点击 `提交` 或显式提交是必要步骤，不能跳过；该行为按现设计接受
- **处理结果**: 不进入后续修复排期，不作为待解决问题跟踪

### ISSUE-016 (P1): 竖式题答错后看不到完整正确竖式
- **状态**: ✅ 按产品决策接受（不修复）
- **来源**: `manual-qa-deep-experience-batch1` / `I-08`
- **现象**: 错误提交后会显示对错反馈与扣心结果，但不会保留完整正确竖式板面
- **产品结论**: 当前结算 / 反馈层只要能让用户知道是否答对、是否扣心即可；不要求展示完整正确竖式
- **处理结果**: 不进入后续修复排期，不作为待解决问题跟踪

### ISSUE-017（原始发现，后续已修复）: 竖式减法退位提示可发现性偏弱
- **状态**: ✅ 已修复（2026-04-16；修复细节见文末“ISSUE-017（更新）”）
- **来源**: `manual-qa-deep-experience-batch1` / `I-02`
- **现象**: 退位机制和上方辅助格本身存在，但缺少足够显性的提示告诉用户”这一列必须退位”
- **影响**: 第一次接触该交互的用户容易靠猜，理解成本偏高
- **用户感知**: 不像老师在纸笔作业上给出的明确引导，教学感偏弱
- **建议修复方向**: 在存在进位 / 退位辅助格的题型上增加一个可点开的 `Tips` 说明，解释上方小格的用途与使用时机；必要时再叠加更醒目的视觉标记

---

## 2026-04-14 UI 设计审查 + WCAG AA 无障碍审查（全产品）

> 来源：`/ui-design:design-review` + `/ui-design:accessibility-audit --level AA`  
> 完整报告：  
> - [.ui-design/reviews/mathquest_20260414_full.md](../.ui-design/reviews/mathquest_20260414_full.md)  
> - [.ui-design/audits/mathquest_a11y_20260414_AA.md](../.ui-design/audits/mathquest_a11y_20260414_AA.md)

### UI 设计审查 — 严重（Critical）

### ISSUE-018 (UI/Critical): SessionSummary 使用无效 CSS token `bg-error/10`
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: `src/pages/SessionSummary.tsx:24`
- **现象**: 失败 Banner 用 `bg-error/10`，但设计系统中 token 名为 `--color-danger`，无 `error`。失败状态背景色不生效，与通关状态外观难以区分
- **修复**: `bg-error/10` → `bg-danger/10`

### ISSUE-019 (UI/Critical): SessionSummary 在渲染期间直接调用 `setPage`
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: `src/pages/SessionSummary.tsx:10-12`
- **现象**: `lastSession` 为 null 时直接调用 `setPage('home')`，违反 React 渲染纯函数原则，在严格/并发模式下可能触发无限重渲染
- **修复**: 将 `setPage('home')` 移入 `useEffect`

---

### UI 设计审查 — 重要（Major）

### ISSUE-020 (UI/Major): 底部导航栏5份重复代码（DRY 严重违反）
- **状态**: ✅ 已关闭（子计划 2 / 2.5 附带完成，2026-04-18 子计划 3 §零交叉验证）
- **位置**: Home.tsx / Progress.tsx / WrongBook.tsx / Profile.tsx / History.tsx
- **修复**: 已提取 `src/components/BottomNav.tsx`，5 个页面全部改用 `<BottomNav activeTab={...} />`
- **验证**: `ls src/components/BottomNav.tsx` 存在；5 页均传入 `activeTab` 属性

### ISSUE-021 (UI/Major): `useGameProgressStore` 导入来源不一致
- **状态**: ✅ 已关闭（2026-04-15）
- **位置**: WrongBook.tsx:1 / Profile.tsx:1（从 `@/store`）vs Home.tsx:3 / Progress.tsx:2 / CampaignMap.tsx:6 / App.tsx:4（从 `@/store/gamification`）
- **现象**: 同一个 store hook 从两个不同路径导入，若 `@/store` 未正确 re-export，页面数据可能不一致
- **修复**: 统一改为从 `@/store` 导入（barrel re-export，tsc 0 错误验证通过）

### ISSUE-022 (UI/Major): CampaignMap 关卡按钮触控区域偏小且内容密度高
- **状态**: ✅ 已修复（Phase 2 Boss 视觉重设计中隐式修复，按钮 96/120px，字号 12px）
- **位置**: `src/pages/CampaignMap.tsx:114-134`
- **现象**: 固定 `w-16 h-16`（64px），内显示图标+题数+3颗心，心数用 `text-[10px]`（约10px），在移动端极难辨认
- **修复**: 增大至 min 72px，心数改 `text-xs`（12px）

### ISSUE-023 (UI/Major): 错题本每主题仅展5题且无”查看全部”入口
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/pages/WrongBook.tsx`
- **修复**: 新增 expandedTopics 状态，每主题默认显示 5 题，超出显示"显示全部 N 题"按钮，可展开/收起


### ISSUE-024 (UI/Major): 页面加载无 Loading 占位，出现黑色闪烁
- **状态**: ✅ 已修复（前序迭代已改为 LoadingScreen 组件，2026-04-16 确认关闭）
- **位置**: Home.tsx:13 / WrongBook.tsx:9 / Profile.tsx:9
- **现象**: `user`/`gameProgress` 为 null 时直接 `return null`，低端设备上有明显黑屏帧
- **修复**: 返回居中加载占位 div

---

### UI 设计审查 — 次要（Minor）

### ISSUE-025 (UI/Minor): 硬编码颜色值混入设计 token 系统
- **状态**: ✅ 已关闭（2026-04-18，子计划 3 B1-T1）
- **位置**: VerticalCalcBoard.tsx:302/398/421（`#e53935`）; Home.tsx:83 / Progress.tsx:57（`#58cc02`）
- **修复**:
  - `#58cc02` 在前序迭代中已随 token 体系切换移除（验证：`rg '#58cc02' src/` 零命中）
  - `#e53935` 三处（VerticalCalcBoard.tsx 小数点渲染行内 style）统一改为 `var(--color-danger)`
  - 验证：`rg '#e53935' src/` 零命中；tsc -b 0 错误；vitest 328/328 PASS

### ISSUE-026 (UI/Minor): 多处使用 `text-[10px]`，低于儿童最小可读字号
- **状态**: ✅ 已关闭（子计划 2 / 2.5 附带完成，2026-04-18 子计划 3 §零交叉验证）
- **位置**: Profile.tsx / SessionDetail.tsx / CampaignMap
- **验证**: `rg 'text-\[10px\]' src/` 零命中；相关位置已全部改用 `text-xs`（12px）或更大字号

### ISSUE-027 (UI/Minor): Profile 页昵称下方硬编码”五年级”
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: `src/pages/Profile.tsx:42`
- **修复**: 改为固定文案 `数学大冒险`

### ISSUE-028 (UI+a11y/Serious): 图标/符号按钮缺少 aria-label（WCAG 4.1.2）
- **状态**: ✅ 已修复（2026-04-16，前序已补全 ← ✕ 关卡 aria-label，本轮补 Profile 音效开关 role="switch"）
- **位置**: 所有”←”返回按钮（WrongBook/Profile/CampaignMap/History/SessionDetail）; Practice “✕” 退出按钮; CampaignMap 关卡按钮
- **来源**: 设计审查 N-04 + 无障碍审查 A-S01（合并）
- **修复**: 所有图标按钮加 `aria-label`，内容用 `aria-hidden=”true”`

### ISSUE-029 (UI/Minor): History 底部导航无激活状态高亮
- **状态**: ✅ 已关闭（随 ISSUE-020 附带完成，2026-04-18 子计划 3 §零交叉验证）
- **位置**: `src/pages/History.tsx`
- **修复**: History.tsx 使用 `<BottomNav activeTab="progress" />`，激活态高亮由 BottomNav 组件统一处理

### ISSUE-030 (UI/Minor): VerticalCalcBoard `handleSubmit` 向下引用 `highestNonZeroCol`
- **状态**: ✅ 已关闭（2026-04-18，子计划 3 B1-T2）
- **位置**: `src/components/VerticalCalcBoard.tsx:186`（函数定义在 174 行，被引用变量在 342 行）
- **修复**: 将 `highestNonZeroCol` 的 useMemo 移到 `handleSubmit` 定义之前；依赖项 `columns` / `totalCols` 在上方已定义，纯代码移动无行为变化；tsc -b 0 + vitest 328/328 PASS

### ISSUE-031 (UI/Minor): Practice 多处 `as any` 类型断言绕过类型系统
- **状态**: ✅ 已关闭（2026-04-18，子计划 3 B1-T3）
- **位置**: `src/pages/Practice.tsx`（旧 :46/:205，v2.2 后位移至 :75-76 和 :347，共 3 处）
- **修复**: 提取 `dataTrainingFields` 局部变量，使用结构化类型 `(currentQuestion.data as { trainingFields?: TrainingField[] }).trainingFields` 替代裸 `as any`；JSX 中 `(currentQuestion.data as any).trainingFields` 改为直接引用 `dataTrainingFields`
- **验证**: `rg 'as any' src/pages/Practice.tsx` 零命中；tsc -b 0 + vitest 328/328 PASS

---

### 无障碍审查 WCAG AA — 严重（Critical）

### ISSUE-032 (a11y/Critical): 主按钮文字对比度仅 2.09:1（WCAG 1.4.3 AA 需 ≥4.5:1）
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/styles/globals.css:67-72`（`.btn-primary`）及所有使用该类的页面
- **现象**: `text-white`（#ffffff）在 `bg-primary`（#58cc02）上对比度 2.09:1，远低于 AA 标准，全产品曝光量最大的可访问性问题
- **修复**: 将按钮文字改为深色（如 `#1a3a00`，对比度约 6.5:1），参考 Duolingo 自身实践

### ISSUE-033 (a11y/Critical): `user-scalable=no` 阻止用户调整文字大小（WCAG 1.4.4）
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: `index.html:5`
- **现象**: `maximum-scale=1.0, user-scalable=no` 阻止系统层面的文字缩放，有视力需求的儿童或家长无法使用辅助功能放大
- **修复**: viewport 仅保留 `width=device-width, initial-scale=1.0, viewport-fit=cover`

---

### 无障碍审查 WCAG AA — 严重（Serious）

### ISSUE-034 (a11y/Serious): 退出确认弹窗缺 `role=”dialog”` 和焦点陷阱（WCAG 2.1.2 / 4.1.2）
- **状态**: ✅ 已修复（Dialog 组件已含 role="dialog" + 焦点陷阱 + ESC，2026-04-16 确认关闭）
- **位置**: `src/pages/Practice.tsx:285-308`
- **现象**: 自定义模态框无 dialog 语义，弹窗出现时焦点不移入，键盘用户可操作弹窗后方内容
- **修复**: 添加 `role=”dialog” aria-modal=”true” aria-labelledby`，useEffect 聚焦弹窗容器

### ISSUE-035 (a11y/Serious): 所有进度条无 ARIA 角色与属性（WCAG 4.1.2）
- **状态**: ✅ 已修复（ProgressBar 组件 + Practice 圆点进度已含完整 ARIA，2026-04-16 确认关闭）
- **位置**: Home.tsx:77-88 / Progress.tsx:54-59 / Practice.tsx:117-120
- **现象**: 纯视觉 div 实现，屏幕阅读器无法感知进度数值
- **修复**: 添加 `role=”progressbar” aria-valuenow aria-valuemin aria-valuemax aria-valuetext`

### ISSUE-036 (a11y/Serious): 答题反馈区无 `aria-live`，屏幕阅读器不播报结果（WCAG 4.1.3）
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: `src/pages/Practice.tsx:244-280`
- **现象**: 提交答案后动态插入的反馈（正确/错误）无 live region，视障用户无法知道是否答对
- **修复**: 在 Practice 根元素内加 `aria-live="polite"` 的 `sr-only` 播报区域

---

### 无障碍审查 WCAG AA — 中等（Moderate）

### ISSUE-037 (a11y/Moderate): `text-danger` 在 `bg-card` 背景对比度 4.37:1，低于 AA（WCAG 1.4.3）
- **状态**: ✅ 已关闭（2026-04-18，子计划 3 B3-E3，评估后直接关闭）
- **位置**: `src/pages/WrongBook.tsx:58` / `src/pages/SessionDetail.tsx:117` 等
- **评估**: `--color-danger` 当前值为 `#FF6B6B`（2026-04-14 UI redesign 阶段已从旧 `#ff4b4b` 更新），在 `bg-card: #1a2c35` 上实测对比度 ≈ 4.83:1，**满足 AA 正文阈值 4.5:1**。其他低对比度用法（如 `.digit-cell-wrong` 在 `bg-danger-lt: #FFF5F5` 上 ≈ 2.58:1）均属临时错误态，附带红色边框 + 抖动动画辅助区分，不作为主要信息载体
- **结论**: 原 issue 基于旧色值陈述，当前色值已满足主要 AA 要求；无需调整

### ISSUE-038 (a11y/Moderate): DecimalTrainingGrid 使用亮色系，脱离应用暗色主题
- **状态**: ✅ 已关闭（子计划 2 / 2.5 附带完成，2026-04-18 子计划 3 §零交叉验证）
- **位置**: `src/components/DecimalTrainingGrid.tsx`
- **修复**: 组件已改用 `bg-primary-lt` / `border-primary-mid` 等应用 token
- **验证**: `rg 'amber|gray-600' src/components/DecimalTrainingGrid.tsx` 零命中

### ISSUE-039 (a11y/Moderate): 心数展示缺可访问文字描述（WCAG 1.1.1）
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: Practice.tsx:130-134 / SessionSummary.tsx:37-42 / CampaignMap.tsx:56-65
- **现象**: ❤ emoji 列表读出”红心 红心 红心”，无法传达”当前剩余X条命”语义
- **修复**: 心数容器加 `role="img" + aria-label="剩余生命 X 颗，共 3 颗"`，emoji 加 `aria-hidden="true"`

### ISSUE-040 (a11y/Moderate): 无 `prefers-reduced-motion` 支持
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: `src/styles/globals.css`（shake/float-up/pulse-grow/fade-in 四种动画）
- **现象**: 对前庭障碍或运动敏感用户（含部分有感知障碍的儿童）可能造成不适
- **修复**: 在 globals.css 末尾加 `@media (prefers-reduced-motion: reduce)`，统一压缩动画与过渡时长

### ISSUE-041 (a11y/Moderate): 关卡完成/可玩/锁定状态仅颜色区分（WCAG 1.4.1）
- **状态**: ✅ 已关闭（2026-04-18，子计划 3 B3-E1，评估后降级关闭）
- **位置**: `src/pages/CampaignMap.tsx`
- **评估**: 原 issue 描述"完成（绿）和可玩（也是绿）"，实际代码中两态分别为绿色（完成）/ 橙色（可玩）；且除颜色外同时具备：
  - 图标差异：完成态打钩（✓），可玩态播放三角（▶）
  - 底部文字差异：完成态显示心数，可玩态显示题数
  - aria-label 差异：已分别明确状态
- **结论**: 非颜色区分手段已充分，符合 WCAG 1.4.1；无需改动

---

### 无障碍审查 WCAG AA — 次要（Minor）

### ISSUE-042 (a11y/Minor): `autoFocus` 干扰屏幕阅读器虚拟光标
- **状态**: ✅ 已关闭（2026-04-18，子计划 3 B3-E2，评估后降级关闭）
- **位置**: Practice.tsx / VerticalCalcBoard.tsx / Onboarding.tsx 共 5 处
- **评估**:
  - 目标用户为小学五年级儿童，明视用户占绝对主体；`autoFocus` 让进入答题页即可直接输入，体验收益大
  - 改为 `useEffect` 受控焦点仅为时机调整，不消除"自动移焦"本身；对屏幕阅读器用户影响等价
  - 已有 `aria-live`、`aria-label`、`aria-describedby` 等配套措施为屏幕阅读器提供上下文
  - WCAG 将此归为 Minor，严重度低
- **结论**: UX 收益大于可访问性微影响；维持现状

### ISSUE-043 (a11y/Minor): 输入框 placeholder 承载关键操作说明（WCAG 3.3.2）
- **状态**: ✅ 已关闭（2026-04-18，子计划 3 B2-T1）
- **位置**: `src/pages/Practice.tsx`
- **修复**:
  - 输入框 `placeholder` 统一为 `"输入答案"`，不再承载条件提示
  - 在输入框上方新增持久可见的 `<p id="training-hint" className="text-sm font-bold text-warning">先完成上方训练格</p>`，仅在 `hasTrainingFields && !trainingComplete` 时渲染
  - 输入框通过 `aria-describedby={hasTrainingFields && !trainingComplete ? 'training-hint' : undefined}` 关联
- **验证**: tsc -b 0 + vitest 328/328 PASS

### ISSUE-044 (a11y/Minor): 页面切换无 `document.title` 更新（WCAG 2.4.2）
- **状态**: ✅ 已修复（2026-04-14 UI hotfix 6.1）
- **位置**: `src/App.tsx`
- **现象**: Zustand 路由切换不更新标题，所有页面读到的都是”数学大冒险”，屏幕阅读器无法区分
- **修复**: App.tsx 使用 `useEffect` 监听 `currentPage` 并按页面映射更新 `document.title`

### ISSUE-045 (a11y/Minor): 无跳过导航链接（WCAG 2.4.1）
- **状态**: ✅ 已关闭（2026-04-18 子计划 3 B2-T2 浏览器抽测时确认：早已实现）
- **位置**: `index.html:17` + `src/App.tsx` `<main id="main-content">`
- **实际情况**: UI redesign 阶段（`.skip-link` CSS 类和 `index.html` 的 `<a href="#main-content" class="skip-link">跳至主要内容</a>` 均已落地，注释明确标注 "WCAG 2.4.1"），且 `App.tsx` 返回的 `<main>` 一直持有 `id="main-content"`，锚点目标有效
- **验证**: 浏览器 `browser_snapshot` 捕获到 "跳至主要内容" link，Tab 聚焦可见；本轮子计划 3 最初在 `App.tsx` 重复注入的 skip-link 已撤销，避免重复

---

## 2026-04-16 试玩反馈修复（对应计划：Plan/2026-04-16-p1p2-fixes.md）

### ISSUE-046 (Bug/P1): 结算面板心数不更新
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/store/index.ts`，`submitAnswer` 函数
- **现象**: 答错 2 题后结算面板显示 16/18 但心数仍显示 3（初始值）
- **根因**: `submitAnswer` 只更新组件级 `hearts` 状态，未同步更新 `session.heartsRemaining`
- **修复**: 将 `newHearts` 计算移到 `updatedSession` 构造前，并在 session 中写入 `heartsRemaining: newHearts`

### ISSUE-047 (Bug/P1): 除法整除比例异常（difficulty 6-7 阶段 100% 整除）
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/engine/generators/mental-arithmetic.ts`，`generatePair` 函数 `case '÷'`
- **现象**: difficulty 6-7 强制 `a = b * answer`，100% 整除；难度越高反而越整洁
- **修复**: difficulty 6-7 引入 40% 有余数概率；difficulty 8+ 引入 30% 有余数概率；新增验证测试

### ISSUE-048 (UI/P1): Boss 关无视觉差异
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/pages/CampaignMap.tsx`
- **现象**: `isBoss: true` 字段已存在但渲染层完全忽略，Boss 关与普通关外观相同
- **修复**: Boss 阶段显示🔥红色横幅分隔符；Boss 关按钮高度 120px（普通 96px）、danger 配色、"👹 Boss"标签、图标 44px

### ISSUE-049 (内容/P1): Boss 关与综合挑战关内容雷同
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/constants/campaign.ts`
- **现象**: 全部 8 主题 Boss S4 difficulty=7 与 S3 末关相同，题型无差异
- **修复**: Boss difficulty 提至 9，questionCount 提至 25；S3-L3 提至 8，S2-L3 提至 6（含 qa-v3.test.ts 断言同步更新）

### ISSUE-050 (UX/P1): 进阶模式/段位赛对新用户完全不可见
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/pages/Home.tsx`
- **现象**: 未解锁进阶时首页无任何进阶/段位赛信息，新用户不知道有更高目标
- **修复**: 进阶训练入口始终显示（未解锁时呈锁定灰色 div + "通关任意主题解锁进阶星级挑战"）；主题卡片未解锁时显示灰色星 + "通关解锁"

### ISSUE-051 (难度设计/P2): 关卡难度梯度缺失
- **状态**: ✅ 已修复（2026-04-16，与 ISSUE-049 合并处理）
- **位置**: `src/constants/campaign.ts`
- **现象**: 8 个主题 S2/S3 阶段内 L2 与 L3 共享同一 difficulty 值，玩法无差异
- **修复**: 系统性调整，详见 ISSUE-049

### ISSUE-052 (UI/P2): 顶部进度圆点过多时挤压心数显示
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/pages/Practice.tsx`，顶栏圆点进度区域
- **现象**: 题数多时圆点无限扩张，将右侧 Hearts 挤出视口
- **修复**: 题数 >15 时改为数字指示 "N / M"；≤15 时保留圆点并加 `overflow-hidden min-w-0`

### ISSUE-053 (UX/P2): 关卡地图未自动滚动到当前待做关卡
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/pages/CampaignMap.tsx`
- **现象**: 推荐关卡已算出但页面始终从顶部加载，需手动下滑
- **修复**: 添加 `useRef` + `useEffect`，300ms 后 `scrollIntoView({ behavior: 'smooth', block: 'center' })`

### ISSUE-054 (UI/P2): 题目文本过长时算式折行
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/pages/Practice.tsx`，题目 `<h2>` 元素
- **现象**: 长算式在 32px 字号下换行，表达式断裂
- **修复**: 加 `whitespace-nowrap overflow-x-auto`；按 prompt.length 动态选字号（≤18: 32px / 19-25: 24px / >25: 20px）

### ISSUE-055 (UX/P2): 余数输入框获焦导致页面跳动
- **状态**: ✅ 已修复（2026-04-16）
- **位置**: `src/components/VerticalCalcBoard.tsx`
- **现象**: 移动端点击格子后 focus() 触发浏览器自动滚动，页面突然跳动
- **修复**: 所有 `inputRef.current.focus()` 改为 `focus({ preventScroll: true })`；隐藏 input 加 `style={{ scrollMargin: 0 }}`

### ISSUE-017（更新）: 竖式减法退位提示可发现性偏弱
- **状态**: ✅ 已修复（2026-04-16，原状态：⬜ 待评估）
- **位置**: `src/components/VerticalCalcBoard.tsx`
- **修复**: 存在进位/退位辅助格且用户尚未填入任何值时，显示脉冲提示"💡 上方小格用于记录退位/进位"；填入第一个值后提示消失

---

## 2026-04-17 生成器题型设计 v2.1 重做（对应计划：Plan/2026-04-17-generator-redesign-v2-implementation.md）

### ISSUE-056 (生成器/P0): A01-A08 题型梯度失效、答题形式偏离教学目的、题型间重叠
- **状态**: ✅ 已完成（阶段 1-6 全部完成，2026-04-17；关卡重划独立为 ISSUE-057）
- **来源**: 2026-04-17 人工验证 + 前人经验研究
- **核心问题**:
  1. 多题型三档靠"数字变大"拉梯度，学生无感知差异（A01/A02/A04/A08 等）
  2. A05 与 A02（比大小）和 A03（需笔算乘除）大量重叠
  3. A06 去/添括号用选择题无法训练变换能力；A07 只考最终得数无法训练"识别简便 + 变形"双能力；A08 填空模板已把变号帮学生做掉
- **设计规格**: `Specs/2026-04-17-generator-redesign-v2.md` **v2.2**
- **实施计划**: `Plan/2026-04-17-generator-redesign-v2-implementation.md`（阶段 6：压档 + 细节修订）
- **范围**: A01-A08 八个生成器 + 前端新组件（表达式输入、多选 MC、书面分数、多步填空）
- **依赖**: 阶段 3 依赖阶段 1 的前端能力调查结论

### ISSUE-057 (游戏化结构/P1): campaign.ts 关卡分段需对齐 A01/A04/A08 的 2 档压缩
- **状态**: ✅ 已完成（2026-04-17，范围扩张为"全 8 题型关卡设计理念重构"）
- **范围扩张说明**:
  - 初始范围：只压缩 A01/A04/A08 三个题型为"档1 → 档2 → Boss"
  - 审计发现：8 个题型里 7 个的 S3 "综合/高阶" 段没有 `subtypeFilter`，实质是"Boss 弱化版"，违反"普通关聚焦知识点、Boss 关综合考察"的设计理念
  - 用户确认理念后扩范围：8 个题型全部重构，普通关必有 `subtypeFilter`，Boss 关无 `subtypeFilter`
- **实施**:
  - `src/constants/campaign.ts` 完全重写（见文件头注释与分段映射）
  - A01/A04/A08 压为 "档1 / 档2 / Boss" 3 段；其余 5 题型保持 "低档 / 中档 / 高档 / Boss" 4 段但全部补 `subtypeFilter`
  - 总 lane 数 54 → 50；每题型关卡数见 `Reports/2026-04-17-campaign-migration-note.md`
- **存档迁移**: `src/repository/local.ts` 的 `migrateCampaignIfNeeded`（策略 X）——旧 Boss 已通→新结构全关直接满星；旧 Boss 未通→丢弃孤儿记录，从新结构续关
- **测试**: `qa-v3.test.ts` B-09 关卡数字典 + A-24 总 lane 数已更新；`npx vitest run` 263/263 通过
- **来源**: 2026-04-17 晚复盘——A01/A04/A08 按进阶规格 `TOPIC_STAR_CAP` 压缩为 2 档后，`campaign.ts` 中这三个题型的关卡分段（当前"3 段 + Boss"结构）与生成器 2 档输出不再对齐
- **当前分段假设**: 低档关 → 中档关 → 高档关 → Boss
- **新实际分布**: 生成器只会产出档 1 / 档 2，因此"中档关"实际会被档 1 或档 2 其中之一填充
- **影响**:
  - 短期可接受——`getDifficultyEntries` 在该题型没有中档分布时会退化为相邻档，玩法不会断
  - 但关卡名称 / 难度标签 / 进度可视化会与实际题目档位错位
- **范围**: `src/data/campaign.ts` 中 A01/A04/A08 三个题型的关卡表
- **推荐方案**: 三个题型改为"档 1 段 → 档 2 段 → Boss"（少 1 段）；或保留 3 段但在前端显式把第 2 段标注为"档 1 加强 / 档 2 预热"
- **暂不处理的理由**: 本轮（ISSUE-056 阶段 6）只动生成器分布，避免破坏现有玩家进度。待 ISSUE-057 独立排期时统一重划并做存档迁移
- **关联**: ISSUE-056 阶段 6；`Specs/2026-04-15-gamification-phase2-advance-spec.md` `TOPIC_STAR_CAP`

### ISSUE-058 (生成器/P1): v2.2 重构遗留的 tsc 类型错误阻塞生产构建
- **状态**: ✅ 已关闭（2026-04-17 子计划 2.5 S1-T1）
- **来源**: 2026-04-17 ISSUE-057 QA 流程中发现——`npx vitest run` 全绿（270/270），但 `npm run build`（`tsc -b && vite build`）的 tsc 阶段报 **24 个类型错误**，vite 打包根本不会执行
- **根因**: v2.2 生成器重构（ISSUE-056 阶段 6）新增的 subtype 字面量（`nested-bracket` / `four-items-sign` / `error-diagnose` / `trap` 等）和 data 字段（`subtype` / `position`）没有同步进 `src/types/` 下的对应 data 类型声明
- **错误分布**（全部集中在 `src/engine/generators/*.ts`，与 ISSUE-057 完全无关）:
  - `bracket-ops.ts`: 5 条（3 × TS2322 subtype 字面量 + 2 × TS2353 position 字段未声明）
  - `equation-transpose.ts`: 9 条（TS2353 `subtype` 字段在 `EquationTransposeData` 中未声明）
  - `multi-step.ts`: 9 条（TS2353 `subtype` 字段在 `MultiStepData` 中未声明）
  - `decimal-ops.ts`: 1 条（TS2322 `'trap'` 字面量不在现有 subtype 联合类型中）
  - `mental-arithmetic.ts`: 1 条（TS6133 `pickTwoDigitDivisor` 声明未用）
- **影响**:
  - 单测和 dev server 都不受影响（`vite` 走 esbuild，对类型错误宽松）
  - 但生产 `npm run build` 彻底失败，无法产出部署包
- **修复方向**: 在 `src/types/` 或生成器文件顶部的本地类型声明里，把 v2.2 新增 subtype 加入联合类型、把 `subtype`/`position` 等字段补进对应 data 接口；删除 `pickTwoDigitDivisor` 或加 `// eslint-disable-next-line` / 改为 `_pickTwoDigitDivisor`
- **验证**: `npm run build` 能跑通 tsc 阶段并进入 vite 打包
- **关联**:
  - ISSUE-056 阶段 6（根因来源）
  - ISSUE-057 QA 报告 Q-057-F03（发现证据）：`Reports/2026-04-17-qa-issue057-session.md`
- **非关联**: 本 issue 不是 ISSUE-057 引入的；ISSUE-057 只动了 `campaign.ts` / `qa-v3.test.ts` / `local.ts` 三个文件，与所有报错文件无因果关系
- **关闭记录** (2026-04-17 子计划 2.5 S1-T1):
  - `src/types/index.ts` 精准补齐 4 份 data 类型（BracketOpsData/EquationTransposeData/MultiStepData 新增可选字段，DecimalOpsData subtype 追加 'trap'）
  - `src/engine/generators/mental-arithmetic.ts` 删除零引用死函数 `pickTwoDigitDivisor`
  - 验证：`npx tsc -b` 24→0；`npm run build` 产出 dist；`npx vitest run` 270/270 PASS
  - 详见 `Plan/2026-04-17-campaign-advance-stabilization.md` §八 S1 执行结果

### ISSUE-059 (实现一致性/P2): `dec-div` 高档残留隐藏 `trainingFields`
- **状态**: ⬜ 新发现（2026-04-18）；挂靠 A03 块B Plus 实施子子计划评估处理
- **位置**: `src/engine/generators/vertical-calc.ts` / `src/pages/Practice.tsx`
- **现象**: `vertical-calc.ts` 的高档 `dec-div` 仍会生成 `trainingFields`，但 `Practice.tsx` 仅在 `difficulty < 8` 时渲染训练格，导致这批字段对用户完全不可见
- **影响**:
  - 当前不构成直接用户可见 bug，因为高档题实际上仍按“直接答数”工作
  - 但实现和规格容易被误读，后续开发者可能误以为高档小数除法应显示训练格
- **产品口径**: 以 `Specs/2026-04-18-a03-block-b-plus-design.md` 为准——A03 当前版本 `difficulty >= 8` 不显示训练格；这些隐藏字段不是产品承诺
- **建议处理方向**:
  - 要么在生成器侧移除这批隐藏 `trainingFields`
  - 要么在提交流程/渲染流程里显式忽略它们，并补注释说明
  - 处理目标不是新增功能，而是消除“数据层有、UI 层无”的实现歧义
