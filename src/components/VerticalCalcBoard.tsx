import { useEffect, useMemo, useRef, useState } from 'react';
import type { VerticalCalcCompletePayload, VerticalCalcData } from '@/types';
import {
  buildVerticalCalcPolicyColumns,
  canSubmitVerticalCalc,
  classifyVerticalCalcResult,
  getNextFocus,
  getVisibleProcessColumns,
  isCellComplete,
} from '@/engine/vertical-calc-policy';
import type {
  VerticalCalcCellId,
  VerticalCalcOperation,
  VerticalCalcResult,
  VerticalCalcValues,
  VerticalCalcWrongCell,
} from '@/engine/vertical-calc-policy';
import MultiplicationVerticalBoard from './MultiplicationVerticalBoard';

interface Props {
  data: VerticalCalcData;
  difficulty: number;
  onComplete: (result: boolean | VerticalCalcCompletePayload) => void;
}

type CellResult = 'correct' | 'wrong';

export default function VerticalCalcBoard({ data, difficulty, onComplete }: Props) {
  if (data.multiplicationBoard) {
    const boardKey = [
      data.multiplicationBoard.mode,
      data.multiplicationBoard.integerOperands.join('x'),
      data.multiplicationBoard.operandInputMode,
      data.multiplicationBoard.decimalPlaces ?? 0,
    ].join(':');

    return (
      <MultiplicationVerticalBoard
        key={boardKey}
        data={data.multiplicationBoard}
        onComplete={onComplete}
      />
    );
  }

  const legacyKey = [
    difficulty,
    data.operation,
    data.operands.join(':'),
    data.decimalPlaces ?? 0,
    data.steps.map(step => `${step.stepType}:${step.column}:${step.expectedDigit}`).join('|'),
  ].join(':');

  return (
    <LegacyVerticalCalcBoard
      key={legacyKey}
      data={data}
      difficulty={difficulty}
      onComplete={onComplete}
    />
  );
}

