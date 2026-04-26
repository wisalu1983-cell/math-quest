# v0.4 Phase 3 自动化 QA 结果 v2

**执行日期**: 2026-04-26
**范围**: `test-cases-v2.md` 中所有自动化 / 静态门禁用例
**结论**: PASS（全仓 lint 历史债务除外，已分类为非 Phase 3 blocker）

## 1. 命令执行记录

| Command | Covered Cases | Result | Evidence |
|---|---|---|---|
| `npm test -- --run src/engine/generators/vertical-calc.phase3.test.ts src/engine/generators/number-sense.phase3.test.ts src/engine/question-dedupe.test.ts src/store/session-dedupe.test.ts src/engine/rank-match/question-picker.dedupe.test.ts` | A-GATE-01, F-MUL, F-DIV, H-CMP, D-DED | PASS | 5 files / 15 tests passed |
| `node scripts\diagnose-phase3-question-quality.mjs` | F-MUL-01/02, F-DIV-08, H-CMP-02..11, D-DED-11/12 | PASS | 诊断指标全部达标，见 §2 |
| touched-files scoped ESLint | A-GATE-05 | PASS | Phase 3 touched files 无 lint error |
| `npm test -- --run` | A-GATE-02 | PASS | 53 files / 687 tests passed |
| `npm run build` | A-GATE-03 | PASS | `tsc -b && vite build` 通过；仅 Vite chunk size warning |
| `npx tsx scripts/pm-sync-check.ts` | A-GATE-04 | PASS | `✅ 全绿：未发现不一致。` |
| `npm run lint` | A-GATE-06 | NON-BLOCKING FAIL | 292 errors / 2 warnings；失败点为历史债务与 `.worktrees/` 副本扫描，非 Phase 3 touched-file regression |

## 2. 诊断脚本关键指标

| Area | Oracle | Actual | Verdict |
|---|---|---|---|
| A03 d4 int-mul | `2d×2d` 10%-20%，主体仍为 `3d×1d` | `67/500 = 13.4%`; `3d×1d=433/500` | PASS |
| A03 d5 int-mul | `2d×2d` 10%-20%，主体仍为 `3d×1d` | `69/500 = 13.8%`; `3d×1d=431/500` | PASS |
| A03 multiplication board | `2d×2d` 样本携带 board | `multiplicationBoard=67/500` for d4 | PASS |
| A03 advance 3★ division | `shortDivisionCandidates=0` | totalQuestions=1600, divisionQuestions=465, shortDivisionCandidates=0 | PASS |
| Two-choice option candidates | 除 accepted A02 compare judges 外无候选 | none | PASS |
| A02 d7 pattern coverage | 三类模板均出现 | combine-like-terms=85, net-multiplier=62, equivalent-transform=103 | PASS |
| A02 d7 answer coverage | `>` / `<` / `=` 均出现 | `>=44`, `<=110`, `==96` | PASS |
| A02 d8 pool size | unique statements >=24 | 24 | PASS |
| A02 d8 balance | 对/错大致均衡 | 对=139, 错=137 | PASS |
| A02 d8 explanation | explanation 完整 | 276/276 | PASS |
| Rank-match duplicate | 四段位 0/30 duplicate games | rookie/pro/expert/master 均 0/30 | PASS |

## 3. Campaign Duplicate Hotspots 解释

诊断脚本显示 campaign 多数热点在 simulated retry 后显著下降；仍存在 `retryExhausted` 的热点，例如：

| Hotspot | Baseline avgExtra | Retry avgExtra | Drop | retryExhausted | QA 解释 |
|---|---:|---:|---:|---:|---|
| number-sense-S3-LB-L2 | 10.50 | 2.10 | 80.0% | 63 | 机制有效，小模板池仍有容量上限 |
| multi-step-S2-LB-L2 | 7.87 | 0.83 | 89.4% | 25 | 机制有效，扩池可继续改善 |
| number-sense-S2-LB-L2 | 8.40 | 7.00 | 16.7% | 210 | 小题池 / 结构重复显著，后续应扩池，不判 T5 失败 |

T5 开发文档明确只治理“session 内完全重复”，不承诺消灭结构重复或小模板池耗尽。因此以上热点作为后续扩池观察项，不写入本轮 FAIL。

## 4. 全仓 lint 非阻塞归因

`npm run lint` 失败并不代表 Phase 3 touched files 失败：

- 失败列表包含仓库根 `.worktrees/v0.4-phase3-question-quality/...` 的副本路径。
- 主工作区历史文件仍有 React Hook purity / refs / set-state-in-effect、`any`、未配置 `react/no-danger` 等既有问题。
- 本轮 scoped ESLint 覆盖所有 Phase 3 touched files，结果为 PASS。

## 5. 自动化结论

新版专业用例对应的自动化门禁通过。唯一红项是已分类的全仓 lint 历史债务，不阻塞 Phase 3 QA 结论。
