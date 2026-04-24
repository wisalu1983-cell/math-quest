import { MAX_RETRY } from './engine';
import type { SyncState, SyncStatus } from './types';
import { formatRelativeTime } from '@/utils/relative-time';

export function getHomeSyncAriaLabel(
  status: SyncStatus,
  retryCount: number,
  syncState: SyncState,
): string | null {
  if (status === 'armed') return '同步准备中';
  if (status === 'syncing') return '正在同步';
  if (status === 'synced') return `已同步 · 上次同步 ${formatRelativeTime(syncState.lastSyncedAt)}`;
  if (status === 'offline') return '离线 · 网络恢复后自动同步';
  if (status === 'error' && retryCount < MAX_RETRY) {
    return `同步失败，正在重试（第 ${retryCount} 次）`;
  }
  if (status === 'error') return '同步持续失败 · 请检查网络并刷新页面';
  return null;
}

export function getProfileSyncText(
  status: SyncStatus,
  retryCount: number,
  syncState: SyncState,
): string {
  if (status === 'armed') return '同步准备中 · 等待合并判定';
  if (status === 'syncing') return '正在同步';
  if (status === 'synced') return `已同步 · 上次同步 ${formatRelativeTime(syncState.lastSyncedAt)}`;
  if (status === 'offline') return '离线中 · 网络恢复后自动继续';
  if (status === 'error' && retryCount < MAX_RETRY) {
    return `同步失败 · 已重试 ${retryCount} 次`;
  }
  if (status === 'error') return `同步持续失败 · 上次同步 ${formatRelativeTime(syncState.lastSyncedAt)}`;
  return '同步未启动';
}
