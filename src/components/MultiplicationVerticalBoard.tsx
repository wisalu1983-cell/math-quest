import { Check, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { MultiplicationBoardData, VerticalCalcCompletePayload } from '@/types';
import PracticeMathKeyboard from '@/pages/PracticeMathKeyboard';
import { inputKeysForRow, resolveTabTarget } from '@/utils/multiplication-input-order';
import {
  DECIMAL_KEYS,
  DIGIT_KEYS,
  sanitizeDecimalInput,
  sanitizeDigitInput,
  sanitizeSingleDigitInput,
  usePrefersVirtualKeyboard,
} from '@/pages/practice-math-keyboard';
import type { MathInputSlot } from '@/pages/practice-math-keyboard';
import {
  buildMultiplicationVerticalLayout,
  isEquivalentFinalAnswer,
  placeDecimalPoint,
} from '@/engine/verticalMultiplication';
import { classifyMultiplicationErrors } from '@/engine/verticalMultiplicationErrors';

interface Props {
  data: MultiplicationBoardData;
  onComplete: (result: VerticalCalcCompletePayload) => void;
}

interface RenderRow {
  id: string;
  label: string;
  cells: Array<string | null>;
}

const operandADecimalPlacesKey = 'operand-a-decimal-places';
const operandBDecimalPlacesKey = 'operand-b-decimal-places';
const decimalMoveKey = 'decimal-move';
const finalAnswerKey = 'final-answer';
const integerFinalAnswerKey = 'integer-final-answer';

function countDecimalPlaces(value: string): number {
  const [, decimal = ''] = value.split('.');
  return decimal.length;
}

function cellClass(status: 'idle' | 'correct' | 'wrong', active: boolean): string {
  if (status === 'correct') return 'border-success bg-success-lt text-success';
  if (status === 'wrong') return 'border-danger bg-danger-lt text-danger animate-shake';
  if (active) return 'border-primary bg-primary-lt text-primary ring-2 ring-primary/20';
  return 'border-border bg-card text-text focus:border-primary';
}

export default function MultiplicationVerticalBoard({ data, onComplete }: Props) {
  const [multiplicand, multiplier] = data.integerOperands;
  const board = useMemo(
    () => buildMultiplicationVerticalLayout(multiplicand, multiplier),
    [multiplicand, multiplier],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const prefersVirtualKeyboard = usePrefersVirtualKeyboard();

  const isDecimalMode = data.mode === 'decimal';
  const originalA = data.originalOperands?.[0] ?? String(multiplicand);
  const originalB = data.originalOperands?.[1] ?? String(multiplier);
  const operandDecimalPlaces = useMemo(
    () => data.operandDecimalPlaces ?? [
      countDecimalPlaces(originalA),
      countDecimalPlaces(originalB),
    ] as [number, number],
    [data.operandDecimalPlaces, originalA, originalB],
  );
  const decimalPlaces = data.decimalPlaces ?? operandDecimalPlaces[0] + operandDecimalPlaces[1];
  const integerProduct = String(multiplicand * multiplier);
  const expectedFinalAnswer = data.finalAnswer ?? placeDecimalPoint(integerProduct, decimalPlaces);

  const calculationRows = useMemo<RenderRow[]>(() => [
    ...board.partials.map((row, index) => ({
      id: row.id,
      label: `第 ${index + 1} 个部分积`,
      cells: row.cells,
    })),
    { id: board.total.id, label: '积', cells: board.total.cells },
  ], [board]);

  const operandRows = useMemo<RenderRow[]>(() => [
    { id: 'operand-a', label: '整数被乘数', cells: board.operandA },
    { id: 'operand-b', label: '整数乘数', cells: board.operandB },
  ], [board.operandA, board.operandB]);

  const orderedInputKeys = useMemo(() => {
    const operandKeys = isDecimalMode && data.operandInputMode === 'blank'
      ? operandRows.flatMap(row => inputKeysForRow(row, 'ltr'))
      : [];
    const calculationKeys = calculationRows.flatMap(row =>
      inputKeysForRow(row, 'rtl'),
    );
    return isDecimalMode
      ? [
          ...operandKeys,
          ...calculationKeys,
          operandADecimalPlacesKey,
          operandBDecimalPlacesKey,
          decimalMoveKey,
          finalAnswerKey,
        ]
      : calculationKeys;
  }, [calculationRows, data.operandInputMode, isDecimalMode, operandRows]);

  const expectedByKey = useMemo(() => {
    const entries: Record<string, string> = {};
    if (isDecimalMode && data.operandInputMode === 'blank') {
      operandRows.forEach(row => {
        row.cells.forEach((cell, index) => {
          if (cell != null) entries[`${row.id}-${index}`] = cell;
        });
      });
    }
    calculationRows.forEach(row => {
      row.cells.forEach((cell, index) => {
        if (cell != null) entries[`${row.id}-${index}`] = cell;
      });
    });
    if (isDecimalMode) {
      entries[operandADecimalPlacesKey] = String(operandDecimalPlaces[0]);
      entries[operandBDecimalPlacesKey] = String(operandDecimalPlaces[1]);
      entries[decimalMoveKey] = String(decimalPlaces);
      entries[finalAnswerKey] = expectedFinalAnswer;
    }
    return entries;
  }, [calculationRows, data.operandInputMode, decimalPlaces, expectedFinalAnswer, isDecimalMode, operandDecimalPlaces, operandRows]);

  useEffect(() => {
    window.setTimeout(() => {
      const first = orderedInputKeys[0];
      if (!first) return;
      setFocusedKey(first);
      if (!prefersVirtualKeyboard) {
        inputRefs.current[first]?.focus({ preventScroll: true });
      }
    }, 0);
  }, [orderedInputKeys, prefersVirtualKeyboard]);

  const isExpectedValue = (key: string, rawValue: string) => (
    key === finalAnswerKey
      ? isEquivalentFinalAnswer(rawValue, expectedByKey[key] ?? '')
      : rawValue.trim() === expectedByKey[key]
  );

  const allFilled = orderedInputKeys.every(key => (values[key] ?? '').trim().length > 0);
  const hasWrong = submitted && orderedInputKeys.some(key => !isExpectedValue(key, values[key] ?? ''));

  const scrollInputIntoView = useCallback((key: string) => {
    inputRefs.current[key]?.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, []);

  const focusNext = (key: string) => {
    const currentIndex = orderedInputKeys.indexOf(key);
    const nextKey = orderedInputKeys[currentIndex + 1];
    if (nextKey) {
      setFocusedKey(nextKey);
      scrollInputIntoView(nextKey);
      if (!prefersVirtualKeyboard) {
        inputRefs.current[nextKey]?.focus({ preventScroll: true });
      }
    }
  };

  const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>, key: string) => {
    if (event.key !== 'Tab') return;
    const nextKey = resolveTabTarget(orderedInputKeys, key, event.shiftKey);
    if (!nextKey) return;
    event.preventDefault();
    setFocusedKey(nextKey);
    scrollInputIntoView(nextKey);
    if (!prefersVirtualKeyboard) {
      inputRefs.current[nextKey]?.focus({ preventScroll: true });
    }
  }, [orderedInputKeys, prefersVirtualKeyboard, scrollInputIntoView]);

  const updateDigitCell = (key: string, raw: string) => {
    if (completed) return;
    const nextValue = raw.replace(/\D/g, '').slice(-1);
    setValues(prev => ({ ...prev, [key]: nextValue }));
    setSubmitted(false);
    if (nextValue) focusNext(key);
  };

  const updateSmallNumber = (key: string, raw: string) => {
    if (completed) return;
    const nextValue = raw.replace(/\D/g, '').slice(0, 2);
    setValues(prev => ({ ...prev, [key]: nextValue }));
    setSubmitted(false);
    if (nextValue.length >= (expectedByKey[key]?.length ?? 1)) {
      focusNext(key);
    }
  };

  const updateFinalAnswer = (raw: string) => {
    if (completed) return;
    const digitsAndPoint = raw.replace(/[^\d.]/g, '');
    const firstPointIndex = digitsAndPoint.indexOf('.');
    const nextValue = firstPointIndex === -1
      ? digitsAndPoint
      : `${digitsAndPoint.slice(0, firstPointIndex + 1)}${digitsAndPoint.slice(firstPointIndex + 1).replace(/\./g, '')}`;
    setValues(prev => ({ ...prev, [finalAnswerKey]: nextValue }));
    setSubmitted(false);
  };

  const reset = () => {
    setValues({});
    setSubmitted(false);
    setCompleted(false);
    const first = orderedInputKeys[0];
    if (first) {
      setFocusedKey(first);
      if (!prefersVirtualKeyboard) inputRefs.current[first]?.focus({ preventScroll: true });
    }
  };

  const integerFinalAnswerFromValues = (source: Record<string, string>) => {
    const totalRow = calculationRows[calculationRows.length - 1];
    return totalRow.cells
      .map((cell, index) => (cell == null ? '' : source[`${totalRow.id}-${index}`] ?? ''))
      .join('')
      .replace(/^0+(?=\d)/, '') || '';
  };

  const submit = () => {
    if (completed || !allFilled) return;
    const classifierExpected = { ...expectedByKey };
    const classifierValues = { ...values };
    const classifierKeys = [...orderedInputKeys];
    const classifierFinalKey = isDecimalMode ? finalAnswerKey : integerFinalAnswerKey;
    if (!isDecimalMode) {
      classifierExpected[integerFinalAnswerKey] = String(multiplicand * multiplier);
      classifierValues[integerFinalAnswerKey] = integerFinalAnswerFromValues(values);
      classifierKeys.push(integerFinalAnswerKey);
    }
    const result = classifyMultiplicationErrors({
      orderedInputKeys: classifierKeys,
      expectedByKey: classifierExpected,
      userValues: classifierValues,
      finalAnswerKey: classifierFinalKey,
    });
    setSubmitted(true);
    setCompleted(true);
    onComplete(result);
  };

  const labelForKey = useCallback((key: string): string => {
    if (key === finalAnswerKey) return '最终答数';
    if (key === operandADecimalPlacesKey) return '被乘数小数位数';
    if (key === operandBDecimalPlacesKey) return '乘数小数位数';
    if (key === decimalMoveKey) return '小数点移动位数';
    const [rowId, index] = key.split(/-(?=\d+$)/);
    const row = [...operandRows, ...calculationRows].find(item => item.id === rowId);
    return row ? `${row.label}第 ${Number(index) + 1} 格` : key;
  }, [calculationRows, operandRows]);

  const setActiveSlotId = (slotId: string | null) => {
    setFocusedKey(slotId);
    if (slotId && !prefersVirtualKeyboard) {
      scrollInputIntoView(slotId);
      inputRefs.current[slotId]?.focus({ preventScroll: true });
    } else if (slotId) {
      scrollInputIntoView(slotId);
    }
  };

  const multiplicationMathSlots = useMemo<MathInputSlot[]>(() => {
    if (completed) return [];
    return orderedInputKeys.map(key => {
      if (key === finalAnswerKey) {
        return {
          id: key,
          label: labelForKey(key),
          value: values[key] ?? '',
          maxLength: 16,
          enabledKeys: DECIMAL_KEYS,
          sanitizeInput: sanitizeDecimalInput,
          setValue: next => {
            if (completed) return;
            setValues(prev => ({ ...prev, [key]: next }));
            setSubmitted(false);
          },
        };
      }
      if (
        key === operandADecimalPlacesKey ||
        key === operandBDecimalPlacesKey ||
        key === decimalMoveKey
      ) {
        return {
          id: key,
          label: labelForKey(key),
          value: values[key] ?? '',
          maxLength: 2,
          enabledKeys: DIGIT_KEYS,
          sanitizeInput: sanitizeDigitInput,
          setValue: next => {
            if (completed) return;
            setValues(prev => ({ ...prev, [key]: next }));
            setSubmitted(false);
          },
          shouldAutoAdvance: ({ nextValue }) => nextValue.length >= (expectedByKey[key]?.length ?? 1),
        };
      }
      return {
        id: key,
        label: labelForKey(key),
        value: values[key] ?? '',
        maxLength: 1,
        enabledKeys: DIGIT_KEYS,
        sanitizeInput: sanitizeSingleDigitInput,
        setValue: next => {
          if (completed) return;
          setValues(prev => ({ ...prev, [key]: next }));
          setSubmitted(false);
        },
        shouldAutoAdvance: ({ nextValue }) => nextValue.length >= 1,
      };
    });
  }, [completed, expectedByKey, labelForKey, orderedInputKeys, values]);

  const renderStaticRow = (cells: Array<string | null>, prefix = '') => (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `2.75rem repeat(${board.width}, minmax(2.25rem, 2.75rem))` }}
    >
      <div className="flex h-11 items-center justify-center text-2xl font-black text-primary">{prefix}</div>
      {cells.map((cell, index) => (
        <div
          key={index}
          className="flex h-11 items-center justify-center rounded-lg border-2 border-transparent bg-bg text-2xl font-black text-text"
        >
          {cell ?? ''}
        </div>
      ))}
    </div>
  );

  const renderInputRow = (row: RenderRow, prefix = '', alignOnlyEmpty = false) => (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `2.75rem repeat(${board.width}, minmax(2.25rem, 2.75rem))` }}
    >
      <div className="flex h-11 items-center justify-center text-2xl font-black text-primary">{prefix}</div>
      {row.cells.map((cell, index) => {
        const key = `${row.id}-${index}`;
        if (cell == null) {
          return (
            <div
              key={index}
              className={`h-11 rounded-lg border-2 ${
                alignOnlyEmpty
                  ? 'border-transparent bg-bg'
                  : 'border-dashed border-border/40 bg-bg/60'
              }`}
            />
          );
        }

        const userValue = values[key] ?? '';
        const status = !submitted ? 'idle' : isExpectedValue(key, userValue) ? 'correct' : 'wrong';
        return (
          <input
            key={index}
            ref={node => { inputRefs.current[key] = node; }}
            value={userValue}
            onChange={event => updateDigitCell(key, event.target.value)}
            onKeyDown={event => handleInputKeyDown(event, key)}
            onFocus={() => setFocusedKey(key)}
            onPointerDown={event => {
              if (!prefersVirtualKeyboard) return;
              event.preventDefault();
              setActiveSlotId(key);
            }}
            inputMode={prefersVirtualKeyboard ? 'none' : 'numeric'}
            aria-label={`${row.label}第 ${index + 1} 格`}
            className={`h-11 rounded-lg border-2 text-center text-2xl font-black outline-none transition-all ${cellClass(status, focusedKey === key)}`}
            readOnly={prefersVirtualKeyboard}
            disabled={completed}
          />
        );
      })}
    </div>
  );

  const decimalFieldStatus = (key: string): 'idle' | 'correct' | 'wrong' => {
    if (!submitted) return 'idle';
    return isExpectedValue(key, values[key] ?? '') ? 'correct' : 'wrong';
  };

  const renderDecimalPlaceField = (key: string, label: string) => (
    <label className="flex min-w-0 items-center justify-center gap-2 text-sm font-black text-primary-dark">
      <span className="truncate">{label} 有</span>
      <input
        ref={node => { inputRefs.current[key] = node; }}
        value={values[key] ?? ''}
        onChange={event => updateSmallNumber(key, event.target.value)}
        onKeyDown={event => handleInputKeyDown(event, key)}
        onFocus={() => setFocusedKey(key)}
        onPointerDown={event => {
          if (!prefersVirtualKeyboard) return;
          event.preventDefault();
          setActiveSlotId(key);
        }}
        inputMode={prefersVirtualKeyboard ? 'none' : 'numeric'}
        aria-label={`${label}的小数位数`}
        className={`h-11 w-14 rounded-lg border-2 text-center text-xl font-black outline-none transition-all ${cellClass(decimalFieldStatus(key), focusedKey === key)}`}
        readOnly={prefersVirtualKeyboard}
        disabled={completed}
      />
      <span>位小数</span>
    </label>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full overflow-x-auto pb-1">
        <div className="inline-flex min-w-full justify-center">
          <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-border bg-bg p-3">
            {isDecimalMode && data.operandInputMode === 'blank'
              ? renderInputRow(operandRows[0], '', true)
              : renderStaticRow(board.operandA)}
            {isDecimalMode && data.operandInputMode === 'blank'
              ? renderInputRow(operandRows[1], '×', true)
              : renderStaticRow(board.operandB, '×')}
            <div className="ml-10 border-b-2 border-text" />
            {calculationRows.slice(0, -1).map(row => (
              <div key={row.id}>{renderInputRow(row)}</div>
            ))}
            <div className="ml-10 border-b-2 border-text" />
            {renderInputRow(calculationRows[calculationRows.length - 1])}
          </div>
        </div>
      </div>

      {isDecimalMode && (
        <div className="grid w-full gap-3 rounded-2xl border-2 border-primary/20 bg-primary/[0.06] p-3 md:grid-cols-2">
          {renderDecimalPlaceField(operandADecimalPlacesKey, originalA)}
          {renderDecimalPlaceField(operandBDecimalPlacesKey, originalB)}
          <label className="flex min-w-0 items-center justify-center gap-2 text-sm font-black text-text">
            <span className="shrink-0">小数点向左移动</span>
            <input
              ref={node => { inputRefs.current[decimalMoveKey] = node; }}
              value={values[decimalMoveKey] ?? ''}
              onChange={event => updateSmallNumber(decimalMoveKey, event.target.value)}
              onKeyDown={event => handleInputKeyDown(event, decimalMoveKey)}
              onFocus={() => setFocusedKey(decimalMoveKey)}
              onPointerDown={event => {
                if (!prefersVirtualKeyboard) return;
                event.preventDefault();
                setActiveSlotId(decimalMoveKey);
              }}
              inputMode={prefersVirtualKeyboard ? 'none' : 'numeric'}
              aria-label="小数点向左移动的位数"
              className={`h-11 w-14 rounded-lg border-2 text-center text-xl font-black outline-none transition-all ${cellClass(decimalFieldStatus(decimalMoveKey), focusedKey === decimalMoveKey)}`}
              readOnly={prefersVirtualKeyboard}
              disabled={completed}
            />
            <span>位</span>
          </label>
          <label className="flex min-w-0 items-center justify-center gap-2 text-sm font-black text-text">
            <span className="shrink-0">最终答数</span>
            <input
              ref={node => { inputRefs.current[finalAnswerKey] = node; }}
              value={values[finalAnswerKey] ?? ''}
              onChange={event => updateFinalAnswer(event.target.value)}
              onKeyDown={event => handleInputKeyDown(event, finalAnswerKey)}
              onFocus={() => setFocusedKey(finalAnswerKey)}
              onPointerDown={event => {
                if (!prefersVirtualKeyboard) return;
                event.preventDefault();
                setActiveSlotId(finalAnswerKey);
              }}
              inputMode={prefersVirtualKeyboard ? 'none' : 'decimal'}
              aria-label="最终答数"
              className={`h-11 w-0 min-w-0 flex-1 rounded-lg border-2 px-3 text-center text-2xl font-black outline-none transition-all ${cellClass(decimalFieldStatus(finalAnswerKey), focusedKey === finalAnswerKey)}`}
              readOnly={prefersVirtualKeyboard}
              disabled={completed}
            />
          </label>
        </div>
      )}

      {submitted && hasWrong && (
        <div className="text-sm font-bold text-danger">有格子不正确，请看红色标记</div>
      )}
      {submitted && !hasWrong && (
        <div className="animate-pulse-grow text-lg font-bold text-success">全部正确！</div>
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
              allFilled
                ? 'btn-primary'
                : 'cursor-not-allowed border-2 border-border bg-card-2 text-text-2'
            }`}
            disabled={!allFilled}
          >
            <Check size={16} aria-hidden="true" />
            提交
          </button>
        </div>
      )}
      {!completed && multiplicationMathSlots.length > 0 && (
        <PracticeMathKeyboard
          slots={multiplicationMathSlots}
          activeSlotId={focusedKey}
          onActiveSlotChange={setActiveSlotId}
        />
      )}
    </div>
  );
}
