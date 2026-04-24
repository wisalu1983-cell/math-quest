import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

type AuthChangeCallback = (event: string, session: Session | null) => void;

const mockUser = {
  id: 'sb-user-1',
  email: 'kid@example.com',
  aud: 'authenticated',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-04-23T00:00:00.000Z',
} as SupabaseUser;

const mockSession = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
} as Session;

const mockState = {
  clientEnabled: true,
  session: null as Session | null,
  otpError: null as Error | null,
  authChangeCallback: null as AuthChangeCallback | null,
};

const mockClient = {
  auth: {
    getSession: vi.fn(async () => ({
      data: { session: mockState.session },
      error: null,
    })),
    onAuthStateChange: vi.fn((callback: AuthChangeCallback) => {
      mockState.authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
    signInWithOtp: vi.fn(async ({ email }: { email: string }) => {
      if (mockState.otpError) {
        return { data: { user: null, session: null }, error: mockState.otpError };
      }

      return {
        data: {
          user: null,
          session: null,
          email,
        },
        error: null,
      };
    }),
    signOut: vi.fn(async () => ({ error: null })),
  },
};

const mockSyncEngineState = {
  syncState: {
    dirtyKeys: [] as string[],
  },
};

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => (mockState.clientEnabled ? mockClient : null),
  isSupabaseConfigured: () => mockState.clientEnabled,
}));

vi.mock('@/sync/engine', () => ({
  useSyncEngine: {
    getState: () => mockSyncEngineState,
  },
}));

import { useAuthStore } from './auth';

function resetAuthStore() {
  useAuthStore.setState({
    supabaseUser: null,
    isAuthenticated: false,
    isLoading: false,
    authError: null,
    magicLinkSent: false,
  });
}

describe('AuthStore', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockState.clientEnabled = true;
    mockState.session = null;
    mockState.otpError = null;
    mockState.authChangeCallback = null;
    mockSyncEngineState.syncState.dirtyKeys = [];
    mockClient.auth.getSession.mockClear();
    mockClient.auth.onAuthStateChange.mockClear();
    mockClient.auth.signInWithOtp.mockClear();
    mockClient.auth.signOut.mockClear();
    resetAuthStore();
  });

  it('未配置 Supabase 时 initialize 结束 loading，保持未登录', async () => {
    mockState.clientEnabled = false;

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState()).toMatchObject({
      supabaseUser: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('initialize 会读取当前 session，并跟随后续 auth 事件更新状态', async () => {
    mockState.session = mockSession;

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState()).toMatchObject({
      supabaseUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
    });
    expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledTimes(1);

    mockState.authChangeCallback?.('SIGNED_OUT', null);

    expect(useAuthStore.getState()).toMatchObject({
      supabaseUser: null,
      isAuthenticated: false,
    });
  });

  it('未配置 Supabase 时 signInWithMagicLink 写入明确错误', async () => {
    mockState.clientEnabled = false;

    await useAuthStore.getState().signInWithMagicLink('kid@example.com');

    expect(useAuthStore.getState()).toMatchObject({
      authError: 'Supabase 未配置',
      magicLinkSent: false,
    });
  });

  it('signInWithMagicLink 成功后标记 magic link 已发送', async () => {
    await useAuthStore.getState().signInWithMagicLink('kid@example.com');

    expect(mockClient.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'kid@example.com' });
    expect(useAuthStore.getState()).toMatchObject({
      authError: null,
      magicLinkSent: true,
    });
  });

  it('signInWithMagicLink 会把 Magic Link 回跳地址设为当前应用地址', async () => {
    vi.stubGlobal('location', { origin: 'https://wisalu1983-cell.github.io' });

    await useAuthStore.getState().signInWithMagicLink('kid@example.com');

    expect(mockClient.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'kid@example.com',
      options: { emailRedirectTo: 'https://wisalu1983-cell.github.io/' },
    });
  });

  it('signInWithMagicLink 失败时暴露 Supabase 错误信息', async () => {
    mockState.otpError = new Error('邮箱发送失败');

    await useAuthStore.getState().signInWithMagicLink('kid@example.com');

    expect(useAuthStore.getState()).toMatchObject({
      authError: '邮箱发送失败',
      magicLinkSent: false,
    });
  });

  it('signOut 会清空登录态与 magic link 状态', async () => {
    useAuthStore.setState({
      supabaseUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      authError: null,
      magicLinkSent: true,
    });

    await useAuthStore.getState().signOut();

    expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      supabaseUser: null,
      isAuthenticated: false,
      magicLinkSent: false,
    });
  });

  it('signOutGuarded 在存在 dirtyKeys 时阻止登出并返回脏数据列表', async () => {
    mockSyncEngineState.syncState.dirtyKeys = ['game_progress', 'rank_match_sessions'];
    useAuthStore.setState({
      supabaseUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      authError: null,
      magicLinkSent: true,
    });

    const result = await useAuthStore.getState().signOutGuarded();

    expect(result).toEqual({
      ok: false,
      reason: 'dirty',
      dirtyKeys: ['game_progress', 'rank_match_sessions'],
    });
    expect(mockClient.auth.signOut).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('signOutForce 绕过 dirtyKeys 校验并清空登录态', async () => {
    mockSyncEngineState.syncState.dirtyKeys = ['game_progress'];
    useAuthStore.setState({
      supabaseUser: mockUser,
      isAuthenticated: true,
      isLoading: false,
      authError: null,
      magicLinkSent: true,
    });

    await useAuthStore.getState().signOutForce();

    expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      supabaseUser: null,
      isAuthenticated: false,
      magicLinkSent: false,
    });
  });
});
