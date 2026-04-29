import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import PracticeMathKeyboard from './PracticeMathKeyboard';
import { ALL_MATH_KEYBOARD_KEYS } from './practice-math-keyboard';
import type { MathInputSlot, MathKeyboardKey } from './practice-math-keyboard';

function makeSlot(overrides: Partial<MathInputSlot> = {}): MathInputSlot {
  return {
    id: 'answer-cell',
    label: '答案第 4 格',
    value: '',
    enabledKeys: ['1', '2', '3', 'delete'],
    setValue: vi.fn(),
    ...overrides,
  };
}

describe('PracticeMathKeyboard', () => {
  function renderKeyboard(slot: MathInputSlot): string {
    return renderToStaticMarkup(
      createElement(PracticeMathKeyboard, {
        slots: [slot],
        activeSlotId: slot.id,
        onActiveSlotChange: vi.fn(),
      }),
    );
  }

  function getButtonClass(markup: string, ariaLabel: string): string {
    const match = new RegExp(`<button[^>]*aria-label="${ariaLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*class="([^"]+)"`).exec(markup);
    expect(match).not.toBeNull();
    return match?.[1] ?? '';
  }

  function getButtonMarkup(markup: string, ariaLabel: string): string {
    const match = new RegExp(`<button[^>]*aria-label="${ariaLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?</button>`).exec(markup);
    expect(match).not.toBeNull();
    return match?.[0] ?? '';
  }

  it('keeps the active slot label for screen readers without repeating it as visible keyboard chrome', () => {
    const markup = renderKeyboard(makeSlot());

    expect(markup).toContain('aria-label="计算输入键盘"');
    expect(markup).toContain('class="sr-only"');
    expect(markup.match(/答案第 4 格/g)).toHaveLength(1);
  });

  it('uses project theme classes for symbol keys instead of a separate blue palette', () => {
    const markup = renderKeyboard(makeSlot({
      enabledKeys: ALL_MATH_KEYBOARD_KEYS,
    }));

    const equalsClass = getButtonClass(markup, '输入 =');
    expect(equalsClass).toContain('bg-primary-lt');
    expect(equalsClass).toContain('border-primary-mid');
    expect(equalsClass).toContain('text-primary-dark');
  });

  it('makes unavailable keys visibly muted and keeps the keyboard fixed at the viewport bottom', () => {
    const markup = renderKeyboard(makeSlot({
      enabledKeys: ['1', '2', '3', 'delete'] as MathKeyboardKey[],
    }));

    expect(markup).toContain('fixed');
    expect(markup).toContain('bottom-0');
    expect(markup).toContain('pb-3');

    const enabledClass = getButtonClass(markup, '输入 1');
    expect(enabledClass).toContain('bg-card');
    expect(enabledClass).toContain('text-text');
    expect(enabledClass).not.toContain('opacity-40');

    const disabledClass = getButtonClass(markup, '输入 x');
    expect(disabledClass).toContain('border-dashed');
    expect(disabledClass).toContain('bg-card-2');
    expect(disabledClass).toContain('text-text-3');
    expect(disabledClass).toContain('opacity-40');
  });

  it('renders variable x with math-variable styling so it does not read like the multiply sign', () => {
    const markup = renderKeyboard(makeSlot({
      enabledKeys: ALL_MATH_KEYBOARD_KEYS,
    }));

    const variableMarkup = getButtonMarkup(markup, '输入 x');
    expect(variableMarkup).toContain('font-serif');
    expect(variableMarkup).toContain('italic');
    expect(variableMarkup).toContain('aria-hidden="true"');

    const multiplyMarkup = getButtonMarkup(markup, '乘号');
    expect(multiplyMarkup).not.toContain('font-serif');
    expect(multiplyMarkup).not.toContain('italic');
  });
});
