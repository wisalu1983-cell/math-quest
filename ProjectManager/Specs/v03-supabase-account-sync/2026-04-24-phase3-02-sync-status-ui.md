# Phase 3 · Task 3.1 + Task 3.3 · 同步状态 UI + 账号区域

> 属于：v0.3 Phase 3
> 总览：[`00-index`](./2026-04-24-phase3-00-index.md)
> 设计规格：[`v03-supabase-账号与同步系统`](./2026-04-23-v03-supabase-账号与同步系统.md) §6 / §7.1
> 前置任务：[`01-startup-and-merge`](./2026-04-24-phase3-01-startup-and-merge.md)（依赖其 `arm/start/shutdown` 与 signOutGuarded）
> 状态：✅ 已实施并验收（2026-04-24）

---

## 目标

1. 实现 `SyncStatusIndicator` 组件，在 Home 顶部以轻量图标 + 悬浮 tooltip 展示同步状态
2. 实现 `AccountSection` 组件，在 Profile 页提供"登录 / 已登录信息 / 登出"入口
3. Onboarding 页新增"已有账号？登录"入口，打通"访客即用 + 可后续登录"的路径
4. 落地 P2 决策：离线启动保持登录态 + 直接进主场景 + 非阻塞离线提示；一次 session 不反复弹提示

本 Task 不新增任何同步逻辑——只是把 `useSyncEngine` / `useAuthStore` 已暴露的状态呈现给用户。

---

## 关键规则（不可违反）

1. **`SyncStatusIndicator` 仅在 `supabaseUser` 存在时渲染**。访客模式下完全不展示，保持"未登录 = 未使用同步"的视觉干净
2. **所有状态文案必须来自决策**，不临时起意：状态映射见下文 §UI 状态映射表
3. **点击图标打开 Profile 账号区域**，不要做独立下拉面板（v0.3 不引入同步管理中心）
4. **P2 反复告警抑制**：离线态的 tooltip 只在首次进入 `offline` 时播一次 subtle 动画提示，后续保持静态图标；不做 toast / banner
5. **Profile 账号区域与同步状态独立**：未登录时账号区域显示"登录"按钮；无论同步状态如何，登出按钮始终可点（但受 Task 3.0 的 `signOutGuarded` 保护）

---

## UI 状态映射表

源头：`useSyncEngine.getState().status` + `useAuthStore.getState().supabaseUser`

| 条件组合 | 图标 | Home 顶部 aria-label | Profile 账号区域文案 |
|---|---|---|---|
| `supabaseUser` 为空 | 不渲染 | — | "登录以在多设备间同步进度" + [登录] 按钮 |
| `status === 'armed'` | 🕒（loader） | "同步准备中" | "同步准备中 · 等待合并判定" |
| `status === 'syncing'` | 🔄（旋转动画） | "正在同步" | "正在同步" |
| `status === 'synced'` | ✓（静态） | "已同步 · 上次同步 \{relativeTime\}" | "已同步 · 上次同步 \{relativeTime\}" |
| `status === 'offline'` | ⚡（静态，灰） | "离线 · 网络恢复后自动同步" | "离线中 · 网络恢复后自动继续" |
| `status === 'error'`, `retryCount < MAX` | ⚠️（静态，黄） | "同步失败，正在重试（第 \{retryCount\} 次）" | "同步失败 · 已重试 \{retryCount\} 次" |
| `status === 'error'`, `retryCount >= MAX` | ❌（静态，红） | "同步持续失败 · 请检查网络并刷新页面" | "同步持续失败 · 上次失败 \{relativeTime\}" + [手动重试] 按钮 |
| `status === 'idle'`, `supabaseUser` 存在 | — | —（过渡态，短暂出现于合并完成到 start 之间） | "同步未启动" |

`{relativeTime}` 使用现有 util（如无则 Phase 3 内新增 `src/utils/relative-time.ts`：`"刚刚" / "N 分钟前" / "N 小时前" / "昨天"`）。

---

## 数据流

```
SyncEngine.status ─────┐
                       ├──▶ SyncStatusIndicator（Home 顶部）
AuthStore.supabaseUser ┘                         │
                                                 │ 点击
                                                 ▼
                                          setPage('profile')
                                                 │
                                                 ▼
                                          AccountSection
                                          展示邮箱 / 同步状态 / [登出] 按钮
                                                 │ 点击登出
                                                 ▼
                                          signOutGuarded()
                                           ├─ ok:true  → 立即登出
                                           └─ ok:false → SignOutConfirmDialog
                                                          ├─ 取消
                                                          └─ 仍然登出 → signOutForce()
```

