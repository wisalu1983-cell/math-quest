// src/components/Hearts.tsx
import { getHeartsAriaLabel } from '@/utils/ui-accessibility';

interface HeartsProps {
  /** 当前剩余心数。*/
  count: number;
  /** 最大心数，默认 3。*/
  max?: number;
}

export default function Hearts({ count, max = 3 }: HeartsProps) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={getHeartsAriaLabel(count)}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`text-xl transition-all ${i < count ? 'text-danger' : 'text-danger opacity-20'}`}
        >
          ❤
        </span>
      ))}
    </div>
  );
}
