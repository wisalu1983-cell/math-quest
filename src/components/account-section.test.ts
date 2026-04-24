import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { SyncStatus } from '@/sync/types';

const { mockAuthState, mockSyncState, mockConfig, useSyncEngineMock } = vi.hoisted(() => {
  const syncState = {
    status: 'synced' as SyncStatus,
    retryCount: 0,
    syncState: {
      lastSyncedAt: '2026-04-24T11:55:00.000Z',
      dirtyKeys: [],
      deviceId: 'device-1',
    },
    fullSync: vi.fn(),
  };
  const syncHook = ((selector?: (value: typeof syncState) => unknown) => (
    selector ? selector(syncState) : syncState
  )) as unknown as {
    <TSelected>(selector: (value: typeof syncState) => TSelected): TSelected;
    (): typeof syncState;
    getState: () => typeof syncState;
  };
  syncHook.getState = () => syncState;

  return {
    mockAuthState: {
      supabaseUser: null as SupabaseUser | null,
      isLoading: false,
    },
    mockSyncState: syncState,
    mockConfig: {
      enabled: true,
    },
    useSyncEngineMock: syncHook,
  };
});

function bindSelector<TState>(state: TState) {
  return ((selector?: (value: TState) => unknown) => (
    selector ? selector(state) : state
  )) as unknown as {
    <TSelected>(selector: (value: TState) => TSelected): TSelected;
    (): TState;
  };
}

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => mockConfig.enabled,
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: bindSelector(mockAuthState),
}));

vi.mock('@/sync/engine', () => ({
  MAX_RETRY: 6,
  useSyncEngine: useSyncEngineMock,
}));

import AccountSection from './AccountSection';
import SignOutConfirmDialog from './SignOutConfirmDialog';

describe('AccountSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T12:00:00.000Z'));
    mockConfig.enabled = true;
    mockAuthState.supabaseUser = null;
    mockAuthState.isLoading = false;
    mockSyncState.status = 'synced';
    mockSyncState.retryCount = 0;
    mockSyncState.syncState.lastSyncedAt = '2026-04-24T11:55:00.000Z';
  });

  it('Supabase 未配置时显示账号系统占位', () => {
    mockConfig.enabled = false;

    const html = renderToStaticMarkup(createElement(AccountSection, {
      onLogin: vi.fn(),
      onLogoutConfirm: vi.fn(),
    }));

    expect(html).toContain('当前版本未接入账号系统');
    expect(html).not.toContain('登录账号');
  });

  it('未登录时显示登录入口', () => {
    const html = renderToStaticMarkup(createElement(AccountSection, {
      onLogin: vi.fn(),
      onLogoutConfirm: vi.fn(),
    }));

    expect(html).toContain('登录以在多设备间同步进度');
    expect(html).toContain('登录账号');
  });

  it('已登录时显示邮箱和同步状态', () => {
    mockAuthState.supabaseUser = { id: 'u1', email: 'kid@example.com' } as SupabaseUser;

    const html = renderToStaticMarkup(createElement(AccountSection, {
      onLogin: vi.fn(),
      onLogoutConfirm: vi.fn(),
    }));

    expect(html).toContain('kid@example.com');
    expect(html).toContain('已同步 · 上次同步 5 分钟前');
    expect(html).toContain('登出');
  });

  it('重试耗尽时显示手动重试按钮', () => {
    mockAuthState.supabaseUser = { id: 'u1', email: 'kid@example.com' } as SupabaseUser;
    mockSyncState.status = 'error';
    mockSyncState.retryCount = 6;

    const html = renderToStaticMarkup(createElement(AccountSection, {
      onLogin: vi.fn(),
      onLogoutConfirm: vi.fn(),
    }));

    expect(html).toContain('同步持续失败');
    expect(html).toContain('手动重试');
  });
});

describe('SignOutConfirmDialog', () => {
  it('展示待同步数据类型并提供取消和仍然登出', () => {
    const html = renderToStaticMarkup(createElement(SignOutConfirmDialog, {
      dirtyKeys: ['game_progress', 'rank_match_sessions'],
      onCancel: vi.fn(),
      onForce: vi.fn(),
    }));

    expect(html).toContain('还有未同步的数据');
    expect(html).toContain('进度数据');
    expect(html).toContain('段位赛记录');
    expect(html).toContain('取消');
    expect(html).toContain('仍然登出');
  });
});
