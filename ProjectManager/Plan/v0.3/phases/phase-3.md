# Phase 3：UI + 验收

> 所属：v0.3 · 设计规格 §7/§9/§6.4/§13
> 状态：📋 待开始
> 依赖：Phase 2（SyncEngine + 合并策略就绪）

---

## 范围

- 同步状态指示器（`src/components/SyncStatusIndicator.tsx`）+ Home 页集成
- 首次登录合并引导对话框（`src/components/MergeGuideDialog.tsx`）+ App.tsx 集成
- Profile 账号区域（`src/components/AccountSection.tsx`）
- Onboarding 登录入口
- 段位赛联网检查（store + UI）
- 全量测试 + 构建 + 手动验收

## Task 清单

| Task | 内容 | 涉及文件 |
|------|------|---------|
| 3.1 | 同步状态指示器 | `src/components/SyncStatusIndicator.tsx`, `src/pages/Home.tsx` |
| 3.2 | 首次登录合并引导 | `src/components/MergeGuideDialog.tsx`, `src/App.tsx` |
| 3.3 | Profile 账号区域 + Onboarding 入口 | `src/components/AccountSection.tsx`, `src/pages/Profile.tsx`, `src/pages/Onboarding.tsx` |
| 3.4 | 段位赛联网检查 | `src/store/rank-match.ts`, `src/pages/RankMatchHub.tsx` |
| 3.5 | 全量测试 + 构建验证 | 全量 |

## 进入条件

- Phase 2 完成（SyncEngine 可运行、合并策略测试通过）

## 收尾条件

- `npm test` 全量通过
- `npm run build` 通过
- 手动验收：
  - 访客模式正常（不登录 = 和之前一样）
  - 登录页可打开、可输入邮箱
  - Profile 页显示账号区域
  - Home 页登录后显示同步状态
  - 段位赛离线时按钮 disabled
  - 两台设备分别离线做题，联网后进度正确合并（需真实 Supabase 环境）

详细步骤见 [`implementation-plan.md`](../implementation-plan.md) Task 3.1~3.5。
