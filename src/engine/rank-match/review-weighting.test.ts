// src/engine/rank-match/review-weighting.test.ts
// ISSUE-061（P2）M2 遗留补做：段位赛复习题按近期错题频次加权
//
// 设计依据：
//   - Spec 2026-04-18 §5.6「复习题主题抽样」：最近 N 道错题频次 → 主题权重
//   - Plan §6（2026-04-18）补做决策：N=50，权重 = 1 + 该主题出现次数（加 1 平滑）
//   - 硬约束保留：§5.5 难度桶 / §5.6 复习池主题范围 / §5.7 自检
//   - 约束外沿用：低于复习池难度下限的错题不参与加权（§5.6「低档错题不沿用」）
//
// 本套测试只覆盖"主题分布函数"这一纯函数契约；难度分配、自检由原有用例保障。

import { describe, it, expect } from 'vitest';
import { distributeReviewTopics } from './review-weighting';
import type { WrongQuestion, Question, TopicId } from '@/types';
import type { DifficultyRange } from '@/constants/rank-match';

// ─── 辅助：构造最小可用的 WrongQuestion ───

function makeWrong(topicId: TopicId, difficulty: number, wrongAt: number): WrongQuestion {
  const question: Question = {
    id: `q-${topicId}-${wrongAt}`,
    topicId,
    difficulty,
    type: 'numeric-input',
    stem: '',
    data: { kind: 'mental-arithmetic', subtype: 'add', subtypeTag: 'mock' } as unknown as Question['data'],
    solution: { answer: 0 },
    hints: [],
  };
  return { question, wrongAnswer: '0', wrongAt };
}

// pro 复习池：rookie 的 4 个题型
const proReviewTopics: TopicId[] = [
  'mental-arithmetic',
  'number-sense',
  'vertical-calc',
  'operation-laws',
];
const proReviewRange: DifficultyRange = { min: 2, max: 5 };

// ─── 1. 基础契约：长度 & 主题合法性 ───

describe('distributeReviewTopics · 基础契约', () => {
  it('返回数组长度严格等于 count', () => {
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 6,
      wrongQuestions: [],
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    expect(out).toHaveLength(6);
  });

  it('所有元素必须来自 reviewTopics（不得引入非复习池主题）', () => {
    const wqs: WrongQuestion[] = [
      makeWrong('decimal-ops', 3, 100), // decimal-ops 不在 pro review 范围，应被忽略
      makeWrong('bracket-ops', 4, 101),
    ];
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 5,
      wrongQuestions: wqs,
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    for (const t of out) expect(proReviewTopics).toContain(t);
  });

  it('count=0 返回空数组', () => {
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 0,
      wrongQuestions: [],
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    expect(out).toEqual([]);
  });
});

// ─── 2. 无错题历史 → 均匀回落（向后兼容当前行为） ───

describe('distributeReviewTopics · 无错题历史 → 均匀回落', () => {
  it('空 wrongQuestions：4 主题 / 8 道 → 每主题各 2 道', () => {
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 8,
      wrongQuestions: [],
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    const counts: Record<string, number> = {};
    for (const t of out) counts[t] = (counts[t] ?? 0) + 1;
    for (const topic of proReviewTopics) {
      expect(counts[topic]).toBe(2);
    }
  });

  it('所有错题都被"低档"过滤后 → 均匀回落', () => {
    // reviewRange.min=2；全部 difficulty=1 的错题都不参与加权
    const wqs: WrongQuestion[] = proReviewTopics.flatMap((t, i) =>
      [0, 1].map(k => makeWrong(t, 1, 100 + i * 10 + k)),
    );
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 8,
      wrongQuestions: wqs,
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    const counts: Record<string, number> = {};
    for (const t of out) counts[t] = (counts[t] ?? 0) + 1;
    for (const topic of proReviewTopics) {
      expect(counts[topic]).toBe(2);
    }
  });
});

// ─── 3. 加权分配：错题频次驱动主题比例 ───

