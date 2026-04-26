# v0.4 Release Gate Code Review Result

**执行日期**：2026-04-26
**范围**：v0.4 发布前最终 QA · 第一层 Code Review
**结论**：PASS。未发现发布阻塞缺陷；若后续自动化或拟真人工发现新现象，以实际执行结果为准。

## 审查范围

| 关注点 | 主要文件 / 证据 | 结果 |
|---|---|---|
| v0.4 Phase 证据链 | `QA/runs/2026-04-25-v04-phase1-multiplication-vertical/`, `QA/runs/2026-04-26-v04-phase3-question-quality-v2/`, `QA/runs/2026-04-26-v04-phase4-carry-policy/`, `QA/runs/2026-04-26-v04-phase5-practice-reset/` | PASS |
| 当前开放 issue | `ProjectManager/ISSUE_LIST.md` | PASS：当前开放数 0，`ISSUE-059` 已有关闭证据 |
| 竖式三档策略 | `src/engine/vertical-calc-policy.ts`, `src/components/VerticalCalcBoard.tsx`, `QA/e2e/phase4-carry-focus.spec.ts` | PASS |
| Practice 输入状态 reset | `src/pages/practice-input-state.ts`, `src/pages/Practice.tsx`, `QA/e2e/phase5-practice-input-reset.spec.ts` | PASS |
| 题目生成器与 session 去重 | `src/engine/question-dedupe.ts`, `src/store/index.ts`, `src/store/session-dedupe.test.ts`, `src/engine/generators/*.phase3.test.ts` | PASS |
| A04/A06 断联并入 A07 | `src/constants/index.ts`, `src/constants/campaign.phase2.test.ts`, `src/constants/player-topics.phase2.test.ts`, `src/repository/local.phase2-migration.test.ts` | PASS |
| 存档升级与数据安全 | `src/repository/local.ts`, `src/repository/local.test.ts` | PASS |
| 账号同步安全降级 | `src/store/auth.ts`, `src/sync/merge.ts`, v0.3 sync tests | PASS |

## 重点结论

1. **竖式策略边界清楚**：`vertical-calc-policy.ts` 不依赖 React / Zustand / DOM，负责三档焦点、可提交性、结果分类；`VerticalCalcBoard.tsx` 只消费策略并处理渲染和本地复盘。
2. **低/中/高档规则与 Phase 4 裁决一致**：低档过程格错误会得到 `vertical-process` 失败；中档过程格错误通过 `vertical-process-warning` 做当前题提示；高档通过 `getVisibleProcessColumns()` 隐藏过程格。
3. **Practice reset 已收敛**：`usePracticeInputState(currentQuestion)` 管理普通输入、余数、多选、多空、训练格状态；页面层保留弹窗、rank match 和反馈状态，降低跨题状态串扰风险。
4. **生成器回归覆盖明确**：A03 乘法分布、除法样本池、A02 compare 和 session dedupe 均有 Phase 3 专项测试；store 侧 campaign / advance 复用 `generateUniqueQuestion()`。
5. **A04/A06 断联策略不是删除数据**：玩家可见 topic 收敛到 6 个，legacy topic 通过 display guard 路由到 A07；旧进度保留，恢复中的隐藏题型段位赛会取消。
6. **存档迁移符合项目硬约束**：`repository.init()` 走 `MIGRATIONS` 串行升级；迁移失败备份 `gameProgress` 后新起，不调用 `clearAll()`。
7. **账号同步回归边界保留**：未配置 Supabase 时认证状态安全降级；`signOutGuarded()` 仍检查 `dirtyKeys`；merge 层保留本地优先进度和 rank session 状态优先级逻辑。

## 风险与观察

| ID | 类型 | 说明 | 裁决 |
|---|---|---|---|
| OBS-CR-01 | Observation | `operation-laws` / `bracket-ops` 仍存在于 `ALL_TOPICS`、生成器和 legacy campaign map 中，这是为历史数据、测试和兼容保留；玩家入口使用 `TOPICS` / `PLAYER_TOPICS` 隐藏。 | 非阻塞，自动化会复核 |
| OBS-CR-02 | Observation | Phase 4 / Phase 5 E2E 截图路径仍指向各自历史 QA run；本轮 release gate 只引用其结论，不迁移历史截图。 | 非阻塞 |

## 缺陷分流

| 类型 | 数量 | 处理 |
|---|---:|---|
| FAIL | 0 | 无需写入 `ProjectManager/ISSUE_LIST.md` |
| RISK | 0 | 无发布阻塞残余风险 |
| Observation | 2 | 记录于本文件，自动化层继续复核 |
