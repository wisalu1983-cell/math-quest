# 段位赛恢复与中断语义设计

> 日期：2026-04-19
> 范围：`ISSUE-064` 刷新恢复 + 主动中断/重开语义
> 背景：Phase 3 代码落地和定向验证已成立，但全量 QA 发现 `D-07` 失败，说明当前“刷新恢复”只恢复了 BO 层，没有恢复到局内 `Practice`。

---

## 1. 目标

本设计同时解决两类需求：

1. 修复 `ISSUE-064`：用户在段位赛局内意外退出后，若数据一致且可恢复，应直接回到当前 `Practice`。
2. 引入显式“中断并保存”语义：用户主动暂停当前 BO 时，下次进入游戏后先到段位赛入口，再由用户自己决定继续或放弃重开。

设计必须兼容后续两步规划：

1. 本地版本的用户数据存档导出/导入。
2. 再下一阶段接数据库账号系统。

因此，本轮不能把“中断”做成临时 UI 标记或纯内存开关，而要把它建模为可持久化、可迁移、可同步的会话生命周期状态。

---

## 2. 非目标

本轮明确不做：

- 不实现真正的本地存档导出/导入功能。
- 不接数据库或账号系统。
- 不改动段位数值、BO 规则、抽题器逻辑、历史统计口径。
- 不承诺对所有意外退出场景无限兜底；只在数据完整且一致时恢复。
- 不把 `cancelled` 会话暴露给用户作为可见历史。

---

## 3. 用户语义

### 3.1 三种退出语义

段位赛局内退出弹窗改为三按钮：

- `继续练习`
- `中断并保存`
- `放弃，重新开始`

其中：

- `中断并保存`：保留当前 BO 和当前未完成局的恢复能力；下次由用户手动选择是否继续。
- `放弃，重新开始`：对用户视角等同“删除本次挑战并重新开始”；底层不硬删，而是保留一条 `cancelled` 会话记录。
- 普通意外退出（刷新、关标签页、崩溃）不走上面两条用户动作，只触发保底恢复策略。

### 3.2 继续入口

- `Home` 的段位赛卡片仍然只负责把用户带到 `RankMatchHub`。
- 如果当前存在 `suspended` 会话，`Hub` 顶部展示“中断中的挑战”卡片，并提供：
  - `继续当前对局`
  - `放弃，重新开始`
- 点击 `放弃，重新开始` 后必须二次确认。

### 3.3 保底恢复边界

程序不承诺覆盖所有异常情况：

- 若是意外退出，且 BO 会话、PracticeSession、题序三者一致，则自动恢复到 `Practice`。
- 若数据不一致或存档损坏，则不强行补救；按既有 `RankMatchRecoveryError` 路径显式落回 `Hub`。

---

## 4. 数据模型

## 4.1 核心原则

不要再用“中断布尔标记”。改为可迁移的生命周期状态。

建议在 `RankMatchSession` 上新增：

```ts
export type RankMatchSessionStatus =
  | 'active'
  | 'suspended'
  | 'completed'
  | 'cancelled';
```

并新增字段：

```ts
status: RankMatchSessionStatus;
suspendedAt?: number;
cancelledAt?: number;
```

语义如下：

- `active`：当前 BO 正在进行，可被意外退出保底恢复。
- `suspended`：用户主动执行了“中断并保存”；不自动直跳 `Practice`。
- `completed`：正常结束，且 `outcome` 已为 `promoted` 或 `eliminated`。
- `cancelled`：用户执行了“放弃，重新开始”；对用户不可见，但底层保留。

## 4.2 为什么不用硬删除

`cancelled` 的保留价值在于：

- 本地导出/导入时，能忠实表达用户真实做过的动作。
- 后续接账号系统时，服务端可以直接同步会话状态，而不是因为硬删导致状态断裂。
- 以后排查“为什么玩家说自己的对局没了”时，有底层证据链。

但这类会话不进入用户可见历史，也不影响段位、不影响 `activeSessionId`。

## 4.3 旧数据兼容

现有 `mq_rank_match_sessions` 里的老会话没有 `status` 字段。

本轮不做大规模的全仓持久化架构重构，而采用**读时归一化**：

