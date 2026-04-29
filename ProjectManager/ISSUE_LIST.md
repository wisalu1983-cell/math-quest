# ISSUE_LIST — 当前版本开放问题

> 最后更新：2026-04-29（`ISSUE-069` 纳入 v0.5 Release Gate 前小修）
> 当前版本：**v0.5 Phase 3 有条件完成**（入口：[`Plan/v0.5/README.md`](Plan/v0.5/README.md)）
> 本文件角色：**只列当前版本开放的 issue**（待修 bug / 欠账 / 实现问题）。历史关闭项走版本归档，未激活需求走 Backlog。

---

## 当前开放数

| 当前开放数 | 是否阻塞当前主线 | 当前需关注项 |
|---|---|---|
| 1 | 否 | `ISSUE-069` |

> v0.5 版本包已创建；v0.4 已发布版本入口见 [Plan/v0.4/README.md](Plan/v0.4/README.md)。

---

## 开放问题清单

### ISSUE-069 · reverse-round 填空题要求填 □ 数字但正确答案显示完整小数（P1 · bug / 题干答案一致性）

- **状态**：🟡 待修复（2026-04-29 新增）
- **所属版本**：v0.5 当前开放问题；来源功能为 v0.2 `reverse-round` 模板扩充。
- **计划归位**：v0.5 Release Gate 前 P1 correctness hotfix；不并入 Phase 4 `BL-010` 竖式除法 UI 主线，避免干扰长除法实现范围。
- **来源**：2026-04-29 用户截图反馈。样例 1：`78.□ 用四舍五入法取到个位后，结果变成了 79，□ 里最小能填几？`；按题干应填 `5`。样例 2：`91.□ 用四舍五入法取到个位后结果仍然是 91，□ 里最大能填几？`；用户填 `4`，系统判错并显示正确答案 `91.4`。
- **类别**：bug / 题干答案一致性 / A02 数感与近似值 / `reverse-round`。
- **复现路径**：
  1. 在 A02 数感题池生成 `reverse-round` 低/中档模板 4 题。
  2. 遇到 `N.□ ... □ 里最大能填几？` 或 `(N-1).□ ... □ 里最小能填几？`。
  3. 按题干只输入 □ 内数字 `4` 或 `5`。
  4. 系统按完整小数 `N.4` 或 `(N-1).5` 判定，导致符合题干的答案被判错。
- **证据**：
  - `src/engine/generators/number-sense.ts`：`templateIdx === 4` 注释写明“填数字题”，题干也问“□ 里最大/最小能填几”。
  - 同一分支仍复用 `answerStr = askMax ? \`${target}.4\` : \`${target - 1}.5\``，导致 `solution.answer` 和解释显示完整一位小数。
  - `ProjectManager/Specs/2026-04-22-逆向推理A3回验.md` §“模板 4（填写具体数位，十分位填空形式）”明确模板为 `□` 填空形式。
- **用户影响**：学生按题干填入正确数字仍被判错，容易误以为“四舍五入规则”理解错误，影响错题本记录和学习反馈可信度。
- **成熟参照**：纸质练习册和在线数学填空题中，“□ 里最大/最小能填几”通常要求填写占位符本身的数字；只有题干问“这个一位小数最大/最小是多少”时才填写完整小数。可迁移做法是让判题答案粒度和可见空格粒度一致；迁移边界是解释仍可展示完整小数帮助理解。
- **建议修复方向**：低风险修复为仅在模板 4 中把 `solution.answer` 改为 `askMax ? '4' : '5'`，解释改为“□ 最大填 4，所以这个数是 N.4 / □ 最小填 5，所以这个数是 (N-1).5”；其他模板继续保留完整小数答案。
- **非目标**：不调整 `reverse-round` 其他 4 个模板的题干口径；不改变四舍五入数学规则；不扩大到高档“两位小数 → 一位小数”题。
- **建议验证**：新增 generator 单测固定覆盖模板 4 的最大/最小两种分支，断言题干含 `□ 里` 时 `solution.answer` 为单个数字；补一条判题层回归，确认用户输入 `4` / `5` 可通过。

---

## 本轮关闭问题

- `ISSUE-067` 多行乘法竖式判错面板缺少过程 / 训练格错因：已随 v0.5 Phase 3 修复并归档到 [`Plan/v0.5/issues-closed.md`](Plan/v0.5/issues-closed.md)。
- `ISSUE-068` 单行过程积乘法竖式要求重复填写答数：已随 v0.5 Phase 3 小修关闭，归档到 [`Plan/v0.5/issues-closed.md`](Plan/v0.5/issues-closed.md)。
- v0.4 关闭问题归档见 [`Plan/v0.4/issues-closed.md`](Plan/v0.4/issues-closed.md)。

---

## 历史归档 / 延期入口

| 想看什么 | 去哪里 |
|---|---|
| v0.1 期间 ISSUE-001~064 完整关闭记录 | [`Plan/v0.1/issues-closed.md`](Plan/v0.1/issues-closed.md) |
| v0.1 延期未处理的 issue / 候选项 | [`Backlog.md`](Backlog.md) |
| 项目管理规则 / 模板 / 版本生命周期规则 | [`Plan/README.md`](Plan/README.md) |

---

## 操作规范（简化提醒）

> 完整流转规则见 [`Plan/rules/pm-write-routing.md`](Plan/rules/pm-write-routing.md)；版本收口规则见 [`Plan/version-lifecycle.md`](Plan/version-lifecycle.md)。

1. **新开 issue**：从当前最大 ID 续编（跨版本连续，目前下一个新 ID 从 `ISSUE-070` 起）。写明 P0/P1/P2、所属版本、类别（bug / 实现一致性 / a11y / UI / 等）
2. **关闭 issue**：在本文件内标注关闭并保留关闭证据链；版本收口时由本文件整体搬至 `Plan/vX.Y/issues-closed.md`
3. **延期 issue**：迁入 `Backlog.md`，原 ID 保留；激活时搬回本文件，仍用原 ID
4. **同一条目不同时在两边**：bug 进本文件；未激活需求 / 想法进 Backlog
