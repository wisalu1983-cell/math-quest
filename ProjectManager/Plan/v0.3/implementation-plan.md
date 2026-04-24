# v0.3 Supabase 在线账号与数据同步 · 实施计划

> **⚠️ Phase 3 部分已作废（2026-04-24）。** 本文件的 Task 1.x / 2.x（Phase 1 / Phase 2）继续作为历史实施记录有效；**Task 3.x（Phase 3）草案以下面 5 份开发文档为准，不得按本文件 Phase 3 小节实施**：
>
> - [`Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-00-index.md)
> - [`Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-01-startup-and-merge.md)
> - [`Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-02-sync-status-ui.md)
> - [`Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-03-rank-match-online.md)
> - [`Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md`](../../Specs/v03-supabase-account-sync/2026-04-24-phase3-04-resilience-qa.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 math-quest 接入 Supabase 实现邮箱 Magic Link 登录 + 本地优先数据同步 + 跨设备进度合并。

**Architecture:** Repository 接口不变，写操作先落 localStorage 再通知 SyncEngine 推送远端。SyncEngine 独立于 React 渲染周期，负责 push/pull/merge。未登录时 SyncEngine 休眠，行为和现在完全一致。

**Tech Stack:** Supabase JS SDK (`@supabase/supabase-js`)、Zustand、Vite、Vitest

**设计规格:** [`Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md`](../../Specs/v03-supabase-account-sync/2026-04-23-v03-supabase-账号与同步系统.md)

---

## 文件结构总览

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/lib/supabase.ts` | Supabase 客户端单例 |
| `src/store/auth.ts` | AuthStore（登录状态管理） |
| `src/sync/types.ts` | 同步相关类型定义 |
| `src/sync/merge.ts` | 合并策略函数（GameProgress / History / RankMatch） |
| `src/sync/merge.test.ts` | 合并策略单元测试 |
| `src/sync/remote.ts` | 远端数据访问（Supabase CRUD 封装） |
| `src/sync/engine.ts` | SyncEngine 核心（push/pull/在线检测/Realtime） |
| `src/sync/engine.test.ts` | SyncEngine 单元测试 |
| `src/pages/LoginPage.tsx` | 登录页（邮箱输入 + Magic Link） |
| `src/components/SyncStatusIndicator.tsx` | 同步状态图标 |
| `src/components/MergeGuideDialog.tsx` | 首次登录合并引导 |
| `src/components/AccountSection.tsx` | Profile 页账号区域 |
| `supabase/migrations/001_initial_schema.sql` | 数据库建表 + RLS + Trigger |
| `.env.example` | 环境变量模板 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `package.json` | 新增 `@supabase/supabase-js` 依赖 |
| `.gitignore` | 新增 `.env` |
| `src/types/index.ts` | `User` 新增 `supabaseId?: string` |
| `src/repository/local.ts` | KEYS 扩展、v3→v4 迁移、写操作加 `markDirty` |
| `src/store/index.ts` | `Page` 类型新增 `'login'`；useUIStore 扩展 |
| `src/store/rank-match.ts` | `startRankMatch()` 加联网检查 |
| `src/App.tsx` | Auth 初始化、login 页面路由 |
| `src/pages/Onboarding.tsx` | 新增"已有账号？登录"入口 |
| `src/pages/Home.tsx` | Header 加 SyncStatusIndicator |
| `src/pages/Profile.tsx` | 加 AccountSection |
| `src/pages/RankMatchHub.tsx` | 加联网检查 UI |

---

## Phase 1：基建 + 认证

### Task 1.1：安装依赖 + 环境配置

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: 安装 Supabase SDK**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: 创建 `.env.example`**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: `.gitignore` 加 `.env`**

在 `.gitignore` 末尾追加：
```
.env
.env.local
```

- [ ] **Step 4: 创建 Supabase 客户端单例**

```typescript
// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}
```

- [ ] **Step 5: 运行 `npm run build` 确认构建通过**

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example src/lib/supabase.ts
git commit -m "feat(v0.3): 安装 Supabase SDK + 环境配置"
```

---

### Task 1.2：数据库 Schema（SQL 脚本）

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: 创建 SQL 迁移脚本**

```sql
-- supabase/migrations/001_initial_schema.sql
-- v0.3: 在线账号与数据同步系统

-- ============================================================
-- 1. 表结构
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  avatar_seed text not null default '',
  settings jsonb not null default '{"soundEnabled": true, "hapticsEnabled": true}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table game_progress (
  user_id uuid primary key references profiles(id) on delete cascade,
  campaign_progress jsonb not null default '{}',
  advance_progress jsonb not null default '{}',
  rank_progress jsonb not null default '{"currentTier": "apprentice", "history": []}',
  wrong_questions jsonb not null default '[]',
  total_questions_attempted int not null default 0,
  total_questions_correct int not null default 0,
  updated_at timestamptz not null default now()
);

create table history_records (
  id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  session_mode text not null,
  started_at bigint not null,
  ended_at bigint,
  completed boolean not null default false,
  result text not null,
  topic_id text not null,
  rank_match_meta jsonb,
  questions jsonb not null default '[]',
  synced_at timestamptz not null default now()
);
create index idx_history_user on history_records(user_id);

create table rank_match_sessions (
  id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  target_tier text not null,
  best_of int not null,
  wins_to_advance int not null,
  games jsonb not null default '[]',
  status text not null default 'active',
  outcome text,
  started_at bigint not null,
  suspended_at bigint,
  cancelled_at bigint,
  ended_at bigint,
  updated_at timestamptz not null default now()
);
create index idx_rank_match_user on rank_match_sessions(user_id);

create table sync_metadata (
  user_id uuid primary key references profiles(id) on delete cascade,
  last_synced_at timestamptz not null default now(),
  device_id text
);

-- ============================================================
-- 2. Row Level Security
-- ============================================================

alter table profiles enable row level security;
create policy "用户读写自己的资料" on profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter table game_progress enable row level security;
create policy "用户读写自己的进度" on game_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table history_records enable row level security;
create policy "用户读写自己的历史" on history_records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table rank_match_sessions enable row level security;
create policy "用户读写自己的段位赛" on rank_match_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table sync_metadata enable row level security;
create policy "用户读写自己的同步元数据" on sync_metadata
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 3. Triggers
-- ============================================================

-- 新用户注册时自动创建业务表行
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  insert into game_progress (user_id) values (new.id);
  insert into sync_metadata (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 自动更新 updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger set_updated_at before update on game_progress
  for each row execute function update_updated_at();
create trigger set_updated_at before update on rank_match_sessions
  for each row execute function update_updated_at();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/
git commit -m "feat(v0.3): 数据库 schema 迁移脚本（表/RLS/Trigger）"
```

> **人工操作**：需要在 Supabase Dashboard 的 SQL Editor 中执行此脚本，或配置 Supabase CLI 后运行 `supabase db push`。

---

### Task 1.3：本地版本迁移 v3 → v4

**Files:**
- Modify: `src/repository/local.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: `User` 类型新增 `supabaseId`**

在 `src/types/index.ts` 的 `User` interface 中新增：

```typescript
interface User {
  id: string;
  nickname: string;
  avatarSeed: string;
  createdAt: number;
  grade?: number;           // @deprecated
  supabaseId?: string;      // v0.3: 登录后填入 Supabase UUID
  settings: UserSettings;
}
```

- [ ] **Step 2: 更新 `CURRENT_VERSION` 和迁移链**

在 `src/repository/local.ts` 中：

```typescript
// 修改 CURRENT_VERSION
const CURRENT_VERSION = 4;  // was 3

// 新增迁移函数
function migrateV3ToV4(gp: GameProgress): GameProgress {
  return gp;  // GameProgress 结构不变
}

// 注册到 MIGRATIONS
const MIGRATIONS: Record<number, (gp: GameProgress) => GameProgress> = {
  2: migrateV2ToV3,
  3: migrateV3ToV4,  // 新增
};
```

- [ ] **Step 3: KEYS 新增同步相关 key**

```typescript
const KEYS = {
  // ... 现有 key 不变 ...
  syncState: () => `${keyPrefix}sync_state`,
  authUserId: () => `${keyPrefix}auth_user_id`,
} as const;
```

- [ ] **Step 4: 运行测试确认迁移不破坏现有功能**

```bash
npm test
```

预期：所有现有测试通过。

- [ ] **Step 5: Commit**

```bash
git add src/repository/local.ts src/types/index.ts
git commit -m "feat(v0.3): 本地存档版本 v3→v4 迁移 + User.supabaseId 字段"
```

---

### Task 1.4：AuthStore

**Files:**
- Create: `src/store/auth.ts`
- Modify: `src/store/index.ts` — Page 类型新增 `'login'`

- [ ] **Step 1: Page 类型新增 `'login'`**

在 `src/store/index.ts` 的 `useUIStore` 中，`currentPage` 的类型联合新增 `'login'`：

```typescript
currentPage: 'onboarding' | 'home' | 'campaign-map' | 'advance-select'
         | 'practice' | 'summary' | 'progress' | 'profile'
         | 'wrong-book' | 'history' | 'session-detail'
         | 'rank-match-hub' | 'rank-match-game-result' | 'rank-match-result'
         | 'login';  // v0.3
```

- [ ] **Step 2: 创建 AuthStore**

```typescript
// src/store/auth.ts
import { create } from 'zustand';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  magicLinkSent: boolean;

  initialize: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  supabaseUser: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  magicLinkSent: false,

  initialize: async () => {
    const client = getSupabaseClient();
    if (!client) {
      set({ isLoading: false });
      return;
    }

    const { data: { session } } = await client.auth.getSession();
    set({
      supabaseUser: session?.user ?? null,
      isAuthenticated: !!session?.user,
      isLoading: false,
    });

    client.auth.onAuthStateChange((_event, session) => {
      set({
        supabaseUser: session?.user ?? null,
        isAuthenticated: !!session?.user,
      });
    });
  },

  signInWithMagicLink: async (email: string) => {
    const client = getSupabaseClient();
    if (!client) {
      set({ authError: 'Supabase 未配置' });
      return;
    }

    set({ authError: null, magicLinkSent: false });

    const { error } = await client.auth.signInWithOtp({ email });
    if (error) {
      set({ authError: error.message });
    } else {
      set({ magicLinkSent: true });
    }
  },

  signOut: async () => {
    const client = getSupabaseClient();
    if (!client) return;

    await client.auth.signOut();
    set({
      supabaseUser: null,
      isAuthenticated: false,
      magicLinkSent: false,
    });
  },

  clearError: () => set({ authError: null }),
}));
```

- [ ] **Step 3: 运行 `npm run build` 确认类型检查通过**

- [ ] **Step 4: Commit**

```bash
git add src/store/auth.ts src/store/index.ts
git commit -m "feat(v0.3): AuthStore + Page 类型新增 login"
```

---

### Task 1.5：LoginPage + App.tsx 集成

**Files:**
- Create: `src/pages/LoginPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 创建 LoginPage**

