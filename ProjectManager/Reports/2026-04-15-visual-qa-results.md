# 视觉层全量 QA 报告

**日期:** 2026-04-15  
**方法:** Playwright boundingBox + getComputedStyle + 截图人工审视  
**用例总数:** 86 条（含部分动态补充）  
**测试用例文档:** `Reports/2026-04-15-visual-qa-test-plan.md`  
**截图目录:** `test-results/visual-full-2026-04-15/`

---

## 执行摘要

| 指标 | 数值 |
|------|------|
| 总用例 | 86 |
| ✅ PASS | 82 |
| ❌ FAIL | 4 |
| 通过率 | 95.3% |

---

## FAIL 项详细分析

### F1: S-03 — 关卡按钮边框宽度

| 项 | 值 |
|---|---|
| **预期** | `border-width: 2.5px`（spec §4.3） |
| **实际** | `border-width: 2px` |
| **根因** | `CampaignMap.tsx` 使用 Tailwind class `border-[2.5px]`，但浏览器将小数 px 四舍五入为 `2px` |
| **严重度** | P3-低 — 0.5px 差异肉眼不可感知 |
| **建议** | spec 中改为 2px 即可，或保持现状（视觉无差异） |

### F2: S-05 — 关卡跨状态宽度不一致（54px 差）

| 项 | 值 |
|---|---|
| **预期** | 所有关卡卡片宽度一致 |
| **实际** | done:60px, rec:56px, avail:56px, **locked:110px** |
| **根因** | 锁定关卡的 `<div>` 与可交互关卡的 `<button>` 在 3 列 grid 中宽度不同。locked 的 div 没有被 grid 约束到与 button 相同的列宽 |
| **严重度** | **P1-高** — 肉眼立即可见的布局错位，影响用户对产品质量的信任 |
| **截图** | `V04b-campaign-map-multi-state.png` |
| **建议** | 所有关卡（含 locked）的外层容器统一为 `<div>` 或统一为 `<button>`，确保 grid item 等宽 |

### F3: A-03 — 答错抖动动画检测失败

| 项 | 值 |
|---|---|
| **预期** | 答错后 `.animate-shake` class 出现 |
| **实际** | Playwright 在 50ms 内未捕获到 |
| **根因** | shake 动画 300ms，`setTimeout` 移除 class 也是 300ms。Playwright 检测窗口太窄 |
| **严重度** | P3-低 — 属于测试时序问题，功能实际存在（从代码和截图 V07 确认） |
| **建议** | 增大检测窗口或在 CSS 中保留 class 更久 |

### F4: X-03 — focus-visible 全局样式检测失败

| 项 | 值 |
|---|---|
| **预期** | 检测到 `:focus-visible` CSS 规则 |
| **实际** | 遍历 styleSheets 未匹配 |
| **根因** | Tailwind v4 的 `@theme` 块和 `@layer` 编译方式可能导致规则字符串不包含 `focus-visible` 关键字 |
| **严重度** | P3-低 — 从 `globals.css` 源码确认规则存在（第 85-88 行） |
| **建议** | 测试方法改为检查具体元素的 focus outline |

---

## 截图人工审视 — 额外发现

> 以下是纯靠截图「用眼看」发现的问题，无法被自动化代码检测。

### VR-01: 答题页下半屏大面积留白（P2）

**截图:** `V05-practice-numeric.png`  
**描述:** 题目卡 + 输入框 + 确认按钮仅占上半屏 ~40%，下方 60% 完全空白。对小学生来说视觉重心过高，操作集中在屏幕上方，拇指需要上移。  
**建议:** 考虑将输入区域垂直居中，或在下方添加鼓励性装饰（如吉祥物提示区）。

### VR-02: 进度页内容被底部导航遮挡（P2）

**截图:** `V10-progress.png`  
**描述:** "方程移项"（第 8 个主题）行和"总体统计"区域紧贴或部分被固定底部导航栏遮挡。虽然 `pb-[88px]` 已设置 padding-bottom，但 8 个主题 + 统计区的总高度超出了预留空间。  
**建议:** 增大 `pb-[88px]` 到 `pb-[120px]`，或改用 `mb-safe` 确保最后一个卡片完全可见。

### VR-03: 引导页使用 emoji 图标（P3）

