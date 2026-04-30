import { describe, expect, it } from 'vitest';
import {
  buildLongDivisionBoardData,
  classifyLongDivisionSubmission,
  getLongDivisionOrderedInputKeys,
  normalizeLongDivisionNumberText,
} from './longDivision';

describe('longDivision engine', () => {
  it('normalizes long division number text for engine and UI comparisons', () => {
    expect(normalizeLongDivisionNumberText(' 0012.3400 ')).toBe('12.34');
    expect(normalizeLongDivisionNumberText('')).toBe('0');
    expect(normalizeLongDivisionNumberText('-000.500')).toBe('-0.5');
    expect(normalizeLongDivisionNumberText('1a2.3b0')).toBe('12.3');
  });

  it('builds standard rounds for integer long division with repeated remainder transfer', () => {
    const board = buildLongDivisionBoardData({
      kind: 'integer',
      dividend: '936',
      divisor: '4',
      finalAnswer: '234',
    });

    expect(board).toMatchObject({
      mode: 'integer',
      originalDividend: '936',
      originalDivisor: '4',
      workingDividend: '936',
      workingDivisor: '4',
      finalAnswer: '234',
      quotientStartColumn: 0,
      quotientDecimalAfter: null,
    });
    expect(board.rounds.map(round => ({
      current: round.currentPartialDividend,
      quotient: round.quotientDigit,
      product: round.product,
      remainder: round.remainder,
      next: round.nextPartialDividend,
    }))).toEqual([
      { current: '9', quotient: '2', product: '8', remainder: '1', next: '13' },
      { current: '13', quotient: '3', product: '12', remainder: '1', next: '16' },
      { current: '16', quotient: '4', product: '16', remainder: '0', next: undefined },
    ]);
  });

  it('adds decimal divisor conversion fields before the board', () => {
    const board = buildLongDivisionBoardData({
      kind: 'decimal-divisor',
      dividend: '15.6',
      divisor: '0.24',
      finalAnswer: '65',
    });

    expect(board.mode).toBe('decimal-divisor');
    expect(board.workingDividend).toBe('1560');
    expect(board.workingDivisor).toBe('24');
    expect(board.setupFields).toEqual([
      { id: 'setup-scale', label: '除数扩大', expected: '100', allowDecimal: true },
      { id: 'setup-divisor', label: '转换后除数', expected: '24', allowDecimal: true, mustBeInteger: true },
      { id: 'setup-dividend', label: '转换后被除数', expected: '1560', allowDecimal: true },
    ]);
    expect(getLongDivisionOrderedInputKeys(board).slice(0, 3)).toEqual([
      'setup-scale',
      'setup-divisor',
      'setup-dividend',
    ]);
  });

  it('builds decimal-dividend rounds with quotient decimal alignment', () => {
    const board = buildLongDivisionBoardData({
      kind: 'decimal-dividend',
      dividend: '12.6',
      divisor: '3',
      finalAnswer: '4.2',
    });

    expect(board).toMatchObject({
      mode: 'decimal-dividend',
      workingDividend: '12.6',
      workingDivisor: '3',
      quotientStartColumn: 1,
      quotientDecimalAfter: 1,
    });
    expect(board.rounds.map(round => ({
      current: round.currentPartialDividend,
      quotient: round.quotientDigit,
      product: round.product,
      remainder: round.remainder,
      next: round.nextPartialDividend,
    }))).toEqual([
      { current: '12', quotient: '4', product: '12', remainder: '0', next: '6' },
      { current: '6', quotient: '2', product: '6', remainder: '0', next: undefined },
    ]);
    expect(getLongDivisionOrderedInputKeys(board)).toEqual([
      'round-0-quotient',
      'round-0-product',
      'round-0-next',
      'round-1-quotient',
      'round-1-product',
      'round-1-remainder',
    ]);
  });

  it('keeps zero digits in the quotient as fillable process rounds', () => {
    const board = buildLongDivisionBoardData({
      kind: 'integer',
      dividend: '824',
      divisor: '4',
      finalAnswer: '206',
    });

    expect(board.rounds.map(round => ({
      current: round.currentPartialDividend,
      quotient: round.quotientDigit,
      product: round.product,
      remainder: round.remainder,
      next: round.nextPartialDividend,
    }))).toEqual([
      { current: '8', quotient: '2', product: '8', remainder: '0', next: '2' },
      { current: '2', quotient: '0', product: '0', remainder: '2', next: '24' },
      { current: '24', quotient: '6', product: '24', remainder: '0', next: undefined },
    ]);
    expect(board.expectedByKey['round-1-quotient']).toBe('0');
    expect(board.expectedByKey['round-1-product']).toBe('0');
  });

  it('builds a single-round division board without a next partial dividend', () => {
    const board = buildLongDivisionBoardData({
      kind: 'integer',
      dividend: '8',
      divisor: '4',
      finalAnswer: '2',
    });

    expect(board.rounds).toHaveLength(1);
    expect(board.rounds[0]).toMatchObject({
      currentPartialDividend: '8',
      quotientDigit: '2',
      product: '8',
      remainder: '0',
    });
    expect(board.rounds[0].nextPartialDividend).toBeUndefined();
    expect(getLongDivisionOrderedInputKeys(board)).toEqual([
      'round-0-quotient',
      'round-0-product',
      'round-0-remainder',
    ]);
  });

  it('supports approximation and cyclic result fields after the board', () => {
    const approximate = buildLongDivisionBoardData({
      kind: 'approximation',
      dividend: '8.5',
      divisor: '3',
      finalAnswer: '2.83',
      approximationPlaces: 2,
    });
    expect(approximate.resultFields).toEqual([
      { id: 'result-approximation', label: '保留两位小数', expected: '2.83', allowDecimal: true },
    ]);

    const cyclic = buildLongDivisionBoardData({
      kind: 'cyclic',
      dividend: '14',
      divisor: '135',
      finalAnswer: '0.1037037',
      cyclic: {
        nonRepeating: '0.1',
        repeating: '037',
      },
    });
    expect(cyclic.resultFields).toEqual([
      { id: 'result-non-repeating', label: '非循环部分', expected: '0.1', allowDecimal: true },
      { id: 'result-repeating', label: '循环节', expected: '037', allowDecimal: false },
    ]);
    expect(cyclic.cyclic?.displayText).toBe('0.1037');
  });

  it('classifies process mistakes without exposing expected process values', () => {
    const board = buildLongDivisionBoardData({
      kind: 'integer',
      dividend: '936',
      divisor: '4',
      finalAnswer: '234',
    });
    const values = Object.fromEntries(
      getLongDivisionOrderedInputKeys(board).map(key => [key, board.expectedByKey[key]]),
    );
    values['round-0-quotient'] = '3';

    const result = classifyLongDivisionSubmission({ board, values });

    expect(result.result).toBe('failProcess');
    if (result.result !== 'failProcess') throw new Error('expected process failure');
    expect(result.failureReason).toBe('vertical-long-division-process');
    expect(result.failureDetail).toMatchObject({
      reason: 'vertical-long-division-process',
      source: 'long-division',
      message: '本题未通过：竖式过程有误。',
      processCategories: [
        { code: 'long-division-round-0-quotient', label: '第 1 轮商位错误' },
      ],
      trainingFieldMistakes: [],
    });
  });

  it('classifies mixed process and structured result mistakes together', () => {
    const board = buildLongDivisionBoardData({
      kind: 'approximation',
      dividend: '8.5',
      divisor: '3',
      finalAnswer: '2.83',
      approximationPlaces: 2,
    });
    const values = Object.fromEntries(
      getLongDivisionOrderedInputKeys(board).map(key => [key, board.expectedByKey[key]]),
    );
    values['round-0-quotient'] = '3';
    values['result-approximation'] = '2.84';

    const result = classifyLongDivisionSubmission({ board, values });

    expect(result.result).toBe('failProcess');
    if (result.result !== 'failProcess') throw new Error('expected mixed failure');
    expect(result.failureReason).toBe('vertical-long-division-process');
    expect(result.failureDetail).toMatchObject({
      reason: 'vertical-long-division-process',
      source: 'long-division',
      message: '本题未通过：竖式过程和结构化字段都有误。',
      processCategories: [
        { code: 'long-division-round-0-quotient', label: '第 1 轮商位错误' },
      ],
      trainingFieldMistakes: [
        {
          code: 'result-approximation',
          label: '保留两位小数错误',
          userValue: '2.84',
          expectedValue: '2.83',
        },
      ],
    });
  });

  it('classifies structured result mistakes with user and expected values', () => {
    const board = buildLongDivisionBoardData({
      kind: 'approximation',
      dividend: '8.5',
      divisor: '3',
      finalAnswer: '2.83',
      approximationPlaces: 2,
    });
    const values = Object.fromEntries(
      getLongDivisionOrderedInputKeys(board).map(key => [key, board.expectedByKey[key]]),
    );
    values['result-approximation'] = '2.84';

    const result = classifyLongDivisionSubmission({ board, values });

    expect(result.result).toBe('failProcess');
    if (result.result !== 'failProcess') throw new Error('expected structured failure');
    expect(result.failureReason).toBe('vertical-training-field');
    expect(result.failureDetail).toMatchObject({
      reason: 'vertical-training-field',
      source: 'long-division',
      message: '本题未通过：结果表达有误。',
      processCategories: [],
      trainingFieldMistakes: [
        {
          code: 'result-approximation',
          label: '保留两位小数错误',
          userValue: '2.84',
          expectedValue: '2.83',
        },
      ],
    });
  });
});
