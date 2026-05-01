# Backlog（未激活需求 / 想法 / 延期候选）

> 最后更新：2026-05-01（确认 v0.5 / v0.6 / v0.7 分流，并完成 `BL-018` 预览原型一致性 QA 门禁的模板 / capability registry 收尾）
> 角色：**未激活的需求 / 想法 / 方向 / 延期候选**集中地。只有被正式纳入某个版本之后，条目才会展开为正式 Plan；已纳入当前版本但尚未收口的条目可暂存在本文件作为来源索引，版本收口时必须归档或回流。
>
> **与 `ISSUE_LIST.md` 的边界**：
> - `ISSUE_LIST.md` — 已知的具体 bug / 欠账 / 实现问题；生命周期 open → closed
> - `Backlog.md`（本文件） — 未激活的需求 / 想法 / 方向 / 延期候选；生命周期 候选 → 纳入 vX.Y / 放弃
> - 同一条目不同时在两边

---

## 状态说明

- **候选**：记录下来但未纳入任何版本
- **已纳入 vX.Y**：已被当前或进行中的版本正式激活；版本收口前可保留完整条目，收口时必须退出活跃区
- **延期至 vX.Y / 候选**：版本收口时未做完、仍值得保留的条目；回到活跃区并写清延期原因
- **已落地 vX.Y**：只出现在 `已落地归档` 区，保留一行索引，不再保留长篇正文
- **已放弃**：评估后决定不做；进入 `已放弃归档`，保留一行理由供未来回溯

---

## 活跃候选 / 已纳入当前版本

### BL-002 · 段位赛晋级动画遗留

- **来源**：v0.1 Phase 3 M3 设计审查 m-3 漏网项
- **背景**：段位赛晋级时机的动画表现未做完整设计与实现。v0.1 收口时按用户决策**不入 ISSUE_LIST**，等 Phase 3 上线后按真实用户反馈评估
- **类别**：体验 / UI 动效
- **状态**：候选（等真实反馈触发；v0.2 主线如有相关用户反馈可提升为 ISSUE 处理）

---

### BL-009 · 闯关竖式题目需排除纯口算样例

- **来源**：2026-04-27 用户新需求反馈
- **背景**：闯关模式下的简单竖式除法出现 `888/4`、`844/4` 等可直接口算的样例；同时存在 `2位数 × 1位数` 这类不需要竖式即可完成的乘法题。用户反馈重点是：这些题目不需要通过竖式计算完成，不适合作为竖式训练题。
- **类别**：题目质量 / 生成器优化（可能转 ISSUE；需先复现并确认是否按线上缺陷处理）
- **状态**：已纳入 v0.5（入口：[`Plan/v0.5/README.md`](Plan/v0.5/README.md)；Phase 2：竖式题样本质量诊断）
- **初步分流**：v0.5 Phase 先抽样诊断，再根据诊断结论判断强制过滤规则；优先检查 A03 `vertical-calc` 生成器、campaign 关卡过滤条件、难度档位边界，以及 `ProjectManager/Specs/a03-vertical-calc/current.md` 对竖式训练目标的当前承诺。
- **期望方向**：竖式关卡应过滤或降权明显可口算样例，让题目负担与“竖式计算训练”目标匹配。

---

### BL-010 · 竖式除法 UI 化答题功能

- **来源**：2026-04-27 用户新需求反馈
- **背景**：需要为竖式除法提供 UI 化答题能力，使玩家通过结构化竖式界面完成作答，而不是只依赖普通文本输入或最终答案输入。
- **类别**：新功能 / A03 竖式计算交互
- **状态**：已纳入 v0.5（入口：[`Plan/v0.5/README.md`](Plan/v0.5/README.md)；Phase 4：竖式除法 UI 化答题）
- **初步分流**：采用“一套动态整数长除法核心板 + 外围扩展训练格”的方向；详细设计阶段确认现有除法题渲染、判定、输入模型与 `VerticalCalcBoard` / 多行竖式组件的边界。
- **期望方向**：竖式除法答题过程应可视化、可交互、可判定，并与现有 A03 竖式反馈、错题、历史记录规则对齐。

---

### BL-011 · 计算输入内置键盘与移动端默认键盘策略

