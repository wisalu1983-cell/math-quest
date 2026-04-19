# 自动化层执行报告

**执行日期**：2026-04-19  
**用例范围**：A-01 ~ A-04  
**结果**：PASS: 2 / FAIL: 2 / RISK: 0 / BLOCKED: 0

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|----|---------|---------|---------|---------|------|------|
| A-01 | lint 基线 | `npm run lint` 无错误阻塞 | `npm run lint` | 命令退出码 1，共 **127 条 error**。主要分四类：① `react-hooks/set-state-in-effect`（`ConfettiEffect.tsx` / `Practice.tsx` / `RankMatchGameResult.tsx`）② `react-hooks/rules-of-hooks`（`CampaignMap.tsx`）③ 大量测试文件 `no-explicit-any` / `no-unused-vars` ④ `TopicIcon.tsx` 缺失 `react/no-danger` 规则定义。属于现有基线质量问题，本轮未修 | FAIL | 命令输出 |
| A-02 | build 基线 | `npm run build` 成功 | `npm run build` | `tsc -b && vite build` 成功，产出 `dist/`；仅有 Vite 大 bundle warning，无构建失败 | PASS | 命令输出 |
| A-03 | 单元测试基线 | `npx vitest run` 全绿 | `npx vitest run` | **16 个测试文件 / 459 条测试全部通过** | PASS | 命令输出 |
| A-04 | 浏览器全链脚本 | 新号/中盘/段位赛三条路径全部跑通且无 FAIL | `node ProjectManager/QA/2026-04-19-full-regression/full-regression.mjs` | 脚本执行完成并产出 3 份批次报告与截图；**Fresh 10/10 PASS，Advance 6/6 PASS，Rank 8/9 PASS**。唯一失败为 `D-07`：段位赛局内刷新后停在 `home`，未直接恢复到 `practice` | FAIL | `batch-1-fresh-user-result.md`<br>`batch-2-advance-result.md`<br>`batch-3-rank-match-result.md`<br>`artifacts/raw-results.json` |

## 本轮结论

- 工程基线里，`build` 与 `vitest` 可作为当前主干可运行证据。
- `lint` 当前不是绿线，存在一批已存在的规则债务；这次 QA 没有把它当作修复任务，但已如实记录。
- 浏览器全链回归只发现 **1 个真实用户路径问题**：`D-07 / ISSUE-064`，即段位赛局内刷新后的恢复路由不符合 Spec §5.8 对“回到刚才那一刻”的要求。
