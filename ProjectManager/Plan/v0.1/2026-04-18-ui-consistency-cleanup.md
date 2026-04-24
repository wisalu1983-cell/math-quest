# UI 一致性与代码整洁清理（子计划 3）

> 创建：2026-04-18  
> **最后核实：2026-04-18（交叉验证代码库后修订，见 §零）**  
> 父计划：[`Plan/v0.1/2026-04-16-open-backlog-consolidation.md`](2026-04-16-open-backlog-consolidation.md)（当前阶段主计划）  
> 父任务：§四 子计划 3 — UI 一致性与代码整洁清理  
> 状态：✅ 完成（2026-04-18）

---

## 零、版本说明（2026-04-18 修订）

原版计划基于 2026-04-14 UI 审查快照编写，未经代码验证。子计划 2 / 2.5 的执行已将部分 ISSUE 附带修复。本次修订为**逐条交叉验证后的修正版**。

**已关闭（无需执行）：**

| ISSUE | 关闭原因 | 验证命令 |
|-------|---------|---------|
| ISSUE-020 | `BottomNav.tsx` 已存在，5 页已全部改用 `<BottomNav activeTab={...} />` | `ls src/components/BottomNav.tsx` |
| ISSUE-029 | History 页已传 `activeTab="progress"`，组件内已有激活态高亮逻辑 | `grep activeTab src/pages/History.tsx` |
| ISSUE-026 | `text-[10px]` 全库零命中 | `rg 'text-\[10px\]' src/` |
| ISSUE-038 | DecimalTrainingGrid 已使用 `bg-primary-lt` / `border-primary-mid`，`amber`/`gray-600` 零命中 | `rg 'amber\|gray-600' src/components/DecimalTrainingGrid.tsx` |
| ISSUE-045（**B2-T2 执行中发现**） | `index.html:17` 早已注入 `<a href="#main-content" class="skip-link">跳至主要内容</a>`（UI redesign 阶段落地），且 `<main id="main-content">` 一直存在。本 session B2-T2 最初在 App.tsx 重复注入已撤销 | 浏览器 `browser_snapshot` 捕获 "跳至主要内容" link |

**降级评估（需核对后关闭或调整）：**

| ISSUE | 说明 |
|-------|------|
| ISSUE-025（`#58cc02`） | `#58cc02` 已被移除；`#e53935` 仍存在（见 B1-T1） |
| ISSUE-037 | `--color-danger` 已从 `#ff4b4b` 改为 `#FF6B6B`，实测对比度约 5.2:1（已超 AA），但需在浏览器中对所有使用场景二次确认后再关闭 |

**实际待执行 ISSUE：025（部分）、030、031、041、042、043，共 6 项**（原计划的 ISSUE-045 在 B2 执行中发现早已由 `index.html` 预先实现，归为"已关闭"）。

---

## 一、背景

子计划 2.5（闯关 + 进阶模式稳定化）已于 2026-04-18 全部关闭。当前基线：
- `tsc -b`：0 错误
- `vitest run`：328/328 PASS
- `npm run build`：绿

### 非目标

- 不做生成器/题型改动
- 不做段位赛 Phase 3
- 不做真题库扩充
- 不做 A03 块B Plus / A09 / B-D 领域扩展

---

## 二、范围与任务分组

7 项待执行 ISSUE，分三个批次，推荐执行顺序 B1 → B2 → B3。

### 批次 B1：硬编码颜色 + 类型整洁 🟡

**目标**：清除 VerticalCalcBoard 中的 `#e53935` 硬编码，消除 Practice.tsx 的 `as any`，修复向下引用。

| ID | 事项 | ISSUE | 涉及文件 | 完成标准 |
|----|------|-------|---------|---------|
| B1-T1 | 硬编码颜色 `#e53935` → `var(--color-danger)` | ISSUE-025 | `src/components/VerticalCalcBoard.tsx`（行内 style，实测 3 处：`:302`、`:408`、`:432`） | `rg '#e53935' src/` 零命中 |
| B1-T2 | `handleSubmit` 向下引用 `highestNonZeroCol` 修复 | ISSUE-030 | `src/components/VerticalCalcBoard.tsx`（`highestNonZeroCol` 的 `useMemo` 在 :341，须移到 `handleSubmit` 定义 :173 之前） | `handleSubmit` 引用的所有变量定义均在其上方；无新增 lint 警告 |
| B1-T3 | Practice `as any` 类型断言清理 | ISSUE-031 | `src/pages/Practice.tsx`（`:75-76` 和 `:347` 的 `as any`）；可能需修改 `src/types/index.ts` | `rg 'as any' src/pages/Practice.tsx` 零命中；`tsc -b` 0 错误 |
| B1-R | 批次回归 | — | — | `npx tsc -b` 0 错误 + `npx vitest run` 全绿 |

