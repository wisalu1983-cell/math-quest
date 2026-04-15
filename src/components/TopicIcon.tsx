// src/components/TopicIcon.tsx
// SVG 图标库，来源：.ui-design/preview/redesign-v5.html
// 使用 dangerouslySetInnerHTML 保留原始 SVG 属性（内部静态资产，无 XSS 风险）。

// ── 路径数据 ─────────────────────────────────────────────────────────────────

const TOPIC_PATHS: Record<string, string> = {
  'mental-arithmetic': `
    <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity=".1" stroke-width="0"/>
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="7.5" x2="12" y2="16.5" stroke-width="2.5"/>
    <line x1="7.5" y1="12" x2="16.5" y2="12" stroke-width="2.5"/>`,
  'number-sense': `
    <path d="M4 9.5c1.5-1.8 3-1.8 4.5 0s3 1.8 4.5 0 3-1.8 4.5 0" stroke-width="2.3"/>
    <path d="M4 15.5c1.5-1.8 3-1.8 4.5 0s3 1.8 4.5 0 3-1.8 4.5 0" stroke-width="2.3"/>`,
  'vertical-calc': `
    <rect x="5" y="3.5" width="14" height="3.5" rx="1.75" fill="currentColor" fill-opacity=".18" stroke-width="0"/>
    <rect x="7" y="9" width="12" height="3.5" rx="1.75" fill="currentColor" fill-opacity=".18" stroke-width="0"/>
    <line x1="3" y1="14.5" x2="21" y2="14.5" stroke-width="2.5"/>
    <rect x="4" y="17.5" width="16" height="3.5" rx="1.75" fill="currentColor" fill-opacity=".75" stroke-width="0"/>`,
  'operation-laws': `
    <path d="M3 12a9 9 0 1015.93-5.66"/>
    <polyline points="19 2 19 7 14 7"/>
    <path d="M21 12A9 9 0 015.07 17.66"/>
    <polyline points="5 22 5 17 10 17"/>`,
  'decimal-ops': `
    <rect x="2" y="8" width="8" height="8" rx="2.5" fill="currentColor" fill-opacity=".15" stroke-width="1.5"/>
    <circle cx="13.5" cy="12" r="2.5" fill="currentColor" fill-opacity=".85" stroke-width="0"/>
    <rect x="15.5" y="8" width="6.5" height="8" rx="2.5" fill="currentColor" fill-opacity=".15" stroke-width="1.5"/>`,
  'bracket-ops': `
    <path d="M9 4C7 8 7 16 9 20" stroke-width="2.5"/>
    <path d="M15 4C17 8 17 16 15 20" stroke-width="2.5"/>`,
  'multi-step': `
    <path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" fill="currentColor" fill-opacity=".18" stroke-linejoin="round" stroke-width="1.8"/>`,
  'equation-transpose': `
    <line x1="12" y1="2" x2="12" y2="6.5" stroke-width="2"/>
    <line x1="3" y1="6.5" x2="21" y2="6.5" stroke-width="2.5"/>
    <line x1="3.5" y1="6.5" x2="7" y2="14" stroke-width="1.8"/>
    <rect x="3" y="14" width="8" height="4.5" rx="2.25" fill="currentColor" fill-opacity=".18" stroke-width="1.5"/>
    <line x1="20.5" y1="6.5" x2="17" y2="14" stroke-width="1.8"/>
    <rect x="13" y="14" width="8" height="4.5" rx="2.25" fill="currentColor" fill-opacity=".18" stroke-width="1.5"/>
    <line x1="10.5" y1="21" x2="13.5" y2="21" stroke-width="2"/>`,
};

const NAV_PATHS: Record<string, string> = {
  home: `
    <path d="M3 12L12 3l9 9"/>
    <path d="M5 10.5v8.5a1 1 0 001 1h4v-4.5h4V20h4a1 1 0 001-1v-8.5" fill="currentColor" fill-opacity=".12" stroke-width="2"/>`,
  progress: `
    <rect x="2.5" y="14" width="5" height="8" rx="1.5" fill="currentColor" fill-opacity=".9" stroke-width="0"/>
    <rect x="9.5" y="9" width="5" height="13" rx="1.5" fill="currentColor" fill-opacity=".9" stroke-width="0"/>
    <rect x="16.5" y="4" width="5" height="18" rx="1.5" fill="currentColor" fill-opacity=".9" stroke-width="0"/>
    <line x1="1.5" y1="22" x2="22.5" y2="22" stroke-width="2"/>`,
  wrongbook: `
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" fill="none"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill="currentColor" fill-opacity=".1"/>
    <polyline points="9 11.5 11 13.5 15 9.5" stroke-width="2.3"/>`,
  profile: `
    <circle cx="12" cy="8" r="4" fill="currentColor" fill-opacity=".15"/>
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" fill-opacity=".12"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>`,
};

const LVL_PATHS: Record<string, string> = {
  done: `<polyline points="5 12 10 17 19 7" stroke-width="2.8"/>`,
  play: `
    <polygon points="8 5 20 12 8 19" fill="currentColor" fill-opacity=".25" stroke-linejoin="round"/>
    <polygon points="8 5 20 12 8 19" stroke-linejoin="round"/>`,
  lock: `
    <rect x="5" y="11" width="14" height="10" rx="3" fill="currentColor" fill-opacity=".18"/>
    <rect x="5" y="11" width="14" height="10" rx="3"/>
    <path d="M8 11V7a4 4 0 018 0v4"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke-width="0"/>`,
};

// ── 公共 SVG 包装 ──────────────────────────────────────────────────────────

function SvgWrap({
  paths,
  size,
  className,
}: {
  paths: string;
  size: number;
  className: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}

// ── 主题图标 ────────────────────────────────────────────────────────────────

export function TopicIcon({
  topicId,
  size = 24,
  className = '',
}: {
  topicId: string;
  size?: number;
  className?: string;
}) {
  return <SvgWrap paths={TOPIC_PATHS[topicId] ?? ''} size={size} className={className} />;
}

// ── 导航图标 ────────────────────────────────────────────────────────────────

export type NavIconKey = 'home' | 'progress' | 'wrongbook' | 'profile';

export function NavIcon({
  name,
  size = 24,
  className = '',
}: {
  name: NavIconKey;
  size?: number;
  className?: string;
}) {
  return <SvgWrap paths={NAV_PATHS[name] ?? ''} size={size} className={className} />;
}

// ── 关卡状态图标 ─────────────────────────────────────────────────────────────

export type LvlIconState = 'done' | 'play' | 'lock';

export function LvlIcon({
  state,
  size = 36,
  className = '',
}: {
  state: LvlIconState;
  size?: number;
  className?: string;
}) {
  return <SvgWrap paths={LVL_PATHS[state] ?? ''} size={size} className={className} />;
}
