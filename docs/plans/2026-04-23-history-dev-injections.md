# History Dev Injections Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 DEV 工具新增“追加随机历史记录（全覆盖）”和“清空历史记录”两个注入项，服务历史页联调。

**Architecture:** 在 `src/dev-tool/injections/` 新增独立的 `history-records.ts`，只操作当前 namespace 的 `mq_history` / `mq_dev_history`。随机数据直接构造合法 `HistoryRecord` 并追加，清空能力下沉到 `repository/local.ts`，避免误删其他存档 key。

**Tech Stack:** React, Zustand, Vitest, localStorage repository

---

### Task 1: 历史记录注入测试

**Files:**
- Create: `src/dev-tool/injections/history-records.test.ts`
- Test: `src/dev-tool/injections/_registry.test.ts`

**Step 1: Write the failing test**

为“追加随机历史记录（全覆盖）”写测试，断言它会在保留既有历史的前提下新增一批记录，并覆盖：
- 3 个真实历史模式：`campaign` / `advance` / `rank-match`
- 3 个结果：`win` / `lose` / `incomplete`
- 8 个 `TopicId`

再为“清空历史记录”写测试，断言它只清当前 namespace 的 history key，不影响另一个 namespace。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/dev-tool/injections/history-records.test.ts src/dev-tool/injections/_registry.test.ts`

Expected: FAIL，因为 `history-records.ts` 尚不存在，注册表也没有该组注入项。

**Step 3: Write minimal implementation**

实现 `src/dev-tool/injections/history-records.ts`，导出注入项数组；注册到 `_registry.ts`。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/dev-tool/injections/history-records.test.ts src/dev-tool/injections/_registry.test.ts`

Expected: PASS

### Task 2: Repository 清空入口

**Files:**
- Modify: `src/repository/local.ts`
- Test: `src/dev-tool/injections/history-records.test.ts`

**Step 1: Write the failing test**

为 repository 增加按当前 namespace 清空 history 的行为断言。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/dev-tool/injections/history-records.test.ts`

Expected: FAIL，因为 repository 还没有独立的 `clearHistory()` 能力。

**Step 3: Write minimal implementation**

在 `repository/local.ts` 新增 `clearHistory()`，仅删除当前 namespace 的 history key。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/dev-tool/injections/history-records.test.ts`

Expected: PASS

### Task 3: 回归验证

**Files:**
- Test: `src/pages/history-ui.test.ts`

**Step 1: Run targeted regression**

Run: `npm test -- src/pages/history-ui.test.ts src/dev-tool/injections/history-records.test.ts src/dev-tool/injections/_registry.test.ts`

Expected: PASS，历史页现有展示逻辑不受影响。
