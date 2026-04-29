import { Delete } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  ALL_MATH_KEYBOARD_KEYS,
  applyMathKeyboardKey,
  isMathKeyboardKeyEnabled,
  resolveAutoAdvanceSlotId,
} from './practice-math-keyboard';
import type { MathInputSlot } from './practice-math-keyboard';

interface Props {
  slots: MathInputSlot[];
  activeSlotId: string | null;
  onActiveSlotChange: (slotId: string | null) => void;
  className?: string;
}

function keyLabel(key: string): string {
  if (key === 'delete') return '删除';
  if (key === '-') return '−';
  return key;
}

function keyContent(key: string) {
  if (key === 'delete') return <Delete size={20} aria-hidden="true" />;
  if (key === 'x') {
    return (
      <span
        className="font-serif text-[22px] font-semibold italic leading-none"
        style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
        aria-hidden="true"
      >
        x
      </span>
    );
  }
  return keyLabel(key);
}

function keyAriaLabel(key: string): string {
  if (key === 'delete') return '删除当前格';
  if (key === '×') return '乘号';
  if (key === '÷') return '除号';
  if (key === '-') return '减号';
  return `输入 ${key}`;
}

function keyTone(key: string): 'input' | 'symbol' | 'delete' {
  if (key === 'delete') return 'delete';
  if (/^[0-9.]$/.test(key) || key === 'x') return 'input';
  return 'symbol';
}

function keyClassName(key: string, enabled: boolean): string {
  const base = 'flex h-10 min-w-0 items-center justify-center rounded-xl border text-lg font-black transition-all sm:h-11';
  const tone = keyTone(key);

  const enabledTone = {
    input: 'border-border bg-card text-text shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_1px_5px_rgba(61,20,0,.08)] active:scale-[0.98] active:bg-card-2',
    symbol: 'border-primary-mid bg-primary-lt text-primary-dark shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_1px_5px_rgba(255,107,53,.12)] active:scale-[0.98] active:bg-primary-mid',
    delete: 'border-danger bg-danger-lt text-danger shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_1px_5px_rgba(255,107,107,.12)] active:scale-[0.98] active:bg-danger-lt',
  }[tone];

  const disabledTone = {
    input: 'cursor-not-allowed border-dashed border-border-2 bg-card-2 text-text-3 opacity-40 shadow-none',
    symbol: 'cursor-not-allowed border-dashed border-border-2 bg-card-2 text-text-3 opacity-40 shadow-none',
    delete: 'cursor-not-allowed border-dashed border-border-2 bg-card-2 text-text-3 opacity-40 shadow-none',
  }[tone];

  return `${base} ${enabled ? enabledTone : disabledTone}`;
}

export default function PracticeMathKeyboard({
  slots,
  activeSlotId,
  onActiveSlotChange,
  className = '',
}: Props) {
  const activeSlot = slots.find(slot => slot.id === activeSlotId) ?? slots[0] ?? null;
  if (!activeSlot) return null;

  const handleKeyPress = (key: (typeof ALL_MATH_KEYBOARD_KEYS)[number]) => {
    const targetSlot = activeSlot ?? slots[0];
    if (!targetSlot || !isMathKeyboardKeyEnabled(targetSlot, key)) return;
    if (targetSlot.id !== activeSlotId) onActiveSlotChange(targetSlot.id);
    const previousValue = targetSlot.value;
    const nextValue = applyMathKeyboardKey(targetSlot, key);
    targetSlot.setValue(nextValue);
    const nextSlotId = resolveAutoAdvanceSlotId({
      slots,
      activeSlotId: targetSlot.id,
      key,
      previousValue,
      nextValue,
    });
    if (nextSlotId) onActiveSlotChange(nextSlotId);
  };

  const keyboard = (
    <div className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex w-full justify-center px-3 pb-3 pt-2 safe-bottom ${className}`}>
      <div className="pointer-events-auto w-full max-w-lg">
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          当前输入：{activeSlot.label}
        </div>
        <div
          className="rounded-[18px] border-2 border-border bg-card px-2.5 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,.09)]"
          aria-label="计算输入键盘"
        >
          <div className="grid grid-cols-[1fr_1fr_1fr_0.72fr_0.72fr] gap-1.5 sm:gap-2">
            {ALL_MATH_KEYBOARD_KEYS.map(key => {
              const enabled = isMathKeyboardKeyEnabled(activeSlot, key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={keyAriaLabel(key)}
                  title={keyAriaLabel(key)}
                  disabled={!enabled}
                  onClick={() => handleKeyPress(key)}
                  className={keyClassName(key, enabled)}
                >
                  {keyContent(key)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return keyboard;
  return createPortal(keyboard, document.body);
}
