# v0.2 增量专项验收结果

> 日期：2026-04-23
> 范围：Tips / estimate 新格式 / 375px 题干无横向溢出补充复验

- PASS：3
- RISK：1
- FAIL：0
- 发生横向溢出的用例：0

| ID | 场景 | 状态 | 观察 | 证据 |
|---|---|---|---|---|
| E-01 | reverse-round Tip | PASS | 第 1 题出现目标 tip；overflow=0 | artifacts/delta/E-01-pass.png |
| E-02 | floor-ceil Tip | PASS | 第 1 题出现目标 tip；overflow=0 | artifacts/delta/E-02-pass.png |
| E-03 | estimate 新格式 | PASS | new_format=10; old_format=0; overflow=0 | artifacts/delta/E-03-summary.png |
| E-04 | compare Tip | RISK | 25 题内未命中目标 tip；overflow=0 | artifacts/delta/E-04-risk.png |

## 题干不折行补充复验

- 口径：本轮在 375px 视口下，对 4 个 v0.2 高风险数感专项场景逐题检查 `scrollWidth <= clientWidth`。
- 结果：4/4 场景未观察到横向溢出。
- 说明：E1 的 7 条代表题干原专项报告仍保留为基础证据，本轮重点复验的是 v0.2 后续改造仍可能影响的高风险数感题型。
