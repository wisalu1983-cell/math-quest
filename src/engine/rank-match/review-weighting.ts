// src/engine/rank-match/review-weighting.ts
// ISSUE-061（P2）：段位赛复习题按近期错题频次加权分配主题
//
// 算法（Spec 2026-04-18 §5.6 / Plan §6 2026-04-18 补做决策）：
//   1) 取最近 `windowSize` 条 wrongQuestions（按 wrongAt desc 截断）
//   2) 只保留 topicId ∈ reviewTopics 且 difficulty ≥ reviewRange.min 的错题
//      （§5.6「低档错题不沿用」——低于复习池下限的错题来自玩家早已翻页的基础字段）
//   3) 对每个复习主题累加错题次数，得 rawCount[]
//
//   4) 名额分配（双保险——均衡 + 加权）：
//     - 若 count ≥ reviewTopics.length：每主题先保底 1 道（§5.6「均衡回顾」），
//       余下的 (count − numTopics) 个名额按 rawCount 用最大余数法分配；
//       totalRaw=0 时按均匀权重分配（无错题历史回落）
//     - 若 count < reviewTopics.length：给 rawCount 最高的前 count 个主题各 1 道，
//       平局按 reviewTopics 原顺序决（实际路径罕见，保留防御）
//
//   5) 按 reviewTopics 顺序展开成 TopicId[]，长度 = count
//
// 设计意图（为什么保底 + 再按"原始次数"而不是"平滑权重"）：
//   - 保底 1 道：避免任一主题在复习池中完全消失（§5.6 "各段位覆盖全部上一段 topic"）
//   - 剩余名额不再加 1 平滑：否则在"0/0/0/0"场景下会叠加一次均匀分布 + 再按原次数分，
//     直觉比例被稀释；现用 rawCount 分余量、totalRaw=0 单独走均匀，语义更清晰
//
// 确定性：无随机化；相同输入 → 相同输出，便于测试与离线复盘

import type { TopicId, WrongQuestion } from '@/types';
import type { DifficultyRange } from '@/constants/rank-match';

/** §5.6 加权窗口大小（Plan §6 2026-04-18 决策 N=50） */
export const REVIEW_WRONG_WINDOW = 50;

export interface DistributeReviewTopicsParams {
  reviewTopics: TopicId[];
  count: number;
  wrongQuestions: WrongQuestion[];
  reviewRange: DifficultyRange;
  windowSize: number;
}

export function distributeReviewTopics(params: DistributeReviewTopicsParams): TopicId[] {
  const { reviewTopics, count, wrongQuestions, reviewRange, windowSize } = params;
  if (count <= 0 || reviewTopics.length === 0) return [];

  // Step 1 + 2：按 wrongAt desc 取窗口，过滤池外主题 + 低档错题
  const windowWrongs = [...wrongQuestions]
    .sort((a, b) => b.wrongAt - a.wrongAt)
    .slice(0, windowSize);

  const topicIndex = new Map<TopicId, number>();
  reviewTopics.forEach((t, i) => topicIndex.set(t, i));

  const rawCount: number[] = reviewTopics.map(() => 0);
  for (const wq of windowWrongs) {
    const idx = topicIndex.get(wq.question.topicId);
    if (idx === undefined) continue;
    if (wq.question.difficulty < reviewRange.min) continue;
    rawCount[idx] += 1;
  }

  const numTopics = reviewTopics.length;
  const allocated: number[] = reviewTopics.map(() => 0);

  if (count < numTopics) {
    // 罕见路径：名额不够覆盖所有主题 → 给错题最多的前 count 个主题各 1 道
    const order = rawCount
      .map((c, i) => ({ i, c }))
      .sort((a, b) => (b.c - a.c) || (a.i - b.i));
    for (let k = 0; k < count; k++) {
      allocated[order[k].i] = 1;
    }
  } else {
    // 主路径：保底 1 道 + 余量按 rawCount 加权
    for (let i = 0; i < numTopics; i++) allocated[i] = 1;
    const remaining = count - numTopics;

    if (remaining > 0) {
      // 无错题时按均匀权重；否则按 rawCount 比例
      const weights = rawCount.some(c => c > 0)
        ? rawCount.slice()
        : rawCount.map(() => 1);
      distributeByLargestRemainder(remaining, weights, allocated);
    }
  }

  // Step 5：按 reviewTopics 顺序展开
  const out: TopicId[] = [];
  reviewTopics.forEach((topic, i) => {
    for (let k = 0; k < allocated[i]; k++) out.push(topic);
  });
  return out;
}

/**
 * 最大余数法把 `total` 个名额按 weights 比例分配，结果累加到 allocated 数组。
 * - 平局（小数部分相同 / 权重相同）时按索引升序决，保证确定性
 * - weights 允许全 0；调用方需自行避免（会造成 division-by-zero 后 expected=NaN，
 *   本函数视 totalWeight=0 时退化为"名额按顺序发给前 total 个"）
 */
function distributeByLargestRemainder(
  total: number,
  weights: number[],
  allocated: number[],
): void {
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight <= 0) {
    for (let i = 0; i < total && i < allocated.length; i++) allocated[i] += 1;
    return;
  }

  const expected = weights.map(w => (total * w) / totalWeight);
  const floors = expected.map(e => Math.floor(e));
  for (let i = 0; i < floors.length; i++) allocated[i] += floors[i];
  let rem = total - floors.reduce((s, v) => s + v, 0);

  const fracOrder = expected
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => (b.frac - a.frac) || (a.i - b.i));

  for (const { i } of fracOrder) {
    if (rem <= 0) break;
    allocated[i] += 1;
    rem -= 1;
  }
}
