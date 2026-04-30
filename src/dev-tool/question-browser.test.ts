import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore, useUIStore, useUserStore } from '@/store';
import type { User } from '@/types';
import {
  getQuestionBrowserSubtypes,
  getQuestionBrowserTopics,
  refreshQuestionBrowserPractice,
  startQuestionBrowserPractice,
} from './question-browser';

function makeUser(): User {
  return {
    id: 'u-question-browser',
    nickname: 'Dev',
    avatarSeed: 'dev',
    createdAt: 0,
    settings: { soundEnabled: true, hapticsEnabled: true },
  };
}

describe('dev-tool question browser', () => {
  beforeEach(() => {
    useUserStore.setState({ user: makeUser() });
    useSessionStore.setState({
      active: false,
      session: null,
      currentQuestion: null,
      currentIndex: 0,
      totalQuestions: 0,
      hearts: 3,
      showFeedback: false,
      pendingWrongQuestions: [],
      rankQuestionQueue: [],
      sessionDuplicateSignatures: new Set<string>(),
    });
    useUIStore.setState({ currentPage: 'home' });
  });

  it('枚举所有题型，并为子题型提供可生成的代表 difficulty', () => {
    expect(getQuestionBrowserTopics().map(topic => topic.id)).toContain('vertical-calc');

    const subtypes = getQuestionBrowserSubtypes('vertical-calc');
    expect(subtypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tag: 'int-add', difficulty: expect.any(Number) }),
        expect.objectContaining({ tag: 'dec-div', difficulty: expect.any(Number) }),
      ]),
    );
  });

  it('竖式笔算会显式展开 6 个长除法 UI 场景', () => {
    const longDivisionItems = getQuestionBrowserSubtypes('vertical-calc')
      .filter(subtype => subtype.id.startsWith('vertical-calc.long-division.'));

    expect(longDivisionItems.map(item => item.id)).toEqual([
      'vertical-calc.long-division.integer-remainder',
      'vertical-calc.long-division.middle-zero',
      'vertical-calc.long-division.decimal-dividend',
      'vertical-calc.long-division.decimal-divisor',
      'vertical-calc.long-division.approximation',
      'vertical-calc.long-division.cyclic',
    ]);
  });

  it('竖式笔算会显式展开乘法 UI 场景', () => {
    const multiplicationItems = getQuestionBrowserSubtypes('vertical-calc')
      .filter(subtype => subtype.id.startsWith('vertical-calc.multiplication.'));

    expect(multiplicationItems.map(item => item.id)).toEqual([
      'vertical-calc.multiplication.legacy-3digit-by-1digit',
      'vertical-calc.multiplication.integer-2digit-by-2digit',
      'vertical-calc.multiplication.integer-3digit-by-2digit',
      'vertical-calc.multiplication.integer-internal-zero',
      'vertical-calc.multiplication.decimal-by-integer',
      'vertical-calc.multiplication.decimal-by-decimal',
      'vertical-calc.multiplication.approximation',
    ]);
  });

  it('题型目录会展开玩家实际遇到的内部细分子题型', () => {
    expect(getQuestionBrowserSubtypes('multi-step').map(item => item.id)).toEqual(
      expect.arrayContaining([
        'multi-step.core.recognize-simplifiable',
        'multi-step.core.fill-split-mid',
        'multi-step.core.hidden-factor-exec',
        'multi-step.law.law-identify',
        'multi-step.bracket.bracket-remove-plus',
      ]),
    );
    expect(getQuestionBrowserSubtypes('equation-transpose').map(item => item.id)).toEqual(
      expect.arrayContaining([
        'equation-transpose.trap.T1-lite',
        'equation-transpose.trap.T2',
        'equation-transpose.trap.T3+T4',
      ]),
    );
  });

  it('长除法 UI 场景入口会启动对应版式的数据', () => {
    const cases = [
      ['vertical-calc.long-division.integer-remainder', 'integer', '234'],
      ['vertical-calc.long-division.middle-zero', 'integer', '206'],
      ['vertical-calc.long-division.decimal-dividend', 'decimal-dividend', '1.92'],
      ['vertical-calc.long-division.decimal-divisor', 'decimal-divisor', '65'],
      ['vertical-calc.long-division.approximation', 'approximation', '2.83'],
      ['vertical-calc.long-division.cyclic', 'cyclic', '0.1037'],
    ] as const;

    for (const [subtypeId, mode, finalAnswer] of cases) {
      const question = startQuestionBrowserPractice({
        topicId: 'vertical-calc',
        subtypeId,
      });
      const board = question.data.kind === 'vertical-calc'
        ? question.data.longDivisionBoard
        : undefined;

      expect(board?.mode, subtypeId).toBe(mode);
      expect(board?.finalAnswer, subtypeId).toBe(finalAnswer);
    }
  });

  it('乘法 UI 场景入口会启动对应版式的数据', () => {
    const legacy = startQuestionBrowserPractice({
      topicId: 'vertical-calc',
      subtypeId: 'vertical-calc.multiplication.legacy-3digit-by-1digit',
    });
    expect(legacy.type).toBe('vertical-fill');
    expect(legacy.data.kind).toBe('vertical-calc');
    if (legacy.data.kind === 'vertical-calc') {
      expect(legacy.data.operation).toBe('×');
      expect(legacy.data.multiplicationBoard).toBeUndefined();
      expect(legacy.data.steps.length).toBeGreaterThan(0);
    }

    const integerCases = [
      'vertical-calc.multiplication.integer-2digit-by-2digit',
      'vertical-calc.multiplication.integer-3digit-by-2digit',
      'vertical-calc.multiplication.integer-internal-zero',
    ];
    for (const subtypeId of integerCases) {
      const question = startQuestionBrowserPractice({ topicId: 'vertical-calc', subtypeId });
      expect(question.type, subtypeId).toBe('vertical-fill');
      expect(question.data.kind, subtypeId).toBe('vertical-calc');
      if (question.data.kind === 'vertical-calc') {
        expect(question.data.operation, subtypeId).toBe('×');
        expect(question.data.multiplicationBoard, subtypeId).toMatchObject({
          mode: 'integer',
          operandInputMode: 'static',
        });
      }
    }

    const decimalCases = [
      ['vertical-calc.multiplication.decimal-by-integer', [2, 0], '93.38'],
      ['vertical-calc.multiplication.decimal-by-decimal', [2, 2], '6.4998'],
    ] as const;
    for (const [subtypeId, operandDecimalPlaces, finalAnswer] of decimalCases) {
      const question = startQuestionBrowserPractice({ topicId: 'vertical-calc', subtypeId });
      expect(question.type, subtypeId).toBe('vertical-fill');
      expect(question.data.kind, subtypeId).toBe('vertical-calc');
      if (question.data.kind === 'vertical-calc') {
        expect(question.data.operation, subtypeId).toBe('×');
        expect(question.data.multiplicationBoard, subtypeId).toMatchObject({
          mode: 'decimal',
          operandInputMode: 'blank',
          operandDecimalPlaces,
          finalAnswer,
        });
      }
    }

    const approximate = startQuestionBrowserPractice({
      topicId: 'vertical-calc',
      subtypeId: 'vertical-calc.multiplication.approximation',
    });
    expect(approximate.type).toBe('numeric-input');
    expect(approximate.data.kind).toBe('vertical-calc');
    if (approximate.data.kind === 'vertical-calc') {
      expect(approximate.data.operation).toBe('×');
      expect(approximate.data.multiplicationBoard).toBeUndefined();
      expect(approximate.data.longDivisionBoard).toBeUndefined();
    }
  });

  it('可按题型 + 子题型直接启动一题 Practice 页面', () => {
    const question = startQuestionBrowserPractice({
      topicId: 'vertical-calc',
      subtypeId: 'vertical-calc.long-division.decimal-divisor',
    });

    const sessionState = useSessionStore.getState();
    expect(question.topicId).toBe('vertical-calc');
    expect(sessionState.active).toBe(true);
    expect(sessionState.totalQuestions).toBe(1);
    expect(sessionState.currentQuestion?.id).toBe(question.id);
    expect(sessionState.session?.targetLevelId).toBeNull();
    expect(useUIStore.getState().currentPage).toBe('practice');
  });

  it('刷新当前子题型会替换成同一入口下的新题', () => {
    const first = startQuestionBrowserPractice({
      topicId: 'multi-step',
      subtypeId: 'multi-step.core.recognize-simplifiable',
    });
    const second = refreshQuestionBrowserPractice({
      topicId: 'multi-step',
      subtypeId: 'multi-step.core.recognize-simplifiable',
    });

    expect(second.id).not.toBe(first.id);
    expect(useSessionStore.getState().currentQuestion?.id).toBe(second.id);
    expect(second.data.kind).toBe('multi-step');
    if (second.data.kind === 'multi-step') {
      expect(second.data.subtype).toBe('recognize-simplifiable');
    }
  });

  it('所有暴露在题型一览里的子题型都能启动样题', () => {
    for (const topic of getQuestionBrowserTopics()) {
      const subtypes = getQuestionBrowserSubtypes(topic.id);
      expect(subtypes.length, topic.id).toBeGreaterThan(0);

      for (const subtype of subtypes) {
        const question = startQuestionBrowserPractice({
          topicId: topic.id,
          subtypeId: subtype.id,
        });
        expect(question.topicId, `${topic.id}/${subtype.tag}`).toBe(topic.id);
      }
    }
  });
});
