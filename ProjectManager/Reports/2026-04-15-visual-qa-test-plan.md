# 视觉层 QA 完整测试用例

**日期:** 2026-04-15  
**方法:** Playwright 截图 + boundingBox 测量 + getComputedStyle 颜色/字体校验 + 人工审图  
**基准文档:**  
- `ProjectManager/Specs/2026-04-14-ui-redesign-spec.md`  
- `.ui-design/design-system.md`  
- `.ui-design/tokens/tokens.ts`  
- `.ui-design/audits/mathquest_a11y_20260415_AA.md`

---

## 一、颜色 Token 合规性（C 系列）

> 验证实际渲染的 CSS `color` / `background-color` 是否匹配 design-system 中的 Token 定义。

| ID | 用例名 | 检查点 | 预期值 |
|----|--------|--------|--------|
| C-01 | 全局背景色 | `body` 的 `background-color` | `#FFF8F3` |
| C-02 | 卡片背景色 | `.card` / `bg-card` 元素的 `background` | `#FFFFFF` |
| C-03 | 主色：主按钮背景 | `.btn-flat` 的 `background-color` | `#FF6B35` |
| C-04 | 主色：主按钮文字色 | `.btn-flat` 的 `color` | `#FFFFFF`（白字）|
| C-05 | 功能色-成功：已完成关卡背景 | done 状态关卡 `background-color` | `#EAF9F0`（success-lt）|
| C-06 | 功能色-成功：已完成关卡边框 | done 状态关卡 `border-color` | `#B6EDD0`（success-mid）|
| C-07 | 功能色-推荐：推荐关卡背景 | rec 状态关卡 `background-color` | `#FF6B35`（primary）|
| C-08 | 功能色-推荐：推荐关卡边框 | rec 状态关卡 `border-color` | `#D4521A`（primary-dark）|
| C-09 | 功能色-可玩：可挑战关卡背景 | avail 状态关卡 `background` | `#FFF0EB`（primary-lt）|
| C-10 | 功能色-锁定：锁定关卡 opacity | locked 状态关卡 `opacity` | `0.55` |
| C-11 | 答对反馈面板背景 | 答对时反馈区域 `background` | `#EAF9F0`（success-lt）|
| C-12 | 答错反馈面板背景 | 答错时反馈区域 `background` | `#FFF9DB`（warning-lt）|
| C-13 | 文字色-主文字 | 页面标题 `color` | `#181818` |
| C-14 | 文字色-次要文字 | 说明文字 `color` | `#7A7A7A` |
| C-15 | 文字色-禁用 | 禁用态 / 占位 `color` | `#C8C8C8` |
| C-16 | 边框色-主要 | 卡片主边框 `border-color` | `#EED9CC` |
| C-17 | 边框色-次要 | 分隔线 `border-color` | `#F5EDE8` |
| C-18 | 导航栏激活高亮色 | 激活态导航按钮高亮块背景 | `#FFF0EB`（primary-lt）|
| C-19 | 导航栏非激活文字色 | 未选中 Tab 的文字 `color` | `#C8C8C8`（text-3）|
| C-20 | 退出按钮背景色 | 退出按钮 `background` | `#FFF5F5`（danger-lt）|
| C-21 | 主题卡片各自主题色 | 8 个主题卡片图标色分别匹配 | 见 topicColors |

---

## 二、字体规范合规性（T 系列）

> 验证字号、字重、字体族是否匹配设计系统规格。

| ID | 用例名 | 元素 | 预期 |
|----|--------|------|------|
| T-01 | 全局字体族 | `body font-family` | 含 `Nunito` |
| T-02 | 页面大标题（display） | 首页问候语 | 24px / weight 900 |
| T-03 | 模块标题（title） | 关卡地图名 | 20px / weight 900 |
| T-04 | 卡片主标题（subtitle） | Hero 卡标题 | 17px / weight 900 |
| T-05 | 按钮文字（body-strong） | `.btn-flat` | 15px / weight 900 |
| T-06 | 正文说明（body） | 副文案（"今天继续挑战吧"） | 13px / weight 700 |
| T-07 | 进度文字（caption） | 关卡标签"第N关" | 12px / weight 800 |
| T-08 | 最小字号（mini） | 导航标签、NEW 徽章 | ≥ 11px / weight 800 |
| T-09 | 字号下限（禁止） | 全页面所有文字元素 | 无 < 11px |
| T-10 | 关卡序号字号 | "第N关" 文字 | 12px |
| T-11 | 进度条旁完成标签字号 | "X/Y 关" | 12px / weight 800 |

---

## 三、组件尺寸与布局合规性（S 系列）

> 验证关键组件的宽、高、间距是否匹配 spec。