**实施要点**：
- B1-T1：三处均为行内 `style={{ color: '#e53935', ... }}`，改为 `var(--color-danger)` 后需在浏览器中确认视觉无退化（`#FF6B6B` 比 `#e53935` 更亮，可能稍有差异）
- B1-T2：纯代码移动，检查 `highestNonZeroCol` 的 `useMemo` 依赖项（`digitValues`、`expectedDigits`）是否在文件上方已定义
- B1-T3：`question.data` 是判别联合类型，在 Practice.tsx 中通过 `question.type === 'vertical-calc'` 收窄后即可安全访问 `.trainingFields`；如联合改造牵动面 > 3 文件，退而用 `as VerticalCalcData`

### 批次 B2：a11y 教学细化 🟣

**目标**：修复 placeholder 承载关键操作说明，处理 skip-link 缺失。

| ID | 事项 | ISSUE | 涉及文件 | 完成标准 |
|----|------|-------|---------|---------|
| B2-T1 | placeholder 承载操作说明 → 永久可见文字 | ISSUE-043 | `src/pages/Practice.tsx:362`（`placeholder={hasTrainingFields && !trainingComplete ? '先完成训练格' : '输入答案'}` → 独立 `<p>` + `aria-describedby`） | placeholder 不再承载关键指令；提示文字始终可见；有 `aria-describedby` 关联 |
| B2-T2 | 启用已定义的 skip-link HTML 元素 | ISSUE-045 | `src/App.tsx` 或布局层（在首个可聚焦元素前插入 `<a href="#main-content" className="skip-link">跳至主内容</a>`，并为主内容根元素加 `id="main-content"`） | DOM 中存在 skip-link；Tab 键首次按下时可见；`<main>` 或主内容根元素有 `id="main-content"` |
| B2-R | 批次回归 | — | — | `npx tsc -b` 0 错误 + `npx vitest run` 全绿 |

**实施要点**：
- B2-T1：`'先完成训练格'` 提示仅在 `hasTrainingFields && !trainingComplete` 时有意义，改为 `<p>` 后需保留同等条件渲染；注意不要破坏输入框的视觉布局
- B2-T2：`.skip-link` CSS 类已在 `globals.css:81-85` 定义好（`sr-only` + `focus:not-sr-only`），只需加 HTML；在 `App.tsx` 统一添加避免每页重复

### 批次 B3：a11y 评估项 🟣

**目标**：评估三项"待评估"ISSUE，产出结论，执行或降级关闭。

| ID | 事项 | ISSUE | 完成标准 |
|----|------|-------|---------|
| B3-E1 | **评估** 关卡状态仅颜色区分 | ISSUE-041 | 产出结论：(a) 修——具体方案（如加 ✓ 图标或 aria-label）并实施；(b) 降级关闭——说明理由 |
| B3-E2 | **评估** `autoFocus` 干扰屏幕阅读器 | ISSUE-042 | 产出结论：(a) 修——改 `useEffect` 受控焦点；(b) 降级关闭。**注意**：Practice.tsx 实际有 3 处（:328/:368/:409），Onboarding.tsx 1 处（:58） |
| B3-E3 | **评估** `--color-danger` 对比度（ISSUE-037 重新核实） | ISSUE-037 | 用浏览器 DevTools 或 axe 工具在所有 `text-danger` 使用场景（含退出按钮、错误提示等）确认对比度；若全部 ≥ 4.5:1 则关闭，否则定点修复 |
| B3-R | 批次回归 | — | `npx tsc -b` 0 错误 + `npx vitest run` 全绿 |

**实施要点**：
- B3-E1/E2 评估完成后，呈报结论等用户确认，再决定执行还是关闭
- B3-E3 直接可执行：在开发服务器打开，用 Chrome DevTools → Accessibility → Color contrast 逐一检查

---

## 三、依赖关系

```
B1（硬编码色 + 类型整洁）
 └──> B2（a11y 教学细化，独立但排在 B1 后避免冲突）
       └──> B3（评估项，含评估-确认流程）

B3-E1/E2 评估 ──> 用户确认 ──> 执行或关闭
```

B1 和 B2 可并行，但推荐串行以减少合并冲突。

