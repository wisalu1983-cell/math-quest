import type {
  LongDivisionBoardData,
  LongDivisionBoardMode,
  LongDivisionResultField,
  LongDivisionRoundData,
  LongDivisionSetupField,
  PracticeFailureDetail,
  PracticeFailureReason,
  TrainingFieldMistake,
  VerticalCalcCompletePayload,
} from '@/types';

interface BuildLongDivisionBoardDataParams {
  kind: LongDivisionBoardMode;
  dividend: string | number;
  divisor: string | number;
  finalAnswer: string | number;
  approximationPlaces?: number;
  cyclic?: {
    nonRepeating: string;
    repeating: string;
  };
}

interface DecimalParts {
  digits: string;
  decimalPlaces: number;
}

const PROCESS_FAILURE_MESSAGE = '本题未通过：竖式过程有误。';
const SETUP_FAILURE_MESSAGE = '本题未通过：扩倍结果有误。';
const RESULT_FAILURE_MESSAGE = '本题未通过：结果表达有误。';
const MIXED_FAILURE_MESSAGE = '本题未通过：竖式过程和结构化字段都有误。';

export function normalizeLongDivisionNumberText(value: string | number): string {
  const raw = String(value).trim();
  if (!raw) return '0';
  const sign = raw.startsWith('-') ? '-' : '';
  const unsigned = sign ? raw.slice(1) : raw;
  const [integerRaw = '0', decimalRaw = ''] = unsigned.split('.');
  const integerPart = integerRaw.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
  const decimalPart = decimalRaw.replace(/\D/g, '').replace(/0+$/, '');
  return `${sign}${integerPart}${decimalPart ? `.${decimalPart}` : ''}`;
}

function decimalParts(value: string | number): DecimalParts {
  const normalized = normalizeLongDivisionNumberText(value);
  const [integerPart, decimalPart = ''] = normalized.split('.');
  const digits = `${integerPart}${decimalPart}`.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
  return {
    digits,
    decimalPlaces: decimalPart.length,
  };
}

function shiftDecimal(value: string | number, places: number): string {
  const parts = decimalParts(value);
  const source = parts.digits.padStart(parts.decimalPlaces + 1, '0');
  const decimalIndex = source.length - parts.decimalPlaces + places;
  if (decimalIndex >= source.length) {
    return normalizeLongDivisionNumberText(`${source}${'0'.repeat(decimalIndex - source.length)}`);
  }
  if (decimalIndex <= 0) {
    return normalizeLongDivisionNumberText(`0.${'0'.repeat(Math.abs(decimalIndex))}${source}`);
  }
  return normalizeLongDivisionNumberText(`${source.slice(0, decimalIndex)}.${source.slice(decimalIndex)}`);
}

function chinesePlaceText(places: number): string {
  if (places === 1) return '一位小数';
  if (places === 2) return '两位小数';
  if (places === 3) return '三位小数';
  return `${places}位小数`;
}

function resultFieldsFor(params: BuildLongDivisionBoardDataParams): LongDivisionResultField[] | undefined {
  if (params.kind === 'approximation' || params.approximationPlaces != null) {
    const places = params.approximationPlaces ?? 2;
    return [{
      id: 'result-approximation',
      label: `保留${chinesePlaceText(places)}`,
      expected: normalizeLongDivisionNumberText(params.finalAnswer),
      allowDecimal: true,
    }];
  }
  if (params.kind === 'cyclic' && params.cyclic) {
    return [
      {
        id: 'result-non-repeating',
        label: '非循环部分',
        expected: params.cyclic.nonRepeating,
        allowDecimal: true,
      },
      {
        id: 'result-repeating',
        label: '循环节',
        expected: params.cyclic.repeating,
        allowDecimal: false,
      },
    ];
  }
  return undefined;
}

