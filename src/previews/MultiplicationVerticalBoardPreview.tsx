import { Check, RotateCcw, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type ScenarioId = 'integer' | 'decimal';

interface Scenario {
  id: ScenarioId;
  title: string;
  prompt: string;
  originalExpression: string;
  boardExpression: string;
  operandDecimalPlaces: [number, number];
  multiplicand: number;
  multiplier: number;
  decimalPlaces: number;
}

interface BoardRow {
  id: string;
  label: string;
  cells: Array<string | null>;
}

const scenarios: Scenario[] = [
  {
    id: 'integer',
    title: '多位整数乘法',
    prompt: '用竖式计算',
    originalExpression: '782 × 14',
    boardExpression: '782 × 14',
    operandDecimalPlaces: [0, 0],
    multiplicand: 782,
    multiplier: 14,
    decimalPlaces: 0,
  },
  {
    id: 'decimal',
    title: '小数乘法复用',
    prompt: '列竖式计算',
    originalExpression: '4.06 × 23',
    boardExpression: '406 × 23',
    operandDecimalPlaces: [2, 0],
    multiplicand: 406,
    multiplier: 23,
    decimalPlaces: 2,
  },
];

function digitCells(value: string, width: number): Array<string | null> {
  const cells: Array<string | null> = Array(width).fill(null);
  const digits = value.split('');
  const start = width - digits.length;
  digits.forEach((digit, index) => {
    cells[start + index] = digit;
  });
  return cells;
}

function shiftedCells(value: number, shift: number, width: number): Array<string | null> {
  const cells: Array<string | null> = Array(width).fill(null);
  const digits = String(value).split('');
  const end = width - 1 - shift;
  const start = end - digits.length + 1;
  digits.forEach((digit, index) => {
    cells[start + index] = digit;
  });
  return cells;
}

function placeDecimalPoint(integerProduct: string, decimalPlaces: number): string {
  if (decimalPlaces <= 0) return integerProduct;
  const padded = integerProduct.padStart(decimalPlaces + 1, '0');
  const cut = padded.length - decimalPlaces;
  return `${padded.slice(0, cut)}.${padded.slice(cut)}`;
}

function normalizeDecimalProduct(raw: string): string {
  return raw.includes('.') ? raw.replace(/0+$/, '').replace(/\.$/, '') : raw;
}

function normalizeAnswer(raw: string): string {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d*)?$/.test(trimmed)) return trimmed;

  const [integerPart, decimalPart = ''] = trimmed.split('.');
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const normalizedDecimal = decimalPart.replace(/0+$/, '');
  return normalizedDecimal ? `${normalizedInteger}.${normalizedDecimal}` : normalizedInteger;
}

function buildRows(scenario: Scenario): { width: number; operandA: Array<string | null>; operandB: Array<string | null>; partials: BoardRow[]; total: BoardRow } {
  const product = scenario.multiplicand * scenario.multiplier;
  const width = Math.max(
    String(scenario.multiplicand).length,
    String(scenario.multiplier).length + 1,
    String(product).length,
  );
  const multiplierDigits = String(scenario.multiplier).split('').reverse().map(Number);
  const partials = multiplierDigits.map((digit, shift) => ({
    id: `partial-${shift}`,
    label: '',
    cells: shiftedCells(scenario.multiplicand * digit, shift, width),
  }));

  return {
    width,
    operandA: digitCells(String(scenario.multiplicand), width),
    operandB: digitCells(String(scenario.multiplier), width),
    partials,
    total: {
      id: 'total',
      label: '积',
      cells: digitCells(String(product), width),
    },
  };
}

function cellClass(status: 'idle' | 'correct' | 'wrong', active: boolean): string {
  if (status === 'correct') return 'border-success bg-success-lt text-success';
  if (status === 'wrong') return 'border-danger bg-danger-lt text-danger animate-shake';
  if (active) return 'border-primary bg-primary-lt text-primary ring-2 ring-primary/20';
  return 'border-border bg-card text-text focus:border-primary';
}