- **来源**：2026-04-27 用户新需求反馈
- **背景**：需要提供统一内置键盘；按键全集常驻，当前槽位不可用按键置灰且不可点击；移动端默认使用内置键盘，不自动弹出系统键盘；系统键盘可由玩家手动呼叫。
- **类别**：新功能 / 输入体验 / 移动端 UX
- **状态**：已纳入 v0.5（入口：[`Plan/v0.5/README.md`](Plan/v0.5/README.md)；Phase 3 本地完成，真实 Android / iOS 设备证据发布后线上补验；v0.5 release gate 时归档或标明剩余条件）
- **初步分流**：全量接入计算字符输入入口；Chrome Android / Safari iOS 必须稳定默认内置键盘，其他浏览器允许降级为“内置键盘优先 + 系统键盘可同时弹出”。系统键盘兜底入口不能只放在内置键盘内部。
- **期望方向**：计算输入默认走稳定、低干扰的统一内置键盘；按键是否可用由当前 active slot 决定，输入合法性由 slot sanitize 守门；保留手动呼叫系统键盘作为兼容路径。

---

### BL-012 · 特定账号数据查询后台页面

- **来源**：2026-04-27 用户新需求反馈
- **背景**：需要一个可随时查看特定账号数据的查询后台页面，用于定位账号、学习进度、历史记录、同步状态等线上数据问题。
- **类别**：新功能 / 内部后台 / 账号数据运维
- **状态**：延期至 v0.7（版本包待启动；从 v0.5 / v0.6 当前候选范围拆出）
- **初步分流**：后续 v0.7 启动时对齐 v0.3 Supabase 账号同步规格，明确可查询的数据表、账号定位方式、访问权限、生产环境入口、隐私边界、审计要求与只读保护；默认只读查询后台。
- **期望方向**：提供低风险的只读查询后台，支持按特定账号查看关键数据状态，优先服务排障与客服/运营验证。

---

### BL-013 · 错题本重练与同类题行动路径

- **来源**：2026-04-29 v0.5 Phase 3 产品评审
- **背景**：`ISSUE-067` 结构化错因上线后，错题本能告诉学生“哪里错了”，但仍缺少“重做本题 / 练一道同类题 / 回到相关关卡”的行动路径，学生可能产生“然后呢”的挫败感。
- **类别**：学习闭环 / 错题本 / 练习行动路径
- **状态**：延期至 v0.6（版本包待启动；不进入 v0.5）
- **初步分流**：后续版本启动时评估错题本重练、同类题推荐、回到相关关卡或知识点 lane 的最低成本方案；需要与错题数据、Practice session、campaign / advance / rank-match 入口边界一起设计。
- **期望方向**：让结构化错因不仅能解释错误，也能给学生一个低压力的下一步练习动作；Phase 3 只记录缺口，不扩大当前范围。

---

### BL-014 · 乘法竖式迭代：删除 legacy 并统一过程错因

- **来源**：2026-04-30 用户新需求反馈
- **背景**：A03 乘法竖式当前同时存在 legacy 单行竖式和多行乘法竖式两套交互与判定口径。legacy 一位乘法使用进位过程格和三档宽松策略；多行乘法竖式已经能覆盖一位乘数的单行过程积场景，且 `ISSUE-068` 已修复单行过程积重复填写问题。后续希望收敛为一套乘法竖式能力。
- **类别**：体验一致性 / A03 竖式计算交互 / 判定与反馈抽象
- **状态**：延期至 v0.6 hardening（版本包待启动；不并入 v0.5 `BL-010` 竖式除法 UI 主线）
- **初步分流**：先评估用多行乘法板覆盖原 legacy 乘法题型的改造范围，再决定是否保留 legacy 仅服务加法 / 减法，或进一步拆除 legacy 组件。同步检查乘法过程格错误提示是否可参照长除法设计，并评估过程错因分类、结构化字段展示、错题本展示是否能抽象为跨题型统一逻辑。
- **期望方向**：删除或收敛乘法 legacy 路径，用多行乘法覆盖原 legacy 乘法题型；乘法过程错因提示与长除法保持一致，并尽量沉淀出所有竖式题型可复用的统一判定 / 错因展示逻辑。

---

### BL-015 · v0.6 开发 / QA 子 agent 职责拆分试点

