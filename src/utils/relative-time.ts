export function formatRelativeTime(timestamp: string | number | null): string {
  if (!timestamp) return '尚未同步';

  const time = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
  if (Number.isNaN(time)) return '尚未同步';

  const diff = Date.now() - time;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 172_800_000) return '昨天';
  return `${Math.floor(diff / 86_400_000)} 天前`;
}
