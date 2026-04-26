import { describe, expect, it } from 'vitest';
import type { VerticalCalcStep } from '@/types';
import type { VerticalCalcPolicyColumn, VerticalCalcValues } from './vertical-calc-policy';
import {
  buildFocusOrder,
  buildVerticalCalcPolicyColumns,
  canSubmitVerticalCalc,
  classifyVerticalCalcResult,
  getNextFocus,
  getVisibleProcessColumns,
  isCellComplete,
} from './vertical-calc-policy';

const col = (
  answerExpected: number,
  processExpected = 0,
  hasProcessSlot = true,
): VerticalCalcPolicyColumn => ({
  answerExpected,
  processExpected,
  hasProcessSlot,
});

const values = (
  answers: Record<number, string | undefined> = {},
  processes: Record<number, string | undefined> = {},
): VerticalCalcValues => ({ answers, processes });

describe('vertical-calc-policy · visibility and required cells', () => {
  it('从 generator steps 派生 work item 列，并补齐低档需要展示的 0 过程格', () => {
    const steps: VerticalCalcStep[] = [
      { stepIndex: 0, stepType: 'digit', column: 0, row: 0, expectedDigit: 7, skippable: false, hint: '个位' },
      { stepIndex: 1, stepType: 'carry', column: 1, row: 0, expectedDigit: 1, skippable: false, hint: '向十位进1' },
      { stepIndex: 2, stepType: 'digit', column: 1, row: 0, expectedDigit: 8, skippable: false, hint: '十位' },
      { stepIndex: 3, stepType: 'carry', column: 2, row: 0, expectedDigit: 1, skippable: false, hint: '向百位进1' },
      { stepIndex: 4, stepType: 'digit', column: 2, row: 0, expectedDigit: 8, skippable: false, hint: '百位' },
      { stepIndex: 5, stepType: 'carry', column: 3, row: 0, expectedDigit: 1, skippable: false, hint: '向千位进1' },
      { stepIndex: 6, stepType: 'digit', column: 3, row: 0, expectedDigit: 1, skippable: false, hint: '千位' },
    ];

    expect(buildVerticalCalcPolicyColumns(steps)).toEqual([
      col(7, 0, true),
      col(8, 1, true),
      col(8, 1, true),
      col(1, 1, true),
    ]);
  });

  it('低档和中档显示过程格，高档隐藏过程格', () => {
    const columns = [col(7), col(8, 1), col(8, 1), col(1, 1)];

    expect(getVisibleProcessColumns({ difficulty: 5, columns })).toEqual([0, 1, 2, 3]);
    expect(getVisibleProcessColumns({ difficulty: 6, columns })).toEqual([0, 1, 2, 3]);
    expect(getVisibleProcessColumns({ difficulty: 8, columns })).toEqual([]);
  });

  it('低档默认焦点链按计算步骤纳入过程格，中档和高档只包含答案格', () => {
    const columns = [col(9, 0), col(7, 0), col(5, 0)];

    expect(buildFocusOrder({ difficulty: 5, columns })).toEqual([
      { kind: 'answer', col: 0 },
      { kind: 'process', col: 1 },
      { kind: 'answer', col: 1 },
      { kind: 'process', col: 2 },
      { kind: 'answer', col: 2 },
    ]);
    expect(buildFocusOrder({ difficulty: 6, columns })).toEqual([
      { kind: 'answer', col: 0 },
      { kind: 'answer', col: 1 },
      { kind: 'answer', col: 2 },
    ]);
    expect(buildFocusOrder({ difficulty: 8, columns })).toEqual([
      { kind: 'answer', col: 0 },
      { kind: 'answer', col: 1 },
      { kind: 'answer', col: 2 },
    ]);
  });
});

describe('vertical-calc-policy · completion', () => {
  it('答案格只接受单个数字', () => {
    expect(isCellComplete({ operation: '+', cellKind: 'answer', value: '8' })).toBe(true);
    expect(isCellComplete({ operation: '+', cellKind: 'answer', value: '' })).toBe(false);
    expect(isCellComplete({ operation: '+', cellKind: 'answer', value: '12' })).toBe(false);
  });

  it('减法退位格的单独负号不完整，-1 才完整', () => {
    expect(isCellComplete({ operation: '-', cellKind: 'process', value: '-' })).toBe(false);
    expect(isCellComplete({ operation: '-', cellKind: 'process', value: '-1' })).toBe(true);
    expect(isCellComplete({ operation: '-', cellKind: 'process', value: '0' })).toBe(true);
  });

  it('加法过程格只接受 0/1，乘法过程格只接受 0-8', () => {
    expect(isCellComplete({ operation: '+', cellKind: 'process', value: '1' })).toBe(true);
    expect(isCellComplete({ operation: '+', cellKind: 'process', value: '2' })).toBe(false);
    expect(isCellComplete({ operation: '×', cellKind: 'process', value: '8' })).toBe(true);
    expect(isCellComplete({ operation: '×', cellKind: 'process', value: '9' })).toBe(false);
  });
});

