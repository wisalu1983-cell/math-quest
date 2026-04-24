# Batch 1 · 新号起步执行报告

**执行日期**：2026-04-19
**总计**：10 条
**结果**：PASS: 10 / FAIL: 0 / RISK: 0 / BLOCKED: 0

## 说明

- 本批使用真实新号 onboarding 路径，不注入任何进度夹具。

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|----|---------|---------|---------|---------|------|------|
| B-01 | 欢迎页首屏 | 看到“数学大冒险”欢迎页与“开始冒险”按钮。 | 清空本地存档后打开应用。 | page=onboarding；欢迎文案=true；开始按钮=true | PASS | artifacts/shots/B-01-onboarding.png |
| B-02 | 昵称建档 | 输入昵称后创建用户并进入 Home。 | 点击“开始冒险”→ 输入昵称 → 点击“开始学习！”。 | page=home；昵称可见=true | PASS | artifacts/shots/B-02-home-after-onboarding.png |
| B-03 | Home 首屏信息层级 | Home 同时呈现 Hero 卡、8 个主题卡、进阶锁态和段位赛入口。 | 新号首次进入 Home 后观察首屏。 | 主题命中=8/8；进阶入口=true；段位赛卡=true | PASS | artifacts/shots/B-03-home-overview.png |
| B-04 | 主题卡进入闯关地图 | 点击 A01 主题卡后进入 CampaignMap，并看到可玩的第 1 关。 | 在 Home 点击“基础计算”。 | page=campaign-map；第1关可见=true | PASS | artifacts/shots/B-04-campaign-map-a01.png |
| B-05 | Practice 基础答题页 | 进入第 1 关后看到退出、进度、心数和题面。 | 在 CampaignMap 点击第 1 关。 | 题型=numeric-input；进度=1/10；心数=3 | PASS | artifacts/shots/B-05-practice-first-question.png |
| B-06 | 退出确认弹窗 | 点退出后弹出确认对话框，并能继续练习。 | 在 Practice 点击左上退出按钮，再点击“继续练习”。 | 弹窗标题=true；说明文案=true | PASS | artifacts/shots/B-06-quit-dialog.png |
| B-07 | 单局通关结算 | 完整通过一局闯关后进入 summary，并显示通关结算。 | 在 Practice 使用正确答案完成本局全部题目。 | summary文案=true；统计区=true | PASS | artifacts/shots/B-07-summary.png |
| B-08 | Progress 与总体统计 | 进度页能展示累计答题与总体正确率。 | 从 summary 返回首页，再通过底部导航进入“进度”。 | 进度页标题=true；累计答题=true；正确率=true | PASS | artifacts/shots/B-08-progress.png |
| B-09 | History 与 SessionDetail | 能进入练习历史并打开刚完成的练习详情。 | 在进度页点击“查看练习记录”，再打开第一条记录。 | 详情页标题=true；逐题区=true；首题=true | PASS | artifacts/shots/B-09-history.png<br>artifacts/shots/B-09-session-detail.png |
| B-10 | Profile 与错题本空状态 | Profile 展示用户统计，错题本在全对路径下呈现空状态。 | 从练习详情返回首页，进入“我的”和“错题”。 | Profile统计=true；错题本空态=true | PASS | artifacts/shots/B-10-profile.png<br>artifacts/shots/B-10-wrongbook-empty.png |
