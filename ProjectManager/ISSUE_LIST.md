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

### ISSUE-017 (P2): 竖式减法退位提示可发现性偏弱
- **状态**: ⬜ 待评估 / 体验增强
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
- **状态**: ⬜ 待修复
- **位置**: `src/pages/SessionSummary.tsx:24`
- **现象**: 失败 Banner 用 `bg-error/10`，但设计系统中 token 名为 `--color-danger`，无 `error`。失败状态背景色不生效，与通关状态外观难以区分
- **修复**: `bg-error/10` → `bg-danger/10`（1行）

### ISSUE-019 (UI/Critical): SessionSummary 在渲染期间直接调用 `setPage`
- **状态**: ⬜ 待修复
- **位置**: `src/pages/SessionSummary.tsx:10-12`
- **现象**: `lastSession` 为 null 时直接调用 `setPage('home')`，违反 React 渲染纯函数原则，在严格/并发模式下可能触发无限重渲染
- **修复**: 将 `setPage` 移入 `useEffect`（5行）

---

### UI 设计审查 — 重要（Major）

### ISSUE-020 (UI/Major): 底部导航栏5份重复代码（DRY 严重违反）
- **状态**: ⬜ 待修复
- **位置**: Home.tsx:96-115 / Progress.tsx:94-113 / WrongBook.tsx:83-102 / Profile.tsx:117-136 / History.tsx:97-116
- **现象**: 完全相同的底部导航 JSX 复制5份，History 页还漏掉了激活状态高亮。任何改动须同步5处
- **修复**: 提取 `<BottomNav activeTab={...} />` 组件，顺带修复 ISSUE-029

### ISSUE-021 (UI/Major): `useGameProgressStore` 导入来源不一致
- **状态**: ⬜ 待调查
- **位置**: WrongBook.tsx:1 / Profile.tsx:1（从 `@/store`）vs Home.tsx:3 / Progress.tsx:2 / CampaignMap.tsx:6（从 `@/store/gamification`）
- **现象**: 同一个 store hook 从两个不同路径导入，若 `@/store` 未正确 re-export，页面数据可能不一致
- **修复**: 统一从 `@/store/gamification` 导入，或在 `@/store/index.ts` 明确 re-export 并注释

### ISSUE-022 (UI/Major): CampaignMap 关卡按钮触控区域偏小且内容密度高
- **状态**: ⬜ 待修复
- **位置**: `src/pages/CampaignMap.tsx:114-134`
- **现象**: 固定 `w-16 h-16`（64px），内显示图标+题数+3颗心，心数用 `text-[10px]`（约10px），在移动端极难辨认
- **修复**: 增大至 min 72px，心数改 `text-xs`（12px）

### ISSUE-023 (UI/Major): 错题本每主题仅展5题且无”查看全部”入口
- **状态**: ⬜ 待修复
- **位置**: `src/pages/WrongBook.tsx:54-71`
- **现象**: 超出5题后显示”还有 X 题...”但无按钮查看，错题本核心功能受损
- **修复**: 添加展开/折叠交互

### ISSUE-024 (UI/Major): 页面加载无 Loading 占位，出现黑色闪烁
- **状态**: ⬜ 待修复
- **位置**: Home.tsx:13 / WrongBook.tsx:9 / Profile.tsx:9
- **现象**: `user`/`gameProgress` 为 null 时直接 `return null`，低端设备上有明显黑屏帧
- **修复**: 返回居中加载占位 div

---

### UI 设计审查 — 次要（Minor）

### ISSUE-025 (UI/Minor): 硬编码颜色值混入设计 token 系统
- **状态**: ⬜ 待修复
- **位置**: VerticalCalcBoard.tsx:302/398/421（`#e53935`）; Home.tsx:83 / Progress.tsx:57（`#58cc02`）
- **现象**: 绕过 CSS 变量，未来改主题色时需在多处手动搜索替换
- **修复**: 改用 `var(--color-danger)` / `var(--color-success)` 等 CSS 变量

### ISSUE-026 (UI/Minor): 多处使用 `text-[10px]`，低于儿童最小可读字号
- **状态**: ⬜ 待修复
- **位置**: Profile.tsx:49/52/55; SessionDetail.tsx:67/71/76; CampaignMap 心数
- **现象**: 10px 对五年级小学生（目标用户）视力负担较大，最小建议 12px
- **修复**: 全局替换 `text-[10px]` → `text-xs`（12px）

