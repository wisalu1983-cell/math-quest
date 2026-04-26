# MathQuest QA 体系方法论

> 创建：2026-04-26
> 用途：说明 math-quest 的 QA 制度为什么这样设计，供后续项目和 QA 专家审阅。

## 目标

MathQuest 的 QA 体系服务两类项目：

1. 本项目：儿童数学教育游戏，风险集中在题目质量、教学梯度、游戏循环、存档/同步、移动端体验。
2. 同规模小型软件 / 游戏项目：团队小、迭代快、没有专职大型测试平台，但仍需要可审计的质量门禁。

因此本体系选择“轻量专业化”：

- 保留风险驱动、规格追踪、测试设计技术和可审计报告。
- 不引入重型测试管理系统。
- 用 Markdown、Vitest、Playwright、专项脚本和拟真人工 QA 组成闭环。

## 外部依据

| 来源 | 可复用原则 | 本项目落地 |
|---|---|---|
| ISTQB CTFL v4.0.1 | 测试过程应保持 test basis、testware、风险、用例、结果、缺陷之间的 traceability | `test-cases-vN.md` 必须包含 Test Basis / Risk / Oracle；L2+ 必须有 Coverage Matrix |
| ISO/IEC/IEEE 29119 | 软件测试标准覆盖组织级、管理级、动态测试级流程，以及测试文档模板 | QA 产物分为用例、执行报告、总结、证据和缺陷流转 |
| NISTIR 8397 | 最小开发者验证应包含 threat modeling、自动化、静态扫描、secret、黑盒、结构、历史用例、fuzzing、依赖等 | 账号/同步/上线类 QA 加入安全最小门禁 |
| OWASP ASVS / WSTG | 安全验证需要可引用的技术控制和测试场景 ID | 对 Web/账号/同步功能采用清单式安全检查，不做重型认证 |
| Martin Fowler / Google Test Sizes | 自动化测试要分层；小测试快且稳定，大测试少而关键；测试隔离降低 flaky | Vitest 为基础，Playwright 只保留关键用户路径；随机测试固定 seed / 样本量 |
| Session-Based Test Management | 探索式测试可用 charter、session sheet、debrief 变得可审计 | 拟真人工 QA 使用用户预期 / 操作路径 / 实际观察 / 判定证据 |
| IGDA QA Best Practices | 游戏 QA 需要自动化与 human factor 混合，覆盖 playability、compatibility、first playable 和 milestone | 对题感、反馈、移动端、游戏循环保留人工体验 QA |
| WCAG 2.2 / Xbox Accessibility Guidelines | 无障碍不仅是技术检查，也包含移动端、认知、焦点、时间压力和闪烁 | 儿童教育产品把可读性、焦点、触摸、认知负担纳入 QA |

参考链接：

- ISTQB CTFL v4.0.1: https://www.istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
- ISO/IEC/IEEE 29119 overview: https://standards.ieee.org/wp-content/uploads/import/documents/tocs/ISO_IEC_IEEE_29119.pdf
- NISTIR 8397: https://www.nist.gov/publications/guidelines-minimum-standards-developer-verification-software
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP WSTG: https://owasp.org/www-project-web-security-testing-guide/
- Practical Test Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
- Google Test Sizes: https://testing.googleblog.com/2010/12/test-sizes.html
- Session-Based Test Management: https://www.satisfice.us/articles/sbtm.pdf
- IGDA QA Best Practices: https://igda-website.s3.us-east-2.amazonaws.com/wp-content/uploads/2019/10/15004958/IGDA_Best_Practices_QA_0.pdf
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Xbox Accessibility Guidelines: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines

## 本项目适配原则

### 1. 风险决定深度

普通文案和低风险 UI 不需要 L2/L3 文档负担；题目生成、存档迁移、账号同步、版本收口必须走专业结构。

### 2. 用例设计先于执行

测试用例不是“跑了哪些命令”。正式 QA 必须先说明：

- 基于哪些 Plan / Spec / Issue
- 要覆盖哪些风险
- 使用哪些测试技术
- 什么 oracle 判定通过
- 哪些残余风险可接受

### 3. 自动化先下沉

能用 Vitest 验证的生成器、策略、数据迁移、状态机，不上 Playwright。Playwright 只覆盖用户可见旅程、焦点、视口、持久化和跨层交互。

### 4. 游戏体验不能只靠自动化

教育游戏的题感、挫败感、教学解释和反馈节奏需要拟真人工 QA。人工 QA 必须可审计，不能只写“体验良好”。

### 5. 正式结论入库，过程证据按需保留

Git 同步测试体系、工具、正式测试工作生产资料和正式测试结论。截图、raw logs、trace、视频、大批量 artifacts 默认忽略。关键 FAIL / RISK 证据可在报告中引用，需要长期保存时单独标记。

## 对 MathQuest 已发现短板的修复

| 短板 | 制度修复 |
|---|---|
| 测试用例过于简单 | L2/L3 强制 Test Basis / Risk / Technique / Oracle / Coverage Matrix |
| Codex qa-leader 适配件旧口径 | `.agents/skills/qa-leader/SKILL.md` 同步 canonical |
| `QA/runs` 入库规则冲突 | `.gitignore` 改为允许正式 Markdown / 脚本，继续忽略 artifacts |
| 缺少阶段情境差异 | 新增 L0-L3 深度分级和情境矩阵 |
| 安全/无障碍未入 QA gate | capability registry 和 canonical 增加最小门禁 |
| 拟真人工 QA 不够可审计 | 引入 charter + 四栏协议 + evidence 要求 |

## QA 专家评审建议

评审时建议按以下顺序检查：

1. `QA/qa-leader-canonical.md` 是否覆盖小型游戏 / 软件项目的必要 QA 场景。
2. `QA/templates/test-cases-professional-template.md` 是否足够指导后续写出专业测试用例。
3. `QA/capability-registry.md` 中的工具入口是否与仓库实际能力一致。
4. `.agents` / `.claude` / `.cursor` 三个适配件是否与 canonical 同步。
5. `.gitignore` 是否符合“正式结论入库，过程大产物忽略”的口径。