- **来源**：2026-04-30 Matt Pocock skills repo 与 MathQuest 项目治理讨论；归档入口：[`Reports/2026-04-30-agent-roles-and-development-workflow/summary.md`](Reports/2026-04-30-agent-roles-and-development-workflow/summary.md)
- **背景**：本轮讨论确认 Matt repo 更适合作为 MathQuest 的“开发执行质量控制层”，不替代现有 ProjectManager / 版本包 / QA leader / Living Spec。v0.6 可试点更轻量的 agent 职责拆分：主 agent 继续负责产品、项目、文档、版本治理和需求澄清；开发子 agent 负责技术方案、开发模式判定、实现、TDD、refactor 和架构检查；QA 子 agent 负责测试策略、用例、自动化 / 拟真 / 视觉 QA、缺陷分流和 release gate。
- **类别**：项目治理 / Agent 协作 / 开发流程
- **状态**：候选（暂不纳入版本；v0.6 预研时再决定是否作为治理试点）
- **初步分流**：v0.6 启动时先做一次“开发模式判定”：用户可见功能优先 vertical slice；账号同步、存档迁移、共享输入协议等高风险基础设施采用 foundation slice + vertical slice；纯诊断走 diagnostic phase；release gate 走 stabilization / QA phase。若采用子 agent 拆分，先写一份 canonical 职责文档，再按 Claude Code / Codex / Cursor 分别做轻量适配。
- **期望方向**：把开发实现与 QA 验证从主 agent 的常规职责中拆出，降低主 agent 上下文负担，同时保留用户作为制作人 / PO 的产品决策入口；不新增常驻学习设计、发布或 Spec 治理角色。

---

### BL-016 · master lint 债清理

- **来源**：2026-04-30 用户要求记录当前 `master` lint 债；证据来自独立 worktree `.worktrees/lint-master-20260430`，`master@5bfb1bf`，先执行 `npm ci`，再执行 `npm run lint`。
- **背景**：`master@5bfb1bf` 当前 `npm run lint` 未通过，共 `145 errors / 1 warning`，涉及 17 个文件。主要集中在生成器测试中的 `@typescript-eslint/no-explicit-any`，以及 React Hooks 新规则、ESLint 规则配置和少量历史代码风格问题。该项记录为未激活工程债清理候选；若后续拆成具体缺陷或版本阻塞项，应迁入 `ISSUE_LIST.md` 或对应版本 Plan。
- **类别**：工程债 / Lint hygiene / 测试类型收敛
- **状态**：延期至 v0.6 hardening / 单独工程债切片（版本包待启动；不并入 v0.5 当前功能主线）
- **已确认范围**：
  - 总量：`145 errors / 1 warning`。
  - 主要规则：`@typescript-eslint/no-explicit-any` 126 条；`react-hooks/refs` 5 条；`react-hooks/rules-of-hooks` 3 条；`react-hooks/set-state-in-effect` 2 条；`react-hooks/purity` 2 条；其余为未使用变量、`prefer-const`、`no-useless-escape`、`react-hooks/exhaustive-deps` warning，以及 `react/no-danger` 规则定义缺失。
  - 高集中度文件：`src/engine/generators/generators.test.ts` 79 errors；`src/engine/generators/difficulty-tiers.test.ts` 22 errors；`src/engine/generators/qa-v3.test.ts` 18 errors。
  - 关键非测试风险：`src/components/SyncStatusIndicator.tsx` ref render access；`src/pages/CampaignMap.tsx` 条件调用 hook；`src/pages/RankMatchHub.tsx` render 中调用 `Date.now()`；`src/sync/merge-flow.ts` 非 hook 函数调用 `useRemoteAccount()`。
- **初步分流**：先把 lint 债拆成“规则配置 / 测试 helper 类型化 / React Hooks 结构性修复 / 小型风格修复”四组；优先处理可能影响运行语义的 React Hooks 类问题，再集中收敛测试 helper 的 `any`，避免在业务功能 PR 中混合大量低风险机械改动。
- **期望方向**：恢复 `npm run lint` 作为可信质量门；后续新增功能不再继承 master 上的 lint 噪音。

---

### BL-017 · 题型生成器硬编码样例池审计与循环小数生成优化