### ISSUE-027 (UI/Minor): Profile 页昵称下方硬编码”五年级”
- **状态**: ⬜ 待修复
- **位置**: `src/pages/Profile.tsx:42`
- **修复**: 改为”数学大冒险”或读取 user 字段

### ISSUE-028 (UI+a11y/Serious): 图标/符号按钮缺少 aria-label（WCAG 4.1.2）
- **状态**: ⬜ 待修复
- **位置**: 所有”←”返回按钮（WrongBook/Profile/CampaignMap/History/SessionDetail）; Practice “✕” 退出按钮; CampaignMap 关卡按钮
- **来源**: 设计审查 N-04 + 无障碍审查 A-S01（合并）
- **修复**: 所有图标按钮加 `aria-label`，内容用 `aria-hidden=”true”`

### ISSUE-029 (UI/Minor): History 底部导航无激活状态高亮
- **状态**: ⬜ 待修复（随 ISSUE-020 一并修复）
- **位置**: `src/pages/History.tsx:105-112`
- **现象**: 所有 tab 都用 `text-text-secondary`，无选中态
- **修复**: 提取 BottomNav 后传 `activeTab=”progress”`

### ISSUE-030 (UI/Minor): VerticalCalcBoard `handleSubmit` 向下引用 `highestNonZeroCol`
- **状态**: ⬜ 代码整洁问题
- **位置**: `src/components/VerticalCalcBoard.tsx:186`（函数定义在 174 行，被引用变量在 342 行）
- **修复**: 将 `highestNonZeroCol` 的 useMemo 移到 `handleSubmit` 定义之前

### ISSUE-031 (UI/Minor): Practice 多处 `as any` 类型断言绕过类型系统
- **状态**: ⬜ 待修复
- **位置**: `src/pages/Practice.tsx:46/205`
- **修复**: 为 question.data 使用判别联合类型（discriminated union）

---

### 无障碍审查 WCAG AA — 严重（Critical）

### ISSUE-032 (a11y/Critical): 主按钮文字对比度仅 2.09:1（WCAG 1.4.3 AA 需 ≥4.5:1）
- **状态**: ⬜ 待修复
- **位置**: `src/styles/globals.css:67-72`（`.btn-primary`）及所有使用该类的页面
- **现象**: `text-white`（#ffffff）在 `bg-primary`（#58cc02）上对比度 2.09:1，远低于 AA 标准，全产品曝光量最大的可访问性问题
- **修复**: 将按钮文字改为深色（如 `#1a3a00`，对比度约 6.5:1），参考 Duolingo 自身实践

### ISSUE-033 (a11y/Critical): `user-scalable=no` 阻止用户调整文字大小（WCAG 1.4.4）
- **状态**: ⬜ 待修复
- **位置**: `index.html:5`
- **现象**: `maximum-scale=1.0, user-scalable=no` 阻止系统层面的文字缩放，有视力需求的儿童或家长无法使用辅助功能放大
- **修复**: 移除 `user-scalable=no` 和 `maximum-scale=1.0`（1行改动）

---

### 无障碍审查 WCAG AA — 严重（Serious）

### ISSUE-034 (a11y/Serious): 退出确认弹窗缺 `role=”dialog”` 和焦点陷阱（WCAG 2.1.2 / 4.1.2）
- **状态**: ⬜ 待修复
- **位置**: `src/pages/Practice.tsx:285-308`
- **现象**: 自定义模态框无 dialog 语义，弹窗出现时焦点不移入，键盘用户可操作弹窗后方内容
- **修复**: 添加 `role=”dialog” aria-modal=”true” aria-labelledby`，useEffect 聚焦弹窗容器

### ISSUE-035 (a11y/Serious): 所有进度条无 ARIA 角色与属性（WCAG 4.1.2）
- **状态**: ⬜ 待修复
- **位置**: Home.tsx:77-88 / Progress.tsx:54-59 / Practice.tsx:117-120
- **现象**: 纯视觉 div 实现，屏幕阅读器无法感知进度数值
- **修复**: 添加 `role=”progressbar” aria-valuenow aria-valuemin aria-valuemax aria-valuetext`

### ISSUE-036 (a11y/Serious): 答题反馈区无 `aria-live`，屏幕阅读器不播报结果（WCAG 4.1.3）
- **状态**: ⬜ 待修复
- **位置**: `src/pages/Practice.tsx:244-280`
- **现象**: 提交答案后动态插入的反馈（正确/错误）无 live region，视障用户无法知道是否答对
- **修复**: 在 Practice 根元素内加 `<div aria-live=”polite” aria-atomic=”true” className=”sr-only”>` 播报结果

