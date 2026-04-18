# 子计划 4 — 下阶段扩展（本阶段只做 Phase 3 段位赛）

> 创建：2026-04-18  
> 最后刷新：2026-04-18（**再次重排**：用户明确"本阶段只做 Phase 3；A03+ 废弃；A09、B/C/D 本阶段不做"。Umbrella 从三块收敛为单块 = Phase 3 段位赛）  
> 父计划：[`2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md) §四 子计划 4  
> 设计规格：本计划收敛为单块 Umbrella，只覆盖 Phase 3 段位赛一块扩展工作  
> 状态：🟡 进行中（Umbrella 口径已改写为"仅 Phase 3"；等待 Phase 3 实施级规格与实施子子计划落盘）

---

## 一、背景

### 1.1 定位

子计划 1 / 2 / 2.5 / 3 已全部闭环，项目三大基线已稳：
- 生成器 v2.2（A01~A08）完整重写 + 稳定化
- 闯关 + 进阶两大游戏化模式浏览器验收通过
- UI 一致性 / a11y 存量 12 项全部关闭或降级关闭
- `tsc -b` 0 错 / `vitest` 328/328 / `pm-sync-check` ✅

主计划 §四 把"下阶段扩展"统一挂在**子计划 4**名下。本子计划的口径经历三次演化：

1. **2026-04-18 初版**：Phase 3 / A03+ / A09 / B/C/D 四块一起纳入
2. **2026-04-18 同日第一次重排**（方案 C）：收敛为三块 = A03+ → A09 → Phase 3；B/C/D 移出到未来"子计划 5 领域扩展 roadmap"
3. **2026-04-18 同日第二次重排**（当前口径）：用户明确"**本阶段只做 Phase 3**；A03+ 废弃（设计规格保留作历史参考，不进入代码实施）；A09 本阶段不做；B/C/D 本阶段也不做"——Umbrella 进一步收敛为**单块 = Phase 3 段位赛**

收敛理由：A03+ 的轻量路线（困难档过程格结算纠错）虽然设计完成，但在段位赛尚未落地前其优先级低于"补齐三层游戏化闭环"；A09 + B/C/D 规模更大，放在 Phase 3 之前会让"段位赛落地"继续后延。直接以 Phase 3 为本阶段唯一主线，避免继续在"内容补强 vs 模式补齐"之间摇摆。

本 Umbrella Plan 当前的任务**只有一个**：把 Phase 3 段位赛的范围、跨系统硬约束、文档先行纪律在正式动代码前全部钉在纸上，实际执行再开独立实施子子计划。

### 1.2 本 Umbrella Plan 不做什么

- **不直接写业务代码**——业务代码归 Phase 3 实施子子计划
- **不起草 Phase 3 实施级规格**——开工前单独起草 `Specs/2026-04-XX-rank-match-phase3-implementation-spec.md`（见 §六 文档先行纪律）
- **不承诺 Phase 3 完成时间线**——本子计划只锁范围与硬约束，进度节奏交给实施子子计划
- **不承接 A03+ / A09 / B/C/D**——A03+ 废弃；A09 与 B/C/D 本阶段不做，视 Phase 3 落地后情况再评估是否启用独立子计划承载

### 1.3 前置相关规格（开工前必读）

> 📑 规格索引：[`../Specs/_index.md`](../Specs/_index.md)

按"维度矩阵"扫描后命中的生效规格（本阶段只做 Phase 3，清单按此收敛）：

| 规格 | 本计划从中继承的硬约束 |
|---|---|
| [`Specs/2026-04-10-gamification-redesign.md`](../Specs/2026-04-10-gamification-redesign.md) | 三层游戏化体系（闯关 / 进阶 / 段位赛）；段位赛 §5 五段位、BO 制、新内容点分配、单关规则；"心"作为跨层统一语义 |
| [`Specs/2026-04-13-star-rank-numerical-design.md`](../Specs/2026-04-13-star-rank-numerical-design.md) | 统一星级（3★/5★）与各段位入场门槛数值；时间节奏测算；心→星→段位换算链 |
| [`Specs/2026-04-15-gamification-phase2-advance-spec.md`](../Specs/2026-04-15-gamification-phase2-advance-spec.md) | **`TOPIC_STAR_CAP`** 硬约束：A01/A04/A08 为 3★（2 梯度），A02/A03/A05~A07 为 5★（3 梯度）——Phase 3 段位入场资格直接依赖该上限 |
| [`Specs/2026-04-14-difficulty-standard.md`](../Specs/2026-04-14-difficulty-standard.md) | `difficulty=5` = 上海五年级小升初正常考试水平；段位赛混合题抽题的难度锚点 |
| [`Specs/2026-04-14-ui-redesign-spec.md`](../Specs/2026-04-14-ui-redesign-spec.md) | 阳光版 v5 视觉语言；段位赛新页面（Hub / Session / Result）必须遵守 |
| [`Specs/2026-04-17-generator-redesign-v2.md`](../Specs/2026-04-17-generator-redesign-v2.md) | v2.2 题型规格（A01~A08）；段位赛跨题型抽题直接从这 8 个生成器取题 |

> **历史参考**（本阶段不进入 Phase 3 实施链路，但不从文件系统删除）：
> - [`Specs/2026-04-09-a03-block-b-design.md`](../Specs/2026-04-09-a03-block-b-design.md) — A03 块B 原始设计，已落地
> - [`Specs/2026-04-18-a03-block-b-plus-design.md`](../Specs/2026-04-18-a03-block-b-plus-design.md) — A03+ 轻量路线设计，本阶段废弃不实施

### 1.4 跨系统维度清单

本 Umbrella（收敛为单块 Phase 3）命中的跨系统维度：

- [x] **星级 / 进阶 / 段位数值** — Phase 3 段位赛，直接依赖进阶星级与 `TOPIC_STAR_CAP`
- [x] **UI 组件 / 卡片尺寸** — Phase 3 段位赛新页面（Hub / Session / Result）
- [x] **答题形式 / 验证逻辑** — 段位赛混合题型统一答题入口（跨题型抽题 + BO 多局包装）
- [x] **GameSessionMode 枚举 / GameProgress 形状** — 新增 `'rank-match'` 与 `rankProgress` 字段
- [x] **持久化 / 存档迁移** — `repository/local.ts` `CURRENT_VERSION` 升级 + `rankProgress` 迁移
- [ ] **难度档位 / 题型梯度数** — 本阶段不改
- [ ] **关卡结构 / campaign.ts** — 本阶段不改
- [ ] **`TopicId` 枚举** — 本阶段不改
- [ ] **真题库** — 本阶段不改

### 1.5 工作脉络

本计划当前口径下的存在意义：

1. **主计划 §四"子计划 4"口径** —— 下阶段扩展仍然需要一个显式父文件承接，即使收敛为单块也要保留 Umbrella 结构以匹配"子计划 4"引用链
2. **2026-04-17 文档同步机制（L2 钩子）** —— Phase 3 开工前必须扫 `_index.md` 并在此写前置规格栏、跨系统维度清单
3. **2026-04-18 用户强调的"避免文档滞后于代码"** —— Phase 3 比 A03+/A09 任何一块都更容易文档滞后（多模块深度改动），见 §六

---

## 二、本阶段扩展工作范围（单块 = Phase 3 段位赛）

### 2.1 块 P3 — 游戏化 Phase 3（段位赛，本阶段唯一主线）

**定位**：补齐三层游戏化的最后一层，让"闯关→进阶→段位赛"的完整闭环真正跑通。本块是**全新模式**，直接进入代码实施链路。用户 2026-04-18 明确"本阶段只做 Phase 3"，且 Phase 3 启动**不再依赖 A03+ / A09 闭环**——段位赛抽题器基于 v2.2 已稳定的 A01-A08 八个题型，题库多样性已足够。

**范围草图**：
- 类型层：`GameSessionMode` 追加 `'rank-match'`；`GameProgress` 追加 `rankProgress`；新增 `RankTier` / `RankMatchSession` / `RankMatchGame` 类型
- 常量层：五段位定义、入场门槛（已在 `2026-04-13-star-rank-numerical-design.md` §3.2）、BO 赛制、新内容点编排规则（§Q9）、题目数/场与计时规则
- 算法层：
  - 段位赛入场校验（根据 `advanceProgress` 的星级快照）
  - BO 赛制状态机（BO3/BO5/BO7，累积胜场、单局心 ×3 独立重置）
  - 题库抽题器（跨题型混合出题 + 新内容点 ≥40%、主考项保证、复习题 ≤25%）
- 存储层：`repository/local.ts` `CURRENT_VERSION` 升级 + `rankProgress` 持久化与迁移（段位 / 段位赛历史 / 当前活跃段位）
- UI 层：Home 段位赛入口（已占位"刷星升级，向段位赛进发"）、`RankMatchHub` / `RankMatchSession` / `RankMatchResult` 新页面
- 结算层：单局结算、BO 整体结算、晋级动画、失败复盘（展示薄弱题型）

**挂靠子子计划**（待立）：`Plan/2026-04-XX-rank-match-phase3-implementation.md`

**前置未落规格**：
- `Specs/2026-04-XX-rank-match-phase3-implementation-spec.md` — Phase 3 实施级规格：数据模型 + Session 状态机 + 抽题器算法 + `local.ts` 迁移 + UI 页面信息架构

**启动前置条件**：无额外代码前置。Phase 3 产品层规格已基本齐备，直接进入"两份 Specs 事实源对齐 → 实施级规格落盘 → 实施子子计划落盘 → 代码"的链路。

### 2.2 A03+ / A09 / B/C/D 的本阶段处置

- **A03+**：本阶段**废弃不实施**。设计规格 `Specs/2026-04-18-a03-block-b-plus-design.md` 文件保留作历史参考；`_index.md` 状态改为"历史参考（本阶段不实施）"；Umbrella 与主计划相关叙述全部改口；代码侧无改动。
- **A09 分数运算**：本阶段**不做**。若 Phase 3 落地后决定启动，再单独立子计划承载。
- **B/C/D 领域扩展**：本阶段**不做**，且不再以"子计划 5 领域扩展 roadmap"预立名；视 Phase 3 落地后整体节奏再评估。

---

## 三、本阶段执行顺序（单块主线）

| 顺位 | 块 | 切入理由 | 规格齐备度 | 预估工作量 |
|---|---|---|---|---|
| **1（本阶段唯一）** | **P3 段位赛** | 补齐三层游戏化闭环；产品层规格最齐（仅缺实施级）；用户明确本阶段只做 Phase 3 | 高 | 大 |

**决策轨迹（2026-04-18）**：
- **初版**：从 P3 段位赛起步
- **同日第一次重排**：改为"A03+ → A09 → Phase 3"，先补强闯关+进阶内容
- **同日第二次重排（当前口径）**：用户明确"本阶段只做 Phase 3；A03+ 废弃；A09/B/C/D 本阶段不做"——单块主线，直接进 Phase 3

> 历史重排的完整推理保留在 §八 回写段，供后续回溯。

---

## 四、跨块硬约束（所有实施子子计划必须遵守）

### 4.1 `TOPIC_STAR_CAP` 的单一事实源

- `Specs/2026-04-15-gamification-phase2-advance-spec.md` 为权威；生成器梯度 / campaign 关卡分段 / 进阶难度档位必须继承
- Phase 3 段位赛入场资格直接读取 `TOPIC_STAR_CAP` 对应的星级上限（如 "A03/A05 需 5★"）
- 本阶段**不改** `TOPIC_STAR_CAP`；任何改动都会直接冲击段位赛入场校验

### 4.2 难度锚点不移位

- `difficulty=5` = 上海五年级小升初正常考试水平（`2026-04-14-difficulty-standard.md`）
- 段位赛混合题抽题的难度锚点以此为准；不允许通过"换一套主观难度"来回避校准

### 4.3 UI 视觉语言不破线

- 所有新页面 / 新组件遵守阳光版 v5（`2026-04-14-ui-redesign-spec.md`）
- 段位赛 Hub / Session / Result 页面视觉与现有 Practice / SessionSummary 对齐；字号不低于 11px；色彩从 token 取，不写死十六进制

### 4.4 答题形式的 v2.2 风格一致性

- 段位赛不引入新答题形式；跨题型抽题直接复用 A01-A08 v2.2 现有的 `questionType` 与答题组件
- 如后续 Phase 3 运行中发现抽题器需要新的题型元数据字段，应反向补入对应生成器规格，而非在段位赛侧各自造轮子

### 4.5 真题参考库（本阶段不涉及）

本阶段只做 Phase 3。真题参考库补充规则保留在主计划 §三·D 段"合流说明"中作为后续子计划的合流纪律，但**本 Umbrella 本阶段不激活任何真题提取工作**。

> 规则来源：主计划 [`2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md) §三 D 段。