export default function MultiplicationVerticalBoardPreview() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('integer');
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const scenario = scenarios.find(item => item.id === scenarioId) ?? scenarios[0];
  const board = useMemo(() => buildRows(scenario), [scenario]);
  const integerProduct = String(scenario.multiplicand * scenario.multiplier);
  const positionedProduct = scenario.decimalPlaces > 0
    ? placeDecimalPoint(integerProduct, scenario.decimalPlaces)
    : integerProduct;
  const normalizedProduct = normalizeDecimalProduct(positionedProduct);

  const operandADecimalPlacesKey = 'operand-a-decimal-places';
  const operandBDecimalPlacesKey = 'operand-b-decimal-places';
  const decimalPlacesKey = 'decimal-places';
  const finalAnswerKey = 'final-answer';
  const orderedInputKeys = useMemo(() => {
    const calculationRows = [...board.partials, board.total];
    const rowKeys = calculationRows.flatMap(row =>
      row.cells.flatMap((cell, index) => cell == null ? [] : `${row.id}-${index}`),
    );
    const operandKeys = [
      { id: 'operand-a', cells: board.operandA },
      { id: 'operand-b', cells: board.operandB },
    ].flatMap(row =>
      row.cells.flatMap((cell, index) => cell == null ? [] : `${row.id}-${index}`),
    );
    return scenario.decimalPlaces > 0
      ? [...operandKeys, ...rowKeys, operandADecimalPlacesKey, operandBDecimalPlacesKey, decimalPlacesKey, finalAnswerKey]
      : rowKeys;
  }, [board, scenario.decimalPlaces]);

  useEffect(() => {
    window.setTimeout(() => {
      const first = orderedInputKeys[0];
      if (first) inputRefs.current[first]?.focus();
    }, 0);
  }, [orderedInputKeys]);

  const selectScenario = (nextScenarioId: ScenarioId) => {
    setScenarioId(nextScenarioId);
    setValues({});
    setSubmitted(false);
    setFocusedKey(null);
  };

  const expectedByKey = useMemo(() => {
    const entries: Record<string, string> = {};
    if (scenario.decimalPlaces > 0) {
      [
        { id: 'operand-a', cells: board.operandA },
        { id: 'operand-b', cells: board.operandB },
      ].forEach(row => {
        row.cells.forEach((cell, index) => {
          if (cell != null) entries[`${row.id}-${index}`] = cell;
        });
      });
    }
    [...board.partials, board.total].forEach(row => {
      row.cells.forEach((cell, index) => {
        if (cell != null) entries[`${row.id}-${index}`] = cell;
      });
    });
    if (scenario.decimalPlaces > 0) {
      entries[operandADecimalPlacesKey] = String(scenario.operandDecimalPlaces[0]);
      entries[operandBDecimalPlacesKey] = String(scenario.operandDecimalPlaces[1]);
      entries[decimalPlacesKey] = String(scenario.decimalPlaces);
      entries[finalAnswerKey] = normalizedProduct;
    }
    return entries;
  }, [board, scenario, normalizedProduct]);

  const isExpectedValue = (key: string, rawValue: string) => (
    key === finalAnswerKey
      ? normalizeAnswer(rawValue) === normalizeAnswer(expectedByKey[key] ?? '')
      : rawValue.trim() === expectedByKey[key]
  );

  const allFilled = orderedInputKeys.every(key => (values[key] ?? '').trim().length > 0);
  const wrongKeys = submitted
    ? orderedInputKeys.filter(key => !isExpectedValue(key, values[key] ?? ''))
    : [];
  const hasWrong = wrongKeys.length > 0;

  const focusNext = (key: string) => {
    const currentIndex = orderedInputKeys.indexOf(key);
    const nextKey = orderedInputKeys[currentIndex + 1];
    if (nextKey) inputRefs.current[nextKey]?.focus();
  };

  const updateCell = (key: string, raw: string) => {
    const nextValue = raw.replace(/\D/g, '').slice(-1);
    setValues(prev => ({ ...prev, [key]: nextValue }));
    setSubmitted(false);
    if (nextValue) focusNext(key);
  };

  const updateFinalAnswer = (raw: string) => {
    const digitsAndPoint = raw.replace(/[^\d.]/g, '');
    const firstPointIndex = digitsAndPoint.indexOf('.');
    const nextValue = firstPointIndex === -1
      ? digitsAndPoint
      : `${digitsAndPoint.slice(0, firstPointIndex + 1)}${digitsAndPoint.slice(firstPointIndex + 1).replace(/\./g, '')}`;
    setValues(prev => ({ ...prev, [finalAnswerKey]: nextValue }));
    setSubmitted(false);
  };

  const fillExample = () => {
    setValues(expectedByKey);
    setSubmitted(false);
    setFocusedKey(null);
  };

  const reset = () => {
    setValues({});
    setSubmitted(false);
    setFocusedKey(null);
    const first = orderedInputKeys[0];
    if (first) inputRefs.current[first]?.focus();
  };

  const renderStaticRow = (cells: Array<string | null>, prefix?: string) => (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `3.5rem repeat(${board.width}, minmax(2.25rem, 2.75rem))` }}>
      <div className="flex items-center justify-center text-2xl font-black text-secondary">{prefix ?? ''}</div>
      {cells.map((cell, index) => (
        <div key={index} className="h-11 rounded-md border-2 border-transparent bg-bg text-2xl font-black text-text flex items-center justify-center">
          {cell ?? ''}
        </div>
      ))}
    </div>
  );

  const renderInputRow = (row: BoardRow, prefix = '', alignOnlyEmpty = false) => (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `3.5rem repeat(${board.width}, minmax(2.25rem, 2.75rem))` }}>
      <div className="flex h-11 items-center justify-center text-2xl font-black text-secondary">{prefix}</div>
      {row.cells.map((cell, index) => {
        const key = `${row.id}-${index}`;
        if (cell == null) {
          return (
            <div
              key={index}
              className={`h-11 rounded-md border-2 ${
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
            onChange={event => updateCell(key, event.target.value)}
            onFocus={() => setFocusedKey(key)}
            inputMode="numeric"
            aria-label={`${row.label} 第 ${index + 1} 格`}
            className={`h-11 rounded-md border-2 text-center text-2xl font-black outline-none transition-all ${cellClass(status, focusedKey === key)}`}
          />
        );
      })}
    </div>
  );

  const decimalInputStatus = (key: string): 'idle' | 'correct' | 'wrong' => {
    if (!submitted) return 'idle';
    return isExpectedValue(key, values[key] ?? '') ? 'correct' : 'wrong';
  };
  const [operandAText, operandBText] = scenario.originalExpression.split(' × ');

  return (
    <main className="min-h-screen bg-bg text-text px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-primary">Phase 1 Preview</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">MultiplicationVerticalBoard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {scenarios.map(item => (
              <button
                key={item.id}
                onClick={() => selectScenario(item.id)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-black transition-all ${
                  scenarioId === item.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-card text-text hover:border-primary/50'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-lg border-2 border-border-2 bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-text-2">{scenario.prompt}</p>
                <div className="mt-1 text-3xl font-black text-text">{scenario.originalExpression}</div>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="inline-flex min-w-full justify-center">
                <div className="flex flex-col gap-1.5 rounded-lg border-2 border-border bg-bg p-3">
                  {scenario.decimalPlaces > 0
                    ? renderInputRow({ id: 'operand-a', label: '整数被乘数', cells: board.operandA }, '', true)
                    : renderStaticRow(board.operandA)}
                  {scenario.decimalPlaces > 0
                    ? renderInputRow({ id: 'operand-b', label: '整数乘数', cells: board.operandB }, '×', true)
                    : renderStaticRow(board.operandB, '×')}
                  <div className="ml-10 border-b-2 border-text" />
                  {board.partials.map(row => (
                    <div key={row.id}>{renderInputRow(row)}</div>
                  ))}
                  <div className="ml-10 border-b-2 border-text" />
                  {renderInputRow(board.total)}
                </div>
              </div>
            </div>

            {scenario.decimalPlaces > 0 && (
              <div className="mt-4 grid gap-3 rounded-lg border-2 border-primary/20 bg-primary/[0.06] p-3 lg:grid-cols-2 xl:grid-cols-4 xl:items-center">
                <div className="flex items-center gap-2 text-sm font-black text-primary-dark">
                  <span>{operandAText} 有</span>
                  <input
                    ref={node => { inputRefs.current[operandADecimalPlacesKey] = node; }}
                    value={values[operandADecimalPlacesKey] ?? ''}
                    onChange={event => updateCell(operandADecimalPlacesKey, event.target.value)}
                    onFocus={() => setFocusedKey(operandADecimalPlacesKey)}
                    inputMode="numeric"
                    aria-label={`${operandAText} 的小数位数`}
                    className={`h-11 w-14 rounded-md border-2 text-center text-xl font-black outline-none ${cellClass(decimalInputStatus(operandADecimalPlacesKey), focusedKey === operandADecimalPlacesKey)}`}
                  />
                  <span>位小数</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-black text-primary-dark">
                  <span>{operandBText} 有</span>
                  <input
                    ref={node => { inputRefs.current[operandBDecimalPlacesKey] = node; }}
                    value={values[operandBDecimalPlacesKey] ?? ''}
                    onChange={event => updateCell(operandBDecimalPlacesKey, event.target.value)}
                    onFocus={() => setFocusedKey(operandBDecimalPlacesKey)}
                    inputMode="numeric"
                    aria-label={`${operandBText} 的小数位数`}
                    className={`h-11 w-14 rounded-md border-2 text-center text-xl font-black outline-none ${cellClass(decimalInputStatus(operandBDecimalPlacesKey), focusedKey === operandBDecimalPlacesKey)}`}
                  />
                  <span>位小数</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-black text-text-2">
                  <span>小数点向左移动</span>
                  <input
                    ref={node => { inputRefs.current[decimalPlacesKey] = node; }}
                    value={values[decimalPlacesKey] ?? ''}
                    onChange={event => updateCell(decimalPlacesKey, event.target.value)}
                    onFocus={() => setFocusedKey(decimalPlacesKey)}
                    inputMode="numeric"
                    aria-label="小数点定位位数"
                    className={`h-11 w-14 rounded-md border-2 text-center text-xl font-black outline-none ${cellClass(decimalInputStatus(decimalPlacesKey), focusedKey === decimalPlacesKey)}`}
                  />
                  <span>位</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-black text-text">
                  <span>最终答数</span>
                  <input
                    ref={node => { inputRefs.current[finalAnswerKey] = node; }}
                    value={values[finalAnswerKey] ?? ''}
                    onChange={event => updateFinalAnswer(event.target.value)}
                    onFocus={() => setFocusedKey(finalAnswerKey)}
                    inputMode="decimal"
                    aria-label="小数乘法最终答数"
                    className={`h-11 w-24 rounded-md border-2 text-center text-xl font-black outline-none ${cellClass(decimalInputStatus(finalAnswerKey), focusedKey === finalAnswerKey)}`}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-lg border-2 border-border-2 bg-card p-4 shadow-sm">
            <div className="space-y-3">
              <button
                onClick={fillExample}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary px-4 py-3 text-sm font-black text-white active:scale-[0.99]"
              >
                <Wand2 size={18} />
                填入示例
              </button>
              <button
                onClick={() => setSubmitted(true)}
                disabled={!allFilled}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-black transition-all ${
                  allFilled
                    ? 'border-success bg-success text-white active:scale-[0.99]'
                    : 'border-border bg-card-2 text-text-2'
                }`}
              >
                <Check size={18} />
                检查
              </button>
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-border bg-bg px-4 py-3 text-sm font-black text-text active:scale-[0.99]"
              >
                <RotateCcw size={18} />
                重置
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-bg p-3">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">状态</div>
              <div className={`mt-2 text-lg font-black ${submitted && !hasWrong ? 'text-success' : hasWrong ? 'text-danger' : 'text-text'}`}>
                {!submitted ? '等待填写' : hasWrong ? `${wrongKeys.length} 格需要调整` : '全部正确'}
              </div>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-text-2">
                {scenario.id === 'integer'
                  ? '多位乘法只校验部分积与最终积，不出现辅助进位格。'
                  : '小数题从整数乘数开始填写，再完成小数位数、小数点移动和最终答数。'}
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
