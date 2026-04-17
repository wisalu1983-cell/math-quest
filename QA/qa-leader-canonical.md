# QA Leader 编排器

本文件是 math-quest 项目 QA 体系的规范源（canonical source）。
Cursor 侧（`.cursor/rules/qa-leader.mdc`）和 Claude Code 侧（`.claude/skills/qa-leader/SKILL.md`）
各自加环境特定 frontmatter 后引用本文件内容。编辑请只改本文件。

## 触发条件

当用户要求以下操作时，启动本编排器：
- "跑一轮 QA" / "全量测试" / "QA 测试"
- "写测试用例" / "设计测试方案"
- "视觉 QA" / "体验测试" / "拟真 QA"
- 指定某个 phase 或 batch 的测试执行

---

## 步骤 0：测试用例设计规范

用例不是凭空写的，必须从设计文档出发。

### 输入要求

1. 先通读 `ProjectManager/Overview.md`（项目目标和当前状态）
2. 再通读相关 `ProjectManager/Specs/*.md`（各功能规格）
3. 对照 `src/` 实际实现理解当前能力边界
4. 查阅 `ProjectManager/ISSUE_LIST.md` 了解已知问题

### 用例表结构

每个模块以"设计意图"一句话开头（从 Spec 提取），然后是用例表：

| 列 | 必填 | 说明 |
|----|------|------|
| ID | 是 | 模块缩写-序号，如 `A-01`、`I-05` |
| 用例名称 | 是 | 简短描述测试什么 |
| 操作 | 是 | 具体操作步骤 |
| 预期结果 | 是 | 功能层面的正确结果 |
| **预期体验** | 是 | 用户视角的感受（如"流畅过渡"、"成就感"、"教学价值"） |
| 优先级 | 是 | P0(必须)/P1(重要)/P2(增强) |
| 验证方式 | 是 | `自动化` 或 `模拟人工` |

### 模块划分原则

按游戏生命周期映射，不按代码模块：

1. **A — 迭代验证**：版本间的回归和已修 ISSUE 确认
2. **B — 注册与首页**：新用户注册、主页信息展示
3. **C — 闯关地图**：关卡解锁、路线选择、进度展示
4. **D — 答题通用**：开始答题、提交、退出确认
5. **E — 结算与进度**：答题结果、历史记录、成就
6. **F — 题目生成**：各生成器的正确性、分布、边界
7. **G — 数字输入**：数字键盘交互
8. **H — 选择题**：选项展示、选择反馈
9. **I — 竖式填空**：竖式计算板交互
10. **J — 辅助页面**：设置、帮助、关于
11. **K — 全局边界**：网络异常、存储极限、多标签页

### 版本迭代规则

- 每轮修复/迭代后，在上一版基础上创建新版（v1 -> v2 -> v3...）
- 新版必须覆盖：新功能正向验证 + 旧缺陷回归检查 + 已修 ISSUE 的确认关闭
- 已知缺陷用 `[KNOWN-DEFECT]` 标记；修复后转为正向验证用例
- 文件命名：`test-results/{phase}/test-cases-v{N}.md`

### 覆盖度分类

每条用例必须标注验证方式，供后续分层执行：

- **自动化**：可通过代码审查、Vitest、Playwright DOM 检查验证
- **模拟人工**：需要体验判定、视觉校验、交互流畅度评估

---

## 第一层：Code Review

静态代码审查，在写测试之前先过一遍代码质量。

### 环境适配

| 环境 | 调用的 skill/plugin |
|------|-------------------|
| **Cursor** | `requesting-code-review`（obra/superpowers） |
| **Claude Code** | `code-review` plugin（官方，`~/.claude/plugins/.../code-review/`） |

### 关注重点

- 架构合规：组件是否按约定组织，store 是否正确分层
- 死代码：未使用的 import、函数、组件
- 类型安全：TypeScript 类型是否完整，是否有 `any` 逃逸
- 格式一致性：命名风格、文件组织

---

## 第二层：自动化测试

覆盖用例表中标记为"自动化"的部分。

### 环境适配

| 工具 | Cursor | Claude Code |
|------|--------|-------------|
| 单元测试 | Vitest | Vitest |
| 浏览器测试 | Playwright（引用 `webapp-testing` skill） | Playwright + 可选 gstack `qa-only` 做通用扫描 |
| 测试纪律 | `test-driven-development`（obra） | 同左（通过 superpowers plugin） |
| UI 回归 | `visual-screenshot-qa`（新建全局 skill） | 同左 |

### Vitest 覆盖范围