---

## 五、状态面板

| 块 | 规格齐备 | 实施子子计划 | 代码起点 | 状态 |
|---|---|---|---|---|
| **P3 段位赛（本阶段唯一主线）** | ✅ 产品层两份生效规格 + ✅ 实施级规格 `Specs/2026-04-18-rank-match-phase3-implementation-spec.md`（2026-04-18 落盘）| ✅ `Plan/2026-04-18-rank-match-phase3-implementation.md` 骨架已落盘（2026-04-18，等待 M1 领取）| 仅类型 TODO 注释（`src/types/gamification.ts` L84/L93，M1 内替换）| 🟡 主线进行中（三层落盘已到位，代码起点待领取）|

> A03+（已废弃）、A09（本阶段不做）、B/C/D（本阶段不做）均不计入本面板。

---

## 六、文档先行纪律（本子计划特别强调）

**背景**：2026-04-18 用户明确提出"避免再出现文档滞后于代码的经典问题"。Phase 3 段位赛的体量大、跨模块深（类型 / 常量 / 存储 / Session / UI / 结算全链路），一旦文档滞后，回写成本会指数级放大。本子计划严格执行以下纪律：

### 6.1 三层落盘

Phase 3 的启动顺序**必须**严格为：

1. **Umbrella Plan 注册主线条目**（已在本文件完成）
2. **Phase 3 规格事实源对齐**：`2026-04-10-gamification-redesign.md` §5 与 `2026-04-13-star-rank-numerical-design.md` §3 之间的残留冲突先统一（见 §八 2026-04-18 回写）
3. **Phase 3 实施级 Specs 落盘**：`Specs/2026-04-XX-rank-match-phase3-implementation-spec.md` 写完、在 `Specs/_index.md` 登记、在 `Plan/README.md` 登记
4. **Phase 3 实施子子计划落盘**：按 Plan 模板写完头部（前置规格栏、跨系统维度清单），在 `Plan/README.md` 登记
5. **然后才能动代码**

