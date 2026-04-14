# Accessibility Audit Report — math-quest 全产品

**Audit ID:** mathquest_a11y_20260414_AA  
**日期:** 2026-04-14  
**目标:** `src/` + `index.html`（全产品，18个文件）  
**WCAG 标准:** WCAG 2.1 Level AA  
**方法:** 静态代码分析 + 颜色对比度计算

---

## 执行摘要

**合规状态:** ❌ Failing

| 严重等级 | 数量 | 占比 |
|---------|------|------|
| Critical | 2 | 13% |
| Serious  | 4 | 27% |
| Moderate | 5 | 33% |
| Minor    | 4 | 27% |

**已审查准则:** 22 项  
**通过:** 14 项（64%）  
**审查文件:** 18 个

---

## 颜色对比度计算说明

基于设计 token（`globals.css`）使用 WCAG 相对亮度公式计算：

| 颜色组合 | 前景 | 背景 | 对比度 | AA 正文（≥4.5） | AA 大字（≥3） |
|---------|------|------|--------|----------------|--------------|
| 主按钮文字 | #ffffff | #58cc02 (primary) | **2.09:1** | ❌ FAIL | ❌ FAIL |
| text-danger on bg-card | #ff4b4b | #1a2c35 | **4.37:1** | ❌ FAIL | ✅ PASS |
| text-secondary on bg | #94a3b8 | #131f24 | 7.01:1 | ✅ | ✅ |
| text-secondary on bg-card | #94a3b8 | #1a2c35 | 6.02:1 | ✅ | ✅ |
| text-secondary on bg-elevated | #94a3b8 | #233a44 | 4.97:1 | ✅ | ✅ |
| text-danger on bg | #ff4b4b | #131f24 | 5.09:1 | ✅ | ✅ |
| text-success on bg-card | #58cc02 | #1a2c35 | 6.90:1 | ✅ | ✅ |
| primary green on bg | #58cc02 | #131f24 | 8.05:1 | ✅ | ✅ |
| white on bg-elevated | #ffffff | #233a44 | 11.91:1 | ✅ | ✅ |
| secondary blue on bg | #1cb0f6 | #131f24 | 6.87:1 | ✅ | ✅ |

---

## 严重问题（Critical — 必须修复）

### A-C01：主按钮白色文字对比度严重不足