function setupFieldsFor(params: BuildLongDivisionBoardDataParams): {
  setupFields?: LongDivisionSetupField[];
  workingDividend: string;
  workingDivisor: string;
} {
  const normalizedDividend = normalizeLongDivisionNumberText(params.dividend);
  const normalizedDivisor = normalizeLongDivisionNumberText(params.divisor);
  if (params.kind !== 'decimal-divisor') {
    return {
      workingDividend: normalizedDividend,
      workingDivisor: normalizedDivisor,
    };
  }

  const divisorParts = decimalParts(normalizedDivisor);
  const scale = 10 ** divisorParts.decimalPlaces;
  const workingDivisor = shiftDecimal(normalizedDivisor, divisorParts.decimalPlaces);
  const workingDividend = shiftDecimal(normalizedDividend, divisorParts.decimalPlaces);
  return {
    setupFields: [
      { id: 'setup-scale', label: '除数扩大', expected: String(scale), allowDecimal: true },
      { id: 'setup-divisor', label: '转换后除数', expected: workingDivisor, allowDecimal: true, mustBeInteger: true },
      { id: 'setup-dividend', label: '转换后被除数', expected: workingDividend, allowDecimal: true },
    ],
    workingDividend,
    workingDivisor,
  };
}

function targetRoundCount(params: BuildLongDivisionBoardDataParams, dividendDigitCount: number): number {
  const answerDigits = normalizeLongDivisionNumberText(params.finalAnswer).replace(/\D/g, '').length;
  if (params.kind === 'approximation') {
    const places = params.approximationPlaces ?? 2;
    return Math.max(dividendDigitCount + places + 1, answerDigits);
  }
  if (params.kind === 'cyclic' && params.cyclic) {
    const nonRepeatingDecimals = params.cyclic.nonRepeating.split('.')[1]?.length ?? 0;
    return Math.max(
      dividendDigitCount + nonRepeatingDecimals + params.cyclic.repeating.length * 2,
      answerDigits,
    );
  }
  return answerDigits;
}

function buildRounds(params: {
  dividendDisplay: string;
  divisorDisplay: string;
  targetRounds: number;
}): {
  rounds: LongDivisionRoundData[];
  quotientStartColumn: number;
  quotientDecimalAfter: number | null;
  boardColumnCount: number;
} {
  const digits = params.dividendDisplay.replace(/[^\d]/g, '').split('');
  const integerDigitCount = params.dividendDisplay.includes('.')
    ? params.dividendDisplay.split('.')[0].replace(/\D/g, '').length
    : digits.length;
  const dividendHasDecimal = params.dividendDisplay.includes('.');
  const divisor = Number(params.divisorDisplay);
  const extendedDigits = [...digits];
  const rounds: LongDivisionRoundData[] = [];
  const maxRounds = Math.max(params.targetRounds, digits.length, 1);
  let quotientStartColumn = 0;
  let started = false;
  let current = '';
  let remainder = 0;
  let column = 0;

  while (rounds.length < maxRounds) {
    if (column >= extendedDigits.length) extendedDigits.push('0');

    if (!started) {
      current += extendedDigits[column];
      const currentNumber = Number(current);
      const reachedOnesColumn = column >= Math.max(0, integerDigitCount - 1);
      if (currentNumber < divisor && !reachedOnesColumn) {
        column += 1;
        continue;
      }
      started = true;
      quotientStartColumn = column;
    } else {
      current = `${remainder > 0 ? remainder : ''}${extendedDigits[column]}` || '0';
    }

    const currentNumber = Number(current);
    const quotientDigit = Math.floor(currentNumber / divisor);
    const product = quotientDigit * divisor;
    remainder = currentNumber - product;
    const needsNextRound = remainder !== 0 || column + 1 < extendedDigits.length;
    let nextPartialDividend: string | undefined;
    let broughtDownDigit: string | undefined;

    if (needsNextRound && rounds.length + 1 < maxRounds) {
      if (column + 1 >= extendedDigits.length) extendedDigits.push('0');
      broughtDownDigit = extendedDigits[column + 1] ?? '0';
      nextPartialDividend = remainder > 0 ? `${remainder}${broughtDownDigit}` : broughtDownDigit;
    }

    rounds.push({
      index: rounds.length,
      currentPartialDividend: current,
      quotientDigit: String(quotientDigit),
      product: String(product),
      remainder: String(remainder),
      ...(nextPartialDividend ? { nextPartialDividend } : {}),
      ...(broughtDownDigit ? { broughtDownDigit } : {}),
    });

    if (!nextPartialDividend) break;
    column += 1;
  }

  const quotientDecimalAfter = dividendHasDecimal || extendedDigits.length > digits.length
    ? integerDigitCount - 1
    : null;
  const boardColumnCount = Math.max(
    extendedDigits.length,
    quotientStartColumn + rounds.length,
    quotientDecimalAfter == null ? 0 : quotientDecimalAfter + 2,
  );

  return {
    rounds,
    quotientStartColumn,
    quotientDecimalAfter,
    boardColumnCount,
  };
}