- 题目生成器：各 generator 的输出正确性、选项数量、难度分布
- 数据模型：normalize 函数、分数计算、进度状态机
- Campaign Map：解锁条件、路线筛选

### Playwright 覆盖范围

- 用户旅程：注册 → 选择主题 → 进入关卡 → 答题 → 查看结算
- 交互验证：输入框响应、按钮状态、导航跳转
- 数据持久化：localStorage 读写、页面刷新后状态恢复

### 视觉回归（调用 `visual-screenshot-qa`）

- UI 修复后确认 token 一致性
- 设计稿对照验证
- 多视口适配检查

---

## 第三层：拟真人工 QA

覆盖用例表中标记为"模拟人工"的部分。

### 调用 skill

| skill | 用途 |
|-------|------|
| `agent-as-user-qa`（新建全局 skill） | 方法论：四栏协议、PASS/FAIL/RISK 判定、执行纪律 |
| `visual-screenshot-qa`（新建全局 skill） | 涉及设计稿对照的视觉验证场景 |
| `verification-before-completion`（obra） | 证据纪律：每条判定必须附带证据 |

### 执行要求

1. 测试前确定目标用户画像（math-quest：6-12 岁小学生，数学能力中等）
2. 按批次执行，每批 10-20 条用例
3. 遵守 `agent-as-user-qa` 定义的四栏协议和执行纪律
4. 每条 FAIL 和 RISK 必须附带截图证据

---

## 缺陷流转规范

### 发现阶段

QA 发现问题后，写入 `ProjectManager/ISSUE_LIST.md`，每条包含：

| 字段 | 说明 |
|------|------|
| 编号 | `ISSUE-{NNN}`，递增 |
| 优先级 | P0(阻塞)/P1(重要)/P2(增强) |
| 来源 | 哪一层 QA 发现的（CR/Auto/Manual），具体用例 ID |
| 现象 | 客观描述看到了什么 |
| 用户感知 | 对用户体验的影响（不只是技术层面） |
| 建议方向 | 建议的修复方向（可选） |
| 状态 | `⬜ 待修复` / `⬜ 待评估` |

### 产品裁决阶段

产品负责人（用户）对每个 ISSUE 做三种裁决之一：

| 裁决 | 状态变更 | 后续动作 |
|------|---------|---------|
| **接受** | `✅ 按产品决策接受（不修复）` | 添加产品结论说明；下轮用例中移除该场景的 FAIL 预期 |
| **修复** | `⬜ 待修复` → 修复后改为 `✅ 已修复` | 进入修复排期；下轮用例中添加回归验证 |
| **降级/跟踪** | 调整优先级，保持 `⬜ 待评估` | 保留为体验增强项持续跟踪 |

### 回写要求

裁决后必须同步更新以下文档：
- `ProjectManager/Overview.md`：待解决问题列表
- `ProjectManager/ISSUE_LIST.md`：ISSUE 状态和产品结论
- 当轮 QA 计划文件：执行结果和结论
- 当轮 QA 结果报告：补记产品决策

---

## 产出物规范

### 目录结构

```
test-results/{phase}/
  test-cases-v{N}.md                    # 测试用例表（版本迭代）
  {batch-name}.md                       # 批次执行纲要
  {batch-name}-result.md                # 批次执行报告
  {batch-name}-artifacts/               # 截图证据目录
    {case-id}-before.png
    {case-id}-after.png
    {case-id}-evidence.png
  {script-name}.test.ts                 # Vitest 自动化脚本
  {script-name}.ts                      # Playwright 自动化脚本
```

### 命名约定

- phase：`phase1-full-retest`、`phase2-gamification` 等
- batch：`manual-qa-deep-experience-batch1`、`auto-qa-generators` 等
- script：`qa-v3.test.ts`（Vitest）、`playwright-qa-v3.ts`（Playwright）

---

## 执行编排

QA Leader 按以下顺序编排执行：

```
步骤 0: 设计/更新测试用例
    ↓
第一层: Code Review（可选，仅在有新代码变更时）
    ↓
第二层: 自动化测试（Vitest + Playwright + 视觉回归）
    ↓
第三层: 拟真人工 QA（体验测试 + 视觉对照）
    ↓
汇总: 缺陷分流 → 写入 ISSUE_LIST → 等待产品裁决 → 回写文档
```

每一层可以独立执行，也可以按需跳过。用户可以指定：
- "只跑自动化"→ 跳过第一层和第三层
- "只做体验测试"→ 跳过第一层和第二层
- "全量 QA"→ 按顺序执行全部
- "视觉回归"→ 只执行第二层的视觉回归部分
