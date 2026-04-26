# QA 体系制度升级测试用例 v1

**执行日期**：2026-04-26
**范围**：QA canonical、能力台账、模板、适配件同步、Git 归档规则
**QA 深度**：L2 Professional
**设计方法**：风险驱动 + 规格追踪 + 工具自检 + Git ignore 验证

## Traceability Summary

| Task / Spec / Issue | Test Basis | 用例族 | 覆盖目标 |
|---|---|---|---|
| QA 制度升级 | `QA/qa-leader-canonical.md` | Q-CAN | 专业测试用例制度、情境矩阵、L0-L3 深度 |
| QA 工具台账 | `QA/capability-registry.md` | Q-REG | 工具入口、模板、同步脚本、安全/无障碍能力 |
| 适配件同步 | `.agents` / `.claude` / `.cursor` | Q-ADP | 三环境 qa-leader 内容一致 |
| Git 归档规则 | `.gitignore` | Q-GIT | 正式 QA 资料可入库，过程大产物忽略 |

## Risk Model

| Risk ID | 风险 | 影响 | 可能性 | 优先级 | 对应用例族 |
|---|---|---|---|---|---|
| R1 | 测试用例再次退化为功能清单 | QA 不能证明高风险质量 | 高 | P0 | Q-CAN |
| R2 | 三个 agent 环境读取到不同 QA 规则 | 执行口径漂移 | 中 | P0 | Q-ADP |
| R3 | Git 继续忽略正式 QA 结论或误收大产物 | 证据不可审计或仓库膨胀 | 高 | P0 | Q-GIT |
| R4 | 新增工具未登记入口 | 后续 agent 重复造工具 | 中 | P1 | Q-REG |

## Q-CAN：Canonical 制度

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| Q-CAN-01 | canonical 定义 L0-L3 深度 | `QA/qa-leader-canonical.md` | R1 | Checklist | P0 | canonical 已修改 | 搜索 `L0 Smoke`、`L2 Professional`、`L3 Release Gate` | 能按风险选择测试深度 | 后续不会小改过测或大改欠测 | 自动化 |
| Q-CAN-02 | canonical 强制专业用例字段 | 同上 | R1 | Checklist | P0 | canonical 已修改 | 搜索 `Test Basis`、`Risk`、`Technique`、`Oracle`、`Coverage Matrix` | L2/L3 字段明确 | 测试用例能被审计 | 自动化 |
| Q-CAN-03 | canonical 纳入安全和无障碍门禁 | 同上 | R1 | Checklist | P1 | canonical 已修改 | 搜索 `安全`、`无障碍`、`WCAG`、`OWASP`、`NIST` | 安全/无障碍有最小检查项 | 儿童教育产品风险被显式纳入 | 自动化 |

## Q-REG：能力台账与模板

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| Q-REG-01 | capability registry 登记模板与同步脚本 | `QA/capability-registry.md` | R4 | Checklist | P0 | registry 已修改 | 搜索 `test-cases-professional-template` 和 `sync-qa-leader-adapters` | 两个入口均可见 | 后续 agent 知道从哪里开始 | 自动化 |
| Q-REG-02 | 专业模板包含风险追踪结构 | `QA/templates/test-cases-professional-template.md` | R1 | Checklist | P0 | 模板已创建 | 搜索 `Risk Model`、`Coverage Matrix`、`Exit Criteria` | 模板可直接指导 L2/L3 QA | 后续用例不再从空白页开始 | 自动化 |

## Q-ADP：适配件同步

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| Q-ADP-01 | 同步脚本 DryRun 无变更 | `QA/scripts/sync-qa-leader-adapters.ps1` | R2 | Tool check | P0 | 已执行同步 | 运行 `powershell -ExecutionPolicy Bypass -File QA/scripts/sync-qa-leader-adapters.ps1 -DryRun` | changed=0，unchanged=3 | 三环境规则一致 | 自动化 |
| Q-ADP-02 | Codex 适配件不再使用旧 `test-results` 路径 | `.agents/skills/qa-leader/SKILL.md` | R2 | Regression | P0 | 适配件已同步 | 搜索 `test-results/{phase}` | 不存在旧路径 | Codex 不会把 QA 产物写回旧目录 | 自动化 |

## Q-GIT：Git 归档规则

| ID | Test Condition | Test Basis | Risk | Technique | Priority | Preconditions | Procedure | Oracle / Expected Result | Expected UX | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| Q-GIT-01 | Markdown QA run 可入库 | `.gitignore` | R3 | Negative ignore check | P0 | `.gitignore` 已修改 | `git check-ignore -q QA/runs/sample/test-cases-v1.md` | exit code 1 | 正式测试用例可同步 | 自动化 |
| Q-GIT-02 | 正式脚本可入库 | `.gitignore` | R3 | Negative ignore check | P1 | `.gitignore` 已修改 | `git check-ignore -q QA/runs/sample/full-regression.mjs` | exit code 1 | 可复用 QA 工具可同步 | 自动化 |
| Q-GIT-03 | 截图 artifacts 被忽略 | `.gitignore` | R3 | Positive ignore check | P0 | `.gitignore` 已修改 | `git check-ignore -q QA/runs/sample/artifacts/evidence.png` | exit code 0 | 大图不会污染仓库 | 自动化 |
| Q-GIT-04 | raw JSON 被忽略 | `.gitignore` | R3 | Positive ignore check | P0 | `.gitignore` 已修改 | `git check-ignore -q QA/runs/sample/artifacts/raw-results.json` | exit code 0 | 过程输出不会误入库 | 自动化 |

## Coverage Matrix

| Risk | Covered By | Residual Risk |
|---|---|---|
| R1 | Q-CAN-01, Q-CAN-02, Q-CAN-03, Q-REG-02 | 需后续真实 QA run 持续执行 |
| R2 | Q-ADP-01, Q-ADP-02 | 无 |
| R3 | Q-GIT-01 to Q-GIT-04 | 历史 ignored run 是否补入库需另行裁决 |
| R4 | Q-REG-01 | 无 |

## Exit Criteria

- Q-CAN / Q-ADP / Q-GIT P0 全部 PASS。
- 同步脚本 DryRun 显示 3 个适配件 unchanged。
- `git diff --check` 无 whitespace error。
- 基线 `npm test -- --run` 仍通过。
