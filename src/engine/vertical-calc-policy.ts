import type { VerticalCalcStep } from '@/types';

export type VerticalCalcOperation = '+' | '-' | '×' | '÷';
export type VerticalCalcTier = 'low' | 'mid' | 'high';
export type VerticalCalcCellKind = 'answer' | 'process';

export interface VerticalCalcPolicyColumn {
  answerExpected: number;
  processExpected: number;
  hasProcessSlot: boolean;
}

export interface VerticalCalcCellId {
  kind: VerticalCalcCellKind;
  col: number;
}

export interface VerticalCalcValues {
  answers: Record<number, string | undefined>;
  processes: Record<number, string | undefined>;
}

export type VerticalCalcSubmitBlockReason = 'missing-answer' | 'missing-process' | null;
export type VerticalCalcFeedbackReason =
  | 'wrong-answer'
  | 'vertical-process'
  | 'vertical-process-warning'
  | null;
export type VerticalCalcResultType =
  | 'pass'
  | 'failWrongAnswer'
  | 'failProcess'
  | 'passWithProcessWarning';

export interface VerticalCalcWrongCell extends VerticalCalcCellId {
  expected: number;
}

export interface VerticalCalcResult {
  result: VerticalCalcResultType;
  feedbackReason: VerticalCalcFeedbackReason;
  wrongCells: VerticalCalcWrongCell[];
}

export function buildVerticalCalcPolicyColumns(steps: VerticalCalcStep[]): VerticalCalcPolicyColumn[] {
  const maxCol = steps.reduce((max, step) => Math.max(max, step.column), 0);

  // The ordered work items come from generator steps. Columns without explicit
  // carry/borrow steps still get a visible process slot whose expected value is 0.
  const columns: VerticalCalcPolicyColumn[] = Array.from({ length: maxCol + 1 }, () => ({
    answerExpected: 0,
    processExpected: 0,
    hasProcessSlot: true,
  }));

  for (const step of steps) {
    const column = columns[step.column];
    if (step.stepType === 'digit') {
      column.answerExpected = step.expectedDigit;
    } else {
      column.processExpected = step.expectedDigit;
      column.hasProcessSlot = true;
    }
  }

  return columns;
}

export function getVerticalCalcTier(difficulty: number): VerticalCalcTier {
  if (difficulty <= 5) return 'low';
  if (difficulty <= 7) return 'mid';
  return 'high';
}

function highestAnswerCol(columns: VerticalCalcPolicyColumn[]): number {
  for (let c = columns.length - 1; c >= 0; c--) {
    if (columns[c].answerExpected !== 0) return c;
  }
  return 0;
}

function hasValue(value: string | undefined): boolean {
  return value !== undefined && value !== '';
}

function processValueEquals(value: string | undefined, expected: number): boolean {
  if (!hasValue(value)) return expected === 0;
  return Number(value) === expected;
}

function answerValueEquals(value: string | undefined, expected: number): boolean {
  return hasValue(value) && Number(value) === expected;
}

export function getVisibleProcessColumns(params: {
  difficulty: number;
  columns: VerticalCalcPolicyColumn[];
}): number[] {
  if (getVerticalCalcTier(params.difficulty) === 'high') return [];
  return params.columns
    .map((column, index) => column.hasProcessSlot ? index : -1)
    .filter(index => index >= 0);
}

export function buildFocusOrder(params: {
  difficulty: number;
  columns: VerticalCalcPolicyColumn[];
}): VerticalCalcCellId[] {
  const highest = highestAnswerCol(params.columns);
  const tier = getVerticalCalcTier(params.difficulty);

  if (tier === 'low') {
    const order: VerticalCalcCellId[] = [];
    for (let col = 0; col <= highest; col++) {
      order.push({ kind: 'answer', col });
      const processCol = col + 1;
      if (processCol <= highest && params.columns[processCol]?.hasProcessSlot) {
        order.push({ kind: 'process', col: processCol });
      }
    }
    return order;
  }

  return params.columns
    .map((_, col) => ({ kind: 'answer' as const, col }))
    .filter(cell => cell.col <= highest);
}

export function isCellComplete(params: {
  operation: VerticalCalcOperation;
  cellKind: VerticalCalcCellKind;
  value: string | undefined;
}): boolean {
  const value = params.value ?? '';
  if (params.cellKind === 'answer') {
    return /^[0-9]$/.test(value);
  }

  if (params.operation === '-') {
    return value === '0' || value === '-1';
  }
  if (params.operation === '+') {
    return value === '0' || value === '1';
  }
  if (params.operation === '×') {
    return /^[0-8]$/.test(value);
  }
  return false;
}

function valueForCell(values: VerticalCalcValues, cell: VerticalCalcCellId): string | undefined {
  return cell.kind === 'answer'
    ? values.answers[cell.col]
    : values.processes[cell.col];
}

function isFilledForFocus(params: {
  operation: VerticalCalcOperation;
  values: VerticalCalcValues;
  cell: VerticalCalcCellId;
}): boolean {
  return isCellComplete({
    operation: params.operation,
    cellKind: params.cell.kind,
    value: valueForCell(params.values, params.cell),
  });
}

