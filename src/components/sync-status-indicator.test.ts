import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { SyncStatus } from '@/sync/types';

const { mockAuthState, mockSyncState, mockUiState } = vi.hoisted(() => ({
  mockAuthState: {
    supabaseUser: null as SupabaseUser | null,
  },
  mockSyncState: {
    status: 'synced' as SyncStatus,
    retryCount: 0,
    syncState: {
      lastSyncedAt: '2026-04-24T11:55:00.000Z',
      dirtyKeys: [],
      deviceId: 'device-1',
    },
  },
  mockUiState: {
    setPage: vi.fn(),
  },
}));

function bindSelector<TState>(state: TState) {
  return ((selector?: (value: TState) => unknown) => (
    selector ? selector(state) : state
  )) as unknown as {
    <TSelected>(selector: (value: TState) => TSelected): TSelected;
    (): TState;
  };
}

vi.mock('@/store/auth', () => ({
  useAuthStore: bindSelector(mockAuthState),
}));

vi.mock('@/sync/engine', () => ({
  MAX_RETRY: 6,
  useSyncEngine: bindSelector(mockSyncState),
}));

vi.mock('@/store', () => ({
  useUIStore: bindSelector(mockUiState),
}));

import SyncStatusIndicator from './SyncStatusIndicator';

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T12:00:00.000Z'));
    mockAuthState.supabaseUser = null;
    mockSyncState.status = 'synced';
    mockSyncState.retryCount = 0;
    mockSyncState.syncState.lastSyncedAt = '2026-04-24T11:55:00.000Z';
  });

  it('访客模式不渲染', () => {
    const html = renderToStaticMarkup(createElement(SyncStatusIndicator));
    expect(html).toBe('');
  });

  it('synced 状态显示上次同步时间', () => {
    mockAuthState.supabaseUser = { id: 'u1', email: 'a@example.com' } as SupabaseUser;

    const html = renderToStaticMarkup(createElement(SyncStatusIndicator));

    expect(html).toContain('已同步 · 上次同步 5 分钟前');
  });

  it('offline 状态显示非阻塞离线提示', () => {
    mockAuthState.supabaseUser = { id: 'u1', email: 'a@example.com' } as SupabaseUser;
    mockSyncState.status = 'offline';

    const html = renderToStaticMarkup(createElement(SyncStatusIndicator));

    expect(html).toContain('离线 · 网络恢复后自动同步');
  });

  it('error 且重试耗尽时显示持续失败提示', () => {
    mockAuthState.supabaseUser = { id: 'u1', email: 'a@example.com' } as SupabaseUser;
    mockSyncState.status = 'error';
    mockSyncState.retryCount = 6;

    const html = renderToStaticMarkup(createElement(SyncStatusIndicator));

    expect(html).toContain('同步持续失败 · 请检查网络并刷新页面');
  });
});
