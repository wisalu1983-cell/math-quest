import type { Question } from '@/types';
import type { NumberSenseData } from '@/types';

/**
 * Returns the method tip text for a question if it should be shown at the
 * lowest difficulty tier, otherwise null.
 *
 * Applies to 4 number-sense sub-variants:
 *  - estimate 方向判断  (d ≤ 5)
 *  - reverse-round      (d ≤ 5)
 *  - floor-ceil 情境   (d ≤ 5)
 *  - compare 高档概念   (d ≤ 8, i.e. not Boss d=9)
 *
 * Sub-variant detection uses prompt text because all three "round"-tagged
 * sub-variants share data.subtype === 'round'.
 */
export function getMethodTip(question: Question): string | null {
  if (question.topicId !== 'number-sense') return null;

  const data = question.data as NumberSenseData;
  const d = question.difficulty;

  // ── estimate 方向判断 ──────────────────────────────────────────────────────
  // 特征：multiple-choice, subtype=estimate, options 含 '偏大'
  if (
    data.subtype === 'estimate' &&
    question.type === 'multiple-choice' &&
    Array.isArray(data.options) &&
    data.options.includes('偏大') &&
    d <= 5
  ) {
    return '取整后大了还是小了，取决于每个数被凑大还是凑小';
  }

  // ── round 子题型（reverse-round 和 floor-ceil-context 均为 subtype=round）──
  if (data.subtype === 'round' && question.type === 'numeric-input') {
    // reverse-round（d ≤ 5）
    // 特征：prompt 含"四舍五入"且含"最大"或"最小"
    if (
      d <= 5 &&
      question.prompt.includes('四舍五入') &&
      (question.prompt.includes('最大') || question.prompt.includes('最小'))
    ) {
      return '找原数范围：近似值是 N → 最大为 N.4，最小为 (N−1).5';
    }

    // floor-ceil 情境（d ≤ 5）
    // 特征：prompt 含"至少"或"最多"，不含"四舍五入"（区分 reverse-round）
    if (
      d <= 5 &&
      (question.prompt.includes('至少') || question.prompt.includes('最多')) &&
      !question.prompt.includes('四舍五入')
    ) {
      return '至少/不够就补 → 进一法；最多/只取整份 → 去尾法';
    }
  }

  // ── compare 高档概念判断（d ≤ 8，Boss d=9 不显示）─────────────────────────
  // 特征：subtype=compare, multi-select 或 prompt 含"判断正误"
  if (
    data.subtype === 'compare' &&
    d <= 8 &&
    (question.type === 'multi-select' || question.prompt.includes('判断正误'))
  ) {
    return '遇到"一定"，先找反例';
  }

  return null;
}
