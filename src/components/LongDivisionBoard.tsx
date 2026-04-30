import { Check, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
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

function fieldColumnSpan(value: string, endColumn: number, maxColumns: number) {
  const width = Math.max(1, value.replace(/\D/g, '').length);
  const end = Math.min(maxColumns - 1, Math.max(0, endColumn));
  const start = Math.max(0, end - width + 1);
  return `${start + 2} / ${end + 3}`;
}

function compactDisplay(value: string): string {
  return value.length > 10 ? `${value.slice(0, 10)}...` : value;
}

export default function LongDivisionBoard({ data, difficulty, onComplete }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [conversionSubmitted, setConversionSubmitted] = useState(false);
  const [conversionConfirmed, setConversionConfirmed] = useState(!data.setupFields?.length);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const prefersVirtualKeyboard = usePrefersVirtualKeyboard();

  const setupKeys = useMemo(() => data.setupFields?.map(field => field.id) ?? [], [data.setupFields]);
  const allInputKeys = useMemo(() => getLongDivisionOrderedInputKeys(data), [data]);
  const boardInputKeys = useMemo(
    () => allInputKeys.filter(key => !key.startsWith('setup-')),
    [allInputKeys],
  );
  const visibleInputKeys = conversionConfirmed ? boardInputKeys : setupKeys;

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
    const first = visibleInputKeys[0] ?? null;
    const timer = window.setTimeout(() => {
      setFocusedKey(first);
      if (first && !prefersVirtualKeyboard) {
        inputRefs.current[first]?.focus({ preventScroll: true });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [prefersVirtualKeyboard, visibleInputKeys]);

  const focusNext = useCallback((key: string) => {
    const currentIndex = visibleInputKeys.indexOf(key);
    const nextKey = visibleInputKeys[currentIndex + 1];
    if (nextKey) setActiveSlotId(nextKey);
  }, [setActiveSlotId, visibleInputKeys]);

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

  const mathSlots = useMemo<MathInputSlot[]>(() => {
    if (completed) return [];
    return visibleInputKeys.map(key => ({
      id: key,
      label: fieldLabel(key),
      value: values[key] ?? '',
      maxLength: maxLengthForField(key),
      enabledKeys: inputKeysForField(key),
      sanitizeInput: (raw, previous) => sanitizeForField(key, raw, previous),
      setValue: next => updateValue(key, next),
      shouldAutoAdvance: ({ nextValue }) => shouldAutoAdvance(key, nextValue),
    }));
  }, [
    completed,
    fieldLabel,
    inputKeysForField,
    maxLengthForField,
    sanitizeForField,
    shouldAutoAdvance,
    updateValue,
    values,
    visibleInputKeys,
  ]);

  const visibleFieldsFilled = visibleInputKeys.every(key => (values[key] ?? '').trim().length > 0);

  const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>, key: string) => {
    if (event.key !== 'Tab' && event.key !== 'Enter') return;
    event.preventDefault();
    focusNext(key);
  }, [focusNext]);

  const handleInputChange = (key: string, raw: string) => {
    const nextValue = sanitizeForField(key, raw, values[key] ?? '');
    updateValue(key, nextValue);
    if (shouldAutoAdvance(key, nextValue)) focusNext(key);
  };

  const setupWrongFields = useCallback((): LongDivisionSetupField[] => {
    return (data.setupFields ?? []).filter(field => {
      const value = values[field.id] ?? '';
      if (field.mustBeInteger && !isIntegerText(value)) return true;
      return !fieldMatchesExpected(field.id, value);
    });
  }, [data.setupFields, fieldMatchesExpected, values]);

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
      setLocalWarning(`${nonInteger.label}必须是整数。`);
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
      setLocalWarning('转换结果有误，请检查转换区。');
      return;
    }

    setConversionSubmitted(false);
    setLocalWarning(null);
    setConversionConfirmed(true);
    const firstBoardKey = boardInputKeys[0] ?? null;
    setActiveSlotId(firstBoardKey);
  };

  const reset = () => {
    setValues({});
    setSubmitted(false);
    setConversionSubmitted(false);
    setConversionConfirmed(!data.setupFields?.length);
    setLocalWarning(null);
    setCompleted(false);
    const first = data.setupFields?.length ? setupKeys[0] : boardInputKeys[0];
    setActiveSlotId(first ?? null);
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

  const renderSetupPanel = () => {
    if (!data.setupFields?.length) return null;

    return (
      <section className="w-full rounded-2xl border-2 border-primary/20 bg-primary/[0.06] p-3">
        <div className="grid gap-2 md:grid-cols-3">
          {data.setupFields.map(field => (
            <label key={field.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text">
              <span className="shrink-0">{field.label}</span>
              {renderInput(field.id, 'w-0 flex-1')}
            </label>
          ))}
        </div>
      </section>
    );
  };

  const renderDividendText = () => (
    <div
      className="flex h-11 items-center justify-start rounded-lg border-2 border-border bg-card px-3 text-2xl font-black text-text"
      style={{ gridColumn: `2 / ${data.boardColumnCount + 2}`, gridRow: 2 }}
    >
      {data.workingDividend}
    </div>
  );

  const renderQuotientInputs = () => data.rounds.map(round => {
    const key = `round-${round.index}-quotient`;
    return (
      <div
        key={key}
        style={{
          gridColumn: `${data.quotientStartColumn + round.index + 2} / ${data.quotientStartColumn + round.index + 3}`,
          gridRow: 1,
        }}
      >
        {renderInput(key, 'w-11')}
      </div>
    );
  });

  const renderRoundRows = () => data.rounds.flatMap((round, index) => {
    const quotientColumn = data.quotientStartColumn + index;
    const productKey = `round-${round.index}-product`;
    const workingKind = round.nextPartialDividend != null ? 'next' : 'remainder';
    const workingKey = `round-${round.index}-${workingKind}`;
    const workingValue = round.nextPartialDividend ?? round.remainder;
    const productRow = 3 + index * 2;
    const workingRow = productRow + 1;
    const productSpan = fieldColumnSpan(round.product, quotientColumn, data.boardColumnCount);
    const workingSpan = fieldColumnSpan(workingValue, quotientColumn + (workingKind === 'next' ? 1 : 0), data.boardColumnCount);

    return [
      <div
        key={`${productKey}-minus`}
        className="flex h-11 items-center justify-center text-2xl font-black text-primary"
        style={{ gridColumn: 1, gridRow: productRow }}
      >
        -
      </div>,
      <div key={productKey} style={{ gridColumn: productSpan, gridRow: productRow }}>
        {renderInput(productKey, 'w-full')}
      </div>,
      <div
        key={`${productKey}-line`}
        className="border-b-2 border-text"
        style={{ gridColumn: productSpan, gridRow: productRow + 1 }}
      />,
      <div key={workingKey} style={{ gridColumn: workingSpan, gridRow: workingRow }}>
        {renderInput(workingKey, 'w-full')}
      </div>,
    ];
  });

  const renderLongDivisionBoard = () => (
    <section className="w-full min-w-0" data-long-division-board-section="true">
      <div className="w-full overflow-x-auto pb-1" data-long-division-board-viewport="true">
        <div className="inline-flex min-w-full justify-center">
          <div className="rounded-2xl border-2 border-border bg-bg p-3">
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `2.75rem repeat(${data.boardColumnCount}, minmax(2.45rem, 2.8rem))`,
                gridTemplateRows: `repeat(${3 + data.rounds.length * 2}, minmax(2.75rem, auto))`,
              }}
            >
              {renderQuotientInputs()}
              <div
                className="flex h-11 items-center justify-center rounded-lg border-2 border-border bg-card text-2xl font-black text-primary"
                style={{ gridColumn: 1, gridRow: 2 }}
              >
                {compactDisplay(data.workingDivisor)}
              </div>
              {renderDividendText()}
              <div
                className="border-l-2 border-t-2 border-text"
                style={{ gridColumn: `2 / ${data.boardColumnCount + 2}`, gridRow: 2 }}
              />
              {renderRoundRows()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderResultFields = () => {
    if (!data.resultFields?.length || !conversionConfirmed) return null;
    return (
      <section className="w-full rounded-2xl border-2 border-success-mid bg-success-lt p-3">
        <div className="grid gap-2 md:grid-cols-2">
          {data.resultFields.map(field => (
            <label key={field.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-black text-text">
              <span className="shrink-0">{field.label}</span>
              {renderInput(field.id, 'w-0 flex-1')}
            </label>
          ))}
        </div>
      </section>
    );
  };

  const submitLabel = conversionConfirmed ? '提交' : '确认转换';
  const canSubmit = visibleFieldsFilled;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {renderSetupPanel()}
      {conversionConfirmed && renderLongDivisionBoard()}
      {renderResultFields()}

      {data.cyclic && conversionConfirmed && (
        <div className="rounded-xl border border-primary/30 bg-primary-lt px-3 py-2 text-center text-xs font-black text-primary">
          循环小数：{data.cyclic.displayText}
        </div>
      )}

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
