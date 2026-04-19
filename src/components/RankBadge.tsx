// src/components/RankBadge.tsx
// 段位徽章小组件：学徒 → 新秀 → 高手 → 专家 → 大师
// 颜色严格走 globals.css --rank-* CSS 变量，禁止硬编码十六进制（Spec §8.4）

import type { RankTier } from '@/types/gamification';

const TIER_LABEL: Record<RankTier, string> = {
  apprentice: '学徒',
  rookie:     '新秀',
  pro:        '高手',
  expert:     '专家',
  master:     '大师',
};

const TIER_EMOJI: Record<RankTier, string> = {
  apprentice: '📖',
  rookie:     '🌱',
  pro:        '⚡',
  expert:     '💎',
  master:     '🔥',
};

interface Props {
  tier: RankTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  dimmed?: boolean;
}

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', { wrap: string; emoji: string; text: string }> = {
  sm: { wrap: 'w-8 h-8',   emoji: 'text-base',  text: 'text-[10px]' },
  md: { wrap: 'w-12 h-12', emoji: 'text-2xl',   text: 'text-[12px]' },
  lg: { wrap: 'w-16 h-16', emoji: 'text-3xl',   text: 'text-[13px]' },
};

export default function RankBadge({ tier, size = 'md', showLabel = false, dimmed = false }: Props) {
  const s = SIZE_CLASS[size];
  const cssVar = `--rank-${tier}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${s.wrap} rounded-2xl flex items-center justify-center border-2 transition-opacity`}
        style={{
          backgroundColor: `var(${cssVar})`,
          background: `color-mix(in srgb, var(${cssVar}) 15%, white)`,
          borderColor: `var(${cssVar})`,
          opacity: dimmed ? 0.4 : 1,
        }}
        aria-label={`${TIER_LABEL[tier]}段位`}
      >
        <span className={s.emoji} aria-hidden="true">{TIER_EMOJI[tier]}</span>
      </div>
      {showLabel && (
        <span
          className={`${s.text} font-extrabold`}
          style={{ color: dimmed ? 'var(--color-text-3)' : `var(${cssVar})` }}
        >
          {TIER_LABEL[tier]}
        </span>
      )}
    </div>
  );
}
