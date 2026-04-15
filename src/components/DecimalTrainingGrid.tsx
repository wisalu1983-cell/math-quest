import { useState, useCallback } from 'react';
import type { TrainingField } from '@/types';

interface Props {
  fields: TrainingField[];
  difficulty: number;
  onComplete: () => void;
}

export default function DecimalTrainingGrid({ fields, difficulty, onComplete }: Props) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, 'correct' | 'wrong' | null>>({});
  const [allDone, setAllDone] = useState(false);

  // difficulty ≤ 5: show feedback on wrong answers
  // difficulty 6-7: no feedback, just need to fill all fields
  // difficulty 8+: component should not be rendered (parent handles this)
  const showFeedback = difficulty <= 5;

  const handleChange = useCallback((idx: number, value: string) => {
    const newValues = { ...values, [idx]: value };
    setValues(newValues);

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
    const allFilled = fields.every((field, i) => {
      const val = i === idx ? value : newValues[i];
      if (!val?.trim()) return false;
      if (showFeedback) return val.trim() === field.answer;
      return true; // Hard mode: just needs to be filled
    });

    if (allFilled && !allDone) {
      setAllDone(true);
      onComplete();
    }
  }, [values, fields, showFeedback, allDone, onComplete]);

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
            inputMode="decimal"
            value={values[idx] ?? ''}
            onChange={e => handleChange(idx, e.target.value)}
            placeholder={field.placeholder ?? '?'}
            disabled={allDone}
            aria-label={field.label}
            className={`w-16 text-center text-lg font-bold rounded-lg border-2 px-2 py-1 outline-none transition-colors
              ${results[idx] === 'correct'
                ? 'border-success bg-success-lt text-success'
                : results[idx] === 'wrong'
                  ? 'border-danger bg-danger-lt text-danger'
                  : 'border-border bg-card text-text focus:border-primary'
              }
              ${allDone ? 'opacity-60' : ''}
            `}
          />
          {showFeedback && results[idx] === 'wrong' && (
            <span className="text-danger text-xs font-bold" aria-hidden="true">✗ 再想想</span>
          )}
          {showFeedback && results[idx] === 'correct' && (
            <span className="text-success text-xs font-bold" aria-hidden="true">✓</span>
          )}
        </div>
      ))}
      {allDone && (
        <div className="text-success text-xs font-bold mt-2">✓ 训练格完成，请填写答案</div>
      )}
    </div>
  );
}
