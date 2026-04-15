// src/components/ProgressBar.tsx

interface ProgressBarProps {
  /** 当前值。若传入 max 则 pct = value/max*100；否则直接视为 0-100 的百分比。*/
  value: number;
  max?: number;
  /** CSS 颜色字符串，默认使用橙色渐变 token。*/
  color?: string;
  /** 高度（px），默认 7。*/
  height?: number;
  /** aria-valuetext 说明文字，默认 "X%"。*/
  label?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  color,
  height = 7,
  label,
  className = '',
}: ProgressBarProps) {
  const pct =
    max !== undefined
      ? max > 0 ? Math.round((value / max) * 100) : 0
      : value;
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={label ?? `${clamped}%`}
      className={`overflow-hidden bg-border-2 ${className}`}
      style={{ height, borderRadius: 4 }}
    >
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${clamped}%`,
          borderRadius: 4,
          background:
            color ??
            'linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))',
        }}
      />
    </div>
  );
}