- **来源**：2026-04-30 Phase 4 长除法开发收口 review；发现 `src/engine/generators/vertical-calc.ts` 的 `generateCyclicLongDivision` 仅有 3 个硬编码循环小数样例。
- **背景**：当前 3 个固定样例可支撑 v0.5 初版功能可用性，但学生反复练习时很快会遇到重复题。用户要求不要只局部修 `cyclic-div`，需先检查本软件所有题型是否也存在类似“有限硬编码样例池”问题，再决定是在 v0.5 顺手修掉，还是升格为单独优化任务。
- **类别**：题目质量 / 生成器审计 / 去重与样本丰富度
- **状态**：已纳入 v0.5 Release Gate 审计判断（只做全题型审计与影响判断；不承诺全量修复）
- **初步分流**：v0.5 Phase 5 先审计 `src/engine/generators/` 下所有题型生成器、campaign 题型过滤入口、固定样例 / fallback 样例、有限枚举池和高频重复风险；输出题型清单、重复风险等级、是否影响当前 v0.5 验收。若仅 `cyclic-div` 风险高且修复面小，可在 v0.5 hardening 中用反向构造法生成循环小数；若多题型存在系统性问题，则升格为 v0.6 独立生成器样本质量优化任务。
- **期望方向**：题型生成器避免依赖过小硬编码池；需要硬编码 fallback 的地方保留为异常兜底，正常路径应使用可控随机生成并满足难度、可验收与重复率约束。

---

### BL-019 · 竖式题题干信息内嵌与去重策略

- **来源**：2026-05-01 用户新需求反馈
- **背景**：竖式题当前部分信息以竖式板上方文本呈现，例如“用 / 列竖式计算：XXXXX”。用户判断：所有“小数 ÷ 小数”本来就是先扩倍再做竖式，因此除法题通常不需要把完整算式作为板外文本重复展示；但“小数除法保留 X 位”这类精度要求不能丢失。小数乘法仍可能不能省略“用 / 列竖式计算：XXXXX”，因为题目算式本身是竖式作答的必要输入。
- **类别**：体验优化 / A03 竖式计算交互 / 题干信息架构
- **状态**：延期至 v0.6（版本包待启动；作为 A03 竖式体验优化组评估）
- **初步分流**：先审计 A03 竖式题各子型到底依赖哪些板外文本信息，拆分为“算式 / 操作类型 / 保留位数 / 取近似规则 / 教学提示”等字段；再决定哪些信息可删除、哪些信息必须作为竖式板自身的一部分显示。长除法板与乘法竖式板都需要有明确的信息槽位，避免把关键题目信息散落在板外文本里。
- **期望方向**：竖式板本身成为可独立理解的作答界面；能去掉的重复题干去掉，不能去掉的信息内嵌到竖式板中，确保玩家不会因为上方文本收敛而丢失关键信息。

---

### BL-020 · 小数乘法取近似数改为竖式面板作答

- **来源**：2026-05-01 用户新需求反馈
- **背景**：当前“小数乘法取近似数”题仍然是直接填写答案，没有进入乘法竖式面板。它属于竖式计算训练中的乘法近似场景，只填最终答案会缺少竖式过程、位数处理和取近似规则的可视化反馈。
- **类别**：新功能 / A03 乘法竖式交互 / 近似数题型
- **状态**：延期至 v0.6（版本包待启动；作为 A03 竖式体验优化组评估）
- **初步分流**：确认受影响的 `approximate` / `dec-mul` 子型与当前题型生成路径；将小数乘法取近似题接入乘法竖式板，并把“保留 X 位 / 取近似数”的要求放进竖式板信息区。判定需要同时覆盖竖式过程、精确积与最终近似答案，题型一览入口也要能打开对应 UI 版式。
- **期望方向**：小数乘法取近似题不再只是普通 numeric-input，而是完整竖式过程 + 近似规则的结构化作答体验。

---

### BL-021 · 长除法竖式板冻结商 / 长除号行与过程区滚动

- **来源**：2026-05-01 用户新需求反馈
- **背景**：位数较多的长除法题会让整个竖式变长，过程格滚动时容易丢失“商、长除号、被除数 / 除数”这一层上下文。用户建议采用类似 Excel 首行冻结的体验：商和长除号所在行固定，过程格区域可滚动。
- **类别**：体验优化 / A03 长除法 UI / 响应式布局
- **状态**：延期至 v0.6（版本包待启动；作为 A03 长除法体验优化组评估）
- **初步分流**：评估长除法板是否拆成固定 header 与可滚动 process grid，并保证列宽、输入焦点、反馈高亮和移动端触控滚动仍对齐。需要同时考虑纵向滚动与超长位数可能带来的横向宽度压力，后续设计时用真实高位数样题做响应式验证。
- **期望方向**：长除法过程格滚动时，玩家始终能看到商和长除号上下文，长题不会因为滚动或缩放导致列含义变得难以追踪。

---