---

### 无障碍审查 WCAG AA — 中等（Moderate）

### ISSUE-037 (a11y/Moderate): `text-danger` 在 `bg-card` 背景对比度 4.37:1，低于 AA（WCAG 1.4.3）
- **状态**: ⬜ 待修复
- **位置**: `src/pages/WrongBook.tsx:58` / `src/pages/SessionDetail.tsx:117`（均为 `text-xs` 尺寸）
- **现象**: #ff4b4b 在 #1a2c35 上对比度 4.37:1，低于正文 AA 要求 4.5:1
- **修复**: 将 `--color-danger` 调整为 `#ff3333`（对比度约 5.3:1），或局部场景用更深红色

### ISSUE-038 (a11y/Moderate): DecimalTrainingGrid 使用亮色系，脱离应用暗色主题
- **状态**: ⬜ 待修复（与 ISSUE-025 方向一致）
- **位置**: `src/components/DecimalTrainingGrid.tsx:54-93`
- **现象**: 组件用 `bg-amber-50 border-amber-200 text-gray-600` 等 Tailwind 默认色，在深色背景中形成孤岛，且完全脱离设计 token 系统
- **修复**: 改用 `bg-bg-elevated border-accent/40 text-text` 等应用 token

### ISSUE-039 (a11y/Moderate): 心数展示缺可访问文字描述（WCAG 1.1.1）
- **状态**: ⬜ 待修复
- **位置**: Practice.tsx:130-134 / SessionSummary.tsx:37-42 / CampaignMap.tsx:56-65
- **现象**: ❤ emoji 列表读出”红心 红心 红心”，无法传达”当前剩余X条命”语义
- **修复**: 给心数容器加 `aria-label=”剩余生命 X 颗，共 3 颗”`，emoji 用 `aria-hidden=”true”`

### ISSUE-040 (a11y/Moderate): 无 `prefers-reduced-motion` 支持
- **状态**: ⬜ 待修复
- **位置**: `src/styles/globals.css`（shake/float-up/pulse-grow/fade-in 四种动画）
- **现象**: 对前庭障碍或运动敏感用户（含部分有感知障碍的儿童）可能造成不适
- **修复**: 在 globals.css 末尾加 `@media (prefers-reduced-motion: reduce)` 全局禁用动画

### ISSUE-041 (a11y/Moderate): 关卡完成/可玩/锁定状态仅颜色区分（WCAG 1.4.1）
- **状态**: ⬜ 待评估
- **位置**: `src/pages/CampaignMap.tsx:118-127`
- **现象**: 完成（绿）和可玩（也是绿）两种状态在色盲用户看来差异不足
- **修复**: 完成状态增加实心背景或额外形状差异

---

### 无障碍审查 WCAG AA — 次要（Minor）

### ISSUE-042 (a11y/Minor): `autoFocus` 干扰屏幕阅读器虚拟光标
- **状态**: ⬜ 待评估
- **位置**: Practice.tsx:226 / Onboarding.tsx:52
- **修复**: 改为 useEffect 中受控焦点管理

### ISSUE-043 (a11y/Minor): 输入框 placeholder 承载关键操作说明（WCAG 3.3.2）
- **状态**: ⬜ 待修复
- **位置**: `src/pages/Practice.tsx:219`（`placeholder=”先完成训练格”`）
- **现象**: 操作说明通过 placeholder 传达，焦点时消失，且对比度通常不达标
- **修复**: 改为永久可见的 `<p>` 提示文字 + `aria-describedby` 关联

### ISSUE-044 (a11y/Minor): 页面切换无 `document.title` 更新（WCAG 2.4.2）
- **状态**: ⬜ 待修复
- **位置**: `src/App.tsx`
- **现象**: Zustand 路由切换不更新标题，所有页面读到的都是”数学大冒险”，屏幕阅读器无法区分
- **修复**: App.tsx useEffect 监听 currentPage 更新 document.title

### ISSUE-045 (a11y/Minor): 无跳过导航链接（WCAG 2.4.1）
- **状态**: ⬜ 待评估
- **位置**: 全局
- **现象**: 键盘用户每次换页须 Tab 经过顶部栏才能到达主内容
- **修复**: 每页根元素顶部加隐藏 skip-nav 链接，focus 时可见
