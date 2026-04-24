import { describe, it, expect } from 'vitest';
import { getMethodTip } from './method-tips';
import type { Question } from '@/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function baseQuestion(overrides: Partial<Question>): Question {
  return {
    id: 'test',
    topicId: 'number-sense',
    type: 'numeric-input',
    difficulty: 5,
    prompt: '',
    data: { kind: 'number-sense', subtype: 'round' },
    solution: { answer: 0, explanation: '' },
    hints: [],
    ...overrides,
  };
}

// ── 非 number-sense 题型 ──────────────────────────────────────────────────────

describe('non-number-sense', () => {
  it('其他题型返回 null', () => {
    const q = baseQuestion({ topicId: 'mental-arithmetic' });
    expect(getMethodTip(q)).toBeNull();
  });
});

// ── estimate 方向判断 ─────────────────────────────────────────────────────────

describe('estimate-direction', () => {
  const makeQ = (d: number): Question =>
    baseQuestion({
      difficulty: d,
      type: 'multiple-choice',
      data: {
        kind: 'number-sense',
        subtype: 'estimate',
        options: ['偏大', '偏小', '相等'],
      },
      prompt: '把 199 × 5 估算成 200 × 5 = 1000，这个估算结果比精确值如何？',
    });

  it('d=3 返回方向判断 tip', () => {
    expect(getMethodTip(makeQ(3))).toBe('取整后大了还是小了，取决于每个数被凑大还是凑小');
  });

  it('d=5 返回方向判断 tip', () => {
    expect(getMethodTip(makeQ(5))).toBe('取整后大了还是小了，取决于每个数被凑大还是凑小');
  });

  it('d=6 不显示 tip（超出低档）', () => {
    expect(getMethodTip(makeQ(6))).toBeNull();
  });

  it('普通估算题（无偏大选项）不触发', () => {
    const q = baseQuestion({
      difficulty: 3,
      type: 'numeric-input',
      data: { kind: 'number-sense', subtype: 'estimate' },
      prompt: '估算 492 + 435，结果取整百数',
    });
    expect(getMethodTip(q)).toBeNull();
  });
});

// ── reverse-round ─────────────────────────────────────────────────────────────

describe('reverse-round', () => {
  const makeQ = (d: number, prompt: string): Question =>
    baseQuestion({
      difficulty: d,
      type: 'numeric-input',
      data: { kind: 'number-sense', subtype: 'round' },
      prompt,
    });

  it('d=5 标准模板：返回 reverse-round tip', () => {
    const tip = getMethodTip(
      makeQ(5, '一个一位小数四舍五入到个位后是 7，这个数最大是多少？')
    );
    expect(tip).toBe('找原数范围：近似值是 N → 最大为 N.4，最小为 (N−1).5');
  });

  it('d=5 近似值模板（模板 2）', () => {
    const tip = getMethodTip(
      makeQ(5, '某一位小数用四舍五入法保留到整数，近似值是 8，这个小数最小是多少？')
    );
    expect(tip).toBe('找原数范围：近似值是 N → 最大为 N.4，最小为 (N−1).5');
  });

  it('d=6 不显示 tip', () => {
    expect(
      getMethodTip(makeQ(6, '一个两位小数四舍五入保留一位小数后得 3.5，这个数最大是多少？'))
    ).toBeNull();
  });

  it('普通四舍五入题不触发（无最大/最小）', () => {
    expect(
      getMethodTip(makeQ(4, '将 492 四舍五入到百位'))
    ).toBeNull();
  });
});

// ── floor-ceil 情境 ───────────────────────────────────────────────────────────

describe('floor-ceil-context', () => {
  const makeQ = (d: number, prompt: string): Question =>
    baseQuestion({
      difficulty: d,
      type: 'numeric-input',
      data: { kind: 'number-sense', subtype: 'round' },
      prompt,
    });

  it('d=4 "至少"场景返回 floor-ceil tip', () => {
    const tip = getMethodTip(
      makeQ(4, '一辆大巴能坐 40 人，有 137 人春游，至少需要几辆？')
    );
    expect(tip).toBe('至少/不够就补 → 进一法；最多/只取整份 → 去尾法');
  });

  it('d=5 "最多"场景返回 floor-ceil tip', () => {
    const tip = getMethodTip(
      makeQ(5, '做一件上衣需要 2.5 米布料，25 米布料最多做几件？')
    );
    expect(tip).toBe('至少/不够就补 → 进一法；最多/只取整份 → 去尾法');
  });

  it('d=6 不显示 tip', () => {
    expect(
      getMethodTip(makeQ(6, '篮筐能装 35 个苹果，386 个苹果至少需要几个篮筐？'))
    ).toBeNull();
  });

  it('floor-ceil-basic 题（含"用进一法"）不触发', () => {
    // generateFloorCeilBasic 的 prompt 不含 "至少"/"最多"
    expect(
      getMethodTip(makeQ(4, '用进一法将 3.7 取近似到个位'))
    ).toBeNull();
  });

  it('reverse-round 的"最大/最小"不误触发 floor-ceil（因含"四舍五入"）', () => {
    // 含"四舍五入"时走 reverse-round 分支，floor-ceil 分支不执行
    const tip = getMethodTip(
      makeQ(5, '一个一位小数四舍五入到个位后是 7，这个数最大是多少？')
    );
    expect(tip).not.toBe('至少/不够就补 → 进一法；最多/只取整份 → 去尾法');
  });
});

// ── compare 高档概念判断 ──────────────────────────────────────────────────────

describe('compare-concept', () => {
  it('d=8 multi-select 返回 compare tip', () => {
    const q = baseQuestion({
      difficulty: 8,
      type: 'multi-select',
      data: {
        kind: 'number-sense',
        subtype: 'compare',
        options: ['A. 0.2 × 0.3 比 0.2 小', 'B. 两个小于 1 的数相乘积一定大'],
      },
      prompt: '以下哪些说法正确？（可多选）',
    });
    expect(getMethodTip(q)).toBe('遇到"一定"，先找反例');
  });

  it('d=8 单选"判断正误"返回 compare tip', () => {
    const q = baseQuestion({
      difficulty: 8,
      type: 'multiple-choice',
      data: {
        kind: 'number-sense',
        subtype: 'compare',
        options: ['对', '错'],
      },
      prompt: '判断正误："一个数乘以一个小数，积一定比原数小"',
    });
    expect(getMethodTip(q)).toBe('遇到"一定"，先找反例');
  });

  it('d=9（Boss）不显示 tip', () => {
    const q = baseQuestion({
      difficulty: 9,
      type: 'multi-select',
      data: { kind: 'number-sense', subtype: 'compare', options: [] },
      prompt: '以下哪些说法正确？（可多选）',
    });
    expect(getMethodTip(q)).toBeNull();
  });

  it('d=7 compare-expr 不触发（非 multi-select 也无"判断正误"）', () => {
    const q = baseQuestion({
      difficulty: 7,
      type: 'multiple-choice',
      data: { kind: 'number-sense', subtype: 'compare', options: ['>', '<', '='] },
      prompt: '不计算，比较大小: 3.5 × 4 ○ 3.5 × 3.9',
    });
    expect(getMethodTip(q)).toBeNull();
  });
});