禁止跳步（例如 3 和 4 并行、或先写代码再补规格）。

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

1. **本 session 的交付**：Umbrella Plan 再次重排（收敛为单块 Phase 3）+ 主计划 / Plan/README / Overview / `_index.md` 四处索引同步 + Phase 3 规格事实源对齐 + Phase 3 实施级 Specs 落盘 + Phase 3 实施子子计划落盘
2. **下一 session 的起点**：Phase 3 实施子子计划 M1 进场（类型 / 持久化 / store 基础）；动代码前先跑 `pm-sync-check` ✅
3. Phase 3 M1 完成后 → M2（段位赛 session 状态机 + 混合抽题）→ M3（入口 / 页面 / 结算链路）→ M4（验证 / 回写 / `pm-sync-check`）
4. Phase 3 整体闭环后，再评估是否启用 A03+ / A09 / B/C/D 的后续子计划；本阶段不承诺启动时机

> A03+ 设计规格 `Specs/2026-04-18-a03-block-b-plus-design.md` 保留作历史参考，不进入代码实施链路。

---

## 八、回写段

### 2026-04-18：Umbrella Plan 落盘

- 本文件落盘
- Plan/README.md 登记
- Overview.md 指向本 Umbrella
- 主计划 `2026-04-16-open-backlog-consolidation.md` §四/§五/§六 引用本 Umbrella
- `pm-sync-check` ✅ 全绿