describe('distributeReviewTopics · 加权分配', () => {
  it('加 1 平滑：只在 mental-arithmetic 错 4 题 / 其他 0 题 → weight 5:1:1:1；count=8 分配 → mental-arithmetic >= 其他各', () => {
    const wqs = [
      makeWrong('mental-arithmetic', 3, 100),
      makeWrong('mental-arithmetic', 3, 101),
      makeWrong('mental-arithmetic', 4, 102),
      makeWrong('mental-arithmetic', 5, 103),
    ];
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 8,
      wrongQuestions: wqs,
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    const counts: Record<string, number> = {};
    for (const t of out) counts[t] = (counts[t] ?? 0) + 1;
    // weight 比 5:1:1:1，总权 8，总题 8 → mental-arithmetic ≈ 5 道，其他各 1 道
    expect(counts['mental-arithmetic']).toBe(5);
    expect(counts['number-sense']).toBe(1);
    expect(counts['vertical-calc']).toBe(1);
    expect(counts['operation-laws']).toBe(1);
  });

  it('所有复习主题至少分到 1 道（加 1 平滑保底）', () => {
    const wqs = Array.from({ length: 10 }, (_, i) =>
      makeWrong('mental-arithmetic', 3, 100 + i),
    );
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 4, // 恰好 1 道 per 主题
      wrongQuestions: wqs,
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    const counts: Record<string, number> = {};
    for (const t of out) counts[t] = (counts[t] ?? 0) + 1;
    for (const topic of proReviewTopics) {
      expect(counts[topic]).toBeGreaterThanOrEqual(1);
    }
  });

  it('windowSize=50：超出窗口的更早错题不参与加权', () => {
    // 最近 50 条全部是 number-sense；更早（wrongAt 更小）50 条是 mental-arithmetic
    const old = Array.from({ length: 50 }, (_, i) =>
      makeWrong('mental-arithmetic', 3, i), // wrongAt 0..49
    );
    const recent = Array.from({ length: 50 }, (_, i) =>
      makeWrong('number-sense', 3, 1000 + i), // wrongAt 1000..1049
    );
    const out = distributeReviewTopics({
      reviewTopics: proReviewTopics,
      count: 8,
      wrongQuestions: [...old, ...recent],
      reviewRange: proReviewRange,
      windowSize: 50,
    });
    const counts: Record<string, number> = {};
    for (const t of out) counts[t] = (counts[t] ?? 0) + 1;
    // 有效窗口 weight: mental-arithmetic=1, number-sense=51, vertical-calc=1, operation-laws=1
    // 总权 54，8 道按比例 → number-sense 应 >= 5 道，mental-arithmetic ≤ 1
    expect(counts['number-sense']).toBeGreaterThanOrEqual(5);
    expect(counts['mental-arithmetic']).toBe(1);
  });
});

// ─── 4. 低档错题不沿用（§5.6） ───

describe('distributeReviewTopics · 低档错题过滤', () => {
  it('错题 difficulty < reviewRange.min 时不参与加权', () => {
    const wqs = [
      // expert review min=5
      makeWrong('vertical-calc', 3, 100), // <5 不计入
      makeWrong('vertical-calc', 4, 101), // <5 不计入
      makeWrong('operation-laws', 5, 102), // >=5 计入
      makeWrong('operation-laws', 6, 103), // >=5 计入
    ];
    const expertReviewTopics: TopicId[] = [
      'mental-arithmetic', 'number-sense', 'vertical-calc', 'operation-laws',
      'decimal-ops', 'bracket-ops', 'multi-step', 'equation-transpose',
    ];
    const expertReviewRange: DifficultyRange = { min: 5, max: 7 };
    const out = distributeReviewTopics({
      reviewTopics: expertReviewTopics,
      count: 10,
      wrongQuestions: wqs,
      reviewRange: expertReviewRange,
      windowSize: 50,
    });
    const counts: Record<string, number> = {};
    for (const t of out) counts[t] = (counts[t] ?? 0) + 1;
    // weight: operation-laws=3, 其它=1，共 10；10 道 → operation-laws=3，其它各 1
    expect(counts['operation-laws']).toBe(3);
    // vertical-calc 因为只有 <5 的错题，被过滤后仅剩基础 1 权
    expect(counts['vertical-calc']).toBe(1);
  });
});

// ─── 5. 确定性：相同输入 → 相同分配 ───

describe('distributeReviewTopics · 确定性', () => {
  it('同一批输入多次调用返回相同主题分布（不随机）', () => {
    const wqs = [
      makeWrong('mental-arithmetic', 3, 100),
      makeWrong('mental-arithmetic', 4, 101),
      makeWrong('number-sense', 3, 102),
    ];
    const run = () =>
      distributeReviewTopics({
        reviewTopics: proReviewTopics,
        count: 7,
        wrongQuestions: wqs,
        reviewRange: proReviewRange,
        windowSize: 50,
      });
    const a = run();
    const b = run();
    expect(a).toEqual(b);
  });
});
