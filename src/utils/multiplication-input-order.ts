export function inputKeysForRow(
  row: { id: string; cells: Array<string | null> },
  direction: 'ltr' | 'rtl',
): string[] {
  const keys = row.cells.flatMap((cell, index) => cell == null ? [] : `${row.id}-${index}`);
  return direction === 'rtl' ? [...keys].reverse() : keys;
}

export function resolveTabTarget(
  orderedKeys: string[],
  currentKey: string,
  shiftKey: boolean,
): string | null {
  const currentIndex = orderedKeys.indexOf(currentKey);
  return orderedKeys[currentIndex + (shiftKey ? -1 : 1)] ?? null;
}