function expectedByKeyFor(board: Omit<LongDivisionBoardData, 'expectedByKey'>): Record<string, string> {
  const expected: Record<string, string> = {};
  board.setupFields?.forEach(field => {
    expected[field.id] = field.expected;
  });
  board.rounds.forEach(round => {
    expected[`round-${round.index}-quotient`] = round.quotientDigit;
    expected[`round-${round.index}-product`] = round.product;
    if (round.nextPartialDividend != null) {
      expected[`round-${round.index}-next`] = round.nextPartialDividend;
    } else {
      expected[`round-${round.index}-remainder`] = round.remainder;
    }
  });
  board.resultFields?.forEach(field => {
    expected[field.id] = field.expected;
  });
  return expected;
}

export function buildLongDivisionBoardData(params: BuildLongDivisionBoardDataParams): LongDivisionBoardData {
  const originalDividend = normalizeLongDivisionNumberText(params.dividend);
  const originalDivisor = normalizeLongDivisionNumberText(params.divisor);
  const { setupFields, workingDividend, workingDivisor } = setupFieldsFor(params);
  const dividendDigitCount = decimalParts(workingDividend).digits.length;
  const targetRounds = targetRoundCount(params, dividendDigitCount);
  const model = buildRounds({
    dividendDisplay: workingDividend,
    divisorDisplay: workingDivisor,
    targetRounds,
  });
  const resultFields = resultFieldsFor(params);
  const boardWithoutExpected: Omit<LongDivisionBoardData, 'expectedByKey'> = {
    mode: params.kind,
    originalDividend,
    originalDivisor,
    workingDividend,
    workingDivisor,
    finalAnswer: normalizeLongDivisionNumberText(params.finalAnswer),
    quotientStartColumn: model.quotientStartColumn,
    quotientDecimalAfter: model.quotientDecimalAfter,
    boardColumnCount: model.boardColumnCount,
    rounds: model.rounds,
    ...(setupFields ? { setupFields } : {}),
    ...(resultFields ? { resultFields } : {}),
    ...(params.cyclic
      ? {
          cyclic: {
            nonRepeating: params.cyclic.nonRepeating,
            repeating: params.cyclic.repeating,
            displayText: `${params.cyclic.nonRepeating}${params.cyclic.repeating}`,
          },
        }
      : {}),
  };

  return {
    ...boardWithoutExpected,
    expectedByKey: expectedByKeyFor(boardWithoutExpected),
  };
}

export function getLongDivisionOrderedInputKeys(board: LongDivisionBoardData): string[] {
  return [
    ...(board.setupFields?.map(field => field.id) ?? []),
    ...board.rounds.flatMap(round => [
      `round-${round.index}-quotient`,
      `round-${round.index}-product`,
      round.nextPartialDividend != null
        ? `round-${round.index}-next`
        : `round-${round.index}-remainder`,
    ]),
    ...(board.resultFields?.map(field => field.id) ?? []),
  ];
}

function normalizeComparable(value: string, allowDecimal: boolean): string {
  return allowDecimal ? normalizeLongDivisionNumberText(value) : value.trim();
}

