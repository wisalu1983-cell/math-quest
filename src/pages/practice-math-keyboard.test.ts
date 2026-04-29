import { describe, expect, it, vi } from 'vitest';
import {
  ALL_MATH_KEYBOARD_KEYS,
  applyMathKeyboardKey,
  createMathKeyboardInitialState,
  isMathKeyboardKeyEnabled,
  mathKeyboardReducer,
  resolveAutoAdvanceSlotId,
  sanitizeDecimalInput,
  sanitizeDigitInput,
  sanitizeExpressionInput,
} from './practice-math-keyboard';
import type { MathInputSlot, MathKeyboardKey } from './practice-math-keyboard';

function makeSlot(overrides: Partial<MathInputSlot> = {}): MathInputSlot {
  return {
    id: 'answer-main',
    label: '答案',
    value: '',
    enabledKeys: ['0', '1', '2', '3', 'delete'],
    setValue: vi.fn(),
    ...overrides,
  };
}

describe('practice-math-keyboard core input', () => {
  it('keeps the keypad order aligned to the compact 3-column input and 2-column symbol layout', () => {
    expect(ALL_MATH_KEYBOARD_KEYS).toEqual([
      '1', '2', '3', '=', 'delete',
      '4', '5', '6', '+', '-',
      '7', '8', '9', '×', '÷',
      '.', '0', 'x', '(', ')',
    ]);
  });

  it('uses the first slot as active slot when creating state', () => {
    const state = createMathKeyboardInitialState([
      makeSlot({ id: 'answer-main' }),
      makeSlot({ id: 'remainder' }),
    ]);

    expect(state.activeSlotId).toBe('answer-main');
    expect(state.useSystemKeyboardForSlotId).toBeNull();
  });

  it('keeps active slot stable when slots refresh and falls back if the slot disappears', () => {
    const state = mathKeyboardReducer(
      { activeSlotId: 'remainder', useSystemKeyboardForSlotId: null },
      {
        type: 'syncSlots',
        slots: [makeSlot({ id: 'answer-main' }), makeSlot({ id: 'remainder' })],
      },
    );
    expect(state.activeSlotId).toBe('remainder');

    const next = mathKeyboardReducer(state, {
      type: 'syncSlots',
      slots: [makeSlot({ id: 'answer-main' })],
    });
    expect(next.activeSlotId).toBe('answer-main');
  });

  it('applies delete and slot sanitize before returning the next value', () => {
    const slot = makeSlot({
      value: '12',
      maxLength: 3,
      enabledKeys: ['0', '1', '2', '3', '4', 'delete'],
      sanitizeInput: sanitizeDigitInput,
    });

    expect(applyMathKeyboardKey(slot, '3')).toBe('123');
    expect(applyMathKeyboardKey({ ...slot, value: '123' }, '4')).toBe('234');
    expect(applyMathKeyboardKey({ ...slot, value: '123' }, 'delete')).toBe('12');
    expect(applyMathKeyboardKey(slot, '×')).toBe('12');
  });

  it('keeps one decimal point and one leading minus sign for decimal slots', () => {
    const slot = makeSlot({
      value: '-1.2',
      enabledKeys: ['0', '1', '2', '3', '.', '-', 'delete'],
      sanitizeInput: sanitizeDecimalInput,
    });

    expect(applyMathKeyboardKey(slot, '.')).toBe('-1.2');
    expect(applyMathKeyboardKey(slot, '3')).toBe('-1.23');
    expect(applyMathKeyboardKey({ ...slot, value: '12' }, '-')).toBe('-12');
    expect(applyMathKeyboardKey({ ...slot, value: '-' }, '-')).toBe('-');
  });

  it('allows expression symbols only for expression slots while keeping layout stable', () => {
    const expressionSlot = makeSlot({
      value: '3x',
      enabledKeys: ALL_MATH_KEYBOARD_KEYS,
      sanitizeInput: sanitizeExpressionInput,
    });
    const digitSlot = makeSlot({
      value: '3',
      enabledKeys: ['0', '1', '2', '3', 'delete'],
      sanitizeInput: sanitizeDigitInput,
    });

    expect(applyMathKeyboardKey(expressionSlot, '+')).toBe('3x+');
    expect(applyMathKeyboardKey(expressionSlot, '(')).toBe('3x(');
    expect(isMathKeyboardKeyEnabled(expressionSlot, '×')).toBe(true);
    expect(isMathKeyboardKeyEnabled(digitSlot, '×')).toBe(false);
    expect(ALL_MATH_KEYBOARD_KEYS).toContain('×');
    expect(ALL_MATH_KEYBOARD_KEYS).toContain('delete');
  });
});

describe('practice-math-keyboard auto advance', () => {
  it('keeps the active slot when the slot does not opt into auto advance', () => {
    const slots = [
      makeSlot({ id: 'first', value: '' }),
      makeSlot({ id: 'second', value: '' }),
    ];

    expect(resolveAutoAdvanceSlotId({
      slots,
      activeSlotId: 'first',
      key: '1',
      previousValue: '',
      nextValue: '1',
    })).toBeNull();
  });

  it('never advances after delete even when the slot completion rule would pass', () => {
    const slots = [
      makeSlot({
        id: 'first',
        value: '1',
        shouldAutoAdvance: () => true,
      }),
      makeSlot({ id: 'second', value: '' }),
    ];

    expect(resolveAutoAdvanceSlotId({
      slots,
      activeSlotId: 'first',
      key: 'delete',
      previousValue: '1',
      nextValue: '',
    })).toBeNull();
  });

  it('advances to the next slot when the active slot completion rule passes', () => {
    const calls: Array<{
      key: MathKeyboardKey;
      previousValue: string;
      nextValue: string;
    }> = [];
    const slots = [
      makeSlot({
        id: 'first',
        value: '',
        shouldAutoAdvance: params => {
          calls.push(params);
          return params.nextValue.length >= 1;
        },
      }),
      makeSlot({ id: 'second', value: '' }),
    ];

    expect(resolveAutoAdvanceSlotId({
      slots,
      activeSlotId: 'first',
      key: '1',
      previousValue: '',
      nextValue: '1',
    })).toBe('second');
    expect(calls).toEqual([{ key: '1', previousValue: '', nextValue: '1' }]);
  });

  it('does not advance past the final slot', () => {
    const slots = [
      makeSlot({ id: 'first', value: '' }),
      makeSlot({
        id: 'last',
        value: '',
        shouldAutoAdvance: () => true,
      }),
    ];

    expect(resolveAutoAdvanceSlotId({
      slots,
      activeSlotId: 'last',
      key: '1',
      previousValue: '',
      nextValue: '1',
    })).toBeNull();
  });
});
