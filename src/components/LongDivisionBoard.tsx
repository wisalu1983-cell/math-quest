import { Check, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type {
  LongDivisionBoardData,
  LongDivisionSetupField,
  VerticalCalcCompletePayload,
} from '@/types';
import {
  classifyLongDivisionSubmission,
  getLongDivisionOrderedInputKeys,
  normalizeLongDivisionNumberText,
} from '@/engine/longDivision';
import PracticeMathKeyboard from '@/pages/PracticeMathKeyboard';
import {
  DECIMAL_KEYS,
  DIGIT_KEYS,
  sanitizeDecimalInput,
  sanitizeDigitInput,
  sanitizeSingleDigitInput,
  usePrefersVirtualKeyboard,
} from '@/pages/practice-math-keyboard';
import type { MathInputSlot } from '@/pages/practice-math-keyboard';

interface Props {
  data: LongDivisionBoardData;
  difficulty: number;
  onComplete: (result: VerticalCalcCompletePayload) => void;
}

type FieldStatus = 'idle' | 'correct' | 'wrong';
type InputSpec = {
  id: string;
  key: string;
  digitIndex: number | null;
};

function isIntegerText(value: string): boolean {
  return /^-?\d+$/.test(normalizeLongDivisionNumberText(value));
}

function cellClass(status: FieldStatus, active: boolean): string {
  if (status === 'correct') return 'border-success bg-success-lt text-success';
  if (status === 'wrong') return 'border-danger bg-danger-lt text-danger animate-shake';
  if (active) return 'border-primary bg-primary-lt text-primary ring-2 ring-primary/25';
  return 'border-border bg-card text-text focus:border-primary';
}

function roundFieldLabel(key: string): string {
  const match = /^round-(\d+)-(quotient|product|next|remainder)$/.exec(key);
  if (!match) return key;
  const round = Number(match[1]) + 1;
  if (match[2] === 'quotient') return `第 ${round} 轮商位`;
  if (match[2] === 'product') return `第 ${round} 轮乘积`;
  if (match[2] === 'next') return `第 ${round} 轮余数与落位`;
  return `第 ${round} 轮最终余数`;
}

function roundFieldKind(key: string): 'quotient' | 'product' | 'next' | 'remainder' | null {
  const match = /^round-\d+-(quotient|product|next|remainder)$/.exec(key);
  return match ? match[1] as ReturnType<typeof roundFieldKind> : null;
}

function isRoundFieldKey(key: string): boolean {
  return roundFieldKind(key) != null;
}

function digitSlotId(key: string, digitIndex: number) {
  return `${key}:digit-${digitIndex}`;
}

function decimalAfterColumn(value: string) {
  if (!value.includes('.')) return null;
  return value.split('.')[0].replace(/\D/g, '').length - 1;
}

const BASE_BOARD_FONT_PX = 16;
const KEYBOARD_RESERVED_REM = 14.5;

type BoardLayoutProfile = {
  id: 'comfortable' | 'font-compact' | 'gap-compact' | 'rail-compact' | 'edge-compact';
  minFontPx: number;
  digitCellRem: number;
  digitCellHeightRem: number;
  digitGapRem: number;
  decimalGapRem: number;
  dividerTrackRem: number;
  divisorTrackRem?: number;
  ellipsisTrackRem: number;
  paperPaddingRem: number;
  innerPaddingXRem: number;
  innerPaddingYRem: number;
};

const BOARD_LAYOUT_PROFILES: BoardLayoutProfile[] = [
  {
    id: 'comfortable',
    minFontPx: 14,
    digitCellRem: 2.2,
    digitCellHeightRem: 2.2,
    digitGapRem: 0.65,
    decimalGapRem: 1.05,
    dividerTrackRem: 0.95,
    ellipsisTrackRem: 1.25,
    paperPaddingRem: 0.75,
    innerPaddingXRem: 0.75,
    innerPaddingYRem: 0.75,
  },
  {
    id: 'font-compact',
    minFontPx: 12,
    digitCellRem: 2.2,
    digitCellHeightRem: 2.2,
    digitGapRem: 0.65,
    decimalGapRem: 1.05,
    dividerTrackRem: 0.95,
    ellipsisTrackRem: 1.25,
    paperPaddingRem: 0.75,
    innerPaddingXRem: 0.75,
    innerPaddingYRem: 0.75,
  },
  {
    id: 'gap-compact',
    minFontPx: 12,
    digitCellRem: 2.15,
    digitCellHeightRem: 2.2,
    digitGapRem: 0.38,
    decimalGapRem: 0.55,
    dividerTrackRem: 0.78,
    ellipsisTrackRem: 1,
    paperPaddingRem: 0.6,
    innerPaddingXRem: 0.55,
    innerPaddingYRem: 0.65,
  },
  {
    id: 'rail-compact',
    minFontPx: 12,
    digitCellRem: 2.05,
    digitCellHeightRem: 2.18,
    digitGapRem: 0.31,
    decimalGapRem: 0.45,
    dividerTrackRem: 0.68,
    divisorTrackRem: 4.55,
    ellipsisTrackRem: 0.85,
    paperPaddingRem: 0.48,
    innerPaddingXRem: 0.45,
    innerPaddingYRem: 0.6,
  },
  {
    id: 'edge-compact',
    minFontPx: 12,
    digitCellRem: 1.88,
    digitCellHeightRem: 2.12,
    digitGapRem: 0.22,
    decimalGapRem: 0.33,
    dividerTrackRem: 0.58,
    divisorTrackRem: 4.05,
    ellipsisTrackRem: 0.68,
    paperPaddingRem: 0.28,
    innerPaddingXRem: 0.3,
    innerPaddingYRem: 0.55,
  },
];

function setupErrorText(field: LongDivisionSetupField): string {
  if (field.id === 'setup-scale') return '扩倍倍数填写有误';
  if (field.id === 'setup-divisor') return '转换后除数填写有误';
  return '转换后被除数填写有误';
}

function renderRecurringDecimalAnswer(nonRepeating: string, repeating: string) {
  const prefix = nonRepeating || '□';
  const cycleDigits = repeating ? repeating.split('') : ['□'];
  const ariaLabel = repeating
    ? `标准格式答数：${prefix}，循环节${repeating}`
    : `标准格式答数：${prefix}，循环节未填写`;

  return (
    <span
      data-cyclic-answer-preview="true"
      aria-label={ariaLabel}
      aria-live="polite"
      className="inline-flex items-end text-lg font-black leading-none text-primary tabular-nums"
    >
      <span>{prefix}</span>
      <span className="inline-flex items-end" aria-hidden="true">
        {cycleDigits.map((digit, index) => {
          const shouldDot = repeating.length <= 1
            ? index === 0
            : index === 0 || index === cycleDigits.length - 1;
          return (
            <span key={`${digit}-${index}`} className="relative inline-flex min-w-[0.58em] justify-center pt-2">
              {shouldDot && (
                <span
                  data-cyclic-dot="true"
                  className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
              {digit}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export default function LongDivisionBoard({ data, difficulty, onComplete }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [conversionSubmitted, setConversionSubmitted] = useState(false);
  const [conversionConfirmed, setConversionConfirmed] = useState(!data.setupFields?.length);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [boardMetrics, setBoardMetrics] = useState({ width: 0, height: 0, scale: 1 });
  const [boardLayoutIndex, setBoardLayoutIndex] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const boardViewportRef = useRef<HTMLDivElement | null>(null);
  const boardPaperRef = useRef<HTMLDivElement | null>(null);
  const prefersVirtualKeyboard = usePrefersVirtualKeyboard();

  const setupKeys = useMemo(() => data.setupFields?.map(field => field.id) ?? [], [data.setupFields]);
  const allInputKeys = useMemo(() => getLongDivisionOrderedInputKeys(data), [data]);
  const boardInputKeys = useMemo(
    () => allInputKeys.filter(key => !key.startsWith('setup-')),
    [allInputKeys],
  );
  const visibleFieldKeys = conversionConfirmed ? boardInputKeys : setupKeys;
  const inputSpecs = useMemo<InputSpec[]>(() => {
    const fieldKeys = conversionConfirmed ? boardInputKeys : setupKeys;
    return fieldKeys.flatMap((key): InputSpec[] => {
      if (!isRoundFieldKey(key)) return [{ id: key, key, digitIndex: null }];
      const expectedLength = Math.max(data.expectedByKey[key]?.length ?? 1, 1);
      return Array.from({ length: expectedLength }, (_, digitIndex) => ({
        id: digitSlotId(key, digitIndex),
        key,
        digitIndex,
      }));
    });
  }, [boardInputKeys, conversionConfirmed, data.expectedByKey, setupKeys]);
  const visibleSlotIds = useMemo(() => inputSpecs.map(spec => spec.id), [inputSpecs]);
  const firstSlotIdForField = useCallback((key: string | null | undefined) => {
    if (!key) return null;
    return isRoundFieldKey(key) ? digitSlotId(key, 0) : key;
  }, []);

  const setupFieldById = useMemo(() => new Map(
    (data.setupFields ?? []).map(field => [field.id, field]),
  ), [data.setupFields]);
  const resultFieldById = useMemo(() => new Map(
    (data.resultFields ?? []).map(field => [field.id, field]),
  ), [data.resultFields]);

  const fieldLabel = useCallback((key: string): string => {
    const setupField = setupFieldById.get(key);
    if (setupField) return setupField.label;
    const resultField = resultFieldById.get(key);
    if (resultField) return resultField.label;
    return roundFieldLabel(key);
  }, [resultFieldById, setupFieldById]);

  const fieldAllowsDecimal = useCallback((key: string): boolean => (
    Boolean(setupFieldById.get(key)?.allowDecimal || resultFieldById.get(key)?.allowDecimal)
  ), [resultFieldById, setupFieldById]);

  const fieldMatchesExpected = useCallback((key: string, rawValue: string): boolean => {
    const expected = data.expectedByKey[key] ?? '';
    if (fieldAllowsDecimal(key)) {
      return normalizeLongDivisionNumberText(rawValue) === normalizeLongDivisionNumberText(expected);
    }
    return rawValue.trim() === expected;
  }, [data.expectedByKey, fieldAllowsDecimal]);

  const fieldStatus = useCallback((key: string): FieldStatus => {
    const shouldShow =
      submitted ||
      (conversionSubmitted && key.startsWith('setup-'));
    if (!shouldShow) return 'idle';
    return fieldMatchesExpected(key, values[key] ?? '') ? 'correct' : 'wrong';
  }, [conversionSubmitted, fieldMatchesExpected, submitted, values]);

  const scrollInputIntoView = useCallback((key: string) => {
    inputRefs.current[key]?.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, []);

  const setActiveSlotId = useCallback((slotId: string | null) => {
    setFocusedKey(slotId);
    if (!slotId) return;
    scrollInputIntoView(slotId);
    if (!prefersVirtualKeyboard) {
      inputRefs.current[slotId]?.focus({ preventScroll: true });
    }
  }, [prefersVirtualKeyboard, scrollInputIntoView]);

  useEffect(() => {
    const first = visibleSlotIds[0] ?? null;
    const timer = window.setTimeout(() => {
      setFocusedKey(first);
      if (first && !prefersVirtualKeyboard) {
        inputRefs.current[first]?.focus({ preventScroll: true });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [prefersVirtualKeyboard, visibleSlotIds]);

  useEffect(() => {
    if (!focusedKey || completed) return;
    const timer = window.setTimeout(() => {
      const target = inputRefs.current[focusedKey];
      if (!target) return;
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
      if (!prefersVirtualKeyboard && document.activeElement !== target) {
        target.focus({ preventScroll: true });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [completed, focusedKey, prefersVirtualKeyboard]);

  const focusNext = useCallback((slotId: string) => {
    const currentIndex = visibleSlotIds.indexOf(slotId);
    const nextSlotId = visibleSlotIds[currentIndex + 1];
    if (nextSlotId) setActiveSlotId(nextSlotId);
  }, [setActiveSlotId, visibleSlotIds]);

  const updateValue = useCallback((key: string, nextValue: string) => {
    if (completed) return;
    setValues(prev => ({ ...prev, [key]: nextValue }));
    setSubmitted(false);
    if (key.startsWith('setup-')) setConversionSubmitted(false);
    setLocalWarning(null);
  }, [completed]);

  const inputKeysForField = useCallback((key: string) => {
    if (fieldAllowsDecimal(key)) return DECIMAL_KEYS;
    return DIGIT_KEYS;
  }, [fieldAllowsDecimal]);

  const sanitizeForField = useCallback((key: string, raw: string, previous = '') => {
    const kind = roundFieldKind(key);
    if (kind === 'quotient') return sanitizeSingleDigitInput(raw);
    if (fieldAllowsDecimal(key)) return sanitizeDecimalInput(raw, previous);
    return sanitizeDigitInput(raw);
  }, [fieldAllowsDecimal]);

  const maxLengthForField = useCallback((key: string): number => {
    const expectedLength = data.expectedByKey[key]?.length ?? 1;
    if (roundFieldKind(key) === 'quotient') return 1;
    return Math.max(expectedLength + (fieldAllowsDecimal(key) ? 3 : 0), 1);
  }, [data.expectedByKey, fieldAllowsDecimal]);

  const shouldAutoAdvance = useCallback((key: string, nextValue: string): boolean => {
    if (!nextValue) return false;
    const setupField = setupFieldById.get(key);
    if (setupField?.mustBeInteger && !isIntegerText(nextValue)) return false;
    const expectedLength = data.expectedByKey[key]?.length ?? 1;
    return normalizeLongDivisionNumberText(nextValue).replace(/\D/g, '').length >= expectedLength;
  }, [data.expectedByKey, setupFieldById]);

  const fieldHasFilledExpectedLength = useCallback((key: string): boolean => {
    const rawValue = values[key] ?? '';
    const expected = data.expectedByKey[key] ?? '';
    if (!rawValue.trim()) return false;
    if (key.startsWith('setup-')) return true;
    if (!expected) return rawValue.trim().length > 0;
    const comparableValue = fieldAllowsDecimal(key)
      ? normalizeLongDivisionNumberText(rawValue)
      : rawValue.trim();
    return comparableValue.replace(/\D/g, '').length >= expected.replace(/\D/g, '').length;
  }, [data.expectedByKey, fieldAllowsDecimal, values]);

  const updateFieldDigit = useCallback((key: string, digitIndex: number, raw: string) => {
    if (completed) return;
    const nextDigit = sanitizeSingleDigitInput(raw);
    setValues(prev => {
      const expectedLength = Math.max(data.expectedByKey[key]?.length ?? 1, 1);
      const chars = (prev[key] ?? '').padEnd(expectedLength, ' ').slice(0, expectedLength).split('');
      chars[digitIndex] = nextDigit || ' ';
      return { ...prev, [key]: chars.join('').trimEnd() };
    });
    setSubmitted(false);
    setLocalWarning(null);
    if (nextDigit) focusNext(digitSlotId(key, digitIndex));
  }, [completed, data.expectedByKey, focusNext]);

  const mathSlots = useMemo<MathInputSlot[]>(() => {
    if (completed) return [];
    return inputSpecs.map(spec => {
      if (spec.digitIndex != null) {
        return {
          id: spec.id,
          label: `${fieldLabel(spec.key)}第 ${spec.digitIndex + 1} 位`,
          value: (values[spec.key] ?? '').padEnd(data.expectedByKey[spec.key]?.length ?? 1, ' ')[spec.digitIndex]?.trim() ?? '',
          maxLength: 1,
          enabledKeys: DIGIT_KEYS,
          sanitizeInput: sanitizeSingleDigitInput,
          setValue: next => updateFieldDigit(spec.key, spec.digitIndex ?? 0, next),
          shouldAutoAdvance: ({ nextValue }) => nextValue.trim().length >= 1,
        };
      }

      return {
        id: spec.id,
        label: fieldLabel(spec.key),
        value: values[spec.key] ?? '',
        maxLength: maxLengthForField(spec.key),
        enabledKeys: inputKeysForField(spec.key),
        sanitizeInput: (raw, previous) => sanitizeForField(spec.key, raw, previous),
        setValue: next => updateValue(spec.key, next),
        shouldAutoAdvance: ({ nextValue }) => shouldAutoAdvance(spec.key, nextValue),
      };
    });
  }, [
    completed,
    data.expectedByKey,
    fieldLabel,
    inputSpecs,
    inputKeysForField,
    maxLengthForField,
    sanitizeForField,
    shouldAutoAdvance,
    updateFieldDigit,
    updateValue,
    values,
  ]);

  const visibleFieldsFilled = visibleFieldKeys.every(fieldHasFilledExpectedLength);

  const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>, slotId: string) => {
    if (event.key !== 'Tab' && event.key !== 'Enter') return;
    event.preventDefault();
    focusNext(slotId);
  }, [focusNext]);

  const handleInputChange = (key: string, raw: string) => {
    const nextValue = sanitizeForField(key, raw, values[key] ?? '');
    updateValue(key, nextValue);
    if (shouldAutoAdvance(key, nextValue)) focusNext(key);
  };

  const handleDigitChange = (key: string, digitIndex: number, raw: string) => {
    updateFieldDigit(key, digitIndex, raw);
  };

  const setupWrongFields = useCallback((): LongDivisionSetupField[] => {
    return (data.setupFields ?? []).filter(field => {
      const value = values[field.id] ?? '';
      if (field.mustBeInteger && !isIntegerText(value)) return true;
      return !fieldMatchesExpected(field.id, value);
    });
  }, [data.setupFields, fieldMatchesExpected, values]);

  const setupDivisorFormatError = useMemo(() => (
    Boolean((data.setupFields ?? []).some(field => (
      field.mustBeInteger &&
      (values[field.id] ?? '').trim().length > 0 &&
      !isIntegerText(values[field.id] ?? '')
    )))
  ), [data.setupFields, values]);

  const conversionProcessHints = useMemo(() => {
    if (!data.setupFields?.length || submitted || !conversionSubmitted) return [];
    return data.setupFields.flatMap(field => {
      const value = values[field.id] ?? '';
      if (!value.trim()) return [];
      if (field.mustBeInteger && !isIntegerText(value)) return [];
      if (fieldMatchesExpected(field.id, value)) return [];
      return [{ id: field.id, text: setupErrorText(field) }];
    });
  }, [conversionSubmitted, data.setupFields, fieldMatchesExpected, submitted, values]);

  const confirmSetup = () => {
    if (!visibleFieldsFilled) {
      setLocalWarning('转换区还有未填写的格子。');
      return;
    }

    const nonInteger = (data.setupFields ?? []).find(field => (
      field.mustBeInteger && !isIntegerText(values[field.id] ?? '')
    ));
    if (nonInteger) {
      setConversionSubmitted(true);
      setLocalWarning(null);
      setActiveSlotId(firstSlotIdForField(nonInteger.id));
      return;
    }

    const wrongFields = setupWrongFields();
    if (wrongFields.length > 0) {
      setConversionSubmitted(true);
      if (difficulty >= 8) {
        setCompleted(true);
        onComplete(classifyLongDivisionSubmission({ board: data, values }));
        return;
      }
      setLocalWarning(null);
      setActiveSlotId(firstSlotIdForField(wrongFields[0]?.id));
      return;
    }

    setConversionSubmitted(false);
    setLocalWarning(null);
    setConversionConfirmed(true);
    const firstBoardKey = boardInputKeys[0] ?? null;
    setActiveSlotId(firstSlotIdForField(firstBoardKey));
  };

  const reset = () => {
    setValues({});
    setSubmitted(false);
    setConversionSubmitted(false);
    setConversionConfirmed(!data.setupFields?.length);
    setLocalWarning(null);
    setCompleted(false);
    const first = data.setupFields?.length ? setupKeys[0] : boardInputKeys[0];
    setActiveSlotId(firstSlotIdForField(first));
  };

  const submit = () => {
    if (completed) return;
    if (!conversionConfirmed) {
      confirmSetup();
      return;
    }
    if (!visibleFieldsFilled) {
      setLocalWarning('竖式板还有未填写的格子。');
      return;
    }
    setSubmitted(true);
    setCompleted(true);
    onComplete(classifyLongDivisionSubmission({ board: data, values }));
  };

  const fieldFirstInputIndex = useMemo(() => {
    const next = new Map<string, number>();
    inputSpecs.forEach((spec, index) => {
      if (!next.has(spec.key)) next.set(spec.key, index);
    });
    return next;
  }, [inputSpecs]);
  const activeInputIndex = focusedKey ? visibleSlotIds.indexOf(focusedKey) : -1;
  const boardLayout = BOARD_LAYOUT_PROFILES[boardLayoutIndex] ?? BOARD_LAYOUT_PROFILES[0];
  const dividendDigits = data.workingDividend.replace(/[^\d]/g, '').split('');
  const dividendDecimalAfter = decimalAfterColumn(data.workingDividend);
  const decimalGapAfterColumn = data.quotientDecimalAfter ?? dividendDecimalAfter;
  const boardColumnCount = Math.max(
    data.boardColumnCount,
    dividendDigits.length,
    data.quotientStartColumn + data.rounds.length,
    decimalGapAfterColumn == null ? 0 : decimalGapAfterColumn + 2,
  );
  const minBoardScale = boardLayout.minFontPx / BASE_BOARD_FONT_PX;

  const shouldRevealField = useCallback((key: string) => {
    const firstInputIndex = fieldFirstInputIndex.get(key);
    const hasValue = (values[key] ?? '').trim().length > 0;
    if (submitted || completed || hasValue) return true;
    if (firstInputIndex == null) return false;
    if (activeInputIndex < 0) return firstInputIndex === 0;
    return firstInputIndex <= activeInputIndex;
  }, [activeInputIndex, completed, fieldFirstInputIndex, submitted, values]);

  useLayoutEffect(() => {
    const updateBoardScale = () => {
      const viewport = boardViewportRef.current;
      const paper = boardPaperRef.current;
      if (!viewport || !paper) return;

      const rootFontPx = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || BASE_BOARD_FONT_PX;
      const keyboardReservePx = completed ? 0 : KEYBOARD_RESERVED_REM * rootFontPx;
      const viewportRect = viewport.getBoundingClientRect();
      const naturalWidth = paper.scrollWidth;
      const naturalHeight = paper.scrollHeight;
      const availableWidth = Math.max(1, viewport.clientWidth - 8);
      const availableHeight = window.innerWidth <= 768
        ? Math.max(220, window.innerHeight - keyboardReservePx - viewportRect.top - 16)
        : Number.POSITIVE_INFINITY;
      const fitScale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
      if (fitScale + 0.005 < minBoardScale && boardLayoutIndex < BOARD_LAYOUT_PROFILES.length - 1) {
        setBoardLayoutIndex(previous => Math.min(previous + 1, BOARD_LAYOUT_PROFILES.length - 1));
        return;
      }
      const nextScale = Math.max(minBoardScale, Math.min(1, fitScale));

      setBoardMetrics(previous => {
        if (
          Math.abs(previous.width - naturalWidth) < 1 &&
          Math.abs(previous.height - naturalHeight) < 1 &&
          Math.abs(previous.scale - nextScale) < 0.005
        ) {
          return previous;
        }
        return { width: naturalWidth, height: naturalHeight, scale: nextScale };
      });
    };

    const animationFrame = window.requestAnimationFrame(updateBoardScale);
    const resizeObserver = new ResizeObserver(updateBoardScale);
    if (boardViewportRef.current) resizeObserver.observe(boardViewportRef.current);
    if (boardPaperRef.current) resizeObserver.observe(boardPaperRef.current);
    window.addEventListener('resize', updateBoardScale);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBoardScale);
    };
  }, [
    boardColumnCount,
    boardLayout.minFontPx,
    boardLayoutIndex,
    completed,
    conversionConfirmed,
    data.rounds.length,
    minBoardScale,
    visibleSlotIds.length,
  ]);

  const renderInput = (key: string, className = '') => {
    const value = values[key] ?? '';
    return (
      <input
        key={key}
        ref={node => { inputRefs.current[key] = node; }}
        value={value}
        onChange={event => handleInputChange(key, event.target.value)}
        onKeyDown={event => handleInputKeyDown(event, key)}
        onFocus={() => setFocusedKey(key)}
        onPointerDown={event => {
          if (!prefersVirtualKeyboard) return;
          event.preventDefault();
          setActiveSlotId(key);
        }}
        inputMode={prefersVirtualKeyboard ? 'none' : fieldAllowsDecimal(key) ? 'decimal' : 'numeric'}
        aria-label={fieldLabel(key)}
        className={`h-11 min-w-0 rounded-lg border-2 px-2 text-center text-xl font-black outline-none transition-all ${cellClass(fieldStatus(key), focusedKey === key)} ${className}`}
        readOnly={prefersVirtualKeyboard}
        disabled={completed}
      />
    );
  };

  const renderDigitCell = (key: string, digitIndex: number) => {
    const slotId = digitSlotId(key, digitIndex);
    const expected = data.expectedByKey[key] ?? '';
    const value = (values[key] ?? '').padEnd(Math.max(expected.length, 1), ' ')[digitIndex]?.trim() ?? '';
    const expectedDigit = expected[digitIndex] ?? '';
    const status: FieldStatus = !submitted
      ? 'idle'
      : value === expectedDigit
        ? 'correct'
        : 'wrong';

    return (
      <input
        key={slotId}
        ref={node => { inputRefs.current[slotId] = node; }}
        value={value}
        onChange={event => handleDigitChange(key, digitIndex, event.target.value)}
        onKeyDown={event => handleInputKeyDown(event, slotId)}
        onFocus={() => setFocusedKey(slotId)}
        onPointerDown={event => {
          if (!prefersVirtualKeyboard) return;
          event.preventDefault();
          setActiveSlotId(slotId);
        }}
        inputMode={prefersVirtualKeyboard ? 'none' : 'numeric'}
        aria-label={`${fieldLabel(key)}第 ${digitIndex + 1} 位`}
        style={{
          width: `${boardLayout.digitCellRem}rem`,
          height: `${boardLayout.digitCellHeightRem}rem`,
        }}
        className={`rounded-lg border-2 text-center text-base font-black outline-none transition-all ${cellClass(status, focusedKey === slotId)}`}
        readOnly={prefersVirtualKeyboard}
        disabled={completed}
      />
    );
  };

  const renderSetupPanel = () => {
    if (!data.setupFields?.length || conversionConfirmed) return null;

    return (
      <section className="w-full rounded-2xl border-2 border-primary/20 bg-primary/[0.06] p-3" data-conversion-panel="true" data-long-division-setup-panel="true">
        <div className="grid gap-2 md:grid-cols-3">
          {data.setupFields.map(field => (
            <label key={field.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text">
              <span className="shrink-0">{field.label}</span>
              {renderInput(field.id, 'w-0 flex-1')}
            </label>
          ))}
        </div>
        {conversionProcessHints.length > 0 && (
          <div className="mt-3 grid gap-2" role="status" aria-live="polite">
            {conversionProcessHints.map(hint => (
              <div key={hint.id} className="rounded-xl border-2 border-warning bg-warning-lt px-3 py-2 text-center text-sm font-black" style={{ color: '#7A5C00' }}>
                {hint.text}
              </div>
            ))}
          </div>
        )}
        {conversionSubmitted && setupDivisorFormatError && !submitted && (
          <div className="mt-3 rounded-xl border-2 border-warning bg-warning-lt px-3 py-2 text-center text-sm font-black" style={{ color: '#7A5C00' }} role="alert">
            转换后除数不是整数。
          </div>
        )}
      </section>
    );
  };

  const naturalDivisorTrackRem = Math.max(
    boardLayout.digitCellRem,
    data.workingDivisor.length * boardLayout.digitCellRem + Math.max(0, data.workingDivisor.length - 1) * boardLayout.digitGapRem,
  );
  const divisorTrackRem = boardLayout.divisorTrackRem ?? naturalDivisorTrackRem;
  const digitTracks = Array.from({ length: boardColumnCount }).flatMap((_, index) => {
    const tracks = [`${boardLayout.digitCellRem}rem`];
    if (index < boardColumnCount - 1) {
      tracks.push(`${index === decimalGapAfterColumn ? boardLayout.decimalGapRem : boardLayout.digitGapRem}rem`);
    }
    return tracks;
  });
  const lastQuotientKey = data.rounds.length
    ? `round-${data.rounds[data.rounds.length - 1].index}-quotient`
    : null;
  const continuationMarkerVisible = Boolean(
    data.mode === 'cyclic' &&
    lastQuotientKey &&
    shouldRevealField(lastQuotientKey),
  );
  if (continuationMarkerVisible) {
    digitTracks.push('0rem', `${boardLayout.ellipsisTrackRem}rem`);
  }
  const boardGridStyle = {
    gridTemplateColumns: `${divisorTrackRem}rem ${boardLayout.digitGapRem}rem ${boardLayout.dividerTrackRem}rem ${boardLayout.digitGapRem}rem ${digitTracks.join(' ')}`,
    justifyContent: 'center',
  };
  const digitStartLine = (column: number) => 5 + column * 2;
  const digitEndLine = (column: number) => digitStartLine(column) + 1;
  const gridColumn = (start: number, end: number) => `${digitStartLine(start)} / ${digitEndLine(end)}`;
  const decimalGapColumn = (column: number) => `${digitEndLine(column)} / ${digitEndLine(column) + 1}`;
  const valuePosition = (value: string, endColumn: number) => {
    const width = Math.max(value.replace(/\D/g, '').length, 1);
    const end = Math.min(boardColumnCount - 1, Math.max(0, endColumn));
    const start = Math.max(0, end - width + 1);
    return { start, end };
  };
  const anyQuotientRevealed = data.rounds.some(round => shouldRevealField(`round-${round.index}-quotient`));

  const renderQuotientDecimalPoint = () => {
    if (data.quotientDecimalAfter == null) return null;
    return (
      <span
        className="pointer-events-none z-10 self-center text-2xl font-black leading-none text-danger"
        style={{
          gridColumn: decimalGapColumn(data.quotientDecimalAfter),
          gridRow: '1',
          justifySelf: 'center',
        }}
      >
        .
      </span>
    );
  };

  const renderDividendDecimalPoint = () => {
    if (dividendDecimalAfter == null) return null;
    return (
      <span
        className="pointer-events-none z-10 self-center text-2xl font-black leading-none text-danger"
        style={{
          gridColumn: decimalGapColumn(dividendDecimalAfter),
          gridRow: '1',
          justifySelf: 'center',
        }}
      >
        .
      </span>
    );
  };

  const renderQuotientRow = () => (
    <div className="relative grid min-h-12 items-center" style={boardGridStyle}>
      {data.rounds.map((round, index) => {
        const key = `round-${round.index}-quotient`;
        if (!shouldRevealField(key)) return null;
        return (
          <div
            key={key}
            className="flex items-center justify-center"
            style={{ gridColumn: gridColumn(data.quotientStartColumn + index, data.quotientStartColumn + index), gridRow: '1' }}
          >
            {renderDigitCell(key, 0)}
          </div>
        );
      })}
      {anyQuotientRevealed && renderQuotientDecimalPoint()}
      {continuationMarkerVisible && (
        <div
          className="flex h-10 items-center justify-center text-2xl font-black text-text-2"
          style={{ gridColumn: gridColumn(data.quotientStartColumn + data.rounds.length, data.quotientStartColumn + data.rounds.length), gridRow: '1' }}
        >
          ...
        </div>
      )}
    </div>
  );

  const renderDividendRow = () => (
    <div className="relative grid items-stretch bg-card py-1" style={boardGridStyle}>
      <div
        className="flex h-14 items-center justify-center text-2xl font-black text-text"
        style={{ gridColumn: '1 / 2', gridRow: '1' }}
      >
        {data.workingDivisor}
      </div>
      <div
        className="relative h-14 overflow-visible"
        style={{ gridColumn: '3 / 4', gridRow: '1' }}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-full text-text"
          style={{ left: '0.02rem', width: '0.78rem' }}
          viewBox="0 0 14 64"
          preserveAspectRatio="none"
        >
          <path
            d="M4 1 C12 12 12 52 4 63"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div
        className="pointer-events-none self-start border-t-2 border-text"
        style={{ gridColumn: gridColumn(0, boardColumnCount - 1), gridRow: '1' }}
      />
      {Array.from({ length: boardColumnCount }).map((_, index) => (
        <div
          key={index}
          className="relative flex h-12 items-center justify-center self-center text-2xl font-black text-text"
          style={{ gridColumn: gridColumn(index, index), gridRow: '1' }}
        >
          {dividendDigits[index] ?? ''}
        </div>
      ))}
      {renderDividendDecimalPoint()}
    </div>
  );

  const renderPositionedField = (key: string, start: number) => (
    Array.from({ length: Math.max(data.expectedByKey[key]?.length ?? 1, 1) }).map((_, digitIndex) => (
      <div
        key={`${key}-${digitIndex}`}
        className="flex items-center justify-center"
        style={{ gridColumn: gridColumn(start + digitIndex, start + digitIndex) }}
      >
        {renderDigitCell(key, digitIndex)}
      </div>
    ))
  );

  const renderRule = (start: number, end: number) => (
    <div
      className="h-0 border-b-2 border-text"
      style={{ gridColumn: gridColumn(start, end) }}
    />
  );

  const renderPaperRow = (children: ReactNode, compact = false) => (
    <div className={`grid items-center ${compact ? 'h-2' : ''}`} style={boardGridStyle}>
      {children}
    </div>
  );

  const renderLongDivisionBoard = () => (
    <section className="mt-1 w-full min-w-0" data-long-division-board-section="true">
      <div
        ref={boardViewportRef}
        className="flex min-w-0 justify-center overflow-x-auto overflow-y-visible pb-2"
        data-long-division-board-viewport="true"
      >
        <div
          className="relative shrink-0"
          style={boardMetrics.width && boardMetrics.height
            ? {
                width: `${boardMetrics.width * boardMetrics.scale}px`,
                height: `${boardMetrics.height * boardMetrics.scale}px`,
              }
            : undefined}
        >
          <div
            ref={boardPaperRef}
            data-long-division-adaptive-profile={boardLayout.id}
            data-long-division-board-scale={boardMetrics.scale.toFixed(3)}
            data-min-readable-font-px={boardLayout.minFontPx}
            className={`${boardMetrics.width ? 'absolute left-0 top-0' : ''} w-max rounded-[18px] border-2 border-border bg-bg p-3`}
            style={{
              padding: `${boardLayout.paperPaddingRem}rem`,
              transform: `scale(${boardMetrics.scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              className="mx-auto max-w-2xl rounded-2xl border-2 border-border-2 bg-card px-3 py-3"
              style={{
                padding: `${boardLayout.innerPaddingYRem}rem ${boardLayout.innerPaddingXRem}rem`,
              }}
            >
              {renderQuotientRow()}
              {renderDividendRow()}

              <div className="mt-2 space-y-1.5 py-2 font-black text-text">
                {data.rounds.map((round, index) => {
                  const quotientColumn = data.quotientStartColumn + index;
                  const productKey = `round-${round.index}-product`;
                  const workingKind = round.nextPartialDividend != null ? 'next' : 'remainder';
                  const workingKey = `round-${round.index}-${workingKind}`;
                  const workingValue = round.nextPartialDividend ?? round.remainder;
                  const product = valuePosition(round.product, quotientColumn);
                  const working = valuePosition(workingValue, quotientColumn + (workingKind === 'next' ? 1 : 0));
                  const ruleStart = Math.min(product.start, working.start);
                  const ruleEnd = Math.max(product.end, working.end);
                  const showProductRow = shouldRevealField(productKey);
                  const showWorkingRow = shouldRevealField(workingKey);
                  if (!showProductRow && !showWorkingRow) return null;

                  return (
                    <div key={`round-${round.index}-paper`} className="contents">
                      {showProductRow && renderPaperRow(
                        <>
                          <div className="flex h-10 items-center justify-center text-xl text-danger">-</div>
                          {renderPositionedField(productKey, product.start)}
                        </>,
                      )}
                      {showProductRow && renderPaperRow(renderRule(ruleStart, ruleEnd), true)}
                      {showWorkingRow && renderPaperRow(renderPositionedField(workingKey, working.start))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderResultFields = () => {
    if (!data.resultFields?.length || !conversionConfirmed) return null;
    const visibleResultFields = data.resultFields.filter(field => shouldRevealField(field.id));
    if (visibleResultFields.length === 0) return null;
    const cyclicNonRepeating = data.cyclic ? (values['result-non-repeating'] ?? '').trim().replace(/\s/g, '') : '';
    const cyclicRepeating = data.cyclic ? (values['result-repeating'] ?? '').trim().replace(/\s/g, '') : '';
    return (
      <section className="w-full rounded-2xl border-2 border-success-mid bg-success-lt p-3">
        <div className={`grid gap-2 ${data.cyclic ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {visibleResultFields.map(field => (
            <label key={field.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text">
              <span className="shrink-0">{field.label}</span>
              {renderInput(field.id, 'w-0 flex-1')}
            </label>
          ))}
          {data.cyclic && (
            <div className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text">
              <span className="min-w-0 flex-1 truncate">标准格式答数</span>
              <span className="shrink-0 rounded-lg border-2 border-border bg-bg px-3 py-1.5">
                {renderRecurringDecimalAnswer(cyclicNonRepeating, cyclicRepeating)}
              </span>
            </div>
          )}
        </div>
      </section>
    );
  };

  const submitLabel = conversionConfirmed ? '提交答案' : '确认扩倍';
  const canSubmit = visibleFieldsFilled;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {renderSetupPanel()}
      {conversionConfirmed && renderLongDivisionBoard()}
      {renderResultFields()}

      {localWarning && (
        <div className="w-full rounded-xl border-2 border-warning bg-warning-lt px-4 py-3 text-center text-sm font-black" style={{ color: '#7A5C00' }} role="alert">
          {localWarning}
        </div>
      )}

      {!completed && (
        <div className="mt-1 flex gap-3">
          <button onClick={reset} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
            <RotateCcw size={16} aria-hidden="true" />
            重置
          </button>
          <button
            onClick={submit}
            className={`flex items-center gap-2 rounded-2xl px-6 py-2 text-sm font-black transition-all ${
              canSubmit
                ? 'btn-primary'
                : 'cursor-not-allowed border-2 border-border bg-card-2 text-text-2'
            }`}
            disabled={!canSubmit}
          >
            <Check size={16} aria-hidden="true" />
            {submitLabel}
          </button>
        </div>
      )}

      {!completed && mathSlots.length > 0 && (
        <PracticeMathKeyboard
          slots={mathSlots}
          activeSlotId={focusedKey}
          onActiveSlotChange={setActiveSlotId}
        />
      )}
    </div>
  );
}