export function getNextFocus(params: {
  operation: VerticalCalcOperation;
  difficulty: number;
  columns: VerticalCalcPolicyColumn[];
  currentCell: VerticalCalcCellId;
  values: VerticalCalcValues;
  action?: 'input' | 'enter' | 'tab';
}): VerticalCalcCellId | null {
  const tier = getVerticalCalcTier(params.difficulty);

  if (tier !== 'high' && params.currentCell.kind === 'process') {
    const currentFilled = isFilledForFocus({
      operation: params.operation,
      values: params.values,
      cell: params.currentCell,
    });
    const canSkipZeroProcess =
      params.columns[params.currentCell.col]?.processExpected === 0 &&
      (params.action === 'enter' || params.action === 'tab');

    if (!currentFilled && !canSkipZeroProcess) {
      return null;
    }

    const sameColumnAnswer = { kind: 'answer' as const, col: params.currentCell.col };
    if (!isFilledForFocus({ operation: params.operation, values: params.values, cell: sameColumnAnswer })) {
      return sameColumnAnswer;
    }

    return getNextFocus({
      ...params,
      currentCell: sameColumnAnswer,
    });
  }

  const order = buildFocusOrder({
    difficulty: params.difficulty,
    columns: params.columns,
  });
  const currentIndex = order.findIndex(
    cell => cell.kind === params.currentCell.kind && cell.col === params.currentCell.col,
  );
  if (currentIndex < 0) return null;

  const currentFilled = isFilledForFocus({
    operation: params.operation,
    values: params.values,
    cell: params.currentCell,
  });
  if (!currentFilled) return null;

  for (let i = currentIndex + 1; i < order.length; i++) {
    const cell = order[i];
    if (!isFilledForFocus({ operation: params.operation, values: params.values, cell })) {
      return cell;
    }
  }
  return null;
}

export function canSubmitVerticalCalc(params: {
  difficulty: number;
  columns: VerticalCalcPolicyColumn[];
  values: VerticalCalcValues;
  operation?: VerticalCalcOperation;
}): { canSubmit: boolean; reason: VerticalCalcSubmitBlockReason } {
  const highest = highestAnswerCol(params.columns);
  for (let c = 0; c <= highest; c++) {
    if (!isCellComplete({
      operation: params.operation ?? '+',
      cellKind: 'answer',
      value: params.values.answers[c],
    })) {
      return { canSubmit: false, reason: 'missing-answer' };
    }
  }

  if (getVerticalCalcTier(params.difficulty) === 'low') {
    for (let c = 1; c <= highest; c++) {
      const column = params.columns[c];
      if (!column?.hasProcessSlot || column.processExpected === 0) continue;
      if (!isCellComplete({
        operation: params.operation ?? '+',
        cellKind: 'process',
        value: params.values.processes[c],
      })) {
        return { canSubmit: false, reason: 'missing-process' };
      }
    }
  }

  return { canSubmit: true, reason: null };
}

function collectAnswerWrongCells(
  columns: VerticalCalcPolicyColumn[],
  values: VerticalCalcValues,
): VerticalCalcWrongCell[] {
  const highest = highestAnswerCol(columns);
  const wrongCells: VerticalCalcWrongCell[] = [];
  for (let c = 0; c <= highest; c++) {
    if (!answerValueEquals(values.answers[c], columns[c].answerExpected)) {
      wrongCells.push({ kind: 'answer', col: c, expected: columns[c].answerExpected });
    }
  }
  return wrongCells;
}

function collectLowProcessWrongCells(
  columns: VerticalCalcPolicyColumn[],
  values: VerticalCalcValues,
): VerticalCalcWrongCell[] {
  const highest = highestAnswerCol(columns);
  const wrongCells: VerticalCalcWrongCell[] = [];
  for (let c = 1; c <= highest; c++) {
    const column = columns[c];
    if (!column?.hasProcessSlot) continue;
    if (!processValueEquals(values.processes[c], column.processExpected)) {
      wrongCells.push({ kind: 'process', col: c, expected: column.processExpected });
    }
  }
  return wrongCells;
}

function hasMidProcessWarning(
  columns: VerticalCalcPolicyColumn[],
  values: VerticalCalcValues,
): boolean {
  const highest = highestAnswerCol(columns);
  for (let c = 1; c <= highest; c++) {
    const column = columns[c];
    const value = values.processes[c];
    if (!column?.hasProcessSlot || !hasValue(value)) continue;
    if (Number(value) !== column.processExpected) return true;
  }
  return false;
}

export function classifyVerticalCalcResult(params: {
  difficulty: number;
  columns: VerticalCalcPolicyColumn[];
  values: VerticalCalcValues;
}): VerticalCalcResult {
  const wrongAnswers = collectAnswerWrongCells(params.columns, params.values);
  if (wrongAnswers.length > 0) {
    return {
      result: 'failWrongAnswer',
      feedbackReason: 'wrong-answer',
      wrongCells: wrongAnswers,
    };
  }

  const tier = getVerticalCalcTier(params.difficulty);
  if (tier === 'low') {
    const wrongProcesses = collectLowProcessWrongCells(params.columns, params.values);
    if (wrongProcesses.length > 0) {
      return {
        result: 'failProcess',
        feedbackReason: 'vertical-process',
        wrongCells: wrongProcesses,
      };
    }
  }

  if (tier === 'mid' && hasMidProcessWarning(params.columns, params.values)) {
    return {
      result: 'passWithProcessWarning',
      feedbackReason: 'vertical-process-warning',
      wrongCells: [],
    };
  }

  return {
    result: 'pass',
    feedbackReason: null,
    wrongCells: [],
  };
}