**WCAG 准则:** 1.4.3 对比度（最低）— Level AA  
**严重等级:** Critical  
**位置:** [src/styles/globals.css:67-72](src/styles/globals.css#L67) (`.btn-primary`)，以及 SessionSummary.tsx:61、CampaignMap.tsx:124  
**影响范围:** 全产品所有主操作按钮

**问题:**  
`btn-primary` 使用 `bg-primary text-white`，即白色文字（#ffffff）在绿色背景（#58cc02）上。  
计算得对比度 **2.09:1**，远低于 AA 标准：
- 正文字符（< 18pt / 非加粗 < 14pt）：需 4.5:1 → **失败**
- 大字符（≥ 18pt 或加粗 ≥ 14pt）：需 3:1 → **失败**

这是整个产品**曝光最多的可访问性问题**，所有"确认""继续闯关""开始冒险"等核心操作按钮均受影响。

**受影响用户:** 视力弱、低对比度敏感（含弱视用户、强光环境使用者、儿童视力发育期用户）

**修复方案（任选其一）:**

```css
/* 方案 A（推荐）：换深色文字 */
.btn-primary {
  @apply bg-primary text-[#1a3a00] font-bold ...;  /* 深绿色文字，对比度约 6.5:1 */
}

/* 方案 B：加深绿色背景 */
/* 将 --color-primary 改为 #3d9800，白字对比度可达 4.68:1 */
--color-primary: #3d9800;
--color-primary-dark: #2d7200;

/* 方案 C：暗色覆盖层 */
.btn-primary {
  @apply bg-primary text-white ...;
  background-color: color-mix(in srgb, #58cc02 100%, black 15%);
  /* 结果约 #4db002，白字对比度 ≈ 3.8:1，仍不足 — 不推荐 */
}
```

**推荐方案A**：使用深绿色（#1a3a00 或 #0e2800）作为按钮文字，与 Duolingo 自身实践一致（Duolingo 按钮文字也是深色）。

---

### A-C02：viewport 禁止缩放，阻止用户调整文字大小

**WCAG 准则:** 1.4.4 调整文本大小 — Level AA  
**严重等级:** Critical  
**位置:** [index.html:5](index.html#L5)

**问题:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```
`user-scalable=no` 和 `maximum-scale=1.0` 阻止了用户在浏览器/系统层面放大文字。  
WCAG 1.4.4 要求文本可缩放至 200% 而不丢失内容或功能。  
对于儿童应用，部分用户（视力较弱的孩子或家长）可能依赖此功能。

**影响:** 有视力需求的用户无法通过系统辅助功能放大文字。

**修复方案:**
```html
<!-- Before -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

<!-- After -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**注意:** 移除 `user-scalable=no` 后，测试布局在 200% 缩放下是否仍可用。  
`overscroll-behavior: none` 在 globals.css 中已处理弹性滚动，可安全移除 user-scalable 限制。

---

## 严重问题（Serious）

### A-S01：所有图标按钮缺少可访问名称

**WCAG 准则:** 4.1.2 名称、角色、值 — Level A（AA 必须包含）  
**严重等级:** Serious  
**位置:** 多处（见下表）

| 文件 | 行号 | 按钮内容 | 问题 |
|------|------|---------|------|
| WrongBook.tsx | 25 | `←` | 无 aria-label |
| Profile.tsx | 29 | `←` | 无 aria-label |
| CampaignMap.tsx | 72-77 | `←` | 无 aria-label |
| Practice.tsx | 111-114 | `✕` | 无 aria-label |
| CampaignMap.tsx | 114-134 | `▶`/`🔒`/`✓` + "X题" | 无关卡标识 |
| Home.tsx / all | 96-113 | `🏠`/`📊` 等 | 有 label 文字，但 emoji 未隐藏 |

**问题:**  
纯图标/符号按钮对屏幕阅读器不可见。"←"会被读作"向左箭头"，用户无法知道这是"返回"。  
CampaignMap 中各关卡按钮用 `▶` + 题数区分，屏幕阅读器用户无法区分不同关卡。

**修复方案:**
```tsx
// Before
<button onClick={() => setPage('home')} className="text-2xl">←</button>

// After
<button onClick={() => setPage('home')} aria-label="返回首页" className="text-2xl">
  <span aria-hidden="true">←</span>
</button>

// CampaignMap 关卡按钮
<button
  aria-label={`${level.levelId} · ${level.questionCount}题${completed ? ' · 已完成' : playable ? '' : ' · 未解锁'}`}
  aria-disabled={!playable}
  ...
>
```

---

### A-S02：退出确认弹窗缺少对话框语义和焦点陷阱

**WCAG 准则:** 2.1.2 无键盘陷阱、4.1.2 名称/角色/值 — Level A  
**严重等级:** Serious  
**位置:** [src/pages/Practice.tsx:285-308](src/pages/Practice.tsx#L285)

**问题:**  
退出弹窗是自定义实现的模态层，但：
1. 没有 `role="dialog"` 和 `aria-modal="true"` → 屏幕阅读器不知道这是弹窗
2. 没有 `aria-labelledby` 关联标题
3. 弹窗出现时焦点未移入弹窗内，键盘用户可继续操作弹窗后方内容

**修复方案:**
```tsx
{showQuitConfirm && (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="quit-dialog-title"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  >
    <div className="bg-bg-card rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" tabIndex={-1}>
      <h3 id="quit-dialog-title" className="text-lg font-bold mb-2">确定退出吗？</h3>
      ...
    </div>
  </div>
)}
// 弹窗出现时 useEffect 将焦点移入：
useEffect(() => {
  if (showQuitConfirm) {
    dialogRef.current?.focus();
  }
}, [showQuitConfirm]);
```

---

### A-S03：进度条缺少 ARIA 角色与状态

**WCAG 准则:** 4.1.2 名称、角色、值 — Level A  
**严重等级:** Serious  
**位置:** Home.tsx:77-88, Progress.tsx:54-59, Practice.tsx:117-120

**问题:**  
进度条均为纯视觉实现（`<div>` with width style），无任何 ARIA 标记。  
屏幕阅读器无法感知当前进度。

**修复方案:**
```tsx
// 主题进度条（Home.tsx）
<div
  role="progressbar"
  aria-label={`${topic.name} 完成进度`}
  aria-valuenow={completedLevels}
  aria-valuemin={0}
  aria-valuemax={totalLevels}
  aria-valuetext={`${completedLevels} / ${totalLevels} 关`}
  className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-1"
>
  <div className="h-full rounded-full transition-all" style={{ width: `...%` }} />
</div>

// 答题进度条（Practice.tsx）
<div
  role="progressbar"
  aria-label="答题进度"
  aria-valuenow={currentIndex}
  aria-valuemin={0}
  aria-valuemax={totalQuestions}
  aria-valuetext={`第 ${currentIndex + 1} 题，共 ${totalQuestions} 题`}
  className="flex-1 h-3 bg-bg-elevated rounded-full overflow-hidden"
>
```

---

### A-S04：答题反馈区无 aria-live，屏幕阅读器不会播报

**WCAG 准则:** 4.1.3 状态消息 — Level AA  
**严重等级:** Serious  
**位置:** [src/pages/Practice.tsx:244-280](src/pages/Practice.tsx#L244)

**问题:**  
提交答案后弹出的反馈区（"正确！"/"再想想"）是动态插入的，但没有 `aria-live` 区域。  
屏幕阅读器不会自动播报这个结果，视障用户无法知道是否答对。

**修复方案:**
```tsx
{/* 在 Practice 根 div 内加全局 live region */}
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {showFeedback && (lastAnswerCorrect ? '回答正确！' : `回答错误，正确答案是 ${currentQuestion.solution.answer}`)}
</div>
```

---

## 中等问题（Moderate）

### A-M01：text-danger 在 bg-card 上对比度不足（4.37:1）

**WCAG 准则:** 1.4.3 对比度（最低）— Level AA  
**严重等级:** Moderate  
**位置:** [src/pages/WrongBook.tsx:58](src/pages/WrongBook.tsx#L58), [src/pages/SessionDetail.tsx:117](src/pages/SessionDetail.tsx#L117)

**问题:**  
`text-danger`（#ff4b4b）在 `bg-card`（#1a2c35）背景上的对比度为 **4.37:1**，  
低于正常文字 AA 要求（4.5:1）。在 `text-xs`（12px）尺寸下尤为明显。

**影响区域:**
- WrongBook 错题本中"你的答案:"标签（text-xs）
- SessionDetail 逐题详情中"你的答案:"（text-xs）

**修复方案:**  
将 `--color-danger` 从 `#ff4b4b` 调整为 `#ff3333`（亮度降低，对比度提升至约 5.3:1），  
或仅在 text-xs 场景中使用 `text-[#ff3333]` 覆盖。

---

### A-M02：DecimalTrainingGrid 脱离应用暗色主题，形成视觉孤岛

**WCAG 准则:** 1.4.3 / 一致性原则  
**严重等级:** Moderate  
**位置:** [src/components/DecimalTrainingGrid.tsx:54-93](src/components/DecimalTrainingGrid.tsx#L54)

**问题:**  
训练格组件使用 Tailwind 默认调色板（amber/green/red/gray/white），  
而应用整体是深色主题（#131f24 背景，#58cc02 品牌色）。  
组件呈现为亮色面板（`bg-amber-50 border-amber-200`），与周围深色环境形成强烈割裂感，  
且用到了与应用设计 token 无关的颜色，造成维护上的割裂。

**具体问题:**
- `text-gray-600` 在 `bg-amber-50` 上：暗灰在米黄上，约 6.3:1，通过
- `text-red-600` 在 `bg-red-50` 上：深红在极浅红上，约 4.9:1，通过
- 但视觉风格完全不属于本应用的设计语言

**修复方案:**  
将 DecimalTrainingGrid 改用应用设计 token：
```tsx
// Before: bg-amber-50 border-amber-200 等 Tailwind 默认色
// After: 使用应用 token
<div className="bg-bg-elevated border-2 border-accent/40 rounded-xl p-4 mb-4">
  <div className="text-xs text-accent font-semibold mb-3 ...">
    <span aria-hidden="true">📐</span>
    <span>训练格</span>
  </div>
  ...
  <input className={`... border-2
    ${results[idx] === 'correct' ? 'border-success bg-success/10 text-success'
      : results[idx] === 'wrong' ? 'border-danger bg-danger/10 text-danger'
      : 'border-border bg-bg text-text focus:border-primary'
    }`}
  />
```

---

### A-M03：心数展示缺少可访问文字描述

**WCAG 准则:** 1.1.1 非文字内容、4.1.2 名称/角色/值 — Level A  
**严重等级:** Moderate  
**位置:** Practice.tsx:130-134, SessionSummary.tsx:37-42, CampaignMap.tsx:56-65

**问题:**  
生命值（心数）用 ❤ emoji 重复显示，当前剩余心数无文字标注。  
屏幕阅读器会读出"红心 红心 红心"或"红心 红心 红灰心"，无法传达"当前剩余X条命"的语义。

**修复方案:**
```tsx
// Practice.tsx 心数显示
<div className="flex gap-0.5" aria-label={`剩余生命 ${hearts} 颗，共 3 颗`}>
  {[1, 2, 3].map(i => (
    <span key={i} aria-hidden="true"
      className={`text-xl ${i <= hearts ? 'text-red-500' : 'text-border'}`}>❤</span>
  ))}
</div>
```

---

### A-M04：无 `prefers-reduced-motion` 支持

**WCAG 准则:** 2.3.3 动画来自交互（Level AAA，但 AA 建议提供机制）  
**严重等级:** Moderate（行业最佳实践，影响前庭障碍用户）  
**位置:** [src/styles/globals.css](src/styles/globals.css)（全局动画定义）

**问题:**  
应用定义了 shake、float-up、pulse-grow、fade-in 四种动画，但未提供 `prefers-reduced-motion` 媒体查询覆盖。  
对于有前庭障碍或运动敏感的用户（包括部分有注意力/感知障碍的儿童），这些动画可能造成不适。

**修复方案:**
```css
/* 在 globals.css 底部添加 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### A-M05：CampaignMap 关卡按钮状态仅凭颜色区分

**WCAG 准则:** 1.4.1 颜色的使用 — Level A  
**严重等级:** Moderate  
**位置:** [src/pages/CampaignMap.tsx:118-127](src/pages/CampaignMap.tsx#L118)

**问题:**  
关卡状态（已完成/可玩/锁定）主要通过颜色区分（绿/绿/灰），  
图标（✓/▶/🔒）辅助区分 — 这点做得好。  
但对于色盲用户（红绿色盲），`border-success`（绿）和 `border-primary`（也是绿）  
在"完成"与"可玩"状态间差异不够明显（两者都是绿色系，仅明度不同）。

**建议:**  
在"已完成"状态下增加非颜色视觉差异，如：添加实心背景 vs 透明背景，或边框粗细差异。

---

## 次要问题（Minor）

### A-N01：autoFocus 干扰屏幕阅读器虚拟光标

**WCAG 准则:** 2.4.3 焦点顺序 — Level A  
**严重等级:** Minor  
**位置:** Practice.tsx:226（`autoFocus`），Onboarding.tsx:52

**问题:**  
`autoFocus` 在页面/组件加载时自动聚焦输入框，会中断屏幕阅读器用户的线性阅读流程，  
他们可能还没读完页面内容就被强制跳到输入框。

**建议:** 将 autoFocus 替换为 `useEffect` 中的受控焦点管理，在用户完成页面阅读后再聚焦。

---

### A-N02：输入框 placeholder 承载关键操作说明

**WCAG 准则:** 3.3.2 标签或说明 — Level A  
**严重等级:** Minor  
**位置:** [src/pages/Practice.tsx:219](src/pages/Practice.tsx#L219)

**问题:**
```tsx
placeholder={hasTrainingFields && !trainingComplete ? '先完成训练格' : '输入答案'}
```
"先完成训练格"是操作说明，但 placeholder 在输入时消失，且 placeholder 文字的对比度通常低于 AA 标准。  
此说明应通过 `aria-describedby` 或独立标签提供。

**修复方案:**
```tsx
// 在输入框上方加一个永久可见的说明（或使用 aria-describedby）
{hasTrainingFields && !trainingComplete && (
  <p id="input-hint" className="text-xs text-text-secondary text-center mb-2">
    请先完成上方训练格
  </p>
)}
<input
  aria-describedby={hasTrainingFields && !trainingComplete ? 'input-hint' : undefined}
  ...
/>
```

---

### A-N03：History 和 SessionDetail 无 `<title>` 变更，页面间无法区分

**WCAG 准则:** 2.4.2 页面标题 — Level A  
**严重等级:** Minor  
**位置:** App.tsx（页面路由系统）

**问题:**  
应用使用 Zustand 状态路由，所有"页面"切换时 `document.title` 保持"数学大冒险"不变。  
屏幕阅读器用户通过标题导航时，无法区分当前所在页面。

**修复方案:**
```tsx
// App.tsx 中在页面切换时更新标题
const PAGE_TITLES: Record<string, string> = {
  home: '数学大冒险 · 首页',
  'campaign-map': '数学大冒险 · 闯关',
  practice: '数学大冒险 · 答题',
  summary: '数学大冒险 · 练习结果',
  progress: '数学大冒险 · 闯关进度',
  'wrong-book': '数学大冒险 · 错题本',
  history: '数学大冒险 · 练习记录',
  profile: '数学大冒险 · 个人中心',
};

useEffect(() => {
  document.title = PAGE_TITLES[currentPage] ?? '数学大冒险';
}, [currentPage]);
```

---

### A-N04：无跳过导航链接（Skip Nav）

**WCAG 准则:** 2.4.1 绕过区块 — Level A  
**严重等级:** Minor（对纯移动端/触屏应用影响有限）  
**位置:** 全局

**问题:**  
无跳过导航的隐藏链接，键盘用户每次换页都需要 Tab 经过顶部栏才能到达主内容。  
对于移动端 PWA 影响相对较小，但对使用外接键盘的平板用户有影响。

**修复方案:**
```tsx
// 在每个页面根元素最顶部添加
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50
   focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded">
  跳到主内容
</a>
<main id="main-content" ...>
```

---

## 通过的准则

| 准则 | 名称 | 等级 |
|------|------|------|
| 1.1.1 | 非文字内容（图片有 alt，favicon 正确） | A |
| 1.3.1 | 信息与关系（语义 HTML，button 元素正确使用） | A |
| 1.3.2 | 有意义的序列（DOM 顺序合理） | A |
| 1.4.1 | 颜色的使用（正确/错误同时用颜色+图标区分） | A |
| 1.4.3 | 大多数文字/背景对比度（text-secondary、text-text 均通过） | AA |
| 2.1.1 | 键盘可访问（输入框有键盘处理；Enter 键提交） | A |
| 2.1.4 | 字符键快捷键（无冲突的字符键快捷键） | AA |
| 2.4.3 | 焦点顺序（总体焦点顺序合理） | A |
| 2.5.3 | 标签中的名称（按钮文字与功能一致） | A |
| 3.1.1 | 页面语言（`<html lang="zh-CN">` ✅） | A |
| 3.2.1 | 焦点行为（焦点不触发意外页面变化） | A |
| 3.2.2 | 输入事件（输入不触发意外提交） | A |
| 3.3.1 | 错误识别（答题反馈提供视觉标识） | A |
| 4.1.1 | 解析（无重复 ID 问题，有效 HTML） | A |

---

## 修复优先顺序

### 快速修复（< 30 分钟）

1. **A-C02** — 移除 `user-scalable=no`（1行改动）
2. **A-N03** — 添加 `document.title` 动态更新（5行）
3. **A-M04** — 添加 `prefers-reduced-motion` 媒体查询（10行 CSS）
4. **A-S04** — 添加 `aria-live` 区域（5行）
5. **A-M03** — 给心数 div 添加 `aria-label`（每处 1 行）

### 中等工作量（1-3 小时）

6. **A-C01** — 修复主按钮文字对比度（设计决策 + 全局改 1 个 class）
7. **A-S01** — 所有图标按钮添加 aria-label
8. **A-M01** — 调整 danger 颜色或在 card 背景场景提升对比度
9. **A-S03** — 所有进度条添加 ARIA 属性
10. **A-M02** — DecimalTrainingGrid 改用应用设计 token

### 较大工作量（> 3 小时）

11. **A-S02** — 退出弹窗实现完整焦点陷阱
12. **A-N04** — 全局 Skip Nav 链接

---

## 测试资源

### 自动化测试建议

安装 `vitest` + `@testing-library/react` + `jest-axe`：

```bash
npm install -D jest-axe @testing-library/react @testing-library/jest-dom
```

```typescript
// src/pages/__tests__/Practice.a11y.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import Practice from '../Practice';

expect.extend(toHaveNoViolations);

test('Practice 页面无可访问性违规', async () => {
  const { container } = render(<Practice />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 手动测试清单

- [ ] 仅用键盘（Tab/Enter/Space/方向键）完成一次完整练习流程
- [ ] 用 macOS VoiceOver 或 Android TalkBack 完成首页→选题→答题→结算
- [ ] 系统文字缩放至 150%/200%，检查布局不溢出
- [ ] 高对比度模式下验证所有文字可读
- [ ] 检查 `prefers-reduced-motion` 开启时动画是否停止

---

*由 /ui-design:accessibility-audit 生成 · WCAG 2.1 AA*  
*参考: https://www.w3.org/WAI/WCAG21/quickref/*
