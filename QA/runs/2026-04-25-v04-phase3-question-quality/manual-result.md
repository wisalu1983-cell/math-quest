# v0.4 Phase 3 拟真人工 QA 结果

**执行日期**: 2026-04-25
**范围**: Phase 3 题目质量样本与 session 重复体验
**目标用户画像**: 6-12 岁小学生，数学能力中等，正在通过闯关/进阶/段位赛练习五年级数与运算。
**总计**: 4 条
**结果**: PASS: 4 / FAIL: 0 / RISK: 0 / BLOCKED: 0

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|---|---|---|---|---|---|---|
| U-01 | A03 乘法梯度体验 | 我到第四/第五关时，希望题目比三位乘一位更有竖式挑战，但不要突然全变难 | 查看诊断脚本 A03 d4/d5 抽样统计 | d4 `2d×2d=67/500`，d5 `2d×2d=69/500`，比例约 13%-14%，主体仍是三位数乘一位 | PASS：有新挑战且比例克制 | `automated-result.md` 诊断输出摘要 |
| U-02 | A03 进阶除法体验 | 我打到 3★ 时，不希望还刷到“两位数 ÷ 一位数”这种太简单题 | 查看诊断脚本 advance 3-star division sample | `divisionQuestions=465`，`shortDivisionCandidates=0` | PASS：心算级短除已移出该层 | `automated-result.md` 诊断输出摘要 |
| U-03 | A02 compare 思考价值 | 我遇到比较题时，希望题目需要看结构或陷阱，而不是一眼猜 | 查看 A02 d7/d8 抽样与测试覆盖 | d7 覆盖三类结构；d8 有 24 条正误 statement，解释含规则/条件/边界/反例 | PASS：compare 题具备教学解释和真实判断负荷 | `automated-result.md` 诊断输出摘要 |
| U-04 | session 重复体验 | 我一局练习里不想反复看到完全一样的题，但题干模板相同、选项不同的题可以接受 | 查看 dedupe 单测、store 接入和 rank-match 诊断 summary | campaign/advance 使用 runtime seen set，rank-match bucket 共享 seen set；开放题干签名保留 options 差异 | PASS：完全重复治理符合用户体感，不误杀开放题 | `code-review-result.md` + `automated-result.md` |

## 新发现问题

无。

## 本轮结论

Phase 3 的用户体验目标在题目质量层面通过：A03 难度梯度更可信，A02 compare 具备更高思考价值，session 内完全重复已被 bounded retry 治理。没有发现需要写入 `ProjectManager/ISSUE_LIST.md` 的新缺陷。
