# Batch 3 · 段位赛执行报告

**执行日期**：2026-04-19
**总计**：9 条
**结果**：PASS: 9 / FAIL: 0 / RISK: 0 / BLOCKED: 0

## 说明

- 本批使用受控星级夹具进入 Rookie 门槛，并分别跑晋级、淘汰与刷新恢复三条路径。

## 逐条结果

| ID | 用例名称 | 用户预期 | 操作路径 | 实际观察 | 判定 | 证据 |
|----|---------|---------|---------|---------|------|------|
| D-01 | Home 段位赛入口三态 | Home 段位赛卡在门槛不足 / 可挑战 / 有活跃赛事三态下文案正确。 | 分别加载门槛不足、可挑战与已开赛的夹具状态，观察 Home 段位赛卡。 | 门槛不足=true；可挑战=true；活跃赛事=true | PASS | artifacts/shots/D-01-home-rank-card-states.png |
| D-02 | Hub 锁定与解锁展示 | Hub 中未满足门槛时显示锁态与缺口，满足门槛时显示挑战按钮。 | 分别加载门槛不足与可挑战夹具，进入 RankMatchHub。 | 锁态缺口=true；解锁按钮=true | PASS | artifacts/shots/D-02-rank-hub.png |
| D-03 | Rookie Practice 题头与 BO 感知 | 进入 Rookie Practice 后看到“新秀 · BO3 · 第 1 局”头部。 | 从 Hub 发起 Rookie 挑战。 | 头部新秀=true；BO3=true；第1局=true | PASS | artifacts/shots/D-03-rank-practice-header.png |
| D-04 | 单局结算自动推进 | 第 1 局结束后进入 GameResult，并在 3 秒内自动推进到下一局。 | 用正确答案完成第 1 局 Rookie 对局。 | GameResult倒计时按钮=true；自动推进后页=practice | PASS | artifacts/shots/D-04-rank-game-result.png |
| D-05 | 晋级结算页 | 两局连胜后进入赛事总结算页，显示晋级成功与提前结束标注。 | 继续用正确答案完成第 2 局。 | 晋级文案=true；提前结束标注=true | PASS | artifacts/shots/D-05-rank-promoted.png |
| D-06 | 淘汰复盘页 | 两局连败后进入赛事总结算页，显示薄弱题型前 3。 | 加载新秀可挑战夹具，故意两局连败。 | 淘汰文案=true；薄弱题型区=true | PASS | artifacts/shots/D-06-rank-eliminated.png |
| D-07 | 局内刷新恢复 | 段位赛答到中途刷新后，应直接恢复到当前局可继续答题的状态。 | 加载新秀可挑战夹具，开始 Rookie 对局，答 5 题后刷新浏览器。 | 刷新前 index=5 qid=kinzfgUaTZ；刷新后 page=practice index=5 qid=kinzfgUaTZ | PASS | artifacts/shots/D-07-rank-refresh-mid.png |
| D-08 | 局间刷新恢复 | 第 1 局结束后的刷新不会丢失活跃赛事，用户仍能继续下一局。 | 加载新秀可挑战夹具，完成第 1 局后在 GameResult 阶段刷新。 | 刷新后 page=home；可继续赛事=true | PASS | artifacts/shots/D-08-rank-refresh-between.png |
| D-09 | 段位赛相关 Console 健康 | 跑完整个 Rookie 晋级/淘汰/刷新路径后，不出现关键运行时错误。 | 统计本轮段位赛用例期间新增的 console error / pageerror。 | 未记录到 rank-match 相关关键 console error/pageerror。 | PASS | artifacts/shots/D-09-final-state.png |
