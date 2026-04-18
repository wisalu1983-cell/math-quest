# 子计划 4 — 下阶段扩展（Phase 3 段位赛 / A03 块B Plus / A09 / B-D）

> 创建：2026-04-18  
> 父计划：[`2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md) §四 子计划 4  
> 设计规格：本计划为 **Umbrella Plan**，覆盖四块独立扩展工作；每块各自挂独立实施子子计划  
> 状态：🟡 进行中（Umbrella Plan 骨架落盘，等待首个实施子子计划领取）

---

## 一、背景

### 1.1 定位

子计划 1 / 2 / 2.5 / 3 已全部闭环，项目三大基线已稳：
- 生成器 v2.2（A01~A08）完整重写 + 稳定化
- 闯关 + 进阶两大游戏化模式浏览器验收通过
- UI 一致性 / a11y 存量 12 项全部关闭或降级关闭
- `tsc -b` 0 错 / `vitest` 328/328 / `pm-sync-check` ✅

主计划 §四 把"下阶段扩展"统一挂在**子计划 4**名下，包含四块独立工作。本 Umbrella Plan 的任务是**把这四块的范围、切入顺序、跨系统硬约束、文档先行纪律在正式动代码前全部钉在纸上**，每块实际执行再各自开独立实施子子计划。

### 1.2 本 Umbrella Plan 不做什么

- **不直接写业务代码**——业务代码归各"实施子子计划"
- **不起草各块的实施级规格**——各块开工前各自补（见 §六 文档先行纪律）
- **不承诺四块的完成时间线**——本子计划只锁范围与切入顺序，进度节奏交给各实施子子计划

### 1.3 前置相关规格（开工前必读）

> 📑 规格索引：[`../Specs/_index.md`](../Specs/_index.md)

按"维度矩阵"扫描后命中的生效规格：

| 规格 | 本计划从中继承的硬约束 |
|---|---|
| [`Specs/2026-04-10-gamification-redesign.md`](../Specs/2026-04-10-gamification-redesign.md) | 三层游戏化体系（闯关 / 进阶 / 段位赛）；段位赛 §5 五段位、BO 制、新内容点分配、单关规则；"心"作为跨层统一语义 |
| [`Specs/2026-04-13-star-rank-numerical-design.md`](../Specs/2026-04-13-star-rank-numerical-design.md) | 统一星级（3★/5★）与各段位入场门槛数值；时间节奏测算；心→星→段位换算链 |
| [`Specs/2026-04-15-gamification-phase2-advance-spec.md`](../Specs/2026-04-15-gamification-phase2-advance-spec.md) | **`TOPIC_STAR_CAP`** 硬约束：A01/A04/A08 为 3★（2 梯度），A02/A03/A05~A07 为 5★（3 梯度）；进阶难度档位权重表；心→星映射 |
| [`Specs/2026-04-16-generator-difficulty-tiering-spec.md`](../Specs/2026-04-16-generator-difficulty-tiering-spec.md) | 三档难度主规格（基础/提高/挑战的认知目标与边界）——所有新题型梯度设计的评判锚点 |
| [`Specs/2026-04-14-difficulty-standard.md`](../Specs/2026-04-14-difficulty-standard.md) | `difficulty=5` = 上海五年级小升初正常考试水平；A09/B/C/D 难度校准的基准 |
| [`Specs/2026-04-14-ui-redesign-spec.md`](../Specs/2026-04-14-ui-redesign-spec.md) | 阳光版 v5 视觉语言；关卡卡片 96px / 字号下限 11px / 色彩 token；所有新增页面与组件必须遵守 |
| [`Specs/2026-04-17-generator-redesign-v2.md`](../Specs/2026-04-17-generator-redesign-v2.md) | v2.2 题型规格（A01~A08）；新题型（A09）在风格、陷阱体系、答题形式上需保持一致 |
| [`Specs/2026-04-09-a03-block-b-design.md`](../Specs/2026-04-09-a03-block-b-design.md) | `VerticalCalcBoard` 组件设计（A03 块B）；A03 块B Plus 基于此继续扩展 |

### 1.4 跨系统维度清单

本 Umbrella 计划（作为总纲）涉及**几乎所有跨系统维度**，具体命中以各实施子子计划为准，但整体清单如下：

- [x] **难度档位 / 题型梯度数** — A09 新题型梯度数、A03 块B Plus 子题型扩展、B/C/D 领域难度校准
- [x] **星级 / 进阶 / 段位数值** — Phase 3 段位赛；A09/B/C/D 新增题型需进入 `TOPIC_STAR_CAP`
- [x] **关卡结构 / campaign.ts** — A09/B/C/D 新增题型需建闯关地图；A03 块B Plus 可能扩展现有 A03 关卡
- [x] **UI 组件 / 卡片尺寸** — Phase 3 段位赛新页面；A03 块B Plus 可能扩展 `VerticalCalcBoard`；A09 需书面分数渲染组件
- [x] **答题形式 / 验证逻辑** — A03 块B Plus（竖式新交互）、A09（书面分数等价判定）、段位赛（混合题型统一答题入口）
- [x] **GameSessionMode 枚举 / GameProgress 形状** — Phase 3 新增 `'rank-match'` 与 `rankProgress` 字段
- [x] **`TopicId` 枚举** — A09 / B/C/D 新领域开发时扩充
- [x] **真题库** — A09/B/C/D 起步均需对应真题参考库子目录

### 1.5 工作脉络

本计划的存在意义来自**三件事**：

1. **主计划 §四"子计划 4"口径** —— 四块扩展需要一个显式父文件承接，而不是在主计划里继续直接拆
2. **2026-04-17 文档同步机制（L2 钩子）** —— 新计划启动前必须扫 `_index.md`、写前置规格栏、跨系统维度清单，本 Umbrella 一次性把总的做完，各实施子子计划只增量补自己的
3. **2026-04-18 用户强调的"避免文档滞后于代码"** —— 见 §六

---

## 二、四块扩展工作范围

### 2.1 块 P3 — 游戏化 Phase 3（段位赛）

**定位**：补齐三层游戏化的最后一层，让"闯关→进阶→段位赛"的完整闭环真正跑通。

**范围草图**：
- 类型层：`GameSessionMode` 追加 `'rank-match'`；`GameProgress` 追加 `rankProgress`；新增 `RankTier` / `RankMatchSession` / `RankMatchGame` 类型
- 常量层：五段位定义、入场门槛（已在 `2026-04-13-star-rank-numerical-design.md` §3.2）、BO 赛制、新内容点编排规则（§Q9）、题目数/场与计时规则
- 算法层：
  - 段位赛入场校验（根据 `advanceProgress` 的星级快照）
  - BO 赛制状态机（BO3/BO5/BO7，累积胜场、单局心 ×3 独立重置）
  - 题库抽题器（跨题型混合出题 + 新内容点 ≥40%、主考项保证、复习题 ≤25%）
- 存储层：`repository/local.ts` 新增 `rankProgress` 持久化（段位 / 段位赛历史 / 当前活跃段位）
- UI 层：Home 段位赛入口（已占位"刷星升级，向段位赛进发"）、`RankMatchHub` / `RankMatchSession` / `RankMatchResult` 新页面
- 结算层：单局结算、BO 整体结算、晋级动画、失败复盘（展示薄弱题型）

**挂靠子子计划**（待立）：`Plan/2026-04-1X-rank-match-phase3-implementation.md`

**前置未落规格**：
- `Specs/2026-04-1X-rank-match-phase3-implementation-spec.md` — Phase 3 实施级规格：数据模型 + Session 状态机 + 抽题器算法 + UI 页面信息架构

### 2.2 块 A03+ — A03 块B Plus（竖式深化）

**定位**：在现有 `VerticalCalcBoard`（块B）基础上扩展乘法部分积、除法试商等深度交互，为 A03 的魔王级（5★ 上限）补足题型深度。

**范围草图**：
- 题型：乘法多位竖式部分积拆解、除法试商过程、带小数/近似值 → 对应 A03 魔王档
- 组件：`VerticalCalcBoard` 扩展（新布局 + 部分积输入 + 试商 UI）
- 生成器：`vertical-calc.ts` 新增子题型（`partial-product` / `division-trial` 等）
- 闯关：可能新增 A03 Boss 关前的"挑战路线"（或并入现有 S3 阶段）
- 真题库：需对照 A03 真题参考库补充这两类题的真实用例

**挂靠子子计划**（待立）：`Plan/2026-04-XX-a03-block-b-plus-implementation.md`

**前置未落规格**：`Specs/2026-04-XX-a03-block-b-plus-design.md`（深化 `2026-04-09-a03-block-b-design.md`）

### 2.3 块 A09 — 分数运算生成器

**定位**：引入 A 领域第 9 个题型——分数四则运算，与小数运算（A05）形成互补的数表达体系。

**范围草图**：
- 类型层：`TopicId` 扩充 `'fraction-ops'`（或沿用编号 `'A09-*'`）；`TOPIC_STAR_CAP` 扩表（梯度数待定）
- 生成器：全新 `fraction-ops.ts`（通分/约分/带分数/分数+小数互化等子题型）
- 答题形式：需要**书面分数**输入/渲染（KaTeX 已支持，但前端输入 UI 需新增）
- 等价性判定：`answerValidation.ts` 扩展"分数等价"判定（如 6/8 ≡ 3/4）
- 闯关：从零新建 A09 闯关地图（stages/lanes/levels）
- 真题库：`reference-bank/A09-fraction-ops/` 从零录入，目标 30+ 题起步

**挂靠子子计划**（待立）：`Plan/2026-04-XX-a09-fraction-ops-implementation.md`

**前置未落规格**：
- `Specs/2026-04-XX-a09-fraction-ops-generator.md` — 生成器级规格（子题型桶 + 档位分布 + 陷阱体系）
- 对 `Specs/2026-04-17-generator-redesign-v2.md` 的补丁章节（保持 v2.2 风格一致）

### 2.4 块 BCD — B/C/D 领域扩展

**定位**：从 A 领域（数与运算）扩展到 B（几何）、C（应用题）、D（统计）三大领域。

**范围草图（颗粒度极粗）**：
- 领域级规格设计（每个领域的题型清单、难度梯度、教材对应）
- `TopicId` 枚举大规模扩充
- 每个领域从零起生成器 + 闯关地图 + 真题参考库
- 某些领域可能需要新 UI 组件（B 几何 → 图形渲染 / C 应用题 → 长文本展示 / D 统计 → 图表交互）
- 段位赛 §5 目前只覆盖 A01~A08；B/C/D 加入后段位体系可能需要重新设计

**挂靠子子计划**（待立）：每领域独立 Plan，甚至每领域内部再拆多期

**前置未落规格**：每领域各需独立设计规格文档，远超本 Umbrella Plan 的展开深度

> ⚠️ BCD 的跨度远大于前三块，视为**多季度级别的 roadmap**，本 Umbrella 只记录其存在，不做时间承诺。

---

## 三、推荐执行顺序

| 顺位 | 块 | 切入理由 | 规格齐备度 | 预估工作量 |
|---|---|---|---|---|
| **1（已锁定）** | **P3 段位赛** | 规格最齐（仅缺实施级）；补齐三层游戏化闭环；产品价值最大；与现有稳定模块解耦清晰 | 高 | 大 |
| 2 | A03 块B Plus | 现有组件深化；风险最小；可为 A03 的 5★ 上限提供题型支撑 | 中 | 中 |
| 3 | A09 | 全新题型；需完整规格栈；为段位赛补充题库多样性 | 低 | 中-大 |
| 4 | B/C/D | 超大工程；等前三块完成后再做 roadmap | 极低 | 多季度 |

**决策（2026-04-18，用户确认）**：从 **P3 段位赛** 起步；其余三块作为后续顺位领取项，在 P3 闭环后逐个启动。

---

## 四、跨块硬约束（所有实施子子计划必须遵守）

### 4.1 `TOPIC_STAR_CAP` 的单一事实源

- `Specs/2026-04-15-gamification-phase2-advance-spec.md` 为权威；生成器梯度 / campaign 关卡分段 / 进阶难度档位必须继承
- A09 新增时必须同步：`TOPIC_STAR_CAP` 扩表 + 段位入场门槛表（在 `2026-04-13-star-rank-numerical-design.md` §3.2 增行）
- 任何改动 `TOPIC_STAR_CAP` 的 PR 必须在 Plan 里显式列出四处联动位置

### 4.2 难度锚点不移位

- `difficulty=5` = 上海五年级小升初正常考试水平（`2026-04-14-difficulty-standard.md`）
- 新题型 / 新领域的难度曲线必须与此锚点对齐；不允许通过"换一套主观难度"来回避校准

### 4.3 UI 视觉语言不破线

- 所有新页面 / 新组件遵守阳光版 v5（`2026-04-14-ui-redesign-spec.md`）
- 关卡类卡片继续 96px 规格；字号不低于 11px；色彩从 token 取，不写死十六进制

### 4.4 答题形式的 v2.2 风格一致性

- 新答题形式（书面分数、图形、长文本应用题等）在**陷阱体系 / 提示 / explanation 结构**上遵循 v2.2 约定
- 新增前必须在对应 Specs 里预先声明表达约束（避免 A09/B/C/D 各自造轮子）

### 4.5 真题参考库合流规则（不自造口径，直接引用主计划 §三 D 段）

真题参考库补充**不再作为独立并行任务**。每个新主题（A09 / B01 / B02 / C01 / C02 / D01）在子计划 4 中启动时，其实施子子计划必须包含：

> **Step 0**：从 `reference-bank/sources/` 原始素材中提取本主题 **30-35 道真题**（foundation 18-20 + advanced 12-15），按 [`reference-bank/CONTRIBUTING.md`](../../reference-bank/CONTRIBUTING.md) 规范录入 `reference-bank/{域}/{主题}/foundation.md` 和 `advanced.md`，作为后续生成器子函数设计、参数模式选择、陷阱/易错点设计的直接参照。

激活条件：**子计划 4 任一主题开工即自动激活对应的真题提取工作**，不单建独立计划。

例外：若后续发现 A01-A08 的某个子题型在生产上出现系统性问题（收集到大量新题型素材 + 与现有生成器存在明显差距），为该子题型单独补录真题——**直接挂靠到修复 issue 下**，不走独立计划。

> 规则来源：主计划 [`2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md) §三 D 段"合流说明"（2026-04-18 评估）。本 Umbrella 不得对该规则做二次解释或参数覆盖。