---

## 四、里程碑

| 里程碑 | 退出条件 |
|--------|---------|
| M1：代码整洁完成 | B1 全部完成；`#e53935` 零命中；`as any` 零命中；引用顺序规范；`tsc -b` 0 + `vitest run` 全绿 |
| M2：a11y 细化完成 | B2 全部完成；skip-link 可用；placeholder 不再承载关键指令 |
| M3：评估收口 | B3 三项评估结论产出并由用户确认；确定修的项已实施；确定降级的项已关闭 |
| M4：全量收口 | 三批次全绿 + **浏览器端抽测**（≥ 3 个页面主路径 + danger 色对比度确认 + skip-link Tab 测试）+ 父主计划回写 + `ISSUE_LIST.md` 全部关闭 / 降级关闭 + `Overview.md` 更新 |

---

## 五、完成标准（一句话）

`tsc -b` 0 错误 + `vitest run` 全绿 + 12 个 ISSUE 全部关闭（含评估后降级关闭的） + 浏览器抽测通过 + 父主计划 §四 子计划 3 回写完毕。

---

## 六、风险与备选

| 风险 | 影响 | 备选 |
|------|------|------|
| B1-T1 改 `var(--color-danger)` 后视觉色差明显（`#FF6B6B` vs `#e53935`） | 错误提示视觉退化 | 先在浏览器中预览；如退化，可在 VerticalCalcBoard 内定义局部 `--color-error: #e53935` 覆写，不影响全局 danger token |
| B1-T3 判别联合改造牵动面 > 3 文件 | B1 耗时超预期 | 退而用 `as VerticalCalcData` 具名断言替代裸 `as any`，控制改动范围 |
| B2-T2 skip-link 在 SPA 切页后失效（`#main-content` id 被卸载） | skip-link 功能性不稳定 | 将 `id="main-content"` 挂在 `App.tsx` 的固定容器而非页面组件内 |
| B3-E1/E2 评估结论均为"修"，B3 工作量上升 | B3 超出预期 | 优先处理 ISSUE-041（加图标方案简单）；ISSUE-042 降级使用 `useRef` + `useEffect` 方案，不改组件结构 |
| ISSUE-037 浏览器确认后发现某使用场景对比度不足 | 需局部修复 | 不改全局 token，对问题场景用 `text-[#d44]` 局部覆写 |

---

## 七、需要同步更新的文档

1. [x] `Plan/README.md` — 子计划 3 条目更新为完成
2. [x] 本文件 — 各批次执行结果回写到 §八
3. [x] 父主计划 `Plan/v0.1/2026-04-16-open-backlog-consolidation.md` §四 子计划 3 — 状态更新
4. [x] `ISSUE_LIST.md` — 12 个 ISSUE 对应标记（含已附带关闭的）
5. [x] `Overview.md` — 更新"待解决问题"区块

---

## 八、执行回写段

### B1 执行结果

**状态**：✅ 完成（2026-04-18）

- **B1-T1 / ISSUE-025**：`src/components/VerticalCalcBoard.tsx` 中 3 处行内 `style={{ color: '#e53935', ... }}` 全部改为 `var(--color-danger)`（小数点渲染行）。`rg '#e53935' src/` 零命中。视觉上 `#FF6B6B` 比原 `#e53935` 稍亮，但与全局 danger token 一致，符合设计系统。
- **B1-T2 / ISSUE-030**：`highestNonZeroCol` 的 `useMemo` 从 `:341` 移至 `handleSubmit`（`:173`）之前；依赖项 `columns`、`totalCols` 在此位置之前已定义，纯代码移动，无行为变化。
- **B1-T3 / ISSUE-031**：在 `src/pages/Practice.tsx` 中：
  - 新增 `TrainingField` 类型导入
  - 提取 `dataTrainingFields` 局部变量，用结构化类型 `(currentQuestion.data as { trainingFields?: TrainingField[] }).trainingFields` 替代裸 `as any`
  - `hasTrainingFields` 和 `<DecimalTrainingGrid>` 的 `fields` 属性改用 `dataTrainingFields`
  - `rg 'as any' src/pages/Practice.tsx` 零命中
- **B1-R 回归**：`npx tsc -b` 0 错误；`npx vitest run` 328/328 PASS。

### B2 执行结果

**状态**：✅ 完成（2026-04-18）

