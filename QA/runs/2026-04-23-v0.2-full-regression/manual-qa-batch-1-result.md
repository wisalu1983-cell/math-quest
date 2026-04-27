# Manual QA Batch 1 执行报告

**执行日期**：2026-04-23
**用例范围**：B-01 ~ B-04、C-01 ~ C-03、D-01 ~ D-03
**目标用户画像**：上海五年级学生，数学能力中等，主要使用 375px 左右的小屏手机
**结果**：PASS: 10 / FAIL: 0 / RISK: 0 / BLOCKED: 0

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | QA 判定 | 证据 |
|----|---------|---------|---------|---------|--------|------|
| B-01 | 新号建档与首页 | 第一次进入时能顺利完成建档，并在首页一眼看懂“继续学习 / 进阶训练 / 段位赛”三条主路径。 | 清空存档 → 观察欢迎页 → 输入昵称建档 → 进入首页。 | 欢迎页入口清晰=true；首页 page=home；首屏继续学习=true；主题区块=true / true；主题名命中=1/8；进阶入口=true；段位赛入口=true | PASS | artifacts/manual-qa-batch-1/B-01-onboarding.png<br>artifacts/manual-qa-batch-1/B-01-home.png |
| B-02 | 首局闯关到结算 | 孩子能顺着首页进入第 1 关，答完整局后看到明确的正向结算反馈，不会迷路。 | 从首页进入“基础计算” → 打开第 1 关 → 全对完成本局。 | 练习页心数=3；结算页 page=summary；通关文案=true；统计卡=true | PASS | artifacts/manual-qa-batch-1/B-02-practice.png<br>artifacts/manual-qa-batch-1/B-02-summary.png |
| B-03 | 历史记录与逐题详情 | 做完一局后，能从“记录”直接看到这局并进入逐题详情，方便复盘。 | 从结算页回首页 → 底部导航进入“记录” → 打开第一条记录。 | 记录首页概览卡=已进入详情，入口可打开；详情标题=true；逐题区=true；首题存在=true | PASS | artifacts/manual-qa-batch-1/B-03-progress.png<br>artifacts/manual-qa-batch-1/B-03-session-detail.png |
| B-04 | 主动退出生成未完成记录 | 中途退出后，记录里应明确标记“未完成”，既告诉孩子这局被记下来了，又不会误导成已通关。 | 从详情返回首页 → 再开一局基础计算 → 故意答 1 题后退出 → 回到记录页查看最新记录。 | mq_history 最新 result=incomplete；completed=false；记录卡未完成标记=true；详情页未完成标记=true | PASS | artifacts/manual-qa-batch-1/B-04-progress-incomplete.png<br>artifacts/manual-qa-batch-1/B-04-detail-incomplete.png |
| C-01 | 进阶入口锁态/解锁态 | 孩子在门槛不足时能理解“还没解锁”，达到条件后又能感知“现在可以开始进阶了”。 | 分别加载无进阶进度和已解锁 1 个题型进阶的夹具状态，观察首页进阶卡。 | 锁态提示=true；解锁态文案=true；孩子能感知“先闯关再进阶” | PASS | artifacts/manual-qa-batch-1/C-01-home-locked.png<br>artifacts/manual-qa-batch-1/C-01-home-unlocked.png |
| C-02 | 进阶结算与错题本 | 完成进阶时要有成长反馈，做错并退出后要能在错题本和个人中心里找到问题。 | 进入进阶训练页 → 全对完成 1 局并看结算 → 再开 1 局故意错 2 题后退出 → 查看错题本和个人中心快捷入口。 | 进阶结算正反馈=true；错题本有内容=true；个人中心快捷入口=true；点击后成功跳转=true | PASS | artifacts/manual-qa-batch-1/C-02-advance-summary.png<br>artifacts/manual-qa-batch-1/C-02-wrong-book.png<br>artifacts/manual-qa-batch-1/C-02-profile.png<br>artifacts/manual-qa-batch-1/C-02-profile-shortcut-target.png |
| C-03 | 刷新后持久化 | 刷新之后昵称、进阶解锁和记录都还在，用户不会产生“刚才白玩了”的不安。 | 回到首页 → 刷新浏览器 → 再进“记录”查看列表是否仍在。 | 昵称保留=true；进阶入口保留=true；history条数 2→2；记录页仍可见=true | PASS | artifacts/manual-qa-batch-1/C-03-home-after-refresh.png<br>artifacts/manual-qa-batch-1/C-03-progress-after-refresh.png |
| D-01 | Home / Hub 状态展示 | 段位赛在门槛不足、可挑战、已有活跃赛事三种状态下，都要告诉孩子现在该做什么。 | 分别加载门槛不足、可挑战与已开赛夹具，观察 Home 和 RankMatchHub。 | Home门槛不足=true；Hub锁态缺口=true；Home可挑战=true；Hub可挑战按钮=true；活跃赛事态=true | PASS | artifacts/manual-qa-batch-1/D-01-home-gap.png<br>artifacts/manual-qa-batch-1/D-01-hub-gap.png<br>artifacts/manual-qa-batch-1/D-01-home-open.png<br>artifacts/manual-qa-batch-1/D-01-hub-open.png<br>artifacts/manual-qa-batch-1/D-01-home-active.png |
| D-02 | BO3 晋级与淘汰 | 两局连胜时要有明确的“晋级成功”成就感，两局连败时也要给出可理解的复盘出口。 | 用可挑战夹具分别跑两局连胜和两局连败。 | 晋级页正反馈=true；淘汰页文案=true；淘汰页复盘区=true | PASS | artifacts/manual-qa-batch-1/D-02-promoted.png<br>artifacts/manual-qa-batch-1/D-02-eliminated.png |
| D-03 | 刷新恢复 | 无论在局内还是局间刷新，赛事都应该能继续，不让孩子担心刚才打的局丢掉。 | 先做局内答到第 5 题刷新，再做局间在 GameResult 阶段刷新。 | 局内刷新前 index=5 qid=OJtqw4iDWd；局内刷新后 page=practice index=5 qid=OJtqw4iDWd；局间刷新后 page=home；可继续赛事=true | PASS | artifacts/manual-qa-batch-1/D-03-refresh-mid.png<br>artifacts/manual-qa-batch-1/D-03-refresh-between.png |

## 本轮结论

本批 10 条拟真人工 QA 用例全部跑通，未发现新的 FAIL / BLOCKED。用户从建档、闯关、复盘、进阶到段位赛刷新恢复的核心体验链路成立。

