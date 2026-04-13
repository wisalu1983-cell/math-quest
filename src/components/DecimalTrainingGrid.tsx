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
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
      <div className="text-xs text-amber-700 font-semibold mb-3 tracking-wide flex items-center gap-1">
        <span>📐</span>
        <span>训练格</span>
        {!showFeedback && <span className="text-amber-500 font-normal">（填完解锁答案）</span>}
      </div>
      {fields.map((field, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-2 text-sm flex-wrap">
          <span className="text-gray-600">{field.label}</span>
          <input
            type="text"
            inputMode="decimal"
            value={values[idx] ?? ''}
            onChange={e => handleChange(idx, e.target.value)}
            placeholder={field.placeholder ?? '?'}
            disabled={allDone}
            className={`w-16 text-center text-lg font-bold rounded-lg border-2 px-2 py-1 outline-none transition-colors
              ${results[idx] === 'correct'
                ? 'border-green-500 bg-green-50 text-green-700'
                : results[idx] === 'wrong'
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-amber-400 bg-white text-gray-800 focus:border-blue-500'
              }
              ${allDone ? 'opacity-60' : ''}
            `}
          />
          {showFeedback && results[idx] === 'wrong' && (
            <span className="text-red-500 text-xs">✗ 再想想</span>
          )}
          {showFeedback && results[idx] === 'correct' && (
            <span className="text-green-500 text-xs">✓</span>
          )}
        </div>
      ))}
      {allDone && (
        <div className="text-green-600 text-xs font-semibold mt-2">✓ 训练格完成，请填写答案</div>
      )}
    </div>
  );
}
