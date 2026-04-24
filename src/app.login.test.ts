import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const {
  mockUiState,
  mockUserState,
  mockGameProgressState,
  mockSessionState,
} = vi.hoisted(() => ({
  mockUiState: {
    currentPage: 'login',
    setPage: vi.fn(),
    selectedTopicId: null,
    setSelectedTopicId: vi.fn(),
    lastSession: null,
    setLastSession: vi.fn(),
    viewingSessionId: null,
    setViewingSessionId: vi.fn(),
    soundEnabled: true,
    toggleSound: vi.fn(),
  },
  mockUserState: {
    user: null,
    loadUser: vi.fn(),
  },
  mockGameProgressState: {
    gameProgress: null,
    loadGameProgress: vi.fn(),
  },
  mockSessionState: {
    resumeRankMatchGame: vi.fn(),
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

vi.mock('@/store', async () => {
  const actual = await vi.importActual<typeof import('@/store')>('@/store');

  return {
    ...actual,
    useUIStore: bindSelector(mockUiState),
    useUserStore: bindSelector(mockUserState),
    useGameProgressStore: bindSelector(mockGameProgressState),
    useSessionStore: bindSelector(mockSessionState),
  };
});

import App from './App';

describe('App login route', () => {
  it('currentPage=login 时渲染登录页', () => {
    const html = renderToStaticMarkup(createElement(App));

    expect(html).toContain('登录账号');
    expect(html).toContain('发送登录链接');
  });
});
