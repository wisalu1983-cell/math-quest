/**
 * Shared utilities for question generators.
 */

/**
 * Format a number for display / answer comparison.
 * Integers → "123"; decimals → trim trailing zeros, max 4 dp.
 */
export function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}