describe('vertical-calc-policy · focus', () => {
  it('低档 999+888 填完个位答案后默认跳到十位进位格，主动填进位格后跳到十位答案格', () => {
    const columns = [col(7, 0), col(8, 1), col(8, 1), col(1, 1)];

    const afterUnits = getNextFocus({
      operation: '+',
      difficulty: 5,
      columns,
      currentCell: { kind: 'answer', col: 0 },
      values: values({ 0: '7' }),
    });
    expect(afterUnits).toEqual({ kind: 'process', col: 1 });

    const afterCarry = getNextFocus({
      operation: '+',
      difficulty: 5,
      columns,
      currentCell: { kind: 'process', col: 1 },
      values: values({ 0: '7' }, { 1: '1' }),
    });
    expect(afterCarry).toEqual({ kind: 'answer', col: 1 });
  });

  it('低档 0 过程格可以通过 Enter/Tab 手动跳到下一个格子', () => {
    const columns = [col(9, 0), col(7, 0), col(5, 0)];

    expect(getNextFocus({
      operation: '+',
      difficulty: 5,
      columns,
      currentCell: { kind: 'process', col: 1 },
      values: values({ 0: '9' }),
      action: 'enter',
    })).toEqual({ kind: 'answer', col: 1 });

    expect(getNextFocus({
      operation: '+',
      difficulty: 5,
      columns,
      currentCell: { kind: 'process', col: 1 },
      values: values({ 0: '9' }),
      action: 'tab',
    })).toEqual({ kind: 'answer', col: 1 });
  });

  it('中档答案格默认跳下一个答案格，主动填过程格后跳同列答案格', () => {
    const columns = [col(7, 0), col(8, 1), col(8, 1)];

    expect(getNextFocus({
      operation: '+',
      difficulty: 6,
      columns,
      currentCell: { kind: 'answer', col: 0 },
      values: values({ 0: '7' }),
    })).toEqual({ kind: 'answer', col: 1 });

    expect(getNextFocus({
      operation: '+',
      difficulty: 6,
      columns,
      currentCell: { kind: 'process', col: 1 },
      values: values({ 0: '7' }, { 1: '1' }),
    })).toEqual({ kind: 'answer', col: 1 });
  });
});

describe('vertical-calc-policy · submit result', () => {
  it('低档非 0 过程格未填时不能提交，0 过程格留空不阻塞', () => {
    const columns = [col(9, 0), col(7, 1), col(5, 0)];

    expect(canSubmitVerticalCalc({
      difficulty: 5,
      columns,
      values: values({ 0: '9', 1: '7', 2: '5' }),
    })).toEqual({ canSubmit: false, reason: 'missing-process' });

    expect(canSubmitVerticalCalc({
      difficulty: 5,
      columns,
      values: values({ 0: '9', 1: '7', 2: '5' }, { 1: '1' }),
    })).toEqual({ canSubmit: true, reason: null });
  });

  it('低档答案正确但过程格错误时 failProcess', () => {
    const columns = [col(7, 0), col(8, 1), col(8, 1), col(1, 1)];

    expect(classifyVerticalCalcResult({
      difficulty: 5,
      columns,
      values: values(
        { 0: '7', 1: '8', 2: '8', 3: '1' },
        { 1: '0', 2: '1', 3: '1' },
      ),
    })).toMatchObject({
      result: 'failProcess',
      feedbackReason: 'vertical-process',
      wrongCells: [{ kind: 'process', col: 1, expected: 1 }],
    });
  });

  it('中档答案正确但过程格错误时 passWithProcessWarning，且不输出板上错误格', () => {
    const columns = [col(7, 0), col(8, 1), col(8, 1), col(1, 1)];

    expect(classifyVerticalCalcResult({
      difficulty: 6,
      columns,
      values: values(
        { 0: '7', 1: '8', 2: '8', 3: '1' },
        { 1: '0' },
      ),
    })).toEqual({
      result: 'passWithProcessWarning',
      feedbackReason: 'vertical-process-warning',
      wrongCells: [],
    });
  });
});