| ID | 用例名 | 预期值 |
|----|--------|--------|
| S-01 | 关卡按钮高度（跨全状态） | 全部 = 96px |
| S-02 | 关卡按钮圆角 | border-radius = 18px |
| S-03 | 关卡按钮边框宽度 | border-width = 2.5px |
| S-04 | 关卡按钮 padding | 10px 8px 10px |
| S-05 | 关卡跨状态宽度一致 | 同一 grid 内宽度差 ≤ 2px |
| S-06 | 底部导航高度 | 68px |
| S-07 | 底部导航 4 个 Tab 等宽 | 宽度差 ≤ 2px |
| S-08 | 导航图标尺寸 | 24×24px |
| S-09 | 激活高亮块尺寸 | 38×34px |
| S-10 | 进度条高度-主要 | 7px（首页/进度页/主题卡片） |
| S-11 | 进度条高度-地图 | 8px（CampaignMap） |
| S-12 | 进度条圆角 | border-radius = 4px |
| S-13 | 主题卡片图标尺寸 | 42×42px |
| S-14 | Hero 卡图标尺寸 | 52×52px（icon 容器） |
| S-15 | 主题卡片 padding | 16px 14px 14px |
| S-16 | 主题卡片圆角 | border-radius = 18px |
| S-17 | 主题卡片装饰圆尺寸 | 52×52px |
| S-18 | 返回按钮尺寸 | 36×36px |
| S-19 | 返回按钮圆角 | border-radius = 10px |
| S-20 | 退出按钮尺寸 | 36×36px |
| S-21 | 答题进度圆点尺寸 | done/pending=8px, current=22px 宽 |
| S-22 | 用户头像尺寸（首页） | 36×36px |
| S-23 | 用户头像尺寸（个人中心） | 64×64px |
| S-24 | Hero 卡左边框 | 5px，色 = primary |
| S-25 | btn-flat padding | 13px |
| S-26 | btn-flat 圆角 | border-radius = 16px |
| S-27 | 首页 8 卡片尺寸一致 | 高度差 ≤ 2px，宽度差 ≤ 2px |
| S-28 | 统计卡 3 列等宽 | Profile 3 个统计框宽度差 ≤ 2px |

---

## 四、交互与动效合规性（A 系列）

| ID | 用例名 | 验证方式 |
|----|--------|---------|
| A-01 | 页面进入 stagger 动画存在 | 检查 `.stagger-*` class 存在 |
| A-02 | 推荐关卡 bounce 动画 | 检查 `animate-bounce-rec` 存在 |
| A-03 | 答错抖动动画 | 答错后 `.animate-shake` class 触发 |
| A-04 | btn-flat hover 变亮 | hover 时 `filter: brightness(1.06)` |
| A-05 | btn-flat active 缩小 | active 时 `transform: scale(.99)` |
| A-06 | prefers-reduced-motion | 媒体查询存在于 globals.css |
| A-07 | 退出确认弹窗 | 点退出→弹窗出现→有"继续练习"和"退出"按钮 |
| A-08 | 答题圆点进度随答题推进 | 每答一题圆点变色 |

---

## 五、可访问性合规性（X 系列）

| ID | 用例名 | 预期 |
|----|--------|------|
| X-01 | skip-to-main 链接存在 | `#main-content` + `.skip-link` |
| X-02 | 语言标签 | `<html lang="zh-CN">` |
| X-03 | focus-visible 全局样式 | `:focus-visible` 有 outline |
| X-04 | 所有 img-role 有 aria-label | 心数、锁定关卡 |
| X-05 | 进度条 ARIA | `role="progressbar"` + `aria-valuenow` |
| X-06 | 导航 aria-current="page" | 当前 Tab 标记 |
| X-07 | 输入框 aria-label | 答案输入、昵称输入 |
| X-08 | 答题反馈 aria-live | 正确/错误的 aria-live="polite" |
| X-09 | 锁定关卡不在 Tab 序列中 | locked 用 div 而非 button |
| X-10 | 动态 document.title | 每个页面 title 包含页面名 |
| X-11 | Dialog 焦点陷阱 | 退出弹窗 `role="dialog"` + `aria-modal` |

---

## 六、页面级截图审视（V 系列）

| ID | 页面 | 审视重点 |
|----|------|---------|
| V-01 | 引导页-欢迎 | 布局居中、emoji 大小、按钮间距 |
| V-02 | 引导页-昵称输入 | 输入框居中、placeholder 可见 |
| V-03 | 首页 | Hero 卡左边框、主题网格对齐、图标色、装饰圆 |
| V-04 | 闯关地图（多状态） | 关卡卡片跨状态尺寸一致、章节分隔线、推荐关卡突出 |
| V-05 | 答题页-数值输入 | 卡片居中、输入框对齐、确认按钮宽度 |
| V-06 | 答题页-答对反馈 | 绿色面板、emoji、"太棒了"文案 |
| V-07 | 答题页-答错反馈 | 暖黄面板（非红色）、"没关系"文案、正确答案 |
| V-08 | 结算页-通关 | 🎉 居中、心数显示、统计卡对齐 |
| V-09 | 结算页-失败 | 😅 + 暖黄底、"再试一次"按钮 |
| V-10 | 进度页 | 8 个主题行高度一致、进度条对齐 |
| V-11 | 错题本-空 | 空状态 🎉、文案友好 |
| V-12 | 个人中心 | 头像、统计 3 框等宽、设置开关 |
| V-13 | 退出弹窗 | 遮罩、居中、两按钮等宽 |

---

## 七、跨页面一致性（G 系列）

| ID | 用例名 | 预期 |
|----|--------|------|
| G-01 | 全局背景色统一 | 所有页面 body background = #FFF8F3 |
| G-02 | 卡片阴影统一 | 所有 `.card` box-shadow 一致 |
| G-03 | 进度条样式统一 | 圆角、填充渐变、轨道色跨页面一致 |
| G-04 | 按钮样式统一 | btn-flat 在各页面视觉完全一致 |
| G-05 | 导航栏跨页面一致 | 4 个 Tab 页的底栏高度、宽度、颜色 |
| G-06 | 顶栏返回按钮跨页面一致 | CampaignMap 与 WrongBook 与 Profile |
| G-07 | 页面 title 跨页面不同 | 每页有独立 document.title |

---

**合计：78 条测试用例**

| 类别 | 条数 |
|------|------|
| C-颜色 Token | 21 |
| T-字体规范 | 11 |
| S-尺寸布局 | 28 |
| A-交互动效 | 8 |
| X-可访问性 | 11 |
| V-截图审视 | 13 |
| G-跨页一致 | 7 |
