# Phase 1：基建 + 认证

> 所属：v0.3 · 设计规格 §3/§4/§8/§10/§11
> 状态：📋 待开始

---

## 范围

- Supabase 项目初始化 + 表/RLS/Trigger 创建（SQL 脚本）
- 安装 `@supabase/supabase-js` + 环境配置（`.env.example`）
- Supabase 客户端单例（`src/lib/supabase.ts`）
- 本地存档版本 v3→v4 迁移
- AuthStore（`src/store/auth.ts`）
- LoginPage + App.tsx 集成

## Task 清单

| Task | 内容 | 涉及文件 |
|------|------|---------|
| 1.1 | 安装依赖 + 环境配置 | `package.json`, `.gitignore`, `.env.example`, `src/lib/supabase.ts` |
| 1.2 | 数据库 Schema（SQL 脚本） | `supabase/migrations/001_initial_schema.sql` |
| 1.3 | 本地版本迁移 v3→v4 | `src/repository/local.ts`, `src/types/index.ts` |
| 1.4 | AuthStore | `src/store/auth.ts`, `src/store/index.ts` |
| 1.5 | LoginPage + App.tsx 集成 | `src/pages/LoginPage.tsx`, `src/App.tsx` |

## 进入条件

- 无前置依赖（可立即开始）

## 收尾条件

- `npm run build` 通过
- `npm test` 全部通过
- 登录页可渲染（不需要真实 Supabase 连接）
- 访客模式不受影响

## 人工操作

Phase 1 完成后需要人工在 Supabase Dashboard 执行：
1. 创建 Supabase 项目
2. 在 SQL Editor 执行 `001_initial_schema.sql`
3. 配置 Auth → URL Configuration（Site URL）
4. 复制项目 URL 和 anon key 到 `.env`

详细步骤见 [`implementation-plan.md`](../implementation-plan.md) Task 1.1~1.5。
