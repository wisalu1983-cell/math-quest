# v0.4 Release Gate QA 测试设计方法

**执行日期**：2026-04-26
**范围**：v0.4 题目体验系统性修复发布前最终测试
**QA 深度**：L3 Release Gate
**目标用户画像**：上海五年级学生，数学能力中等，主要在移动端练习，桌面端需要键盘可用。
**设计方法**：风险驱动、规格追踪、历史缺陷回归、状态迁移、决策表、统计抽样、探索式 charter、安全/无障碍最小门禁。

## 1. Preflight

| 项目 | 判定 |
|---|---|
| 任务类型 | 混合：自动化、Code Review、拟真人工、视觉/无障碍、安全隐私 |
| 阶段情境 | release / 版本收口 |
| QA 深度 | L3 Release Gate |
| 归档目录 | `QA/runs/2026-04-26-v04-release-gate/` |
| 工具策略 | 复用 `QA/capability-registry.md` 中现有能力，不新增正式脚本 |

## 2. Test Basis

| 来源 | 用途 |
|---|---|
| `ProjectManager/Overview.md` | 当前版本状态、下一步、开放 issue 状态 |
| `ProjectManager/Plan/v0.4/README.md` | v0.4 总入口、Phase 1-5 状态 |
| `ProjectManager/Plan/v0.4/00-overview.md` | 版本目标、范围边界、Backlog 纳入范围 |
| `ProjectManager/Plan/v0.4/03-phase-plan.md` | Phase 依赖、决策门、收尾条件 |
| `ProjectManager/Plan/v0.4/04-execution-discipline.md` | v0.4 验收纪律和 PM 回写规则 |
| `ProjectManager/Backlog.md` | `BL-003` ~ `BL-008` 收口状态 |
| `ProjectManager/ISSUE_LIST.md` | `ISSUE-059` 已关闭与当前开放数 |
| `ProjectManager/Specs/a03-vertical-calc/current.md` | A03 竖式进位/退位格当前权威规则 |
| `ProjectManager/Specs/2026-04-17-generator-redesign-v2.md` | 生成器与题型规格 |
| `ProjectManager/Specs/2026-04-16-generator-difficulty-tiering-spec.md` | 难度档位与题目梯度 |
| `ProjectManager/Specs/2026-04-15-gamification-phase2-advance-spec.md` | 进阶模式回归依据 |
| `ProjectManager/Specs/2026-04-18-rank-match-phase3-implementation-spec.md` | 段位赛与存档迁移边界 |
| `ProjectManager/Specs/v03-supabase-account-sync/` | 账号同步与安全降级回归依据 |
| `QA/runs/2026-04-25-v04-phase1-multiplication-vertical/` | Phase 1 已验收证据 |
| `QA/runs/2026-04-26-v04-phase3-question-quality-v2/` | Phase 3 专业 QA 证据 |
| `QA/runs/2026-04-26-v04-phase4-carry-policy/` | Phase 4 进位/退位格与 compare tip 证据 |
| `QA/runs/2026-04-26-v04-phase5-practice-reset/` | Phase 5 Practice reset 证据 |
| `QA/runs/2026-04-25-v0.3-account-sync-regression/` | v0.3 账号同步回归证据 |

## 3. Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 覆盖用例族 |
|---|---|---|---|---|---|
| R1 | v0.4 已完成 Phase 的修复点在整合后回退 | 高 | 中 | P0 | A, D, F, I |
| R2 | 竖式笔算渲染、答案等价、进位/退位格三档规则与当前规格不一致 | 高 | 中 | P0 | I, G, X |
| R3 | 题目生成器分布、难度、去重或 compare 质量重新漂移 | 高 | 中 | P0 | F, H |
| R4 | Practice 状态重置破坏答题输入、焦点、退出弹窗或跨题状态隔离 | 高 | 中 | P0 | D, G |
| R5 | A04/A06 断联并入 A07 后，地图、进阶、段位或旧存档入口出现断裂 | 中 | 中 | P1 | C, F, K |
| R6 | v0.3 账号同步、本地优先进度、安全降级被 v0.4 变更误伤 | 高 | 低 | P1 | B, S |
| R7 | 移动端可读性、触摸、焦点顺序或儿童认知负担不符合发布质量 | 中 | 中 | P1 | X, I, D |
| R8 | 发布前工程门禁失败：测试、构建、依赖、安全、PM 一致性存在阻塞 | 高 | 中 | P0 | A, S |

## 4. Coverage Strategy

本轮不是替代每个 Phase 的专项 QA，而是在其基础上执行版本级回归门禁：

1. 复核已完成 Phase 的正式 QA 证据是否存在且结论可追溯。
2. 重新跑全量 Vitest、生产构建和标准 Playwright E2E，确认当前工作树可发布。
3. 对高风险修复点跑专项自动化：竖式策略、生成器分布、compare、session 去重、Practice reset、账号同步。
4. 用拟真人工/视觉 QA 抽查发布前关键用户旅程，重点看“孩子是否看得懂、是否被误导、是否能完成练习闭环”。
5. 执行安全/隐私最小门禁：依赖风险、secret/env 泄漏、账号同步降级和数据不丢边界。

## 5. Exit Criteria

- P0 用例全部 PASS。
- 自动化失败不得写成 PASS；必须归因、复跑或标记 FAIL/BLOCKED。
- 发现新增功能缺陷时写入 `ProjectManager/ISSUE_LIST.md`，从 `ISSUE-065` 起编号。
- P1 可存在 RISK，但必须写入 `qa-summary.md` 的 residual risk，并说明是否阻塞发布。
- 过程截图、trace、raw 输出放入 artifacts；正式结论写入 result/summary。
- 若涉及 PM 生命周期回写，必须运行 `npx tsx scripts/pm-sync-check.ts`。