**截图:** `V01-onboarding-welcome.png`, `V02-onboarding-nickname.png`  
**描述:** 引导页使用 🧮 和 👋 作为装饰元素。设计规范（design-system.md §6 Do/Don't）明确写 "Don't: 用 emoji 作为 UI 图标"。  
**性质:** 引导页是一次性页面，且 emoji 在此处起装饰而非功能作用，属于边界情况。  
**建议:** 不强制修改，但如果追求一致性，可替换为定制 SVG。

### VR-04: 退出弹窗背景遮罩不够明显（P3）

**截图:** `V13-quit-dialog.png`  
**描述:** 半透明遮罩可见，但透明度较高，背后的答题页内容仍然清晰可见，可能分散注意力。  
**建议:** 加深遮罩到 `rgba(0,0,0,0.5)` 或更高。

### VR-05: 答对反馈面板缺少 ⭐ 动画和纸屑效果（P2）

**截图:** `V06-feedback-correct.png`  
**描述:** 设计规范（§4.6）要求答对时有 "⭐×3 弹入 + 纸屑撒落" 动画效果，但截图中仅显示静态文案面板，无任何庆祝动画元素。  
**根因:** `Practice.tsx` 的反馈面板实现是纯静态文案，未实现 spec 中的 `star-pop` 和 `conf-fall` 动画。  
**建议:** 在 Phase B/C 改版中补全答对庆祝动画。

---

## 全量 PASS 项汇总

### 颜色 Token（21/21 PASS ✅）

所有 21 项颜色 Token 检查全部通过：
- 主色 #FF6B35 ✅ | 功能色（success/warning/danger）✅
- 文字色三级（#181818 / #7A7A7A / #C8C8C8）✅
- 背景色 #FFF8F3 ✅ | 卡片白 #FFFFFF ✅
- 4 种关卡状态颜色全部匹配 ✅
- 8 个主题卡片各有独立图标色 ✅

### 字体规范（11/11 PASS ✅）

- Nunito 字体族加载成功 ✅
- 各级字号完全匹配：display 24px / title 20px / subtitle 17px / body-strong 15px / body 13px / caption 12px / mini 11px ✅
- 全页面无小于 11px 的文字 ✅
- 字重全部 ≥ 700（粗体主导）✅

### 尺寸布局（26/28，2 FAIL）

通过的 26 项包括：
- 关卡高度 96px 跨状态一致 ✅ | 圆角 18px ✅
- 首页 8 卡片完全等尺寸 ✅ | 装饰圆 52×52 ✅
- Hero 卡图标 52×52 + 左边框 5px ✅
- 导航栏 68px / 4 Tab 等宽 / 图标 24×24 / 高亮 38×34 ✅
- 进度条 7px(首页) / 8px(地图) / 圆角 4px ✅
- 退出按钮 36×36 / 返回按钮 36×36 ✅
- 答题圆点 current 22px / normal 8px ✅
- btn-flat padding 13px / 圆角 16px ✅

### 交互动效（7/8，1 FAIL）

- stagger 动画存在 ✅ | bounce 推荐关卡 ✅
- prefers-reduced-motion 保护 ✅
- 退出确认弹窗 ✅ | 圆点进度推进 ✅

### 可访问性（10/11，1 FAIL）

- skip-link ✅ | lang="zh-CN" ✅
- role="img" 全部有 aria-label ✅
- progressbar ARIA 完整 ✅ | aria-current 导航 ✅
- aria-live 答题反馈 ✅ | 锁定关卡非 button ✅
- 动态 document.title ✅ | Dialog 规范 ✅

### 跨页面一致性（7/7 PASS ✅）

- 4 页背景色完全一致 rgb(255,248,243) ✅
- 导航栏跨 4 页高度 68px 一致 ✅
- 4 页 document.title 各不相同 ✅

---

## 优先级排序

| 优先级 | ID | 问题 | 建议 |
|--------|-----|------|------|
| **P1** | S-05 | 关卡跨状态宽度差 54px | 修复 grid 布局，统一 button/div 宽度 |
| P2 | VR-01 | 答题页下半屏留白 | 输入区居中或添加装饰 |
| P2 | VR-02 | 进度页内容被导航遮挡 | 增大 padding-bottom |
| P2 | VR-05 | 答对缺少庆祝动画 | Phase B/C 补全 star-pop + conf-fall |
| P3 | S-03 | 边框 2px vs spec 2.5px | 修改 spec 或接受 |
| P3 | VR-03 | 引导页 emoji 图标 | 可选替换为 SVG |
| P3 | VR-04 | 退出弹窗遮罩过淡 | 加深遮罩透明度 |

---

_Generated: 2026-04-15 by Visual QA Test Suite_