```tsx
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const { signInWithMagicLink, magicLinkSent, authError, isLoading, clearError } = useAuthStore();
  const setPage = useUIStore(s => s.setPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await signInWithMagicLink(email.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-white">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">登录账号</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          输入邮箱，我们会发送一个登录链接
        </p>

        {magicLinkSent ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📧</div>
            <p className="text-green-600 font-medium">登录链接已发送！</p>
            <p className="text-sm text-gray-500">
              请查看 <strong>{email}</strong> 的收件箱，点击链接完成登录
            </p>
            <button
              onClick={() => setPage('onboarding')}
              className="text-sm text-blue-500 underline"
            >
              返回
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }}
              placeholder="你的邮箱地址"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none text-base"
              autoFocus
              required
            />
            {authError && (
              <p className="text-red-500 text-sm">{authError}</p>
            )}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-50"
            >
              发送登录链接
            </button>
            <button
              type="button"
              onClick={() => setPage('onboarding')}
              className="w-full py-2 text-sm text-gray-500"
            >
              返回
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: App.tsx 集成 Auth 初始化 + LoginPage 路由**

在 `src/App.tsx` 中：

1. 导入新依赖：
```typescript
import { useAuthStore } from './store/auth';
import { LoginPage } from './pages/LoginPage';
```

2. 在 `useEffect` 初始化块中新增 auth 初始化（在 `repository.init()` 之后）：
```typescript
useAuthStore.getState().initialize();
```

3. 在 `pages` 映射对象中新增：
```typescript
login: <LoginPage />,
```

- [ ] **Step 3: 运行 `npm run build` 确认构建通过**

- [ ] **Step 4: Commit**

```bash
git add src/pages/LoginPage.tsx src/App.tsx
git commit -m "feat(v0.3): LoginPage + App.tsx auth 初始化集成"
```

---

## Phase 2：同步引擎

### Task 2.1：同步类型定义

**Files:**
- Create: `src/sync/types.ts`

- [ ] **Step 1: 创建类型文件**

```typescript
// src/sync/types.ts
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export type DirtyKey =
  | 'profiles'
  | 'game_progress'
  | 'history_records'
  | 'rank_match_sessions';

