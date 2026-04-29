# v0.5 已关闭 Issue 归档

> 所属版本：v0.5
> 创建：2026-04-29
> 角色：v0.5 过程中从 `ProjectManager/ISSUE_LIST.md` 移出的关闭问题。当前开放问题仍以 `ProjectManager/ISSUE_LIST.md` 为准。

---

## 关闭问题

### ISSUE-067 · 多行乘法竖式判错面板缺少过程 / 训练格错因（P1 · bug / UX 反馈一致性）

- **状态**：✅ 已修复（2026-04-29，v0.5 Phase 3）
- **来源**：2026-04-28 用户在本地测试环境验证多位乘法竖式后反馈。
- **类别**：bug / UX 反馈一致性 / A03 竖式计算。
- **归位**：[`phases/phase-3.md`](phases/phase-3.md) · [`subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md`](subplans/2026-04-29-v05-phase3-ISSUE-067-结构化错因反馈.md)。
- **问题摘要**：多行乘法竖式中，最终积填写正确但部分积、合计过程格或小数训练格错误时，系统判错但统一失败面板只显示正确答案和解析，缺少“为什么答案对还没通过”的解释。
- **修复摘要**：新增结构化 `failureDetail`，多行乘法提交从裸 `boolean` 升级为结构化 payload；最终答案错仍走普通错答，过程格错显示类别，训练格错显示用户值 / 正确值；反馈面板与错题本复用 `getPracticeFailureDisplay()`，历史记录 UI 不展示错因；旧 `failureReason='vertical-process'` 数据保留 fallback。
- **关闭证据**：
  - `src/engine/verticalMultiplicationErrors.ts` / `.test.ts`：覆盖最终答案错、过程格错、训练格错、过程格 + 训练格同时错。
  - `src/utils/practiceFailureDisplay.ts` / `.test.ts`：覆盖旧数据 fallback、过程类别、训练格明细和空用户值展示。
  - `src/store/index.test.ts`、`src/sync/merge.test.ts`：`failureDetail` 可选字段在当前反馈、错题、历史和同步合并中保留。
  - `QA/e2e/phase3-decimal-training-failure.spec.ts`：小数乘法训练格错、最终答数对的浏览器端到端证据。
  - `QA/runs/2026-04-29-v05-phase3-input-feedback-qa/qa-summary.md`：Phase 3 QA 有条件通过；`ISSUE-067` 所需自动化与拟真人工证据通过。
  - `npm test -- --run`：59 files / 734 tests passed。
  - `npm run build`：通过，仅 Vite chunk size warning。
  - `npx playwright test`：13 tests passed。

