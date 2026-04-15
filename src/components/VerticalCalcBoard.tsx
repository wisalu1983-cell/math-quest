import { useState, useRef, useEffect, useMemo } from 'react';
import type { VerticalCalcData } from '@/types';

interface Props {
  data: VerticalCalcData;
  onComplete: (correct: boolean) => void;
}

interface ColumnExpected {
  digit: number;
  carry: number; // 0 = no carry expected
  carryMandatory: boolean;
  digitHint: string;
  carryHint: string;
}

type CellId = { type: 'carry' | 'digit'; col: number };

export default function VerticalCalcBoard({ data, onComplete }: Props) {
  const { operation, operands, steps } = data;
  const dp = data.decimalPlaces ?? 0;

  // Build expected values per column
  const columns = useMemo(() => {
    const map: Record<number, ColumnExpected> = {};
    let maxCol = 0;
    for (const step of steps) {
      const col = step.column;
      if (!map[col]) map[col] = { digit: 0, carry: 0, carryMandatory: false, digitHint: '', carryHint: '' };
      if (step.stepType === 'digit') {
        map[col].digit = step.expectedDigit;
        map[col].digitHint = step.hint;
      } else {
        map[col].carry = step.expectedDigit;
        map[col].carryMandatory = !step.skippable;
        map[col].carryHint = step.hint;
      }
      if (col > maxCol) maxCol = col;
    }
    const result: ColumnExpected[] = [];
    for (let c = 0; c <= maxCol; c++) {
      result.push(map[c] ?? { digit: 0, carry: 0, carryMandatory: false, digitHint: '', carryHint: '' });
    }
    return result;
  }, [steps]);

  const totalCols = columns.length;

  const a = operands[0];
  const b = operands[1];
  const aDigits = String(a).split('').map(Number);
  const bDigits = String(b).split('').map(Number);
  // 从 steps 推算答案位数，避免浮点运算精度问题（如 0.1+0.2=0.30000...）
  const answerDigitCount = columns.length;
  const gridCols = Math.max(aDigits.length, bDigits.length, answerDigitCount) + 1 + (dp > 0 ? 1 : 0);

  // The decimal point visual column position (render column index, or -1 if no dp)
  // gridCols includes: 1 operator col + digit cols + (dp > 0 ? 1 dot col : 0)
  // The dot sits between the dp-th and (dp-1)-th digit from the right
  // In render terms (left-to-right): dotRenderCol = gridCols - 1 - dp
  const dotRenderCol = dp > 0 ? gridCols - 1 - dp : -1;

  // Convert render column index to step column index (right-to-left, 0 = units)
  const renderToStepCol = (renderCol: number): number => {
    if (renderCol === 0) return -1; // operator column
    if (renderCol === dotRenderCol) return -1; // dot column
    let digitIdx = renderCol - 1; // subtract operator column
    if (dp > 0 && renderCol > dotRenderCol) {
      digitIdx -= 1; // subtract dot column
    }
    // Convert from left-to-right render index to right-to-left step column
    const totalDigitCols = gridCols - 1 - (dp > 0 ? 1 : 0);
    return totalDigitCols - 1 - digitIdx;
  };

  // Initial active cell: first mandatory cell
  const initialCell = useMemo((): CellId => {
    if (columns[0]?.carryMandatory) return { type: 'carry', col: 0 };
    return { type: 'digit', col: 0 };
  }, [columns]);

  // State: user-filled values. undefined = empty. Carry values can be negative (borrow)
  const [carryValues, setCarryValues] = useState<Record<number, number | undefined>>({});
  const [digitValues, setDigitValues] = useState<Record<number, number | undefined>>({});
  const [activeCell, setActiveCell] = useState<CellId | null>(initialCell);
  const [pendingMinus, setPendingMinus] = useState(false); // user pressed minus, waiting for digit
  const [cellResults, setCellResults] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [corrections, setCorrections] = useState<Record<string, number>>({}); // key -> correct value to show
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !completed) inputRef.current.focus();
  }, [activeCell, completed]);

  const cellKey = (type: string, col: number) => `${type}-${col}`;

  const handleCellClick = (cell: CellId) => {
    if (completed) return;
    setActiveCell(cell);
    setPendingMinus(false);
    inputRef.current?.focus();
  };

  // Find the next mandatory empty cell after `from`, considering current filled state
  const findNextMandatory = (from: CellId, newCarries: Record<number, number | undefined>, newDigits: Record<number, number | undefined>): CellId | null => {
    // Build ordered list of mandatory cells starting after `from`
    // Order: col0 carry, col0 digit, col1 carry, col1 digit, ...
    const all: CellId[] = [];
    for (let c = 0; c < totalCols; c++) {
      if (columns[c].carryMandatory) {
        all.push({ type: 'carry', col: c });
      }
      all.push({ type: 'digit', col: c });
    }

    // Find index of `from` in the list
    const fromIdx = all.findIndex(cell => cell.type === from.type && cell.col === from.col);

    // Search forward from the next position, wrapping is not needed - just go forward
    for (let i = fromIdx + 1; i < all.length; i++) {
      const cell = all[i];
      const isEmpty = cell.type === 'carry'
        ? newCarries[cell.col] === undefined
        : newDigits[cell.col] === undefined;
      if (isEmpty) return cell;
    }
    return null; // all mandatory cells filled
  };

  const handleInput = (value: string) => {
    if (completed || !activeCell) return;

    // Handle minus key: only meaningful for carry cells
    if (value === '-') {
      if (activeCell.type === 'carry') {
        setPendingMinus(true);
      }
      return;
    }

    const digit = parseInt(value);
    if (isNaN(digit) || digit < 0 || digit > 9) return;

    let newCarries = carryValues;
    let newDigits = digitValues;

    if (activeCell.type === 'carry') {
      const finalValue = pendingMinus ? -digit : digit;
      setPendingMinus(false);
      newCarries = { ...carryValues, [activeCell.col]: finalValue };
      setCarryValues(newCarries);
    } else {
      setPendingMinus(false);
      newDigits = { ...digitValues, [activeCell.col]: digit };
      setDigitValues(newDigits);
    }

    // Auto-advance to next mandatory empty cell
    const next = findNextMandatory(activeCell, newCarries, newDigits);
    if (next) setActiveCell(next);
  };

  const handleClear = () => {
    if (completed || !activeCell) return;
    if (activeCell.type === 'carry') {
      setCarryValues(prev => { const n = { ...prev }; delete n[activeCell.col]; return n; });
    } else {
      setDigitValues(prev => { const n = { ...prev }; delete n[activeCell.col]; return n; });
    }
  };

  const handleSubmit = () => {
    if (completed) return;
    const results: Record<string, 'correct' | 'wrong'> = {};
    const corrects: Record<string, number> = {};
    let allCorrect = true;

    for (let col = 0; col < totalCols; col++) {
      const expected = columns[col];

      // Check digit
      const userDigit = digitValues[col];
      // Unfilled high-position zeros are OK (e.g. answer 10, user doesn't need to fill leading 0s)
      if (userDigit === undefined && expected.digit === 0 && col > highestNonZeroCol) {
        // Leading zero left blank — correct
        results[cellKey('digit', col)] = 'correct';
      } else if (userDigit === expected.digit) {
        results[cellKey('digit', col)] = 'correct';
      } else {
        results[cellKey('digit', col)] = 'wrong';
        corrects[cellKey('digit', col)] = expected.digit;
        allCorrect = false;
      }

      // Check carry
      const userCarry = carryValues[col];
      if (expected.carry !== 0) {
        if (expected.carryMandatory) {
          if (userCarry === expected.carry) {
            results[cellKey('carry', col)] = 'correct';
          } else {
            results[cellKey('carry', col)] = 'wrong';
            corrects[cellKey('carry', col)] = expected.carry;
            allCorrect = false;
          }
        } else {
          if (userCarry === undefined) {
            // optional, left empty - fine
          } else if (userCarry === expected.carry) {
            results[cellKey('carry', col)] = 'correct';
          } else {
            results[cellKey('carry', col)] = 'wrong';
            corrects[cellKey('carry', col)] = expected.carry;
            allCorrect = false;
          }
        }
      } else {
        if (userCarry !== undefined && userCarry !== 0) {
          results[cellKey('carry', col)] = 'wrong';
          corrects[cellKey('carry', col)] = 0;
          allCorrect = false;
        } else if (userCarry !== undefined) {
          results[cellKey('carry', col)] = 'correct';
        }
      }
    }

    setCellResults(results);
    setCorrections(corrects);
    setCompleted(true);
    setActiveCell(null);
    onComplete(allCorrect);
  };

  // ─── Rendering ───
  // Total digit columns (excludes operator col and dot col)
  const totalDigitCols = gridCols - 1 - (dp > 0 ? 1 : 0);

  // padDigits returns an array of length totalDigitCols (no dot slot)
  const padDigits = (digits: number[]) => {
    const padded = new Array(totalDigitCols).fill(undefined);
    for (let i = 0; i < digits.length; i++) {
      padded[totalDigitCols - 1 - i] = digits[digits.length - 1 - i];
    }
    return padded;
  };

  const paddedA = padDigits(aDigits);
  const paddedB = padDigits(bDigits);

  const renderCarryCell = (gridCol: number) => {
    // Dot column: render invisible spacer
    if (gridCol === dotRenderCol) {
      return <div key={gridCol} className="w-10 h-10 sm:w-12 sm:h-12" />;
    }

    const logCol = renderToStepCol(gridCol);
    if (logCol < 0 || logCol >= totalCols) {
      return <div key={gridCol} className="w-10 h-10 sm:w-12 sm:h-12" />;
    }

    const val = carryValues[logCol];
    const isActive = activeCell?.type === 'carry' && activeCell.col === logCol && !completed;
    const result = cellResults[cellKey('carry', logCol)];
    const isMandatory = columns[logCol]?.carryMandatory;

    let cls = 'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-sm font-bold rounded-lg transition-all cursor-pointer ';
    if (result === 'correct') {
      cls += 'border-2 border-success bg-success/10 text-success ';
    } else if (result === 'wrong') {
      cls += 'border-2 border-danger bg-danger/10 text-danger animate-shake ';
    } else if (isActive) {
      cls += 'border-2 border-secondary bg-secondary/10 text-secondary ring-2 ring-secondary/30 ';
    } else if (val !== undefined) {
      cls += 'border-2 border-accent/50 bg-accent/5 text-accent ';
    } else {
      cls += `border-2 border-dashed ${isMandatory ? 'border-border/60 hover:border-secondary/50' : 'border-border/30 hover:border-border/50'} `;
    }

    let displayContent: string | number = '';
    if (result === 'wrong' && corrections[cellKey('carry', logCol)] !== undefined) {
      displayContent = corrections[cellKey('carry', logCol)];
    } else if (val !== undefined) {
      displayContent = val;
    }

    return (
      <div key={gridCol} className={cls} onClick={() => handleCellClick({ type: 'carry', col: logCol })}>
        {displayContent !== '' ? displayContent : pendingMinus && isActive ? '-' : ''}
      </div>
    );
  };

  const renderDigitCell = (gridCol: number) => {
    // Dot column: render red decimal point (non-interactive)
    if (gridCol === dotRenderCol) {
      return (
        <div
          key={gridCol}
          className="digit-cell flex items-end justify-center pb-1"
          style={{ color: '#e53935', fontWeight: 'bold', fontSize: '1.5rem', border: 'none', cursor: 'default' }}
        >
          .
        </div>
      );
    }

    const logCol = renderToStepCol(gridCol);
    if (logCol < 0 || logCol >= totalCols) {
      return <div key={gridCol} className="digit-cell digit-cell-empty" />;
    }

    const val = digitValues[logCol];
    const isActive = activeCell?.type === 'digit' && activeCell.col === logCol && !completed;
    const result = cellResults[cellKey('digit', logCol)];

    let cls = 'digit-cell cursor-pointer ';
    if (result === 'correct') {
      cls += 'digit-cell-correct ';
    } else if (result === 'wrong') {
      cls += 'digit-cell-wrong ';
    } else if (isActive) {
      cls += 'digit-cell-active ';
    } else if (val !== undefined) {
      cls += 'digit-cell-filled ';
    } else {
      cls += 'digit-cell-empty hover:border-border ';
    }

    return (
      <div key={gridCol} className={cls} onClick={() => handleCellClick({ type: 'digit', col: logCol })}>
        {result === 'wrong' && corrections[cellKey('digit', logCol)] !== undefined
          ? corrections[cellKey('digit', logCol)]
          : val !== undefined ? val : ''}
      </div>
    );
  };

  // Find the highest column that has a non-zero expected digit
  const highestNonZeroCol = useMemo(() => {
    for (let c = totalCols - 1; c >= 0; c--) {
      if (columns[c].digit !== 0) return c;
    }
    return 0;
  }, [columns, totalCols]);

  // Can submit: all columns up to highestNonZeroCol must be filled
  const canSubmit = useMemo(() => {
    for (let c = 0; c <= highestNonZeroCol; c++) {
      if (digitValues[c] === undefined) return false;
    }
    return true;
  }, [digitValues, highestNonZeroCol]);

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        className="opacity-0 absolute w-0 h-0"
        value=""
        onKeyDown={e => {
          if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            handleClear();
          } else if (e.key === '-') {
            e.preventDefault();
            handleInput('-');
          } else if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            handleInput(e.key);
          }
        }}
        onChange={() => {}}
        autoFocus
      />

      <div className="card p-4 inline-block">
        {/* Carry row */}
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {Array.from({ length: gridCols }).map((_, i) => renderCarryCell(i))}
        </div>

        {/* First operand */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {Array.from({ length: gridCols }).map((_, i) => {
            if (i === 0) {
              // Operator column — empty for first operand
              return <div key={i} className="digit-cell digit-cell-empty" />;
            }
            if (i === dotRenderCol) {
              // Decimal point column
              return (
                <div key={i} className="digit-cell flex items-end justify-center pb-1"
                  style={{ color: '#e53935', fontWeight: 'bold', fontSize: '1.5rem', border: 'none' }}>
                  .
                </div>
              );
            }
            // Digit column: map render col back to paddedA index
            const stepCol = renderToStepCol(i);
            const digitIdx = totalDigitCols - 1 - stepCol;
            const d = paddedA[digitIdx];
            return <div key={i} className="digit-cell digit-cell-empty">{d !== undefined ? d : ''}</div>;
          })}
        </div>

        {/* Operator + second operand */}
        <div className="grid gap-1 mt-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {Array.from({ length: gridCols }).map((_, i) => {
            if (i === 0) {
              // Operator column
              return <div key={i} className="digit-cell digit-cell-empty text-secondary font-bold">{operation}</div>;
            }
            if (i === dotRenderCol) {
              // Decimal point column
              return (
                <div key={i} className="digit-cell flex items-end justify-center pb-1"
                  style={{ color: '#e53935', fontWeight: 'bold', fontSize: '1.5rem', border: 'none' }}>
                  .
                </div>
              );
            }
            // Digit column
            const stepCol = renderToStepCol(i);
            const digitIdx = totalDigitCols - 1 - stepCol;
            const d = paddedB[digitIdx];
            return <div key={i} className="digit-cell digit-cell-empty">{d !== undefined ? d : ''}</div>;
          })}
        </div>

        {/* Divider */}
        <div className="border-b-2 border-text my-2" />

        {/* Result row */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {Array.from({ length: gridCols }).map((_, i) => renderDigitCell(i))}
        </div>
      </div>

      {/* Validation error message */}
      {completed && Object.values(cellResults).some(r => r === 'wrong') && (
        <div className="text-sm text-danger font-bold">答案有误，红色格子已显示正确答案</div>
      )}

      {/* Completed correctly */}
      {completed && Object.values(cellResults).every(r => r === 'correct') && (
        <div className="text-success font-bold text-lg animate-pulse-grow">
          全部正确！
        </div>
      )}

      {/* Action buttons — only show before submission */}
      {!completed && (
        <div className="flex gap-3 mt-1">
          <button
            onClick={handleClear}
            className="btn-secondary text-sm py-2 px-4"
          >
            清除
          </button>
          <button
            onClick={handleSubmit}
            className={`text-sm font-bold py-2 px-6 rounded-2xl transition-all
              ${canSubmit
                ? 'btn-primary'
                : 'bg-card-2 text-text-2 border-2 border-border cursor-not-allowed'}`}
            disabled={!canSubmit}
          >
            提交
          </button>
        </div>
      )}
    </div>
  );
}