### BL-022 · 长除法竖式板自适应缩放触发稳定化

- **来源**：2026-05-01 用户新需求反馈
- **背景**：当前除法竖式板遇到需要自适应缩放时触发不稳定，经常需要玩家手动滑动界面后才缩小，实际体验会像“突然缩小”。用户判断更合理的触发点是：每次长除法答题过程中因为新增答题格导致横向宽度不够时，立即执行缩放逻辑。
- **类别**：体验优化 / A03 长除法 UI / 自适应缩放
- **状态**：延期至 v0.6（版本包待启动；作为 A03 长除法体验优化组评估）
- **初步分流**：把缩放触发从偶发的滚动 / 重排副作用收敛为确定性的布局检测：当 board model、可见列数或新增答题格变化时，测量容器可用宽度与竖式内容宽度，必要时同步更新缩放。后续实现需要验证首题渲染、每步新增格、窗口 resize、移动端横竖屏和字体加载后的触发稳定性。
- **期望方向**：长除法板在宽度不足时即时、稳定、可预期地缩放，不需要玩家手动滑动触发，也避免交互中出现迟来的突兀缩小。

---

### BL-023 · Supabase 公开 key 安全探针与 Auth 防滥用加固

- **来源**：2026-05-01 用户关于 `.env.production` 中 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 公开风险的追问与风险分流
- **背景**：Supabase publishable / anon key 设计上会暴露在前端构建产物中，不能把“隐藏 key”作为主要安全边界。当前项目风险主要落在三类：RLS / policy 配错导致公开 key 可读写用户数据；Auth Magic Link 被滥用刷邮件或消耗额度；公开前端写入模型允许用户伪造自己的学习进度。当前阶段先处理前两类可低成本降低的风险，并把“客户端进度不可作为高可信成绩”作为后续权益 / 排行榜前置约束。
- **类别**：安全 / Supabase / Auth 防滥用 / 发布门禁
- **状态**：延期至 v0.7（版本包待启动；待后续安全设计讨论明确）
- **初步分流**：
  - 增加公开 key 安全探针：用 production publishable key 对 `profiles`、`game_progress`、`history_records`、`rank_match_sessions`、`sync_metadata` 做匿名读写探针，发布前确认匿名态读不出数据、写不进业务表。
  - 核对并固化 Supabase Auth rate limits：重点覆盖 Magic Link / OTP 邮件发送频率、异常请求监控和额度告警。
  - 登录入口接入 CAPTCHA（优先评估 Cloudflare Turnstile / hCaptcha）：防止脚本直接刷 Magic Link 邮件；同时确认未登录用户仍能走本地练习，不被账号系统卡住。
- **期望方向**：公开 key 继续作为前端正常配置，但用自动探针 + Auth 限流 + CAPTCHA 把“可直接调用公开接口”造成的数据泄露和刷邮件风险降到可接受范围；若未来加入排行榜、奖励、付费权益，再另行设计服务端校验进度的高可信链路。

---

## 流转规则

### 候选 → 纳入 vX.Y

当决定把某条候选正式纳入某版本时：
1. 在当前版本的主 Plan / 子计划里引用本条目
2. 本文件把该条目状态改为 **已纳入 vX.Y**，并附上具体 Plan 链接
3. 如果属于 bug 类（如 `ISSUE-059`），同步把条目从 Backlog 移回 `ISSUE_LIST.md`（原 ID 保留）

### 候选 → 已放弃

评估后决定不做时：
1. 状态改为 **已放弃**
2. 保留条目 + 放弃理由，供未来回溯
3. 不删除（避免失去历史信息）

### 激活后归档

版本收口时，Backlog 归档是**必做动作**，不再作为可选整理项。

**触发条件**：

1. 执行 `ProjectManager/Plan/version-lifecycle.md` 的 `版本收口动作`
2. 或某个 `已纳入 vX.Y` 条目被明确关闭 / 延期 / 放弃
3. 或切换版本轴前需要清理当前版本活跃视图

**执行方式**：

1. 扫描本文件中所有状态为 **已纳入 vX.Y** / **已激活至 vX.Y** 的条目。
2. 已完成条目：从 `活跃候选 / 已纳入当前版本` 移出，只在 `已落地归档` 保留一行：`ID / 标题 / 落地版本 / 日期 / Plan 链接 / 一句话结果`。
3. 未完成但仍要做：保留或回流到活跃区，状态改为 **候选** 或 **延期至 vX.Z**，写清延期原因和下一判断点。
4. 决定不做：移入 `已放弃归档`，保留一行放弃理由。
5. bug 类条目不在 Backlog 长期归档；关闭走 `Plan/vX.Y/issues-closed.md`，延期才回到 Backlog，并保留原 ISSUE ID。
6. 若本轮同时改动 Backlog 与 Plan / ISSUE / Overview，按规则运行 `pm-sync-check`。