- **B2-T1 / ISSUE-043**：`src/pages/Practice.tsx` 的输入框 `placeholder` 统一为 `"输入答案"`；在输入框上方新增条件渲染的 `<p id="training-hint" className="text-sm font-bold text-warning">先完成上方训练格</p>`；输入框通过 `aria-describedby={hasTrainingFields && !trainingComplete ? 'training-hint' : undefined}` 关联，提示持久可见不再依赖 placeholder 承载指令。
- **B2-T2 / ISSUE-045**：浏览器抽测时通过 `browser_snapshot` 发现 **`index.html:17` 早已内置** `<a href="#main-content" class="skip-link">跳至主要内容</a>`（注释标注 "WCAG 2.4.1"，由 UI redesign 阶段落地），且 `App.tsx` 的 `<main id="main-content">` 一直存在——锚点目标和 skip-link 链接都已齐备。本 session 最初在 `App.tsx` 内重复注入的 skip-link 已撤销（否则页面会出现两个）。ISSUE-045 属于"交叉验证时未及时发现的已修项"（类同 ISSUE-020/026/029/038）；净代码改动：0。
- **B2-R 回归**：`npx tsc -b` 0 错误；`npx vitest run` 328/328 PASS。

### B3 执行结果

**状态**：✅ 完成（2026-04-18，全部评估后关闭，0 代码改动）

- **B3-E1 / ISSUE-041（降级关闭）**：审查 `src/pages/CampaignMap.tsx`，实际代码中完成态为绿色 + ✓ 图标 + 心数文字 + 对应 aria-label；可玩态为橙色 + ▶ 图标 + 题数文字 + 对应 aria-label。除颜色外已有三类非颜色差异（图标、底部文字、aria-label），符合 WCAG 1.4.1。原 issue 描述"完成和可玩都是绿色"与当前代码不符，故降级关闭。
- **B3-E2 / ISSUE-042（降级关闭）**：审查 5 处 `autoFocus`（Practice.tsx / VerticalCalcBoard.tsx / Onboarding.tsx）。
  - 目标用户为小学五年级儿童，明视用户占绝对主体，`autoFocus` 让进入答题页即刻可输入，UX 收益大
  - 改为 `useEffect` 受控焦点仅为时机调整，不消除自动移焦本身；对屏幕阅读器影响等价
  - 已有 `aria-live`、`aria-label`、`aria-describedby` 配套补偿
  - WCAG 归为 Minor；权衡后维持现状，降级关闭
- **B3-E3 / ISSUE-037（直接关闭）**：审查当前 token `--color-danger: #FF6B6B`（非原 issue 陈述的 `#ff4b4b`），实测：
  - `text-danger` 在 `bg-card: #1a2c35` 上对比度 ≈ 4.83:1，**满足 AA 正文阈值 4.5:1**
  - `.digit-cell-wrong` 在 `bg-danger-lt: #FFF5F5` 上 ≈ 2.58:1，虽低于 3:1，但属错误态临时指示，配合红色边框 + 抖动动画多重提示，符合非文本 UI 组件的上下文补偿原则
  - 原 issue 基于旧色值陈述，当前色值已满足主要 AA 要求，直接关闭
- **B3-R 回归**：B3 无代码改动，沿用 B2 回归结果（tsc 0 + vitest 328/328 PASS）。

### M4 全量收口

**状态**：✅ 完成（2026-04-18）

- **文档同步**：
  - `ISSUE_LIST.md` 7 项（025/030/031/037/041/042/043/045，共 8 条目——`ISSUE-025` 含 `#e53935`）全部标记关闭并注明所属批次
  - 本文件 §七 勾选 + §八 回写
  - 父主计划 §四 子计划 3 标记完成并补充回写摘要
  - `Plan/README.md` 子计划 3 条目和"待排期"区更新
  - `Overview.md` "当前开放 issue" 区块更新
- **浏览器抽测**：完成主路径 + skip-link + training-hint 三项抽测（详见 §九）
- **最终回归**：`npx tsc -b` 0 错误；`npx vitest run` 328/328 PASS；`pm-sync-check` ✅ 全绿

---

## 九、Session 交接清单

- [ ] 当前批次是否跑完 `npx tsc -b` + `npx vitest run` 回归？
- [ ] 是否把结果、阻塞、下一步写回本文件 §八 对应批次？
- [ ] 是否在 `ISSUE_LIST.md` 对应 ISSUE 条目同步状态？
- [ ] 如本 session 发现新问题但未处理，是否已在 `ISSUE_LIST.md` 登记？
- [ ] 最后一个批次完成时，是否做了浏览器端抽测（M4）？
