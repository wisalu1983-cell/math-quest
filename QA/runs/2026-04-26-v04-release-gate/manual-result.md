# v0.4 Release Gate Manual QA Result

**执行日期**：2026-04-26
**范围**：v0.4 发布前最终 QA · 第三层拟真人工体验测试
**目标用户画像**：上海五年级学生，数学能力中等，主要移动端使用。
**工具**：Playwright 临时执行脚本 `artifacts/manual-visual-release-gate.mjs`；截图与 raw JSON 位于 `artifacts/`。
**结论**：PASS。拟真人工功能/体验 charter 未发现操作路径断裂；视觉可读性问题单列于 `visual-result.md`。

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|---|---|---|---|---|---|---|
| U-001 | 新用户注册到首页 | “我第一次打开应用，应该能很快开始学习，并看到自己的昵称。” | 390px 视口打开应用 → 点击“开始冒险” → 填“小测同学” → 点击“开始学习！” | 进入学习首页，显示昵称、继续学习卡片、所有主题与底部导航；无 console/page error。 | PASS：新手入口顺畅，信息层级可理解。 | `artifacts/U-001-before-onboarding.png`, `artifacts/U-001-after-home.png` |
| C-001 | A04/A06 不作为独立玩家入口 | “我应该看到新的主线题型，不会被旧的运算律/括号变换独立入口困扰。” | 注册后停留首页 → 查看“所有主题”列表 | 首页展示 6 个领域，包含“简便计算”，未观察到“运算律”“括号变换”作为独立主题卡片。 | PASS：Phase 2 入口收敛在用户视角成立。 | `artifacts/U-001-after-home.png` |
| I-001 | 低档进位格失败链路 | “低档竖式会提醒我写进位；如果进位写错，即使答案对也应该告诉我错在过程。” | 固定 `999+888 d=5` → 输入个位 `7` → 十位进位格填 `0` → 填完正确答案 `1887` → 提交 → 继续 | 填完个位后焦点进入进位格；提交后先在竖式板显示“未通过：进位/退位格填写错误”，继续后统一失败面板显示原因。 | PASS：低档过程训练与错因链路清楚。 | `artifacts/I-001-low-focus-process.png`, `artifacts/I-001-low-local-process-fail.png`, `artifacts/I-001-low-unified-process-fail.png` |
| I-002 | 中档过程提示 | “中档如果我答案对，过程格只是辅助，不应该因为过程格错而判我失败。” | 固定 `999+888 d=6` → 填个位答案 → 主动点进位格填 `0` → 填完答案 → 提交 | 进入成功反馈，显示“进位/退位过程有误，但本题答案正确，已通过”。 | PASS：中档不惩罚过程格，提示边界符合规格。 | `artifacts/I-002-mid-warning-pass.png` |
| I-003 | 高档隐藏过程格 | “高档题应该更简洁，只让我填答案。” | 固定 `999+888 d=8` → 查看竖式板 → 填 `1887` → 提交 | 过程格行数量为 0，只填写答案格；提交后成功。 | PASS：高档显示与判定符合 current spec。 | `artifacts/I-003-high-pass-no-process-row.png` |
| U-003 | compare 方法提示 | “遇到‘一定’这类判断题时，应该看到怎么想的提示。” | 固定 `number-sense compare d=8` 多选题 → 查看题干阶段 | 题干下显示“遇到‘一定’，先找反例”；选项以多选形式展示。 | PASS：`BL-003` compare tip 可达，教学提示自然。 | `artifacts/U-003-compare-tip-visible.png` |

## 统计

| 结果 | 数量 |
|---|---:|
| PASS | 6 |
| FAIL | 0 |
| RISK | 0 |
| BLOCKED | 0 |

## 说明

- 本文件只记录拟真人工功能/体验 charter。
- 单行竖式操作数低对比问题属于视觉规格对照，已在补测中修复并通过；见 `visual-result.md` 的 `X-002` 与 `ProjectManager/ISSUE_LIST.md` 的 `ISSUE-065`。
