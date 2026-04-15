# 计划目录

> 所有项目管理文档统一存放于 `ProjectManager/` 下：
> - `Plan/` — 实施计划
> - `Specs/` — 设计规格（计划的前置设计文档）
> - `Reports/` — 调研/审视报告
> - `ISSUE_LIST.md` — 待解决问题清单
> - `Overview.md` — 项目概览（四要素）

---

## 设计规格（Specs/）

| 文件 | 内容 |
|------|------|
| [2026-04-08-generator-improvements.md](../Specs/2026-04-08-generator-improvements.md) | 生成器改进总规格（含执行状态，全部完成）|
| [2026-04-08-reference-bank-extraction-design.md](../Specs/2026-04-08-reference-bank-extraction-design.md) | 真题库提取设计 |
| [2026-04-09-a03-block-b-design.md](../Specs/2026-04-09-a03-block-b-design.md) | A03 块B 组件重构设计 |
| [2026-04-10-gamification-redesign.md](../Specs/2026-04-10-gamification-redesign.md) | 游戏化重新设计规格（三层体系：闯关→进阶→段位赛） |
| [2026-04-13-star-rank-numerical-design.md](../Specs/2026-04-13-star-rank-numerical-design.md) | 统一星级与段位数值设计（星级体系、心数门槛、段位门槛、时间节奏） |

## 实施计划（Plan/）

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-09-phase0-classification-adjustment.md](2026-04-09-phase0-classification-adjustment.md) | Phase 0 分类调整 | ✅ 完成 |
| [2026-04-09-phase1-p0-improvements.md](2026-04-09-phase1-p0-improvements.md) | Phase 1 P0 高频考点 | ✅ 完成 |
| [2026-04-09-phase2-p1-extensions.md](2026-04-09-phase2-p1-extensions.md) | Phase 2 P1 参数扩展 | ✅ 完成 |
| [2026-04-09-phase3-p2-question-types.md](2026-04-09-phase3-p2-question-types.md) | Phase 3 P2 题型扩展 | ✅ 完成 |
| [2026-04-09-a03-decimal-generator.md](2026-04-09-a03-decimal-generator.md) | A03 块A 生成器小数支持 | ✅ 完成 |
| [2026-04-09-a03-block-b-component.md](2026-04-09-a03-block-b-component.md) | A03 块B 组件重构 | ✅ 完成 |
| [2026-04-08-reference-bank-extraction.md](2026-04-08-reference-bank-extraction.md) | 真题库提取（A01-A08）| ✅ 完成 312题 |

## 审视报告（Reports/）

| 文件 | 内容 |
|------|------|
| [2026-04-09-A03-vertical-calc-review.md](../Reports/2026-04-09-A03-vertical-calc-review.md) | A03 竖式笔算审视报告 |

## 游戏化重设计（Specs/2026-04-10-gamification-redesign.md）

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-13-gamification-phase1-foundation-campaign.md](2026-04-13-gamification-phase1-foundation-campaign.md) | Phase 1：Foundation + 闯关系统（移除旧 XP 体系，新类型/Store/Repository，8 题型闯关地图，CampaignMap 页） | ✅ 开发完成，待浏览器验收 |
| [2026-04-15-gamification-phase2-implementation.md](2026-04-15-gamification-phase2-implementation.md) | Phase 2 进阶系统实施计划（T1-T15 全部完成） | ✅ 完成 |

| Phase 2（待验收）| 进阶系统（心→星，难度自动调配） | ✅ 开发完成，待浏览器验收 |
| Phase 3（待写）| 段位赛系统（BO3/BO5/BO7） | ⬜ 未开始 |

## Phase 1 优化迭代

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-14-phase1-hotfix-and-iteration.md](2026-04-14-phase1-hotfix-and-iteration.md) | Phase 1 热修复 + 优化迭代（去年级区分、History入口、路线匹配修复、出题质量、难度标准） | ✅ 完成 |

## 设计规格新增

| 文件 | 内容 |
|------|------|
| [2026-04-14-difficulty-standard.md](../Specs/2026-04-14-difficulty-standard.md) | 难度基准文档（difficulty 1-10 各档定义 + 8 个生成器分档明细 + 校准记录） |
| [2026-04-14-ui-redesign-spec.md](../Specs/2026-04-14-ui-redesign-spec.md) | UI/UX 整体重设计规格（阳光版 v5 批准；含颜色 token、图标系统、组件规范、交互规则、hotfix 分类；v1 炼金书院草案已废弃） |
| [2026-04-14-ui-redesign-spec.md → 配套实施参考](./../.ui-design/design-system.md) | 设计系统参考文档（.ui-design/design-system.md）—— 实施级 token、SVG 图标说明、组件规格、Do/Don't |

## UI Hotfix 子计划

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-14-ui-hotfix-6-1.md](2026-04-14-ui-hotfix-6-1.md) | UI redesign spec §6.1 的独立 hotfix 执行计划 | ✅ 完成 |

## UI 整体重设计（阳光版 v5）

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase A | Token + 组件基础设施（BottomNav/ProgressBar/Hearts/LoadingScreen/Dialog）| ✅ 完成（2026-04-14）|
| Phase B | 全量页面级改造（Home/CampaignMap/Practice/Summary/WrongBook/Progress/Profile 等）| ✅ 完成（2026-04-14）|
| Phase C | 动效打磨（stagger 入场动画 + 推荐关卡跳动）| ✅ 完成（2026-04-15）|
| Design Review | 设计系统合规审查 + 修复（94% 合规）| ✅ 完成（2026-04-15）|
| WCAG AA 审查 | 无障碍审查 + 修复（CampaignMap 键盘/输入框 aria/skip-link 等）| ✅ 完成（2026-04-15）|
| 浏览器实测 | E2E 主路径验收（Playwright，0 JS 错误）| ✅ 完成（2026-04-15）|

## 视觉 QA 修复（Reports/2026-04-15-visual-qa-results.md）

| 文件 | 内容 | 状态 |
|------|------|------|
| [2026-04-15-visual-qa-fixes.md](2026-04-15-visual-qa-fixes.md) | 视觉 QA 修复（F2/VR-01/VR-02/VR-04/VR-05/F1，共 5 个文件改动）| ✅ 完成（2026-04-15）|

## 待排期

| 内容 | 优先级 |
|------|--------|
| P2 Issue 修复（ISSUE-008~010）| 中 |
| A03 块B Plus（乘法部分积、除法试商）| 中 |
| A09 分数运算生成器 | 低 |
| B/C/D 领域开发 | 低 |
