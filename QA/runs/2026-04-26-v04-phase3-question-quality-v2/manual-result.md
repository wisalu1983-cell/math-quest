# v0.4 Phase 3 拟真人工 QA 结果 v2

**执行日期**: 2026-04-26
**范围**: `test-cases-v2.md` 中 U-01 至 U-08
**方法**: agent-as-user 四栏协议 + 教育产品题感 oracle
**用户画像**: 上海五年级学生，已完成部分闯关/进阶，能分辨题目是否“太简单 / 太重复 / 解释没帮助”。
**总计**: 8 条
**结果**: PASS: 8 / FAIL: 0 / RISK: 0 / BLOCKED: 0

## 逐条结果

| ID | 用户预期 | 操作路径 | 实际观察 | QA 判定 | 证据 |
|---|---|---|---|---|---|
| U-01 | 我到 A03 第四/第五关，希望偶尔遇到更像竖式挑战的两位乘两位，但不要突然全变难 | 查看 T2 诊断指标和样例 | d4 `2d×2d=67/500`，d5 `69/500`，都约 13%-14%；主体仍是三位乘一位 | PASS：挑战比例克制，符合渐进体验 | `automated-result.md` §2 |
| U-02 | 我到进阶 3★，不希望还刷到 `33÷5`、`18÷8` 这类心算感短除 | 查看 advance 3★ division sample | 1600 题中除法题 465，短除候选 0 | PASS：3★ 除法题感不再低幼 | `automated-result.md` §2 |
| U-03 | 修掉短除后，我仍希望小数除法能力还在，不要为了简单而删掉训练点 | 查看 T3 文档和 dec-div 防误伤测试口径 | 短除禁用只针对整数两位÷一位；小数除法不被候选口径误伤 | PASS：能力边界清楚 | `test-cases-v2.md` F-DIV-07，`automated-result.md` |
| U-04 | A02 d7 compare 应该让我先看结构，不是算两个小数结果硬比 | 查看 d7 三类 pattern 和开发文档模板 | 诊断显示三类 pattern 都出现；模板目标是等价、倍率、合并 | PASS：思考路径符合高档 compare | `automated-result.md` §2，T4 文档 |
| U-05 | A02 d8 对/错题即使是二选一，也要让我知道为什么对/错 | 查看 d8 explanation 样例 | 样例包含反例、规则、条件说明，如负数反例、非零条件 | PASS：反馈具备教学价值 | 诊断脚本输出样例 |
| U-06 | 我能接受结构相似的练习，但不想同一局看到完全一样的题 | 查看 T5 signature 规则与 campaign retry 诊断 | closed/open policy 明确；大部分热点下降；剩余 retryExhausted 被解释为题池容量 | PASS：完全重复治理达标，结构重复解释清楚 | `automated-result.md` §3 |
| U-07 | 闯关、进阶、段位赛都应该有一致的重复治理，不要只修一条路 | 查看 store/rank picker 接入和诊断 | campaign/advance 用 store seen set；rank-match 三桶共享 set；rank 生产路径 0/30 duplicate games | PASS：三条主路径均覆盖 | `code-review-result.md` CR-07/08，`automated-result.md` §2 |
| U-08 | QA 报告应该让我知道“哪些通过、哪些只是非阻塞”，方便决定能否进 Phase 4 | 查看 v2 用例、自动化报告和 summary | v2 把 full lint 债务、chunk warning、小题池耗尽分别分类，不混成 PASS | PASS：结论可审计 | `test-cases-v2.md`，`automated-result.md` |

## 新发现问题

无 FAIL / RISK。

## 后续观察项

| Observation | 来源 | 建议 |
|---|---|---|
| `number-sense-S2-LB-L2` retry 后下降有限 | 诊断脚本 campaign hotspots | 后续扩池任务优先处理，不作为 Phase 3 机制失败 |
| 全仓 lint 仍扫 `.worktrees/` | `npm run lint` | 若要升为硬门禁，先配置 ESLint ignore `.worktrees/`，再清历史债务 |

## 拟真人工结论

Phase 3 题目质量从用户视角通过：A03 难度梯度更可信，A02 compare 具备结构思考和解释价值，session 内完全重复治理覆盖主路径。没有新增需要写入 `ProjectManager/ISSUE_LIST.md` 的缺陷。