---

## 模块改造点

### `src/components/SyncStatusIndicator.tsx`（新文件）

```tsx
// 使用场景：Home 顶部 logo 栏右侧
import { useAuthStore } from '@/store/auth';
import { useSyncEngine } from '@/sync/engine';
import { useUIStore } from '@/store';
import { formatRelativeTime } from '@/utils/relative-time';

export default function SyncStatusIndicator() {
  const supabaseUser = useAuthStore(s => s.supabaseUser);
  const status = useSyncEngine(s => s.status);
  const syncState = useSyncEngine(s => s.syncState);
  const retryCount = useSyncEngine(s => s.retryCount);
  const setPage = useUIStore(s => s.setPage);

  if (!supabaseUser) return null;
  // idle 过渡态：armed → start 中间极短窗口，保持 SVG 占位
  // armed / syncing / synced / offline / error 依表映射
  // ...

  return (
    <button
      type="button"
      onClick={() => setPage('profile')}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full"
    >
      {/* 图标 */}
    </button>
  );
}
```

实现要点：
- 图标尺寸与 Home 现有"用户首字母头像"一致（`w-9 h-9 rounded-full`）；整体置换掉原来的"nickname 首字母"位置
- 各状态的颜色用 `var(--color-*)`：
  - synced → `--color-success`
  - offline → `--color-text-2`
  - error + retry → `--color-warning`
  - error + exhausted → `--color-danger`
  - armed / syncing → `--color-primary`
- `syncing` 的旋转动画 tailwind 用 `animate-spin`；armed 用静态 loader（不旋转，表达"等待"）
- tooltip：使用原生 `title` 属性即可（v0.3 不引入 tooltip lib），文案即 aria-label
- P2 首次 offline 动效：组件内 `useRef` 标记 sessionId（`session-\{timestamp}`）是否播过；只在当前 session 首次进入 offline 时加 `animate-fade-in`，后续停留 offline 不动

### `src/pages/Home.tsx` 改造

替换 `line 116-123` 的"用户首字母头像"：

```tsx
{supabaseUser ? (
  <SyncStatusIndicator />
) : (
  <button onClick={() => setPage('profile')} aria-label={`用户：${user.nickname}`}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center
                     text-[15px] font-black text-white select-none"
          style={{ boxShadow: '0 2px 8px rgba(255,107,53,.4)' }}>
    {user.nickname[0]}
  </button>
)}
```

—— 访客模式保持原样；登录后换成同步状态图标（仍然可点进 Profile）。

### `src/components/AccountSection.tsx`（新文件）

放在 Profile 页的"设置"卡片之前，作为独立 section。

```tsx
import { isSupabaseConfigured } from '@/lib/supabase';

interface AccountSectionProps {
  onLogin: () => void;              // setPage('login')
  onLogoutConfirm: () => void;      // 触发 SignOutConfirmDialog
}

export default function AccountSection({ onLogin, onLogoutConfirm }: AccountSectionProps) {
  const { supabaseUser, isLoading } = useAuthStore(s => ({
    supabaseUser: s.supabaseUser,
    isLoading: s.isLoading,
  }));
  const supabaseConfigured = isSupabaseConfigured();
  const { status, retryCount, syncState } = useSyncEngine(s => ({
    status: s.status,
    retryCount: s.retryCount,
    syncState: s.syncState,
  }));

  // Case 1: Supabase 未配置（Phase 1 已实现的 sentinel；应显示占位，不诱导登录）
  if (!supabaseConfigured) {
    return (
      <div className="card">
        <h3 className="text-sm font-bold mb-2">账号</h3>
        <p className="text-xs text-text-2">当前版本未接入账号系统。</p>
      </div>
    );
  }

  // Case 2: 未登录
  if (!supabaseUser) {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-bold">账号</h3>
        <p className="text-xs text-text-2">登录后可以在多设备间同步进度和段位赛记录。</p>
        <button className="btn-primary w-full" onClick={onLogin} disabled={isLoading}>
          登录账号
        </button>
      </div>
    );
  }

  // Case 3: 已登录
  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-bold">账号</h3>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          📧
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{supabaseUser.email}</div>
          <div className="text-xs text-text-2">{statusText(status, retryCount, syncState)}</div>
        </div>
      </div>
      {status === 'error' && retryCount >= MAX_RETRY && (
        <button className="btn-secondary w-full" onClick={() => useSyncEngine.getState().fullSync()}>
          手动重试
        </button>
      )}
      <button className="btn-secondary w-full" onClick={onLogoutConfirm}>
        登出
      </button>
    </div>
  );
}
```

