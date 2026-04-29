export interface MultiplicationRow {
  id: string;
  cells: Array<string | null>;
}

export interface MultiplicationVerticalLayout {
  width: number;
  operandA: Array<string | null>;
  operandB: Array<string | null>;
  partials: MultiplicationRow[];
  total: MultiplicationRow;
}

export function digitCells(value: string, width: number): Array<string | null> {
  const cells: Array<string | null> = Array(width).fill(null);
  const digits = value.split('');
  const start = width - digits.length;
  digits.forEach((digit, index) => {
    cells[start + index] = digit;
  });
  return cells;
}

export function shiftedCells(value: number, shift: number, width: number): Array<string | null> {
  const cells: Array<string | null> = Array(width).fill(null);
  const digits = String(value).split('');
  const end = width - 1 - shift;
  const start = end - digits.length + 1;
  digits.forEach((digit, index) => {
    const targetIndex = start + index;
    if (targetIndex >= 0 && targetIndex < cells.length) {
      cells[targetIndex] = digit;
    }
  });
  return cells;
}

export function buildMultiplicationVerticalLayout(
  multiplicand: number,
  multiplier: number,
): MultiplicationVerticalLayout {
  const product = multiplicand * multiplier;
  const width = Math.max(
    String(multiplicand).length,
    String(multiplier).length + 1,
    String(product).length,
  );
  const multiplierDigits = String(multiplier).split('').reverse().map(Number);
  const partials = multiplierDigits.map((digit, shift) => ({
    id: `partial-${shift}`,
    cells: shiftedCells(multiplicand * digit, shift, width),
  }));

  return {
    width,
    operandA: digitCells(String(multiplicand), width),
    operandB: digitCells(String(multiplier), width),
    partials,
    total: {
      id: 'total',
      cells: digitCells(String(product), width),
    },
  };
}

export function buildMultiplicationVerticalCalculationRows(
  layout: MultiplicationVerticalLayout,
): MultiplicationRow[] {
  if (layout.partials.length === 1) return layout.partials;
  return [...layout.partials, layout.total];
}

export function getMultiplicationVerticalFinalProductRow(
  layout: MultiplicationVerticalLayout,
): MultiplicationRow {
  if (layout.partials.length === 1) return layout.partials[0];
  return layout.total;
}

export function placeDecimalPoint(integerProduct: string, decimalPlaces: number): string {
  if (decimalPlaces <= 0) return integerProduct;
  const padded = integerProduct.padStart(decimalPlaces + 1, '0');
  const cut = padded.length - decimalPlaces;
  return `${padded.slice(0, cut)}.${padded.slice(cut)}`;
}

export function normalizeFinalAnswer(raw: string): string {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d*)?$/.test(trimmed)) return trimmed;

  const [integerPart, decimalPart = ''] = trimmed.split('.');
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const normalizedDecimal = decimalPart.replace(/0+$/, '');
  return normalizedDecimal ? `${normalizedInteger}.${normalizedDecimal}` : normalizedInteger;
}

export function isEquivalentFinalAnswer(userAnswer: string, expectedAnswer: string): boolean {
  return normalizeFinalAnswer(userAnswer) === normalizeFinalAnswer(expectedAnswer);
}