function LegacyVerticalCalcBoard({ data, difficulty, onComplete }: Props) {
  const { operation, operands, steps } = data;
  const dp = data.decimalPlaces ?? 0;
  const op = operation as VerticalCalcOperation;

  const columns = useMemo(() => buildVerticalCalcPolicyColumns(steps), [steps]);
  const totalCols = columns.length;
  const showProcessRow = getVisibleProcessColumns({ difficulty, columns }).length > 0;

  const a = operands[0];
  const b = operands[1];
  const aDigits = String(a).split('').map(Number);
  const bDigits = String(b).split('').map(Number);
  const answerDigitCount = columns.length;
  const gridCols = Math.max(aDigits.length, bDigits.length, answerDigitCount) + 1 + (dp > 0 ? 1 : 0);
  const dotRenderCol = dp > 0 ? gridCols - 1 - dp : -1;
  const totalDigitCols = gridCols - 1 - (dp > 0 ? 1 : 0);

  const highestAnswerCol = useMemo(() => {
    for (let c = totalCols - 1; c >= 0; c--) {
      if (columns[c].answerExpected !== 0) return c;
    }
    return 0;
  }, [columns, totalCols]);

  const initialCell = useMemo<VerticalCalcCellId>(() => ({ kind: 'answer', col: 0 }), []);
  const [processValues, setProcessValues] = useState<Record<number, string | undefined>>({});
  const [answerValues, setAnswerValues] = useState<Record<number, string | undefined>>({});
  const [activeCell, setActiveCell] = useState<VerticalCalcCellId | null>(initialCell);
  const [cellResults, setCellResults] = useState<Record<string, CellResult>>({});
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<VerticalCalcCompletePayload | null>(null);
  const [submitWarning, setSubmitWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !completed) inputRef.current.focus({ preventScroll: true });
  }, [activeCell, completed]);

  const values: VerticalCalcValues = useMemo(() => ({
    answers: answerValues,
    processes: processValues,
  }), [answerValues, processValues]);

  const renderToStepCol = (renderCol: number): number => {
    if (renderCol === 0) return -1;
    if (renderCol === dotRenderCol) return -1;
    let digitIdx = renderCol - 1;
    if (dp > 0 && renderCol > dotRenderCol) {
      digitIdx -= 1;
    }
    return totalDigitCols - 1 - digitIdx;
  };

  const cellKey = (cell: VerticalCalcCellId) => `${cell.kind}-${cell.col}`;

  const padDigits = (digits: number[]) => {
    const padded = new Array<number | undefined>(totalDigitCols).fill(undefined);
    for (let i = 0; i < digits.length; i++) {
      padded[totalDigitCols - 1 - i] = digits[digits.length - 1 - i];
    }
    return padded;
  };

  const paddedA = padDigits(aDigits);
  const paddedB = padDigits(bDigits);

  const answerCellsComplete = useMemo(() => {
    for (let c = 0; c <= highestAnswerCol; c++) {
      if (!isCellComplete({ operation: op, cellKind: 'answer', value: answerValues[c] })) {
        return false;
      }
    }
    return true;
  }, [answerValues, highestAnswerCol, op]);

  const submitState = useMemo(() => canSubmitVerticalCalc({
    difficulty,
    columns,
    values,
    operation: op,
  }), [columns, difficulty, op, values]);

  const showMissingProcessWarning =
    answerCellsComplete &&
    submitState.reason === 'missing-process' &&
    !completed;

  const getAnswerString = (nextAnswers = answerValues): string => {
    const digits = [];
    for (let c = highestAnswerCol; c >= 0; c--) {
      digits.push(nextAnswers[c] ?? '0');
    }
    let raw = digits.join('').replace(/^0+(?=\d)/, '');
    if (raw.length === 0) raw = '0';
    if (dp <= 0) return raw;

    raw = raw.padStart(dp + 1, '0');
    const integerPart = raw.slice(0, -dp).replace(/^0+(?=\d)/, '') || '0';
    const decimalPart = raw.slice(-dp);
    return `${integerPart}.${decimalPart}`;
  };

  const focusAfterInput = (
    currentCell: VerticalCalcCellId,
    nextValues: VerticalCalcValues,
    action?: 'input' | 'enter' | 'tab',
  ) => {
    const next = getNextFocus({
      operation: op,
      difficulty,
      columns,
      currentCell,
      values: nextValues,
      action,
    });
    if (next) setActiveCell(next);
  };

  const handleCellClick = (cell: VerticalCalcCellId) => {
    if (completed) return;
    setActiveCell(cell);
    setSubmitWarning(false);
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleInput = (value: string) => {
    if (completed || !activeCell) return;
    setSubmitWarning(false);

    if (value === '-') {
      if (activeCell.kind === 'process' && op === '-') {
        const nextProcesses = { ...processValues, [activeCell.col]: '-' };
        setProcessValues(nextProcesses);
      }
      return;
    }

    if (!/^[0-9]$/.test(value)) return;

    if (activeCell.kind === 'answer') {
      const nextAnswers = { ...answerValues, [activeCell.col]: value };
      setAnswerValues(nextAnswers);
      focusAfterInput(activeCell, { answers: nextAnswers, processes: processValues }, 'input');
      return;
    }

    const previous = processValues[activeCell.col] ?? '';
    const nextValue = op === '-' && previous === '-' && value === '1'
      ? '-1'
      : value;
    if (!isCellComplete({ operation: op, cellKind: 'process', value: nextValue })) {
      return;
    }

    const nextProcesses = { ...processValues, [activeCell.col]: nextValue };
    setProcessValues(nextProcesses);
    focusAfterInput(activeCell, { answers: answerValues, processes: nextProcesses }, 'input');
  };

  const handleClear = () => {
    if (completed || !activeCell) return;
    setSubmitWarning(false);
    if (activeCell.kind === 'process') {
      setProcessValues(prev => {
        const next = { ...prev };
        delete next[activeCell.col];
        return next;
      });
    } else {
      setAnswerValues(prev => {
        const next = { ...prev };
        delete next[activeCell.col];
        return next;
      });
    }
  };

  const handleMoveKey = (action: 'enter' | 'tab') => {
    if (completed || !activeCell) return;
    const next = getNextFocus({
      operation: op,
      difficulty,
      columns,
      currentCell: activeCell,
      values,
      action,
    });
    if (next) {
      setActiveCell(next);
      setSubmitWarning(false);
      return;
    }

    if (answerCellsComplete) {
      handleSubmit();
    }
  };

  const setWrongCells = (wrongCells: VerticalCalcWrongCell[]) => {
    const nextResults: Record<string, CellResult> = {};
    const nextCorrections: Record<string, string> = {};
    for (const cell of wrongCells) {
      const key = cellKey(cell);
      nextResults[key] = 'wrong';
      nextCorrections[key] = String(cell.expected);
    }
    setCellResults(nextResults);
    setCorrections(nextCorrections);
  };

  const payloadFromResult = (result: VerticalCalcResult): VerticalCalcCompletePayload => {
    const answer = getAnswerString();
    if (result.result === 'failWrongAnswer') {
      return { result: 'failWrongAnswer', answer, failureReason: 'wrong-answer' };
    }
    if (result.result === 'failProcess') {
      return { result: 'failProcess', answer, failureReason: 'vertical-process' };
    }
    if (result.result === 'passWithProcessWarning') {
      return { result: 'passWithProcessWarning', answer, warningReason: 'vertical-process-warning' };
    }
    return { result: 'pass', answer };
  };

  function handleSubmit() {
    if (completed) return;

    const currentSubmitState = canSubmitVerticalCalc({
      difficulty,
      columns,
      values,
      operation: op,
    });
    if (!currentSubmitState.canSubmit) {
      setSubmitWarning(currentSubmitState.reason === 'missing-process');
      return;
    }

    const result = classifyVerticalCalcResult({ difficulty, columns, values });
    const payload = payloadFromResult(result);

    if (result.result === 'failWrongAnswer' || result.result === 'failProcess') {
      setWrongCells(result.wrongCells);
      setCompleted(true);
      setPendingCompletion(payload);
      setActiveCell(null);
      return;
    }

    onComplete(payload);
  }

  const handleContinue = () => {
    if (pendingCompletion) onComplete(pendingCompletion);
  };

  const renderProcessCell = (gridCol: number) => {
    if (gridCol === dotRenderCol) {
      return <div key={gridCol} className="h-10 w-10 sm:h-12 sm:w-12" />;
    }

    const logCol = renderToStepCol(gridCol);
    if (logCol < 0 || logCol >= totalCols) {
      return <div key={gridCol} className="h-10 w-10 sm:h-12 sm:w-12" />;
    }

    const cell: VerticalCalcCellId = { kind: 'process', col: logCol };
    const value = processValues[logCol];
    const isActive = activeCell?.kind === 'process' && activeCell.col === logCol && !completed;
    const result = cellResults[cellKey(cell)];

    let cls = 'flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-2 text-sm font-bold transition-all sm:h-12 sm:w-12 ';
    if (result === 'wrong') {
      cls += 'border-danger bg-danger-lt text-danger animate-shake ';
    } else if (isActive) {
      cls += 'border-secondary bg-secondary/10 text-secondary ring-2 ring-secondary/30 ';
    } else if (value !== undefined && value !== '') {
      cls += 'border-accent/50 bg-accent/5 text-accent ';
    } else {
      cls += 'border-dashed border-border/40 bg-bg text-text-3 hover:border-border ';
    }

    const displayContent = result === 'wrong' && corrections[cellKey(cell)] !== undefined
      ? corrections[cellKey(cell)]
      : value ?? '';

    return (
      <div key={gridCol} className={cls} onClick={() => handleCellClick(cell)}>
        {displayContent}
      </div>
    );
  };

  const renderAnswerCell = (gridCol: number) => {
    if (gridCol === dotRenderCol) {
      return (
        <div
          key={gridCol}
          className="digit-cell flex items-end justify-center pb-1"
          style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '1.5rem', border: 'none', cursor: 'default' }}
        >
          .
        </div>
      );
    }

    const logCol = renderToStepCol(gridCol);
    if (logCol < 0 || logCol >= totalCols) {
      return <div key={gridCol} className="digit-cell digit-cell-empty" />;
    }

    const cell: VerticalCalcCellId = { kind: 'answer', col: logCol };
    const value = answerValues[logCol];
    const isActive = activeCell?.kind === 'answer' && activeCell.col === logCol && !completed;
    const result = cellResults[cellKey(cell)];

    let cls = 'digit-cell cursor-pointer ';
    if (result === 'wrong') {
      cls += 'digit-cell-wrong ';
    } else if (result === 'correct') {
      cls += 'digit-cell-correct ';
    } else if (isActive) {
      cls += 'digit-cell-active ';
    } else if (value !== undefined && value !== '') {
      cls += 'digit-cell-filled ';
    } else {
      cls += 'digit-cell-empty hover:border-border ';
    }

    const displayContent = result === 'wrong' && corrections[cellKey(cell)] !== undefined
      ? corrections[cellKey(cell)]
      : value ?? '';

    return (
      <div key={gridCol} className={cls} onClick={() => handleCellClick(cell)}>
        {displayContent}
      </div>
    );
  };

  const renderOperandRow = (digits: Array<number | undefined>, prefix = '') => (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
      {Array.from({ length: gridCols }).map((_, i) => {
        if (i === 0) {
          return <div key={i} className="digit-cell digit-cell-empty text-secondary font-bold">{prefix}</div>;
        }
        if (i === dotRenderCol) {
          return (
            <div
              key={i}
              className="digit-cell flex items-end justify-center pb-1"
              style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '1.5rem', border: 'none' }}
            >
              .
            </div>
          );
        }
        const stepCol = renderToStepCol(i);
        const digitIdx = totalDigitCols - 1 - stepCol;
        const d = digits[digitIdx];
        return <div key={i} className="digit-cell digit-cell-empty">{d !== undefined ? d : ''}</div>;
      })}
    </div>
  );

  const hasWrongCells = Object.values(cellResults).some(result => result === 'wrong');
  const localFailureMessage =
    pendingCompletion?.result === 'failProcess'
      ? '未通过：进位/退位格填写错误'
      : '答案有误，红色格子已显示正确答案';

  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        className="absolute h-0 w-0 opacity-0"
        style={{ scrollMargin: 0 }}
        value=""
        onKeyDown={event => {
          if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            event.stopPropagation();
            handleClear();
          } else if (event.key === '-') {
            event.preventDefault();
            event.stopPropagation();
            handleInput('-');
          } else if (event.key >= '0' && event.key <= '9') {
            event.preventDefault();
            event.stopPropagation();
            handleInput(event.key);
          } else if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            handleMoveKey('enter');
          } else if (event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();
            handleMoveKey('tab');
          }
        }}
        onChange={event => {
          const next = event.currentTarget.value.slice(-1);
          if (next) handleInput(next);
        }}
        autoFocus
      />

      <div className="card inline-block p-4">
        {showProcessRow && (
          <div className="mb-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
            {Array.from({ length: gridCols }).map((_, i) => renderProcessCell(i))}
          </div>
        )}

        {renderOperandRow(paddedA)}

        <div className="mt-1">
          {renderOperandRow(paddedB, operation)}
        </div>

        <div className="my-2 border-b-2 border-text" />

        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {Array.from({ length: gridCols }).map((_, i) => renderAnswerCell(i))}
        </div>
      </div>

      {(showMissingProcessWarning || submitWarning) && (
        <div className="w-full rounded-xl border-2 border-warning bg-warning-lt px-4 py-3 text-center text-sm font-black" style={{ color: '#7A5C00' }}>
          请把非 0 的进位/退位格填完整，再提交
        </div>
      )}

      {completed && hasWrongCells && (
        <div className="w-full rounded-xl border-2 border-danger bg-danger-lt px-4 py-3 text-center text-sm font-black text-danger">
          {localFailureMessage}
        </div>
      )}

      {!completed ? (
        <div className="mt-1 flex gap-3">
          <button
            onClick={handleClear}
            className="btn-secondary px-4 py-2 text-sm"
          >
            清除
          </button>
          <button
            onClick={handleSubmit}
            className={`rounded-2xl px-6 py-2 text-sm font-bold transition-all ${
              answerCellsComplete
                ? 'btn-primary'
                : 'cursor-not-allowed border-2 border-border bg-card-2 text-text-2'
            }`}
            disabled={!answerCellsComplete}
          >
            提交
          </button>
        </div>
      ) : (
        <button className="btn-flat mt-1 w-full max-w-xs" onClick={handleContinue}>
          继续
        </button>
      )}
    </div>
  );
}