- `outcome` 已存在的老会话 → 归一化为 `completed`
- `outcome` 不存在的老会话 → 归一化为 `active`

这样可以在不重写整套多 key 迁移框架的前提下，把新语义平滑接到旧数据上。

备注：后续做本地存档导出/导入或账号系统时，可以再把 `mq_game_progress + mq_sessions + mq_rank_match_sessions` 的统一版本化迁移补齐为更上层方案；本轮先保持改动最小。

---

## 5. 恢复策略

## 5.1 启动恢复决策

App 启动后先恢复 BO 层，再根据 `status` 分流：

1. 没有 `activeSessionId`：正常留在 `home`
2. `status === 'suspended'`：只恢复 BO 外壳，不自动恢复 `Practice`
3. `status === 'active'` 且存在未完成局：尝试自动恢复到 `Practice`
4. `status === 'active'` 但处于局间（无未完成局）：保持当前 D-08 行为，不自动进题
5. `status === 'completed' | 'cancelled'`：清理残留 `activeSessionId`

## 5.2 为什么把恢复入口上提到 App

`ISSUE-064` 的根因是：当前局内恢复逻辑挂在 `Practice.tsx`，但刷新后默认先停在 `home`，导致恢复逻辑根本没有执行机会。

因此本轮改为：

- `App.tsx`：负责启动期恢复分流
- `RankMatchHub.tsx`：负责主动中断后的继续/重开
- `Practice.tsx`：只负责局内交互，不再承担“刷新后是否跳回自己”的主判断

---

## 6. Store 与页面职责

## 6.1 `useRankMatchStore`

新增或扩展以下职责：

- `startRankMatch()`：创建新会话时写入 `status: 'active'`
- `handleGameFinished()`：赛事结束时写入 `status: 'completed'`
- `loadActiveRankMatch()`：允许恢复 `active` 或 `suspended` 会话
- `suspendActiveMatch()`：把当前 BO 标记为 `suspended`
- `reactivateSuspendedMatch()`：点击“继续当前对局”时把 `suspended -> active`
- `cancelActiveMatch()`：把当前 BO 标记为 `cancelled`，清理 `activeSessionId`

## 6.2 `useSessionStore`

新增局内显式动作，而不是复用当前语义模糊的 `abandonSession()`：

- `suspendRankMatchSession()`：
  - 保存当前 PracticeSession 快照
  - 调用 `useRankMatchStore.suspendActiveMatch()`
  - 清理内存态
- `cancelRankMatchSession()`：
  - 调用 `useRankMatchStore.cancelActiveMatch()`
  - 清理内存态

这样可以把“暂停”和“放弃”从现有普通练习退出逻辑中剥离出来。

## 6.3 页面

- `Practice.tsx`
  - 段位赛退出弹窗显示三按钮
  - `放弃，重新开始` 需要二次确认
- `RankMatchHub.tsx`
  - `suspended` 会话显示“中断中的挑战”
  - 提供“继续当前对局 / 放弃，重新开始”
- `Home.tsx`
  - 文案可提示“有中断中的挑战”，但仍只进入 `Hub`
- `App.tsx`
  - 执行启动恢复分流

---

## 7. QA 与验收

本轮至少补三类验证：

1. `ISSUE-064 / D-07`
   - 局内意外刷新后自动恢复到当前 `Practice`
2. 主动中断
   - 中断后重进 `Home -> Hub -> 继续当前对局`
3. 放弃重开
   - 中断后选择“放弃，重新开始”
   - 旧会话变成 `cancelled`
   - 新挑战从第 1 局开始

同时保持：

- `D-08` 仍然成立：局间刷新不自动进题，不丢活跃赛事
- `RankMatchRecoveryError` 的显式失败路径不回退为静默降级

---

## 8. 最终建议

本轮按以下原则实现：

- `ISSUE-064` 用 App 启动分流修正
- 主动中断用 `RankMatchSession.status = 'suspended'`
- 放弃重开用 `RankMatchSession.status = 'cancelled'`
- 旧数据通过读时归一化兼容
- 不做硬删除，不做大迁移框架重构

这是一条对当前需求足够小、同时又能兼容后续本地存档和账号系统的路径。