### 2026-04-18（同日）：内部重排序（方案 C）

**用户决策**：优先解决闯关和进阶模式下的相关问题，段位赛放到最后做。经澄清 B/C/D 属于新领域而非闯关+进阶的内容补强，确定方案 C ——

- **三块切入顺序翻转**：从初版 "P3 → A03+ → A09 → B/C/D" 改为 "**A03+ → A09 → P3**"
- **B/C/D 移出本 Umbrella**，后续作为独立"子计划 5 领域扩展 roadmap"承载（§九）
- **子计划 4 范围收敛为三块**

重排动机：A03 块B Plus 和 A09 分数运算本质是"对现有闯关+进阶两大模式的内容补强"（在既有模式结构内新增题型/子题型），放在段位赛（全新模式）之前可以先让闯关+进阶的内容体量更扎实，再开新模式；B/C/D 是新领域而非新内容，性质与本 Umbrella 的三块不一致。

四处同步：本文件 / Plan/README.md / Overview.md / 主计划 §三·D §四 §五 §六；`pm-sync-check` ✅ 全绿。

### 2026-04-18（同日）：A03+ 设计改口并落规格

**用户决策**：A03+ 本轮保留现有乘除法答题方式，不引入新的部分积板 / 试商板；仅在现有训练格体系上增加"困难档过程格填错但答案正确时，题目仍判定通过，反馈面板提示错误及正确值"的小优化。