function fieldAllowsDecimal(board: LongDivisionBoardData, key: string): boolean {
  return Boolean(
    board.setupFields?.some(field => field.id === key && field.allowDecimal) ||
    board.resultFields?.some(field => field.id === key && field.allowDecimal),
  );
}

function categoryForRoundKey(key: string): { code: string; label: string } {
  if (key.endsWith('-quotient')) return { code: 'long-division-quotient', label: '商位判断错误' };
  if (key.endsWith('-product')) return { code: 'long-division-product', label: '乘积填写错误' };
  if (key.endsWith('-next')) return { code: 'long-division-next-partial', label: '落位后新工作数错误' };
  return { code: 'long-division-remainder', label: '相减余数错误' };
}

function structuredLabelForKey(board: LongDivisionBoardData, key: string): string {
  const setup = board.setupFields?.find(field => field.id === key);
  if (setup) return `${setup.label}错误`;
  const result = board.resultFields?.find(field => field.id === key);
  if (result) return `${result.label}错误`;
  return '结构化字段错误';
}

function uniqueCategories(categories: Array<{ code: string; label: string }>) {
  const map = new Map<string, { code: string; label: string }>();
  for (const category of categories) map.set(category.code, category);
  return Array.from(map.values());
}

function failureMessage(params: {
  hasProcess: boolean;
  setupMistakes: TrainingFieldMistake[];
  resultMistakes: TrainingFieldMistake[];
}): string {
  if (params.hasProcess && (params.setupMistakes.length > 0 || params.resultMistakes.length > 0)) {
    return MIXED_FAILURE_MESSAGE;
  }
  if (params.hasProcess) return PROCESS_FAILURE_MESSAGE;
  if (params.setupMistakes.length > 0 && params.resultMistakes.length === 0) return SETUP_FAILURE_MESSAGE;
  if (params.resultMistakes.length > 0) return RESULT_FAILURE_MESSAGE;
  return '本题未通过：存在错误答题项。';
}

export function classifyLongDivisionSubmission(params: {
  board: LongDivisionBoardData;
  values: Record<string, string>;
}): VerticalCalcCompletePayload {
  const processCategories: Array<{ code: string; label: string }> = [];
  const setupMistakes: TrainingFieldMistake[] = [];
  const resultMistakes: TrainingFieldMistake[] = [];

  for (const key of getLongDivisionOrderedInputKeys(params.board)) {
    const expectedValue = params.board.expectedByKey[key] ?? '';
    const userValue = params.values[key] ?? '';
    const allowDecimal = fieldAllowsDecimal(params.board, key);
    if (normalizeComparable(userValue, allowDecimal) === normalizeComparable(expectedValue, allowDecimal)) {
      continue;
    }

    if (key.startsWith('round-')) {
      processCategories.push(categoryForRoundKey(key));
      continue;
    }

    const mistake = {
      code: key,
      label: structuredLabelForKey(params.board, key),
      userValue,
      expectedValue,
    };
    if (key.startsWith('setup-')) setupMistakes.push(mistake);
    else resultMistakes.push(mistake);
  }

  const uniqueProcessCategories = uniqueCategories(processCategories);
  if (uniqueProcessCategories.length === 0 && setupMistakes.length === 0 && resultMistakes.length === 0) {
    return { result: 'pass', answer: params.board.finalAnswer };
  }

  const hasProcess = uniqueProcessCategories.length > 0;
  const reason: PracticeFailureReason = hasProcess
    ? 'vertical-long-division-process'
    : 'vertical-training-field';
  const detail: PracticeFailureDetail = {
    reason,
    source: 'long-division',
    message: failureMessage({
      hasProcess,
      setupMistakes,
      resultMistakes,
    }),
    processCategories: uniqueProcessCategories,
    trainingFieldMistakes: [...setupMistakes, ...resultMistakes],
  };

  return {
    result: 'failProcess',
    answer: params.board.finalAnswer,
    failureReason: reason,
    failureDetail: detail,
  };
}
