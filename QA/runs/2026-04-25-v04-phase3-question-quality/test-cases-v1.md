# v0.4 Phase 3 题目质量 QA 用例表 v1

**执行日期**: 2026-04-25
**范围**: v0.4 Phase 3 题目质量与生成器诊断
**目标用户画像**: 6-12 岁小学生，数学能力中等，能完成五年级数与运算练习，但对低价值重复题和过度心算题敏感。
**设计意图**: 题目生成应匹配当前星级/关卡难度，compare 题应有真实思考价值，同一练习 session 内不应连续消耗用户在完全重复题上。

| ID | 模块 | 用例名称 | 操作 | 预期结果 | 预期体验 | 优先级 | 验证方式 |
|---|---|---|---|---|---|---|---|
| F-01 | 题目生成 | A03 d4/d5 乘法分布包含两位数乘两位数 | 运行 Phase 3 诊断脚本，抽样 `vertical-calc/int-mul` d4/d5 | `2位数 × 2位数` 占比落在 10%-20%，仍以 `三位数 × 一位数` 为主体 | 第四/第五关开始有竖式挑战感，但不会突然拔高 | P0 | 自动化 |
| F-02 | 题目生成 | A03 进阶 3★ 不再出现两位数除以一位数整数短除 | 运行诊断脚本抽样 advance 3-star A03 除法题 | `shortDivisionCandidates=0` | 进阶 3★ 不再像低年级心算混入，难度可信 | P0 | 自动化 |
| F-03 | 题目生成 | A03 d6/d7 除法用有限小数/更合理样本替代短除 | 运行 `vertical-calc.phase3.test.ts` | d6/d7 不生成两位整数除以一位整数短除，有限小数题保留 | 高星题看起来像阶段提升，而非换皮重复 | P0 | 自动化 |
| F-04 | 题目生成 | A03 d8+ 估算除法不再固定低价值小池 | 运行 `vertical-calc.phase3.test.ts` 和诊断脚本 | 估算除法使用三位整数被除数、4-19 除数、不可整除 | 估算题更像估算训练，不像背固定答案 | P1 | 自动化 |
| H-01 | 选择题 | A02 d7 compare 需要二步结构或误导识别 | 运行 `number-sense.phase3.test.ts` 并抽样诊断输出 | d7 compare 覆盖 equivalent-transform / net-multiplier / combine-like-terms，答案含 `>` `<` `=` | 学生不能只凭直觉猜，需要至少两步比较 | P0 | 自动化 + 模拟人工 |
| H-02 | 选择题 | A02 d8 对/错题保留但扩大概念池和解释 | 运行 `number-sense.phase3.test.ts` 并抽样诊断输出 | 24 个概念 statement，正误大致均衡，explanation 包含规则/条件/边界/反例 | 二选一不再只是撞运气，错因解释有教学价值 | P0 | 自动化 + 模拟人工 |
| D-01 | 答题通用 | 闯关/进阶 session 内完全重复治理 | 运行 `question-dedupe.test.ts` 与 `session-dedupe.test.ts` | 相同闭合题干在同一 session 内 bounded retry；开放题干按 prompt+options 区分 | 同一局不会反复看到完全一样的题，节奏更自然 | P0 | 自动化 |
| D-02 | 答题通用 | 重复签名不会误杀开放题干的不同选项实例 | 运行 `question-dedupe.test.ts` | 开放 prompt + 不同 options 不被判完全重复 | 练习不会因为题干模板相同而过度跳题 | P1 | 自动化 |
| D-03 | 段位赛 | rank-match 题目挑选共享 session 去重集合 | 运行 `question-picker.dedupe.test.ts` 与诊断脚本 rank-match summary | primary/nonPrimary/review bucket 间不重复，生产 retry 平均额外重试为 0 | 段位赛题目更像一套完整挑战，不浪费题位 | P0 | 自动化 |
| A-01 | 迭代验证 | Phase 3 变更不破坏既有全量测试 | 运行 `npm test -- --run` | 全量 Vitest 通过 | 开发改动没有明显回归 | P0 | 自动化 |
| A-02 | 迭代验证 | Phase 3 变更可生产构建 | 运行 `npm run build` | TypeScript 与 Vite build 通过 | 发布链路不被题目生成改动阻断 | P0 | 自动化 |
| A-03 | 迭代验证 | PM 状态与 Phase 3 事实一致 | 运行 `npx tsx scripts/pm-sync-check.ts` | 静态一致性校验全绿 | 文档入口不会误导下一阶段开发 | P1 | 自动化 |
| A-04 | 迭代验证 | 变更范围 lint 清洁，全仓 lint 债务单独标注 | 运行 Phase 3 touched-files scoped ESLint；对比 `npm run lint` | scoped lint 通过；全仓 lint 若失败需确认是历史存量或 `.worktrees/` 扫描 | QA 结论不把既有债务误算到 Phase 3 | P1 | 自动化 |
| U-01 | 拟真体验 | 题目样本是否符合五年级训练感 | 查看诊断样例与测试覆盖，按目标用户画像评估 | 样本体现难度提升、解释清楚、重复减少 | 学生感到题目更“像一关一关变难”，不是机械重复 | P1 | 模拟人工 |