---

## 五、状态面板

| 块 | 规格齐备 | 实施子子计划 | 代码起点 | 状态 |
|---|---|---|---|---|
| P3 段位赛 | 两份生效规格 + 实施级 Specs 待立 | 待立 | 仅类型 TODO 注释 | 🟡 下一轮启动 |
| A03 块B Plus | 块B 设计已生效，Plus 设计待立 | 待立 | 无 | ⬜ 顺位 2 |
| A09 分数运算 | 无；待立生成器规格 + v2.2 补丁 | 待立 | 无 | ⬜ 顺位 3 |
| B/C/D 领域 | 无 | 每领域独立 Plan | 无 | ⬜ 多季度 roadmap |

---

## 六、文档先行纪律（本子计划特别强调）

**背景**：2026-04-18 用户明确提出"避免再出现文档滞后于代码的经典问题"。子计划 4 各块的体量大、跨模块深，一旦文档滞后，回写成本会指数级放大。本子计划严格执行以下纪律：

### 6.1 三层落盘

每块扩展工作的启动顺序**必须**严格为：

1. **Umbrella Plan 注册块条目**（已在本文件完成）
2. **Specs 实施级规格落盘**：该块对应的"实施级规格"写完、在 `Specs/_index.md` 登记、在 `Plan/README.md` 登记
3. **实施子子计划落盘**：按 Plan 模板写完头部（前置规格栏、跨系统维度清单），在 `Plan/README.md` 登记
4. **然后才能动代码**

