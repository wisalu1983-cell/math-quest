import { useEffect, useReducer, useState } from 'react';

export type MathKeyboardKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | '+'
  | '-'
  | '×'
  | '÷'
  | '('
  | ')'
  | '='
  | 'x'
  | 'delete';

export const ALL_MATH_KEYBOARD_KEYS: MathKeyboardKey[] = [
  '1', '2', '3', '=', 'delete',
  '4', '5', '6', '+', '-',
  '7', '8', '9', '×', '÷',
  '.', '0', 'x', '(', ')',
];

export const DIGIT_KEYS: MathKeyboardKey[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete'];
export const DECIMAL_KEYS: MathKeyboardKey[] = [...DIGIT_KEYS, '.', '-'];
export const EXPRESSION_KEYS: MathKeyboardKey[] = ALL_MATH_KEYBOARD_KEYS;

export interface MathInputSlot {
  id: string;
  label: string;
  value: string;
  maxLength?: number;
  enabledKeys: MathKeyboardKey[];
  sanitizeInput?: (raw: string, previous: string) => string;
  setValue: (next: string) => void;
  focusSystemInput?: () => void;
}

export interface MathKeyboardState {
  activeSlotId: string | null;
  useSystemKeyboardForSlotId: string | null;
}

export type MathKeyboardAction =
  | { type: 'syncSlots'; slots: MathInputSlot[] }
  | { type: 'setActiveSlot'; slotId: string | null }
  | { type: 'useSystemKeyboard'; slotId: string | null };

export function createMathKeyboardInitialState(slots: MathInputSlot[]): MathKeyboardState {
  return {
    activeSlotId: slots[0]?.id ?? null,
    useSystemKeyboardForSlotId: null,
  };
}

export function mathKeyboardReducer(
  state: MathKeyboardState,
  action: MathKeyboardAction,
): MathKeyboardState {
  switch (action.type) {
    case 'syncSlots': {
      const hasActive = action.slots.some(slot => slot.id === state.activeSlotId);
      const activeSlotId = hasActive ? state.activeSlotId : action.slots[0]?.id ?? null;
      const hasSystemSlot = action.slots.some(slot => slot.id === state.useSystemKeyboardForSlotId);
      return {
        activeSlotId,
        useSystemKeyboardForSlotId: hasSystemSlot ? state.useSystemKeyboardForSlotId : null,
      };
    }
    case 'setActiveSlot':
      return {
        ...state,
        activeSlotId: action.slotId,
        useSystemKeyboardForSlotId:
          action.slotId === state.useSystemKeyboardForSlotId ? state.useSystemKeyboardForSlotId : null,
      };
    case 'useSystemKeyboard':
      return {
        ...state,
        activeSlotId: action.slotId ?? state.activeSlotId,
        useSystemKeyboardForSlotId: action.slotId,
      };
  }
}

export function useMathKeyboardState(slots: MathInputSlot[]) {
  const [state, dispatch] = useReducer(
    mathKeyboardReducer,
    slots,
    createMathKeyboardInitialState,
  );

  useEffect(() => {
    dispatch({ type: 'syncSlots', slots });
  }, [slots]);

  return {
    state,
    setActiveSlotId: (slotId: string | null) => dispatch({ type: 'setActiveSlot', slotId }),
    setSystemKeyboardSlotId: (slotId: string | null) => dispatch({ type: 'useSystemKeyboard', slotId }),
  };
}

function getPrefersVirtualKeyboard(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 768;
}

export function usePrefersVirtualKeyboard(): boolean {
  const [prefers, setPrefers] = useState(getPrefersVirtualKeyboard);

  useEffect(() => {
    const update = () => setPrefers(getPrefersVirtualKeyboard());
    update();
    window.addEventListener('resize', update);
    const media = window.matchMedia?.('(pointer: coarse)');
    media?.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      media?.removeEventListener?.('change', update);
    };
  }, []);

  return prefers;
}

export function isMathKeyboardKeyEnabled(slot: MathInputSlot | null | undefined, key: MathKeyboardKey): boolean {
  if (!slot) return false;
  return slot.enabledKeys.includes(key);
}

function applyMaxLength(value: string, maxLength?: number): string {
  if (maxLength == null || value.length <= maxLength) return value;
  return value.slice(-maxLength);
}

export function applyMathKeyboardKey(slot: MathInputSlot, key: MathKeyboardKey): string {
  if (!isMathKeyboardKeyEnabled(slot, key)) return slot.value;
  const raw = key === 'delete'
    ? slot.value.slice(0, -1)
    : `${slot.value}${key}`;
  const bounded = applyMaxLength(raw, slot.maxLength);
  return slot.sanitizeInput ? slot.sanitizeInput(bounded, slot.value) : bounded;
}

export function sanitizeDigitInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function sanitizeSingleDigitInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(-1);
}

export function sanitizeDecimalInput(raw: string, previous = ''): string {
  if (raw.endsWith('-') && !previous.includes('-')) {
    return `-${previous}`;
  }
  const cleaned = raw.replace(/[^\d.-]/g, '');
  let next = '';
  let hasPoint = false;
  for (const char of cleaned) {
    if (char === '-') {
      if (!next.includes('-') && next.length === 0) next += char;
      continue;
    }
    if (char === '.') {
      if (!hasPoint) {
        next += char;
        hasPoint = true;
      }
      continue;
    }
    next += char;
  }
  if (next === '--') return previous;
  return next;
}

export function sanitizeExpressionInput(raw: string): string {
  return raw.replace(/[^0-9.+\-×÷()=x]/g, '');
}
