import { describe, expect, it } from 'vitest';
import {
  buildMultiplicationVerticalCalculationRows,
  buildMultiplicationVerticalLayout,
  getMultiplicationVerticalFinalProductRow,
  isEquivalentFinalAnswer,
  normalizeFinalAnswer,
  placeDecimalPoint,
} from './verticalMultiplication';

describe('vertical multiplication layout', () => {
  it('builds partial-product rows for multi-digit integer multiplication', () => {
    const layout = buildMultiplicationVerticalLayout(782, 14);

    expect(layout.width).toBe(5);
    expect(layout.operandA).toEqual([null, null, '7', '8', '2']);
    expect(layout.operandB).toEqual([null, null, null, '1', '4']);
    expect(layout.partials).toEqual([
      { id: 'partial-0', cells: [null, '3', '1', '2', '8'] },
      { id: 'partial-1', cells: [null, '7', '8', '2', null] },
    ]);
    expect(layout.total.cells).toEqual(['1', '0', '9', '4', '8']);
  });

  it('does not require a repeated total row when there is only one partial product', () => {
    const layout = buildMultiplicationVerticalLayout(908, 5);

    expect(layout.partials).toHaveLength(1);
    expect(layout.partials[0].cells).toEqual(layout.total.cells);
    expect(buildMultiplicationVerticalCalculationRows(layout).map(row => row.id)).toEqual(['partial-0']);
    expect(getMultiplicationVerticalFinalProductRow(layout).id).toBe('partial-0');
  });

  it('keeps the total row when multiple partial products must be summed', () => {
    const layout = buildMultiplicationVerticalLayout(782, 14);

    expect(buildMultiplicationVerticalCalculationRows(layout).map(row => row.id)).toEqual([
      'partial-0',
      'partial-1',
      'total',
    ]);
    expect(getMultiplicationVerticalFinalProductRow(layout).id).toBe('total');
  });

  it('places and normalizes decimal final answers without weakening move-count validation', () => {
    expect(placeDecimalPoint('560', 1)).toBe('56.0');
    expect(normalizeFinalAnswer('56.0')).toBe('56');
    expect(normalizeFinalAnswer('056.00')).toBe('56');
    expect(isEquivalentFinalAnswer('56', '56.0')).toBe(true);
    expect(isEquivalentFinalAnswer('56.0', '56')).toBe(true);
    expect(isEquivalentFinalAnswer('5.6', '56')).toBe(false);
  });
});