实现要点：
- `statusText(status, retryCount, syncState)` 返回 Profile 版文案（见 §UI 状态映射表第 3 列）
- `MAX_RETRY` 从 `src/sync/engine.ts` 导入；该常量已由 Task 3.0 提前导出，Task 3.5 只补 retry timer 行为
- 手动重试按钮只在 `error + retry 耗尽` 时出现，避免干扰正常自动重试流程
- "登出"按钮直接调 `onLogoutConfirm`——由调用方（Profile）决定走 `signOutGuarded`

### `src/pages/Profile.tsx` 改造

两处变更：

**1）在 "Settings" card 之前插入 AccountSection**

位置：当前 Profile.tsx L92（"Settings" card 前面）。

```tsx
<AccountSection
  onLogin={() => setPage('login')}
  onLogoutConfirm={handleLogoutConfirm}
/>
```

**2）新增登出确认流程**

```tsx
const [signOutDialog, setSignOutDialog] = useState<
  | { open: false }
  | { open: true; dirtyKeys: DirtyKey[] }
>({ open: false });

const handleLogoutConfirm = async () => {
  const result = await useAuthStore.getState().signOutGuarded();
  if (result.ok) {
    // 已同步，直接登出；AuthStore 状态变更会触发 App.tsx 的 engine.shutdown + 返回 Home 访客模式
    return;
  }
  setSignOutDialog({ open: true, dirtyKeys: result.dirtyKeys });
};
```

`Profile.tsx` 需要引入 `repository`，用于用户确认"仍然登出"后清理待同步队列。

渲染：

```tsx
{signOutDialog.open && (
  <SignOutConfirmDialog
    dirtyKeys={signOutDialog.dirtyKeys}
    onCancel={() => setSignOutDialog({ open: false })}
    onForce={async () => {
      setSignOutDialog({ open: false });
      repository.discardPendingSyncAfterUserConfirmation();
      await useAuthStore.getState().signOutForce();
    }}
  />
)}
```

### `src/components/SignOutConfirmDialog.tsx`（新文件）

对应 P4 决策。使用现有 `Dialog.tsx`（`src/components/Dialog.tsx` 2218 字节，应已暴露 Modal + 按钮插槽）。

```tsx
interface Props {
  dirtyKeys: DirtyKey[];
  onCancel: () => void;
  onForce: () => void;
}

const KEY_LABEL: Record<DirtyKey, string> = {
  profiles: '个人资料',
  game_progress: '进度数据',
  history_records: '练习历史',
  rank_match_sessions: '段位赛记录',
};

export default function SignOutConfirmDialog({ dirtyKeys, onCancel, onForce }: Props) {
  const items = dirtyKeys.map(k => KEY_LABEL[k]).join('、');
  return (
    <Dialog open onClose={onCancel} title="还有未同步的数据">
      <p className="text-sm text-text-2">
        以下数据尚未同步到云端：<span className="font-bold text-text">{items}</span>。
        登出后这些数据仍保留在本设备，但当前待同步队列会被丢弃，不会同步到你的账号或下一个登录账号。
      </p>
      <div className="flex gap-3 mt-4">
        <button className="btn-primary flex-1" onClick={onCancel}>取消</button>
        <button className="btn-secondary flex-1 text-danger" onClick={onForce}>仍然登出</button>
      </div>
    </Dialog>
  );
}
```

对齐 P4："取消"为主按钮 + "仍然登出"为次按钮；不提供"立即尝试同步"。

### `src/pages/Onboarding.tsx` 改造

当前 L39-41："开始冒险"按钮下添加"已有账号？登录"次要入口：

```tsx
<button className="btn-primary w-full text-lg" onClick={() => setStep(1)}>
  开始冒险
</button>
<button
  type="button"
  className="text-sm text-text-2 underline decoration-dotted mt-2"
  onClick={() => setPage('login')}
>
  已有账号？登录
</button>
```

—— Supabase 未配置时隐藏该按钮：`{isSupabaseConfigured() && ( ... )}`。

### `src/utils/relative-time.ts`（新文件）

```typescript
export function formatRelativeTime(timestamp: string | number | null): string {
  if (!timestamp) return '尚未同步';
  const time = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
  if (Number.isNaN(time)) return '尚未同步';
  const diff = Date.now() - time;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 172_800_000) return '昨天';
  return `${Math.floor(diff / 86_400_000)} 天前`;
}
```

