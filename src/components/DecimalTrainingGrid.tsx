import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { TrainingField } from '@/types';

interface Props {
  fields: TrainingField[];
  difficulty: number;
  onComplete: () => void;
  onValuesChange?: (values: string[]) => void;
  values?: string[];
  activeIndex?: number | null;
  onFieldFocus?: (index: number) => void;
  preferVirtualKeyboard?: boolean;
}

export default function DecimalTrainingGrid({
  fields,
  difficulty,
  onComplete,
  onValuesChange,
  values: controlledValues,
  activeIndex,
  onFieldFocus,
  preferVirtualKeyboard = false,
}: Props) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, 'correct' | 'wrong' | null>>({});
  const [allDone, setAllDone] = useState(false);
  const controlledCompleteRef = useRef(false);

  // difficulty ≤ 5: show feedback on wrong answers
  // difficulty 6-7: no feedback, just need to fill all fields
  // difficulty 8+: component should not be rendered (parent handles this)
  const showFeedback = difficulty <= 5;
  const currentValues = useMemo(() => controlledValues
    ? Object.fromEntries(controlledValues.map((value, index) => [index, value]))
    : values, [controlledValues, values]);

  const evaluateAllFilled = useCallback((nextValues: Record<number, string>) => (
    fields.every((field, i) => {
      const val = nextValues[i];
      if (!val?.trim()) return false;
      if (showFeedback) return val.trim() === field.answer;
      return true;
    })
  ), [fields, showFeedback]);

  const getResults = useCallback((nextValues: Record<number, string>) => {
    const nextResults: Record<number, 'correct' | 'wrong' | null> = {};
    fields.forEach((field, index) => {
      const value = nextValues[index] ?? '';
      if (!value.trim()) {
        nextResults[index] = null;
      } else if (showFeedback) {
        nextResults[index] = value.trim() === field.answer ? 'correct' : 'wrong';
      } else {
        nextResults[index] = 'correct';
      }
    });
    return nextResults;
  }, [fields, showFeedback]);

  const displayResults = controlledValues ? getResults(currentValues) : results;
  const controlledAllDone = controlledValues ? evaluateAllFilled(currentValues) : false;
  const isAllDone = controlledValues ? controlledAllDone : allDone;

  useEffect(() => {
    if (!controlledValues || !controlledAllDone || controlledCompleteRef.current) return;
    controlledCompleteRef.current = true;
      onComplete();
  }, [controlledAllDone, controlledValues, onComplete]);

  const handleChange = useCallback((idx: number, value: string) => {
    const newValues = { ...currentValues, [idx]: value };
    if (!controlledValues) setValues(newValues);
    onValuesChange?.(fields.map((_, i) => (i === idx ? value : newValues[i] ?? '')));
    if (controlledValues) return;
    setResults(getResults(newValues));

    if (!value.trim()) {
      setResults(prev => ({ ...prev, [idx]: null }));
      return;
    }

    const isCorrect = value.trim() === fields[idx].answer;

    if (showFeedback) {
      setResults(prev => ({ ...prev, [idx]: isCorrect ? 'correct' : 'wrong' }));
      if (!isCorrect) return; // Must fix before proceeding
    } else {
      // Hard mode: mark as filled regardless of correctness
      setResults(prev => ({ ...prev, [idx]: 'correct' }));
    }

    // Check if all fields are properly filled
    const allFilled = evaluateAllFilled(newValues);

    if (allFilled && !allDone) {
      setAllDone(true);
      onComplete();
    }
  }, [allDone, controlledValues, currentValues, evaluateAllFilled, fields, getResults, onComplete, onValuesChange, showFeedback]);

  return (
    <div className="bg-primary-lt border-2 border-primary-mid rounded-xl p-4 mb-4">
      <div className="text-xs text-primary-dark font-bold mb-3 tracking-wide flex items-center gap-1">
        <span aria-hidden="true">📐</span>
        <span>训练格</span>
        {!showFeedback && <span className="text-primary font-normal">（填完解锁答案）</span>}
      </div>
      {fields.map((field, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-2 text-sm flex-wrap">
          <span className="text-text-2">{field.label}</span>
          <input
            type="text"
            inputMode={preferVirtualKeyboard ? 'none' : 'decimal'}
            value={currentValues[idx] ?? ''}
            onChange={e => handleChange(idx, e.target.value)}
            onFocus={() => onFieldFocus?.(idx)}
            onPointerDown={event => {
              if (!preferVirtualKeyboard) return;
              event.preventDefault();
              onFieldFocus?.(idx);
            }}
            placeholder={field.placeholder ?? '?'}
            disabled={isAllDone}
            aria-label={field.label}
            className={`w-16 text-center text-lg font-bold rounded-lg border-2 px-2 py-1 outline-none transition-colors
              ${displayResults[idx] === 'correct'
                ? 'border-success bg-success-lt text-success'
                : displayResults[idx] === 'wrong'
                  ? 'border-danger bg-danger-lt text-danger'
                  : activeIndex === idx
                    ? 'border-primary bg-primary-lt text-primary ring-2 ring-primary/25'
                    : 'border-border bg-card text-text focus:border-primary'
              }
              ${isAllDone ? 'opacity-60' : ''}
            `}
          />
          {showFeedback && displayResults[idx] === 'wrong' && (
            <span className="text-danger text-xs font-bold" aria-hidden="true">✗ 再想想</span>
          )}
          {showFeedback && displayResults[idx] === 'correct' && (
            <span className="text-success text-xs font-bold" aria-hidden="true">✓</span>
          )}
        </div>
      ))}
      {isAllDone && (
        <div className="text-success text-xs font-bold mt-2">✓ 训练格完成，请填写答案</div>
      )}
    </div>
  );
}