**稳定执行检查**：

- 版本收口入口：[`Plan/version-lifecycle.md`](Plan/version-lifecycle.md) 已把 Backlog 归档列为收口动作。
- PM 写入入口：[`Plan/rules/pm-write-routing.md`](Plan/rules/pm-write-routing.md) 规定 Backlog 生命周期变化属于关键节点。
- 当前版本入口：`Plan/v0.4/04-execution-discipline.md` 记录 v0.4 的 Backlog 收口处理方式。
- 工具提醒入口：`.cursor/rules/pm-sync-check.mdc` 在版本收口触发项中包含 Backlog 归档。

---

## 已落地归档

- **BL-001 · 本地用户数据存档 / 账号系统前置数据模型**：已落地 v0.3（2026-04-24），扩大为 Supabase 在线账号与数据同步主线。入口：[`Plan/v0.3/README.md`](Plan/v0.3/README.md)
- **BL-003 · compare 概念题方法提示补证**：已落地 v0.4（2026-04-26），Phase 4 用可控题对象与浏览器证据补齐 compare tip 可达性。入口：[`Plan/v0.4/phases/phase-4.md`](Plan/v0.4/phases/phase-4.md) · [`QA/runs/2026-04-26-v04-release-gate/qa-summary.md`](../QA/runs/2026-04-26-v04-release-gate/qa-summary.md)
- **BL-004 · Practice 答题页状态重置实现清理**：已落地 v0.4（2026-04-26），统一为 `usePracticeInputState()`，换题 reset 与首输入聚焦通过回归。入口：[`Plan/v0.4/phases/phase-5.md`](Plan/v0.4/phases/phase-5.md) · [`QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md`](../QA/runs/2026-04-26-v04-phase5-practice-reset/qa-summary.md)
- **BL-005 · 竖式笔算体验问题集**：已落地 v0.4（2026-04-26），覆盖竖式颜色、乘法竖式、小数答案等价、难度分布、进位/退位格三档规则；release gate 补测关闭 `ISSUE-065`。入口：[`Plan/v0.4/README.md`](Plan/v0.4/README.md) · [`Specs/a03-vertical-calc/current.md`](Specs/a03-vertical-calc/current.md)
- **BL-006 · 运算律填数字题 UX 问题**：已落地 v0.4（2026-04-26），随 A04/A06 玩家入口断联并迁入 A07 知识点 lane 收口。入口：[`Plan/v0.4/phases/phase-2.md`](Plan/v0.4/phases/phase-2.md)
- **BL-007 · 选项题干扰项不足**：已落地 v0.4（2026-04-26），A04/A06 相关题随 Phase 2 收敛，A02 compare 质量在 Phase 3 优化并通过专项验证。入口：[`Plan/v0.4/phases/phase-2.md`](Plan/v0.4/phases/phase-2.md) · [`Plan/v0.4/phases/phase-3.md`](Plan/v0.4/phases/phase-3.md)
- **BL-008 · 闯关题目重复问题**：已落地 v0.4（2026-04-26），完成 campaign / advance / rank-match session 内完全重复治理。入口：[`Plan/v0.4/phases/phase-3.md`](Plan/v0.4/phases/phase-3.md) · [`QA/runs/2026-04-26-v04-release-gate/qa-summary.md`](../QA/runs/2026-04-26-v04-release-gate/qa-summary.md)
- **BL-018 · 预览原型一致性 QA 门禁**：已落地 QA 制度（2026-05-01），QA Leader canonical / 三端适配件已包含预览原型一致性门禁，本次补齐 `QA/templates/test-cases-professional-template.md` 的 `Prototype Parity Matrix` 与 `QA/capability-registry.md` 能力入口。入口：[`QA/qa-leader-canonical.md`](../QA/qa-leader-canonical.md) · [`QA/templates/test-cases-professional-template.md`](../QA/templates/test-cases-professional-template.md) · [`QA/capability-registry.md`](../QA/capability-registry.md)

## 已放弃归档

当前无。