- 新增规格：`Specs/2026-04-18-a03-block-b-plus-design.md`
- `_index.md` 已登记该 Specs，并补入跨维度交叉矩阵
- `Plan/README.md` / `Overview.md` / 本 Umbrella / 主计划已同步把 A03+ 改口为"轻量优化路线"
- 下一步：立 A03+ 实施子子计划，按"三层落盘"进入代码阶段前的最后一道文档关

### 2026-04-18（同日再次重排）：收敛为单块 Phase 3

**用户决策**："A03+ 任务废弃。A09、BCD 本阶段都不做。接下来开始做 Phase 3。"

- **Umbrella 从三块收敛为单块**：仅保留 P3 段位赛为本阶段主线
- **A03+ 废弃**：设计规格 `Specs/2026-04-18-a03-block-b-plus-design.md` 不从文件系统删除，但 `_index.md` 状态改为"历史参考（本阶段不实施）"；Umbrella / 主计划 / Plan/README / Overview 全部删除或改写"A03+ 顺位 1"叙述
- **A09 本阶段不做**：原"顺位 2"叙述删除；若未来启动再单独立子计划
- **B/C/D 本阶段不做**：原 §九"子计划 5 领域扩展 roadmap"占位不再主动预立；视 Phase 3 落地后再评估
- **Phase 3 启动前置简化**：从"A03+/A09 闭环后才启动"改为"无额外代码前置，直接进实施级规格 → 实施子子计划 → 代码"

重排动机：在内容补强（A03+/A09）与模式补齐（P3）之间摇摆反而会继续拖延段位赛落地。直接以 Phase 3 作为本阶段唯一主线，让三层游戏化闭环优先于内容广度。

四处同步：本文件 / Plan/README.md / Overview.md / 主计划 §三·D §四·D §五 §六；`_index.md` 第 A/B/C 维度表对 A03+ 条目状态改口；`pm-sync-check` 收口时 ✅。

### 2026-04-18（同日）：Phase 3 实施级规格与实施子子计划同步落盘

- 新增规格：`Specs/2026-04-18-rank-match-phase3-implementation-spec.md`（维度 B / 维度 C 双登记；事实源分工已显式指向 `2026-04-10` 与 `2026-04-13`）
- 新增计划：`Plan/2026-04-18-rank-match-phase3-implementation.md`（M1~M4 里程碑，M1 涵盖类型 + 常量 + 持久化迁移 + store 最小骨架）
- 两份文件已双向引用；`Plan/README.md` 已登记；`_index.md` 维度 B/C 已登记
- `pm-sync-check` ✅ 全绿
- **三层落盘已到位**（Umbrella + 实施级 Specs + 实施子子计划），代码启动前置已清

### 下一步

→ 用户领取 M1 后，首批代码改动从 `src/types/gamification.ts` / `src/types/index.ts` / `src/constants/rank-match.ts`（新增）/ `src/engine/rank-match/match-state.ts`（新增）/ `src/repository/local.ts` / `src/store/rank-match.ts`（新增）六组开始；相应测试同步 TDD 落地；M1 验收门槛见实施子子计划 §2。

---

## 九、本阶段未承载范围（仅作参考清单）

以下工作**本阶段不做**，未来启动时各自立独立子计划承载；本 §四"跨块硬约束"与 §六"文档先行纪律"届时仍然适用：

- **A03+ 块B Plus 困难档过程纠错优化** — 设计规格 `Specs/2026-04-18-a03-block-b-plus-design.md` 已落盘但本阶段废弃，视 Phase 3 落地后再评估是否重启
- **A09 分数运算生成器** — 规格未落；若启动需完整"生成器规格 + v2.2 补丁 + 真题 Step 0 30-35 题"链路
- **B/C/D 领域扩展（几何 / 应用题 / 统计）** — 多季度工程；每领域需独立领域级规格 + 教材对应 + 题型清单 + 生成器 + 闯关地图 + UI 组件；每主题 Step 0 先提 30-35 题真题

> 本阶段不对上述任何一项承诺启动时机；本 §九只作为"这些曾被提过但当前搁置"的索引，避免后续重复讨论。