禁止跳步（例如 2 和 3 并行、或先写代码再补规格）。

### 6.2 每里程碑四处同步

每个 M 里程碑完成后，当场（**不是 session 末尾**）同步四处：

- 该块的实施子子计划（回写里程碑状态 + 证据）
- `ProjectManager/ISSUE_LIST.md`（新发现 / 已关闭的 issue）
- `ProjectManager/Overview.md`（顶部状态行 + 进展表）
- `ProjectManager/Plan/README.md`（实施子子计划状态）

此纪律在子计划 2.5 已验证有效（2026-04-18 收口四处同步全绿）。

### 6.3 回写不全 = 里程碑不关闭

每个 M 里程碑的验收条件**包含**："四处同步全绿 + `pm-sync-check` ✅"。未完成回写时里程碑保持 🟡 进行中，不打钩。

### 6.4 新增 Specs 的 `_index.md` 联动

每次新增 Specs 文件，**同一 PR/同一轮**必须更新 `Specs/_index.md`（登记 + 关键断言摘要 + 如跨维度则在交叉矩阵补条目）。`pm-sync-check` 的检查项 1 会拦截漏登记。

### 6.5 代码侧占位注释同步规则

代码里已有的 `// Phase 3 追加 xxx` 占位注释（`src/types/gamification.ts` L84/L93）：在 Phase 3 实施子子计划的 M1 里程碑内必须被**真实代码或更精确的 TODO 引用替换**，不允许长期以裸注释存在。其他块如在代码里留占位注释，适用同规则。

---

## 七、推进方式

1. **本 session 的交付**：Umbrella Plan 落盘 + 四处索引同步（Overview / Plan/README / 主计划 §四 §六 / pm-sync-check）
2. **下一 session 的起点**：立 P3 段位赛的**实施级规格** `Specs/2026-04-1X-rank-match-phase3-implementation-spec.md`（不动代码）
3. **再下一 session 的起点**：立 P3 实施子子计划 `Plan/2026-04-1X-rank-match-phase3-implementation.md`，M1 进场
4. P3 全部里程碑闭环后，顺位 2（A03 块B Plus）按同一三层落盘纪律启动

> 真题参考库补充可与本 Umbrella 任何时期并行推进，不强制归入某个块的实施子子计划。

---

## 八、回写段

### 2026-04-18：Umbrella Plan 落盘

- 本文件落盘
- Plan/README.md 登记
- Overview.md 指向本 Umbrella
- 主计划 `2026-04-16-open-backlog-consolidation.md` §四/§五/§六 引用本 Umbrella
- `pm-sync-check` ✅ 待收尾跑

### 下一步

→ 用户领取"立 P3 实施级规格"或其他顺位块后，在本段追加对应 session 的回写。

