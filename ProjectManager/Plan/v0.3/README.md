# v0.3 Supabase 在线账号与数据同步 · 主线

> 所属版本：v0.3
> 创建：2026-04-23
> 状态：✅ Phase 1/2/3 完成；真实 Supabase 验收通过；2026-04-25 补跑 scoped QAleader 通过；已发布到 GitHub Pages（2026-04-24）
> 设计规格：[`Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md`](../../Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md)

---

## 导航入口

| 想了解什么 | 打开哪个文件 |
|---|---|
| 版本背景、目标、阶段结构、收口事实 | [`00-overview.md`](./00-overview.md) |
| 需求 / 规格 / 实施 / 验收证据链 | [`01-source-catalog.md`](./01-source-catalog.md) |
| 功能分类、依赖关系、边界 | [`02-classification.md`](./02-classification.md) |
| Phase 1~3 总图、时序、commit 链 | [`03-phase-plan.md`](./03-phase-plan.md) |
| 执行纪律、数据保护规则、验收规则 | [`04-execution-discipline.md`](./04-execution-discipline.md) |
| 实施计划（含全部 Task 和代码） | [`implementation-plan.md`](./implementation-plan.md) |
| Phase 1：基建 + 认证 | [`phases/phase-1.md`](./phases/phase-1.md) |
| Phase 2：同步引擎 | [`phases/phase-2.md`](./phases/phase-2.md) |
| Phase 3：UI + 验收 | [`phases/phase-3.md`](./phases/phase-3.md) |

---

## 收口状态（2026-04-24）

- Phase 1（基建 + 认证）：✅ 已完成
- Phase 2（同步引擎）：✅ 已完成
- Phase 3（UI + 验收）：✅ 已完成，真实 Supabase 8 个验收剧本通过
- QAleader 补跑：✅ 2026-04-25 v0.3 账号同步 scoped 三层回归通过，见 [`../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md`](../../../QA/runs/2026-04-25-v0.3-account-sync-regression/qa-summary.md)
- 线上发布：✅ `master` commit `f34dc38` 已部署到 GitHub Pages
- 线上地址：[`https://wisalu1983-cell.github.io/math-quest/`](https://wisalu1983-cell.github.io/math-quest/)

版本管理配套文档 `00-04` 已于 2026-04-25 按当前版本状态与历史证据事后重建；下一版本轴切换等待下一版本决策后执行。