export interface SyncState {
  lastSyncedAt: string | null;
  dirtyKeys: DirtyKey[];
  deviceId: string;
}

export interface RemoteGameProgress {
  user_id: string;
  campaign_progress: Record<string, unknown>;
  advance_progress: Record<string, unknown>;
  rank_progress: Record<string, unknown>;
  wrong_questions: unknown[];
  total_questions_attempted: number;
  total_questions_correct: number;
  updated_at: string;
}

export interface RemoteProfile {
  id: string;
  nickname: string;
  avatar_seed: string;
  settings: Record<string, unknown>;
  updated_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/sync/types.ts
git commit -m "feat(v0.3): 同步类型定义"
```

---

### Task 2.2：合并策略（核心 + 测试）

**Files:**
- Create: `src/sync/merge.ts`
- Create: `src/sync/merge.test.ts`

- [ ] **Step 1: 写合并策略的测试（先写测试）**

```typescript
// src/sync/merge.test.ts
import { describe, it, expect } from 'vitest';
import {
  mergeCompletedLevels,
  mergeCampaignProgress,
  mergeAdvanceProgress,
  mergeRankProgress,
  mergeWrongQuestions,
  mergeGameProgress,
  mergeHistoryRecords,
  mergeRankMatchSessions,
} from './merge';

describe('mergeCompletedLevels', () => {
  it('本地空 + 远端有数据 → 取远端', () => {
    const local: never[] = [];
    const remote = [{ levelId: 'L1', bestHearts: 2, completedAt: 100 }];
    expect(mergeCompletedLevels(local, remote)).toEqual(remote);
  });

  it('本地有 + 远端空 → 取本地', () => {
    const local = [{ levelId: 'L1', bestHearts: 3, completedAt: 100 }];
    expect(mergeCompletedLevels(local, [])).toEqual(local);
  });

  it('同 levelId → bestHearts 取 max', () => {
    const local = [{ levelId: 'L1', bestHearts: 2, completedAt: 100 }];
    const remote = [{ levelId: 'L1', bestHearts: 3, completedAt: 200 }];
    const result = mergeCompletedLevels(local, remote);
    expect(result).toHaveLength(1);
    expect(result[0].bestHearts).toBe(3);
  });

  it('不同 levelId → 并集', () => {
    const local = [{ levelId: 'L1', bestHearts: 2, completedAt: 100 }];
    const remote = [{ levelId: 'L2', bestHearts: 1, completedAt: 200 }];
    expect(mergeCompletedLevels(local, remote)).toHaveLength(2);
  });
});

describe('mergeCampaignProgress', () => {
  it('campaignCompleted 取 OR', () => {
    const local = { topicId: 'number-sense' as const, completedLevels: [], campaignCompleted: true };
    const remote = { topicId: 'number-sense' as const, completedLevels: [], campaignCompleted: false };
    const result = mergeCampaignProgress(local, remote);
    expect(result.campaignCompleted).toBe(true);
  });
});

describe('mergeAdvanceProgress', () => {
  it('所有计数器取 max', () => {
    const local = { topicId: 'number-sense' as const, heartsAccumulated: 10, sessionsPlayed: 5, sessionsWhite: 1, unlockedAt: 100 };
    const remote = { topicId: 'number-sense' as const, heartsAccumulated: 8, sessionsPlayed: 7, sessionsWhite: 2, unlockedAt: 50 };
    const result = mergeAdvanceProgress(local, remote);
    expect(result.heartsAccumulated).toBe(10);
    expect(result.sessionsPlayed).toBe(7);
    expect(result.sessionsWhite).toBe(2);
    expect(result.unlockedAt).toBe(50); // 取更早的解锁时间
  });
});

const TIER_ORDER = ['apprentice', 'rookie', 'pro', 'expert', 'master'];

describe('mergeRankProgress', () => {
  it('currentTier 取最高', () => {
    const local = { currentTier: 'pro' as const, history: [] };
    const remote = { currentTier: 'rookie' as const, history: [] };
    const result = mergeRankProgress(local, remote);
    expect(result.currentTier).toBe('pro');
  });

  it('history 按 startedAt 去重合并', () => {
    const local = { currentTier: 'rookie' as const, history: [
      { targetTier: 'rookie', outcome: 'promoted', startedAt: 100, endedAt: 200 },
    ] };
    const remote = { currentTier: 'rookie' as const, history: [
      { targetTier: 'rookie', outcome: 'promoted', startedAt: 100, endedAt: 200 },
      { targetTier: 'pro', outcome: 'eliminated', startedAt: 300, endedAt: 400 },
    ] };
    const result = mergeRankProgress(local, remote);
    expect(result.history).toHaveLength(2);
  });

  it('activeSessionId 取非空值', () => {
    const local = { currentTier: 'rookie' as const, history: [], activeSessionId: 'abc' };
    const remote = { currentTier: 'rookie' as const, history: [], activeSessionId: undefined };
    const result = mergeRankProgress(local, remote);
    expect(result.activeSessionId).toBe('abc');
  });

  it('activeSessionId 双方均非空时取远端', () => {
    const local = { currentTier: 'rookie' as const, history: [], activeSessionId: 'local-id' };
    const remote = { currentTier: 'rookie' as const, history: [], activeSessionId: 'remote-id' };
    const result = mergeRankProgress(local, remote);
    expect(result.activeSessionId).toBe('remote-id');
  });
});

describe('mergeWrongQuestions', () => {
  it('按 question.id + wrongAt 去重', () => {
    const local = [{ question: { id: 'q1' }, wrongAnswer: 'a', wrongAt: 100 }];
    const remote = [{ question: { id: 'q1' }, wrongAnswer: 'a', wrongAt: 100 }];
    const result = mergeWrongQuestions(local as any, remote as any);
    expect(result).toHaveLength(1);
  });

  it('合并后截取前 100 条', () => {
    const local = Array.from({ length: 60 }, (_, i) => ({
      question: { id: `q${i}` }, wrongAnswer: 'a', wrongAt: i,
    }));
    const remote = Array.from({ length: 60 }, (_, i) => ({
      question: { id: `r${i}` }, wrongAnswer: 'b', wrongAt: i + 100,
    }));
    const result = mergeWrongQuestions(local as any, remote as any);
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe('mergeGameProgress', () => {
  it('totalQuestionsAttempted / Correct 取 max', () => {
    const local = { userId: 'u1', campaignProgress: {}, advanceProgress: {}, wrongQuestions: [], totalQuestionsAttempted: 100, totalQuestionsCorrect: 80 };
    const remote = { userId: 'u1', campaignProgress: {}, advanceProgress: {}, wrongQuestions: [], totalQuestionsAttempted: 90, totalQuestionsCorrect: 85 };
    const result = mergeGameProgress(local as any, remote as any);
    expect(result.totalQuestionsAttempted).toBe(100);
    expect(result.totalQuestionsCorrect).toBe(85);
  });
});

describe('mergeHistoryRecords', () => {
  it('按 id 去重合并', () => {
    const local = [{ id: 'h1', userId: 'u1' }, { id: 'h2', userId: 'u1' }];
    const remote = [{ id: 'h2', userId: 'u1' }, { id: 'h3', userId: 'u1' }];
    const result = mergeHistoryRecords(local as any, remote as any);
    expect(result).toHaveLength(3);
  });
});

describe('mergeRankMatchSessions', () => {
  it('状态优先级：completed > active', () => {
    const local = { id: 's1', status: 'active', games: [{ gameIndex: 1 }] };
    const remote = { id: 's1', status: 'completed', outcome: 'promoted', games: [{ gameIndex: 1 }, { gameIndex: 2 }] };
    const result = mergeRankMatchSessions(
      { s1: local } as any,
      { s1: remote } as any,
    );
    expect(result.s1.status).toBe('completed');
    expect(result.s1.games).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 运行测试确认全部 FAIL**

```bash
npx vitest run src/sync/merge.test.ts
```

预期：全部失败（模块不存在）。

- [ ] **Step 3: 实现合并函数**

```typescript
// src/sync/merge.ts
import type { GameProgress, TopicCampaignProgress, WrongQuestion, RankProgress } from '../types/gamification';
import type { HistoryRecord } from '../types';
import type { RankMatchSession } from '../types/gamification';
import type { TopicAdvanceProgress } from '../types/gamification';
import type { LevelCompletion } from '../types/gamification';

const TIER_ORDER = ['apprentice', 'rookie', 'pro', 'expert', 'master'] as const;

export function mergeCompletedLevels(
  local: LevelCompletion[],
  remote: LevelCompletion[],
): LevelCompletion[] {
  const map = new Map<string, LevelCompletion>();
  for (const lc of local) map.set(lc.levelId, lc);
  for (const rc of remote) {
    const existing = map.get(rc.levelId);
    if (!existing || rc.bestHearts > existing.bestHearts) {
      map.set(rc.levelId, rc);
    }
  }
  return Array.from(map.values());
}

export function mergeCampaignProgress(
  local: TopicCampaignProgress,
  remote: TopicCampaignProgress,
): TopicCampaignProgress {
  return {
    topicId: local.topicId,
    completedLevels: mergeCompletedLevels(
      local.completedLevels ?? [],
      remote.completedLevels ?? [],
    ),
    campaignCompleted: local.campaignCompleted || remote.campaignCompleted,
  };
}

export function mergeAdvanceProgress(
  local: TopicAdvanceProgress,
  remote: TopicAdvanceProgress,
): TopicAdvanceProgress {
  return {
    topicId: local.topicId,
    heartsAccumulated: Math.max(local.heartsAccumulated, remote.heartsAccumulated),
    sessionsPlayed: Math.max(local.sessionsPlayed, remote.sessionsPlayed),
    sessionsWhite: Math.max(local.sessionsWhite, remote.sessionsWhite),
    unlockedAt: Math.min(local.unlockedAt, remote.unlockedAt),
  };
}

export function mergeRankProgress(
  local: RankProgress,
  remote: RankProgress,
): RankProgress {
  const localIdx = TIER_ORDER.indexOf(local.currentTier as any);
  const remoteIdx = TIER_ORDER.indexOf(remote.currentTier as any);

  // history 按 startedAt 去重
  const historyMap = new Map<number, any>();
  for (const h of (local.history ?? [])) historyMap.set(h.startedAt, h);
  for (const h of (remote.history ?? [])) historyMap.set(h.startedAt, h);
  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => a.startedAt - b.startedAt);

  // activeSessionId: 取非空值；双方均非空取远端
  let activeSessionId: string | undefined;
  if (remote.activeSessionId && local.activeSessionId) {
    activeSessionId = remote.activeSessionId;
  } else {
    activeSessionId = remote.activeSessionId ?? local.activeSessionId;
  }

  return {
    currentTier: localIdx >= remoteIdx ? local.currentTier : remote.currentTier,
    history: mergedHistory,
    activeSessionId,
  };
}

export function mergeWrongQuestions(
  local: WrongQuestion[],
  remote: WrongQuestion[],
): WrongQuestion[] {
  const map = new Map<string, WrongQuestion>();
  const makeKey = (wq: WrongQuestion) => `${wq.question.id}_${wq.wrongAt}`;
  for (const wq of local) map.set(makeKey(wq), wq);
  for (const wq of remote) map.set(makeKey(wq), wq);
  return Array.from(map.values())
    .sort((a, b) => b.wrongAt - a.wrongAt)
    .slice(0, 100);
}

export function mergeGameProgress(
  local: GameProgress,
  remote: GameProgress,
): GameProgress {
  // campaign: 按 topicId 逐个合并
  const allTopicIds = new Set([
    ...Object.keys(local.campaignProgress ?? {}),
    ...Object.keys(remote.campaignProgress ?? {}),
  ]);
  const mergedCampaign: Record<string, TopicCampaignProgress> = {};
  for (const tid of allTopicIds) {
    const lc = (local.campaignProgress as any)?.[tid];
    const rc = (remote.campaignProgress as any)?.[tid];
    if (lc && rc) {
      mergedCampaign[tid] = mergeCampaignProgress(lc, rc);
    } else {
      mergedCampaign[tid] = lc ?? rc;
    }
  }

  // advance: 按 topicId 逐个合并
  const allAdvTopics = new Set([
    ...Object.keys(local.advanceProgress ?? {}),
    ...Object.keys(remote.advanceProgress ?? {}),
  ]);
  const mergedAdvance: Record<string, TopicAdvanceProgress> = {};
  for (const tid of allAdvTopics) {
    const la = (local.advanceProgress as any)?.[tid];
    const ra = (remote.advanceProgress as any)?.[tid];
    if (la && ra) {
      mergedAdvance[tid] = mergeAdvanceProgress(la, ra);
    } else {
      mergedAdvance[tid] = la ?? ra;
    }
  }

  // rank
  const mergedRank = (local.rankProgress && remote.rankProgress)
    ? mergeRankProgress(local.rankProgress, remote.rankProgress)
    : (local.rankProgress ?? remote.rankProgress);

  return {
    userId: local.userId,
    campaignProgress: mergedCampaign as any,
    advanceProgress: mergedAdvance as any,
    rankProgress: mergedRank,
    wrongQuestions: mergeWrongQuestions(local.wrongQuestions ?? [], remote.wrongQuestions ?? []),
    totalQuestionsAttempted: Math.max(local.totalQuestionsAttempted, remote.totalQuestionsAttempted),
    totalQuestionsCorrect: Math.max(local.totalQuestionsCorrect, remote.totalQuestionsCorrect),
  };
}

export function mergeHistoryRecords(
  local: HistoryRecord[],
  remote: HistoryRecord[],
): HistoryRecord[] {
  const map = new Map<string, HistoryRecord>();
  for (const r of local) map.set(r.id, r);
  for (const r of remote) {
    if (!map.has(r.id)) map.set(r.id, r);
  }
  return Array.from(map.values()).sort((a, b) => b.startedAt - a.startedAt);
}

const STATUS_PRIORITY: Record<string, number> = {
  active: 0,
  suspended: 1,
  cancelled: 2,
  completed: 3,
};

export function mergeRankMatchSessions(
  local: Record<string, RankMatchSession>,
  remote: Record<string, RankMatchSession>,
): Record<string, RankMatchSession> {
  const merged: Record<string, RankMatchSession> = { ...local };
  for (const [id, rs] of Object.entries(remote)) {
    const existing = merged[id];
    if (!existing) {
      merged[id] = rs;
    } else {
      const localPrio = STATUS_PRIORITY[existing.status] ?? 0;
      const remotePrio = STATUS_PRIORITY[rs.status] ?? 0;
      if (remotePrio > localPrio) {
        merged[id] = rs;
      } else if (remotePrio === localPrio && rs.games.length > existing.games.length) {
        merged[id] = rs;
      }
    }
  }
  return merged;
}
```

- [ ] **Step 4: 运行测试确认全部 PASS**

```bash
npx vitest run src/sync/merge.test.ts
```

预期：全部通过。

- [ ] **Step 5: 运行全量测试确认不影响现有功能**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/sync/merge.ts src/sync/merge.test.ts
git commit -m "feat(v0.3): 合并策略函数 + 单元测试"
```

---

### Task 2.3：远端数据访问层

**Files:**
- Create: `src/sync/remote.ts`

- [ ] **Step 1: 实现远端 CRUD 封装**

```typescript
// src/sync/remote.ts
import { getSupabaseClient } from '../lib/supabase';
import type { GameProgress } from '../types/gamification';
import type { HistoryRecord, User } from '../types';
import type { RankMatchSession } from '../types/gamification';

export async function fetchRemoteProfile(userId: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function upsertRemoteProfile(userId: string, profile: { nickname: string; avatarSeed: string; settings: Record<string, unknown> }) {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client
    .from('profiles')
    .upsert({ id: userId, nickname: profile.nickname, avatar_seed: profile.avatarSeed, settings: profile.settings });
  return !error;
}

export async function fetchRemoteGameProgress(userId: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from('game_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function upsertRemoteGameProgress(userId: string, gp: GameProgress) {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client
    .from('game_progress')
    .upsert({
      user_id: userId,
      campaign_progress: gp.campaignProgress,
      advance_progress: gp.advanceProgress,
      rank_progress: gp.rankProgress ?? { currentTier: 'apprentice', history: [] },
      wrong_questions: gp.wrongQuestions,
      total_questions_attempted: gp.totalQuestionsAttempted,
      total_questions_correct: gp.totalQuestionsCorrect,
    });
  return !error;
}

export async function fetchRemoteHistory(userId: string, since?: string): Promise<HistoryRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  let query = client.from('history_records').select('*').eq('user_id', userId);
  if (since) query = query.gt('synced_at', since);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    sessionMode: row.session_mode,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    completed: row.completed,
    result: row.result,
    topicId: row.topic_id,
    rankMatchMeta: row.rank_match_meta,
    questions: row.questions,
  })) as HistoryRecord[];
}

export async function upsertRemoteHistoryRecords(userId: string, records: HistoryRecord[]) {
  const client = getSupabaseClient();
  if (!client) return false;
  if (records.length === 0) return true;
  const rows = records.map(r => ({
    id: r.id,
    user_id: userId,
    session_mode: r.sessionMode,
    started_at: r.startedAt,
    ended_at: r.endedAt ?? null,
    completed: r.completed,
    result: r.result,
    topic_id: r.topicId,
    rank_match_meta: r.rankMatchMeta ?? null,
    questions: r.questions,
  }));
  const { error } = await client.from('history_records').upsert(rows);
  return !error;
}

export async function fetchRemoteRankMatchSessions(userId: string, since?: string) {
  const client = getSupabaseClient();
  if (!client) return {};
  let query = client.from('rank_match_sessions').select('*').eq('user_id', userId);
  if (since) query = query.gt('updated_at', since);
  const { data, error } = await query;
  if (error || !data) return {};
  const result: Record<string, RankMatchSession> = {};
  for (const row of data) {
    result[row.id] = {
      id: row.id, userId: row.user_id, targetTier: row.target_tier,
      bestOf: row.best_of, winsToAdvance: row.wins_to_advance,
      games: row.games, status: row.status, outcome: row.outcome,
      startedAt: row.started_at, suspendedAt: row.suspended_at,
      cancelledAt: row.cancelled_at, endedAt: row.ended_at,
    } as RankMatchSession;
  }
  return result;
}

export async function upsertRemoteRankMatchSessions(userId: string, sessions: Record<string, RankMatchSession>) {
  const client = getSupabaseClient();
  if (!client) return false;
  const rows = Object.values(sessions).map(s => ({
    id: s.id, user_id: userId, target_tier: s.targetTier,
    best_of: s.bestOf, wins_to_advance: s.winsToAdvance,
    games: s.games, status: s.status, outcome: s.outcome ?? null,
    started_at: s.startedAt, suspended_at: s.suspendedAt ?? null,
    cancelled_at: s.cancelledAt ?? null, ended_at: s.endedAt ?? null,
  }));
  if (rows.length === 0) return true;
  const { error } = await client.from('rank_match_sessions').upsert(rows);
  return !error;
}
```

- [ ] **Step 2: 运行 `npm run build` 确认类型检查通过**

- [ ] **Step 3: Commit**

```bash
git add src/sync/remote.ts
git commit -m "feat(v0.3): 远端数据访问层（Supabase CRUD 封装）"
```

---

### Task 2.4：SyncEngine + Repository 改造

**Files:**
- Create: `src/sync/engine.ts`
- Modify: `src/repository/local.ts`

- [ ] **Step 1: 创建 SyncEngine**

```typescript
// src/sync/engine.ts
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { getSupabaseClient } from '../lib/supabase';
import { repository } from '../repository/local';
import { mergeGameProgress, mergeHistoryRecords, mergeRankMatchSessions } from './merge';
import {
  fetchRemoteGameProgress, upsertRemoteGameProgress,
  fetchRemoteHistory, upsertRemoteHistoryRecords,
  fetchRemoteRankMatchSessions, upsertRemoteRankMatchSessions,
  upsertRemoteProfile,
} from './remote';
import type { SyncState, SyncStatus, DirtyKey } from './types';

const SYNC_INTERVAL_MS = 30_000;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

interface SyncEngineState {
  status: SyncStatus;
  retryCount: number;
  syncState: SyncState;

  initialize: (userId: string) => void;
  shutdown: () => void;
  markDirty: (key: DirtyKey) => void;
  fullSync: () => Promise<void>;
}

function loadSyncState(): SyncState {
  try {
    const raw = localStorage.getItem(repository.getSyncStateKey());
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { lastSyncedAt: null, dirtyKeys: [], deviceId: nanoid(12) };
}

function saveSyncState(state: SyncState) {
  localStorage.setItem(repository.getSyncStateKey(), JSON.stringify(state));
}

export const useSyncEngine = create<SyncEngineState>((set, get) => {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let userId: string | null = null;
  let onlineHandler: (() => void) | null = null;

  const push = async () => {
    if (!userId) return;
    const { syncState } = get();
    if (syncState.dirtyKeys.length === 0) return;
    if (!navigator.onLine) return;

    set({ status: 'syncing' });
    const remaining: DirtyKey[] = [];

    for (const key of syncState.dirtyKeys) {
      let ok = false;
      if (key === 'game_progress') {
        const gp = repository.getGameProgress(userId);
        if (gp) ok = await upsertRemoteGameProgress(userId, gp);
      } else if (key === 'history_records') {
        const hist = repository.getHistory();
        ok = await upsertRemoteHistoryRecords(userId, hist);
      } else if (key === 'rank_match_sessions') {
        const rms = repository.getRankMatchSessions();
        ok = await upsertRemoteRankMatchSessions(userId, rms);
      } else if (key === 'profiles') {
        const user = repository.getUser();
        if (user) ok = await upsertRemoteProfile(userId, {
          nickname: user.nickname,
          avatarSeed: user.avatarSeed,
          settings: user.settings as any,
        });
      }
      if (!ok) remaining.push(key);
    }

    const newState = { ...syncState, dirtyKeys: remaining };
    if (remaining.length === 0) {
      newState.lastSyncedAt = new Date().toISOString();
    }
    saveSyncState(newState);
    set({
      syncState: newState,
      status: remaining.length > 0 ? 'error' : 'synced',
      retryCount: remaining.length > 0 ? get().retryCount + 1 : 0,
    });
  };

  const pull = async () => {
    if (!userId || !navigator.onLine) return;
    const { syncState } = get();

    const remoteGP = await fetchRemoteGameProgress(userId);
    if (remoteGP) {
      const localGP = repository.getGameProgress(userId);
      if (localGP) {
        const remoteAsLocal = {
          userId,
          campaignProgress: remoteGP.campaign_progress,
          advanceProgress: remoteGP.advance_progress,
          rankProgress: remoteGP.rank_progress,
          wrongQuestions: remoteGP.wrong_questions,
          totalQuestionsAttempted: remoteGP.total_questions_attempted,
          totalQuestionsCorrect: remoteGP.total_questions_correct,
        } as any;
        const merged = mergeGameProgress(localGP, remoteAsLocal);
        repository.saveGameProgressSilent(merged);
        await upsertRemoteGameProgress(userId, merged);
      }
    }

    const remoteHistory = await fetchRemoteHistory(userId, syncState.lastSyncedAt ?? undefined);
    if (remoteHistory.length > 0) {
      const localHistory = repository.getHistory();
      const merged = mergeHistoryRecords(localHistory, remoteHistory);
      repository.saveHistorySilent(merged);
      const localOnly = merged.filter(r => !remoteHistory.find(rr => rr.id === r.id));
      if (localOnly.length > 0) await upsertRemoteHistoryRecords(userId, localOnly);
    }

    const remoteRMS = await fetchRemoteRankMatchSessions(userId, syncState.lastSyncedAt ?? undefined);
    if (Object.keys(remoteRMS).length > 0) {
      const localRMS = repository.getRankMatchSessions();
      const merged = mergeRankMatchSessions(localRMS, remoteRMS);
      repository.saveRankMatchSessionsSilent(merged);
      await upsertRemoteRankMatchSessions(userId, merged);
    }

    const newState = { ...get().syncState, lastSyncedAt: new Date().toISOString() };
    saveSyncState(newState);
    set({ syncState: newState, status: 'synced', retryCount: 0 });
  };

  return {
    status: 'idle',
    retryCount: 0,
    syncState: loadSyncState(),

    initialize: (uid: string) => {
      userId = uid;
      set({ status: navigator.onLine ? 'syncing' : 'offline', syncState: loadSyncState() });

      get().fullSync();

      intervalId = setInterval(() => {
        if (navigator.onLine && userId) pull();
      }, SYNC_INTERVAL_MS);

      onlineHandler = () => {
        set({ status: 'syncing' });
        get().fullSync();
      };
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', () => set({ status: 'offline' }));

      // Realtime 订阅
      const client = getSupabaseClient();
      if (client) {
        client.channel('game_progress_changes')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_progress',
            filter: `user_id=eq.${uid}`,
          }, () => { pull(); })
          .subscribe();
      }
    },

    shutdown: () => {
      userId = null;
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      if (onlineHandler) { window.removeEventListener('online', onlineHandler); onlineHandler = null; }
      const client = getSupabaseClient();
      if (client) client.removeAllChannels();
      set({ status: 'idle', retryCount: 0 });
    },

    markDirty: (key: DirtyKey) => {
      const { syncState } = get();
      if (!syncState.dirtyKeys.includes(key)) {
        const newState = { ...syncState, dirtyKeys: [...syncState.dirtyKeys, key] };
        saveSyncState(newState);
        set({ syncState: newState });
      }
      if (navigator.onLine && userId) push();
    },

    fullSync: async () => {
      if (!userId || !navigator.onLine) return;
      set({ status: 'syncing' });
      try {
        await pull();
        await push();
        set({ status: 'synced' });
      } catch {
        set({ status: 'error' });
      }
    },
  };
});
```

- [ ] **Step 2: Repository 改造——新增 silent 方法 + markDirty 调用**

在 `src/repository/local.ts` 中新增以下内容：

1. 在 KEYS 下方导出 `getSyncStateKey` 方法：
```typescript
getSyncStateKey() { return KEYS.syncState(); },
```

2. 新增 `Silent` 写方法（供 SyncEngine pull 后写入，不触发 markDirty 避免循环）：
```typescript
saveGameProgressSilent(progress: GameProgress) {
  write(KEYS.gameProgress(), progress);
},
saveHistorySilent(records: HistoryRecord[]) {
  localStorage.setItem(KEYS.history(), JSON.stringify(records));
},
saveRankMatchSessionsSilent(sessions: Record<string, RankMatchSession>) {
  localStorage.setItem(KEYS.rankMatchSessions(), JSON.stringify(sessions));
},
```

3. 在现有的 `saveGameProgress`、`saveSession`、`saveHistoryRecord`、`saveRankMatchSession` 末尾加 markDirty：

```typescript
// 在各写方法末尾追加（懒加载避免循环依赖）
const { useSyncEngine } = await import('../sync/engine');
// 但实际使用动态 import 在同步函数中不可行，改用事件通知模式：

// 方案：用全局事件总线
// 在 local.ts 顶部新增
type SyncNotifyFn = (key: string) => void;
let _syncNotify: SyncNotifyFn | null = null;
export function setSyncNotify(fn: SyncNotifyFn) { _syncNotify = fn; }

// 在每个写方法末尾追加
_syncNotify?.('game_progress');  // saveGameProgress
_syncNotify?.('history_records');  // saveHistoryRecord
_syncNotify?.('rank_match_sessions');  // saveRankMatchSession
_syncNotify?.('profiles');  // saveUser
```

4. 在 `src/sync/engine.ts` 的 `initialize` 中注册通知：
```typescript
import { setSyncNotify } from '../repository/local';
// 在 initialize() 里
setSyncNotify((key) => get().markDirty(key as DirtyKey));
```

- [ ] **Step 3: 运行 `npm run build` 确认类型检查通过**

- [ ] **Step 4: 运行 `npm test` 确认不破坏现有测试**

- [ ] **Step 5: Commit**

```bash
git add src/sync/engine.ts src/repository/local.ts
git commit -m "feat(v0.3): SyncEngine + Repository markDirty 改造"
```

---

## Phase 3：UI + 验收

### Task 3.1：同步状态指示器

**Files:**
- Create: `src/components/SyncStatusIndicator.tsx`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: 创建 SyncStatusIndicator 组件**

```tsx
// src/components/SyncStatusIndicator.tsx
import { useSyncEngine } from '../sync/engine';
import { useAuthStore } from '../store/auth';

export function SyncStatusIndicator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const status = useSyncEngine(s => s.status);

  if (!isAuthenticated) return null;

  const config = {
    synced: { icon: '✓', color: 'text-green-500', label: '已同步' },
    syncing: { icon: '↻', color: 'text-blue-500 animate-spin', label: '同步中' },
    offline: { icon: '⚡', color: 'text-gray-400', label: '离线' },
    error: { icon: '✗', color: 'text-red-500', label: '同步出错' },
    idle: { icon: '', color: '', label: '' },
  }[status];

  if (!config.icon) return null;

  return (
    <span className={`text-sm ${config.color}`} title={config.label}>
      {config.icon}
    </span>
  );
}
```

- [ ] **Step 2: 在 Home.tsx Header 中添加**

在 `src/pages/Home.tsx` 的 Header 区域（右上角）插入 `<SyncStatusIndicator />`。

- [ ] **Step 3: Commit**

```bash
git add src/components/SyncStatusIndicator.tsx src/pages/Home.tsx
git commit -m "feat(v0.3): 同步状态指示器 + Home 页集成"
```

---

### Task 3.2：首次登录合并引导

**Files:**
- Create: `src/components/MergeGuideDialog.tsx`

- [ ] **Step 1: 创建 MergeGuideDialog**

```tsx
// src/components/MergeGuideDialog.tsx
import { useState } from 'react';
import { Dialog } from './Dialog';
import { repository } from '../repository/local';
import { useAuthStore } from '../store/auth';
import { useSyncEngine } from '../sync/engine';
import { mergeGameProgress } from '../sync/merge';
import { fetchRemoteGameProgress, upsertRemoteGameProgress } from '../sync/remote';

interface Props {
  onComplete: () => void;
}

export function MergeGuideDialog({ onComplete }: Props) {
  const [merging, setMerging] = useState(false);
  const supabaseUser = useAuthStore(s => s.supabaseUser);

  const handleMerge = async () => {
    if (!supabaseUser) return;
    setMerging(true);
    const userId = supabaseUser.id;

    const localGP = repository.getGameProgress(repository.getUser()?.id ?? '');
    const remoteRaw = await fetchRemoteGameProgress(userId);

    if (localGP && remoteRaw) {
      const remoteGP = {
        userId,
        campaignProgress: remoteRaw.campaign_progress,
        advanceProgress: remoteRaw.advance_progress,
        rankProgress: remoteRaw.rank_progress,
        wrongQuestions: remoteRaw.wrong_questions,
        totalQuestionsAttempted: remoteRaw.total_questions_attempted,
        totalQuestionsCorrect: remoteRaw.total_questions_correct,
      } as any;
      const merged = mergeGameProgress(localGP, remoteGP);
      merged.userId = userId;
      repository.saveGameProgress(merged);
      await upsertRemoteGameProgress(userId, merged);
    } else if (localGP) {
      localGP.userId = userId;
      repository.saveGameProgress(localGP);
      await upsertRemoteGameProgress(userId, localGP);
    }

    finishMerge(userId);
  };

  const handleDiscard = async () => {
    if (!supabaseUser) return;
    setMerging(true);
    const userId = supabaseUser.id;
    const remoteRaw = await fetchRemoteGameProgress(userId);
    if (remoteRaw) {
      const remoteGP = {
        userId,
        campaignProgress: remoteRaw.campaign_progress,
        advanceProgress: remoteRaw.advance_progress,
        rankProgress: remoteRaw.rank_progress,
        wrongQuestions: remoteRaw.wrong_questions,
        totalQuestionsAttempted: remoteRaw.total_questions_attempted,
        totalQuestionsCorrect: remoteRaw.total_questions_correct,
      } as any;
      repository.saveGameProgress(remoteGP);
    }
    finishMerge(userId);
  };

  const finishMerge = (userId: string) => {
    // 更新本地 User
    const user = repository.getUser();
    if (user) {
      user.supabaseId = userId;
      user.id = userId;
      repository.saveUser(user);
    }
    localStorage.setItem(repository.getAuthUserIdKey(), userId);
    setMerging(false);
    onComplete();
  };

  return (
    <Dialog open onClose={() => {}}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold">发现本地进度</h2>
        <p className="text-sm text-gray-600">
          你的设备上有练习进度，云端账号也有进度。请选择如何处理：
        </p>
        <div className="space-y-3">
          <button
            onClick={handleMerge}
            disabled={merging}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-50"
          >
            合并到云端
          </button>
          <button
            onClick={handleDiscard}
            disabled={merging}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-50"
          >
            放弃本地，使用云端数据
          </button>
        </div>
      </div>
    </Dialog>
  );
}
```

- [ ] **Step 2: 在 App.tsx 中集成合并引导逻辑**

在 auth 状态变更时检查：是否首次登录 + 本地有数据 + 远端也有数据 → 显示 MergeGuideDialog。

- [ ] **Step 3: Commit**

```bash
git add src/components/MergeGuideDialog.tsx src/App.tsx
git commit -m "feat(v0.3): 首次登录合并引导对话框"
```

---

### Task 3.3：Profile 账号区域 + Onboarding 入口

**Files:**
- Create: `src/components/AccountSection.tsx`
- Modify: `src/pages/Profile.tsx`
- Modify: `src/pages/Onboarding.tsx`

- [ ] **Step 1: 创建 AccountSection**

```tsx
// src/components/AccountSection.tsx
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store';
import { isSupabaseConfigured } from '../lib/supabase';
import { SyncStatusIndicator } from './SyncStatusIndicator';

export function AccountSection() {
  const { isAuthenticated, supabaseUser, signOut } = useAuthStore();
  const setPage = useUIStore(s => s.setPage);

  if (!isSupabaseConfigured()) return null;

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h3 className="font-medium">账号</h3>
        <p className="text-sm text-gray-500">登录后可跨设备同步进度</p>
        <button
          onClick={() => setPage('login')}
          className="w-full py-2 rounded-xl bg-blue-500 text-white text-sm"
        >
          登录 / 注册
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">账号</h3>
        <SyncStatusIndicator />
      </div>
      <p className="text-sm text-gray-500">{supabaseUser?.email}</p>
      <button
        onClick={signOut}
        className="w-full py-2 rounded-xl border border-gray-200 text-gray-500 text-sm"
      >
        登出
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Profile.tsx 中添加 AccountSection**

在 `src/pages/Profile.tsx` 合适位置插入 `<AccountSection />`。

- [ ] **Step 3: Onboarding.tsx 新增登录入口**

在 `src/pages/Onboarding.tsx` 底部新增：
```tsx
{isSupabaseConfigured() && (
  <button
    onClick={() => setPage('login')}
    className="text-sm text-blue-500 underline"
  >
    已有账号？登录
  </button>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AccountSection.tsx src/pages/Profile.tsx src/pages/Onboarding.tsx
git commit -m "feat(v0.3): Profile 账号区域 + Onboarding 登录入口"
```

---

### Task 3.4：段位赛联网检查

**Files:**
- Modify: `src/store/rank-match.ts`
- Modify: `src/pages/RankMatchHub.tsx`

- [ ] **Step 1: startRankMatch 加联网检查**

在 `src/store/rank-match.ts` 的 `startRankMatch()` 方法开头新增：

```typescript
if (!navigator.onLine) {
  throw new Error('段位赛需要联网才能开始');
}
```

同样在涉及开始新一局的逻辑中也加此检查。

- [ ] **Step 2: RankMatchHub.tsx 加联网状态 UI**

在 `src/pages/RankMatchHub.tsx` 中，开始段位赛按钮附近新增离线提示：

```tsx
{!navigator.onLine && (
  <p className="text-sm text-amber-500 text-center">
    ⚡ 段位赛需要联网才能开始
  </p>
)}
```

按钮在离线时 disabled。

- [ ] **Step 3: 运行 `npm run build` 确认构建通过**

- [ ] **Step 4: Commit**

```bash
git add src/store/rank-match.ts src/pages/RankMatchHub.tsx
git commit -m "feat(v0.3): 段位赛联网检查"
```

---

### Task 3.5：全量测试 + 构建验证

- [ ] **Step 1: 运行全量单元测试**

```bash
npm test
```

预期：全部通过（包括新增的合并策略测试）。

- [ ] **Step 2: 运行构建**

```bash
npm run build
```

预期：构建成功，无类型错误。

- [ ] **Step 3: 启动 dev server 手动验证核心流程**

```bash
npm run dev
```

验证清单：
- 访客模式正常（不登录 = 和之前一样）
- 登录页可打开、可输入邮箱
- Profile 页显示账号区域（未登录时显示登录按钮）
- Home 页 Header 在登录后显示同步状态
- 段位赛离线时按钮 disabled

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(v0.3): 全量测试通过 + 构建验证"
```

---

## 人工操作检查清单

以下步骤需要人工在 Supabase Dashboard 中执行：

- [ ] 创建 Supabase 项目（如果还没有）
- [ ] 在 SQL Editor 中执行 `supabase/migrations/001_initial_schema.sql`
- [ ] 在 Auth → URL Configuration 中设置 Site URL
- [ ] 在 Auth → Email Templates 中自定义 Magic Link 邮件模板（可选，中文）
- [ ] 复制项目 URL 和 anon key 到 `.env` 文件
- [ ] 端到端测试：两台设备分别离线做题，联网后验证进度合并
