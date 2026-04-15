// src/components/Dialog.tsx
import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 无障碍对话框。
 * - role="dialog" + aria-modal="true"
 * - 打开时自动聚焦第一个可聚焦元素
 * - Tab / Shift+Tab 焦点陷阱
 * - ESC 关闭
 * - 点击遮罩关闭
 */
export default function Dialog({ open, onClose, title, children, className = '' }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const el = ref.current;
    if (!el) return;

    const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusable[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65"
      aria-hidden="false"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        className={`bg-card rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl ${className}`}
      >
        {title && (
          <h3 id="dialog-title" className="text-lg font-black mb-2">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
