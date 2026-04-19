# Batch 2 · 进阶与持久化执行报告

**执行日期**：2026-04-19
**总计**：6 条
**结果**：PASS: 6 / FAIL: 0 / RISK: 0 / BLOCKED: 0

## 说明

- 本批使用受控进度夹具进入中盘状态，以在单次 session 内覆盖进阶、错题沉淀和刷新持久化。

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|----|---------|---------|---------|---------|------|------|
| C-01 | 进阶入口锁态→解锁态 | Home 上的进阶训练入口会从锁态切换为可点击态。 | 加载已解锁 1 个题型进阶的夹具存档，观察 Home。 | 可点击态文案=true；锁态已在 B-03 观察到 | PASS | artifacts/shots/C-01-home-advance-unlocked.png |
| C-02 | AdvanceSelect 已解锁/未解锁分区 | AdvanceSelect 能同时展示已解锁题型与未解锁题型。 | 从 Home 进入进阶训练页。 | 已解锁区=true；未解锁区=true；基础计算可开始=true | PASS | artifacts/shots/C-02-advance-select.png |
| C-03 | 进阶一局结算与星级进度 | 完成一局进阶后进入专属 summary，显示 Hearts 投入与星级进度。 | 在 AdvanceSelect 开始基础计算进阶，并用正确答案完成整局。 | 练习完成=true；星级进度=true；答题统计=true | PASS | artifacts/shots/C-03-advance-summary.png |
| C-04 | 错题本沉淀 | 进阶中答错后主动退出，错题应进入错题本。 | 从 summary 返回进阶训练，再开一局并故意做错 2 题后退出到首页，检查错题本。 | 错题页标题=true；错误答案区=true；正确答案区=true | PASS | artifacts/shots/C-04-wrongbook.png |
| C-05 | Profile 快捷入口联动 | 个人中心存在错题时，可通过快捷入口进入错题本。 | 从错题本回 Home，再进入“我的”，点击错题本快捷入口。 | Profile快捷入口=true；跳转后仍在错题本=true | PASS | artifacts/shots/C-05-profile-with-shortcut.png<br>artifacts/shots/C-05-wrongbook-shortcut.png |
| C-06 | 刷新后持久化 | 刷新后仍保留用户、进阶解锁与统计数据。 | 返回 Home 后刷新页面。 | 刷新前进阶入口=true；刷新后进阶入口=true；昵称保留=true | PASS | artifacts/shots/C-06-home-after-refresh.png |
