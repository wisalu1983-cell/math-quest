# QA 总结

**执行日期**：2026-04-26
**范围**：v0.4 Phase 5 Practice 状态重置
**结论**：PASS，Phase 5 可进入收尾回写。

## 结果汇总

| 层级 | 结论 | 证据 |
|---|---|---|
| 测试用例设计 | PASS | `test-cases-v1.md` 覆盖输入 reset、focus、非输入态隔离、Phase 4 回归 |
| Code Review | PASS | `code-review-result.md`，未发现阻塞缺陷 |
| 自动化测试 | PASS | `automated-result.md`，Vitest/build/Playwright 均通过 |
| 拟真人工 QA | PASS | `manual-result.md`，4/4 PASS |

## 验收结论

- `Practice.tsx` 的 7 份输入态已收敛到 `usePracticeInputState(currentQuestion)`。
- reducer 保持纯输入态管理，focus 副作用位于 hook reset 入口内。
- 换题后普通输入、多空填空、多选态均按新题重置。
- 退出弹窗、Phase 4 竖式 focus 回归和现有 smoke/account-sync e2e 均通过。
- 未发现新缺陷，`ISSUE_LIST.md` 无需新增条目。

## 已知非阻塞风险

- `npm run lint` 仍因仓库既有 lint 基线失败；本轮 touched files 的定向 eslint 通过。该风险不归属于 Phase 5 新增代码。

