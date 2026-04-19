// src/store/index.rank-match-pages.test.ts
// M3 红测试：验证 UIStore 新增的三条段位赛路由类型可通过 setPage 正常跳转

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './index';

describe('UIStore 段位赛路由页类型', () => {
  beforeEach(() => {
    useUIStore.setState({ currentPage: 'home' });
  });

  it('能跳转到 rank-match-hub', () => {
    useUIStore.getState().setPage('rank-match-hub');
    expect(useUIStore.getState().currentPage).toBe('rank-match-hub');
  });

  it('能跳转到 rank-match-game-result', () => {
    useUIStore.getState().setPage('rank-match-game-result');
    expect(useUIStore.getState().currentPage).toBe('rank-match-game-result');
  });

  it('能跳转到 rank-match-result', () => {
    useUIStore.getState().setPage('rank-match-result');
    expect(useUIStore.getState().currentPage).toBe('rank-match-result');
  });

  it('可以从 rank-match-hub 跳回 home', () => {
    useUIStore.getState().setPage('rank-match-hub');
    useUIStore.getState().setPage('home');
    expect(useUIStore.getState().currentPage).toBe('home');
  });
});