简化实现，v0.3 不追求本地化精度；未来若国际化再抽象。

---

## 实施步骤

### Task 3.1（SyncStatusIndicator + Home 集成）

- [ ] **Step 1**：`src/utils/relative-time.ts` + `.test.ts`（3~5 用例）
- [ ] **Step 2**：`src/components/SyncStatusIndicator.tsx` 按表实现各状态；首次 offline 动效 guard
- [ ] **Step 3**：`src/pages/Home.tsx` 替换头像位置；访客保留原首字母
- [ ] **Step 4**：手动回归：
  - 访客状态 Home 顶部是首字母
  - 登录后 Home 顶部是同步图标；点击进入 Profile
  - 断网 → 图标切 offline（首次有 fade-in）；恢复网络 → 切 syncing → synced
- [ ] **Step 5**：commit `feat(v0.3): Home 顶部同步状态指示器`

### Task 3.3（AccountSection + SignOutConfirmDialog + Onboarding 入口）

- [ ] **Step 6**：`src/components/AccountSection.tsx` 按三态（未配置 / 未登录 / 已登录）实现
- [ ] **Step 7**：`src/components/SignOutConfirmDialog.tsx` 按 P4 实现
- [ ] **Step 8**：`src/pages/Profile.tsx` 插入 AccountSection；接入 `signOutDialog` state
- [ ] **Step 9**：`src/pages/Onboarding.tsx` 添加"已有账号？登录"入口（受 `isSupabaseConfigured()` 门控）
- [ ] **Step 10**：手动回归：
  - 未登录用户在 Profile 看到"登录"按钮；点击跳 LoginPage
  - 已登录 + 无脏数据：Profile 点"登出" → 直接回访客 Home
  - 已登录 + 有脏数据（构造：断网 → 完成一题 → 进 Profile 点登出）：弹 SignOutConfirmDialog；"取消"不登出、"仍然登出"清除 Supabase session
  - Onboarding 页"已有账号？登录"可达
  - `VITE_SUPABASE_URL` / `_KEY` 未配置时：AccountSection 显示占位，Onboarding 入口消失
- [ ] **Step 11**：commit `feat(v0.3): Profile 账号区域 + 登出保护对话框 + Onboarding 登录入口`

---

## 测试计划

### 单测新增

| 文件 | 覆盖点 | 期望用例数 |
|---|---|---|
| `src/utils/relative-time.test.ts` | 刚刚 / N 分钟前 / N 小时前 / 昨天 / N 天前 / null | 6 |
| `src/components/SyncStatusIndicator.test.tsx` | 每种 status 渲染对应 label；supabaseUser 为空时不渲染 | 6~8 |
| `src/components/AccountSection.test.tsx` | 三态 × 登录按钮 / 登出按钮行为 / 手动重试按钮仅在 error 耗尽时出现 | 6~8 |
| `src/components/SignOutConfirmDialog.test.tsx` | 多 dirtyKey 文案拼接 / 按钮行为 | 3 |

Home / Profile / Onboarding 的改动不单独写 component test——改动是插入式的，靠现有页面测试 + 手动回归覆盖即可。

### 手动回归清单

详见 §实施步骤中的 Step 4 / Step 10。

---

## Task 收尾条件

- [ ] Task 3.1 所有 Step 完成 + commit
- [ ] Task 3.3 所有 Step 完成 + commit
- [ ] 单测 +18 以上
- [ ] 手动回归通过
- [ ] P2 "不反复告警" 行为通过手动验证（连续 `online → offline → online → offline` 不会连续播多次动效）

---

## 相关文件一览

**新增**：
- `src/utils/relative-time.ts` + `.test.ts`
- `src/components/SyncStatusIndicator.tsx` + `.test.tsx`
- `src/components/AccountSection.tsx` + `.test.tsx`
- `src/components/SignOutConfirmDialog.tsx` + `.test.tsx`

**修改**：
- `src/pages/Home.tsx`（头像位置替换）
- `src/pages/Profile.tsx`（接入 AccountSection + SignOutConfirmDialog）
- `src/pages/Onboarding.tsx`（新增登录入口）

**不改动**：
- `src/pages/LoginPage.tsx`（Phase 1 已实现，本 Task 仅打通入口）
- `src/store/auth.ts`（本 Task 只消费，改造由 Task 3.0 完成）
- `src/sync/engine.ts`（本 Task 只消费 status）
