# v0.1 版本归档索引

> 所属版本：v0.1（原型，已发布）
> 收口日期：2026-04-19（Phase 3 段位赛主线完成并入仓；开新号全量 QA 复跑全绿）
> 角色：本目录是 v0.1 版本**归档区**。所有 v0.1 期间落盘的主计划、子计划、已关闭 issue、收口快照统一从这里进入。

---

## 快速入口

| 想看什么 | 打开哪个文件 |
|---|---|
| v0.1 项目总体完工状态快照（Phase 1/2/3）| [`00-overview.md`](./00-overview.md) |
| v0.1 期间全部已关闭 issue（ISSUE-001~064，含 059 延期）| [`issues-closed.md`](./issues-closed.md) |
| v0.1 全部 Plan 详细索引 | 下方"Plan 清单" |

---

## Plan 清单

按实际执行时序排列。所有 Plan 在 v0.1 收口时均为 ✅ 完成状态。

### 生成器基础建设（真题校准 + 核心题型）

| 文件 | 内容 |
|---|---|
| [2026-04-08-reference-bank-extraction.md](2026-04-08-reference-bank-extraction.md) | 真题库提取（A01~A08，312 题）|
| [2026-04-09-phase0-classification-adjustment.md](2026-04-09-phase0-classification-adjustment.md) | Phase 0 分类调整 |
| [2026-04-09-phase1-p0-improvements.md](2026-04-09-phase1-p0-improvements.md) | Phase 1 P0 高频考点 |
| [2026-04-09-phase2-p1-extensions.md](2026-04-09-phase2-p1-extensions.md) | Phase 2 P1 参数扩展 |
| [2026-04-09-phase3-p2-question-types.md](2026-04-09-phase3-p2-question-types.md) | Phase 3 P2 题型扩展 |
| [2026-04-09-a03-decimal-generator.md](2026-04-09-a03-decimal-generator.md) | A03 块A 生成器小数支持 |
| [2026-04-09-a03-block-b-component.md](2026-04-09-a03-block-b-component.md) | A03 块B 组件重构 |

### 游戏化三层体系

| 文件 | 内容 |
|---|---|
| [2026-04-13-gamification-phase1-foundation-campaign.md](2026-04-13-gamification-phase1-foundation-campaign.md) | Phase 1：Foundation + 闯关系统（移除旧 XP 体系，8 题型闯关地图，CampaignMap 页）|
| [2026-04-15-gamification-phase2-implementation.md](2026-04-15-gamification-phase2-implementation.md) | Phase 2 进阶系统（T1-T15 + A1-A6；心→星，难度自动调配）|
| [2026-04-18-rank-match-phase3-implementation.md](2026-04-18-rank-match-phase3-implementation.md) | Phase 3 段位赛实施（M1 类型+Store → M2 抽题器 → M3 UI → M4 验证；BO3/BO5/BO7 五段位闭环）|

### UI 整体重设计（阳光版 v5）

| 文件 | 内容 |
|---|---|
| [2026-04-14-ui-hotfix-6-1.md](2026-04-14-ui-hotfix-6-1.md) | UI redesign spec §6.1 独立 hotfix |
| [2026-04-15-visual-qa-fixes.md](2026-04-15-visual-qa-fixes.md) | 视觉 QA 修复（F2/VR-01/VR-02/VR-04/VR-05/F1）|

### Phase 1 优化迭代 + 深度 QA

| 文件 | 内容 |
|---|---|
| [2026-04-14-phase1-hotfix-and-iteration.md](2026-04-14-phase1-hotfix-and-iteration.md) | Phase 1 热修复 + 优化迭代（去年级区分、History 入口、路线匹配、出题质量、难度标准）|
| [2026-04-14-phase1-deep-experience-manual-qa.md](2026-04-14-phase1-deep-experience-manual-qa.md) | Phase 1 深度体验拟真 QA |
| [2026-04-16-p1p2-fixes.md](2026-04-16-p1p2-fixes.md) | P1+P2 修复（试玩反馈 11 项）|
| [2026-04-16-generator-difficulty-recalibration.md](2026-04-16-generator-difficulty-recalibration.md) | 生成器难度分档重审 |

### 生成器 v2.2 重做 + 稳定化

| 文件 | 内容 |
|---|---|
| [2026-04-16-open-backlog-consolidation.md](2026-04-16-open-backlog-consolidation.md) | v0.1 后期阶段主计划（开放 backlog 整理；承接 Phase 3 主线与子计划 4 引用链）|
| [2026-04-17-generator-redesign-v2-implementation.md](2026-04-17-generator-redesign-v2-implementation.md) | 生成器题型设计 v2.2 实施（A01~A08 重写 + 陷阱体系 + 答题形式重做）|
| [2026-04-17-campaign-advance-stabilization.md](2026-04-17-campaign-advance-stabilization.md) | 子计划 2.5：闯关+进阶稳定化（S1 阻塞级 → S4 进阶专项验收）|
| [2026-04-18-ui-consistency-cleanup.md](2026-04-18-ui-consistency-cleanup.md) | 子计划 3：UI 一致性与代码整洁清理（B1 硬编码色+类型 / B2 a11y 教学 / B3 a11y 评估）|
| [2026-04-18-subplan-4-next-stage-expansion.md](2026-04-18-subplan-4-next-stage-expansion.md) | 子计划 4 Umbrella：下阶段扩展总纲（收敛为 Phase 3 段位赛）|

---

## v0.1 期间的跨版本工具性 Plan（保留 `Plan/` 根目录）

以下 Plan 是项管体系本身演进的工作，不属于产品版本，保留在 `Plan/` 根目录下，不归入本目录：

- `Plan/2026-04-17-pm-document-sync-mechanism.md` — 历史机制方案：文档同步机制首次设计、L1+L2 落地与回溯验证背景
- `Plan/2026-04-19-pm-token-efficiency-optimization.md` — 项目管理文档体系轻量化优化方案

---

## 与其它归档资产的关系

- **生效规格**：仍在 `../../Specs/`（跨版本资产，按维度演进）；v0.1 期间引入 / 更新的规格清单见 `../../Specs/_index.md`
- **审视 / 历史报告**：仍在 `../../Reports/`
- **QA 产物**：仍在 `../../QA/`
- **人工验证题库**：仍在 `../../human-verification-bank-v2.md`

---

## 说明

- 本目录文件只提供**入口与索引**，不复制具体内容。每个 Plan 文件维持原始完整信息，未做精简。
- v0.1 期间的 Plan 之间的相互引用仍有效（同级引用）。
- 外部（非 v0.1 目录内）对这些 Plan 的引用已在 2026-04-20 版本化迁移中统一更新为 `Plan/v0.1/*` 路径。
