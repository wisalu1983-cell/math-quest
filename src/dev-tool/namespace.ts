// src/dev-tool/namespace.ts
// F3 · namespace 切换（mq_ ↔ mq_dev_）+ stores 重载

import { useSyncExternalStore } from 'react';
import {
  setStorageNamespace,
  getStorageNamespace,
  repository,
  type StorageNamespace,
} from '@/repository/local';
import { useUserStore, useGameProgressStore, useSessionStore, useUIStore } from '@/store';
import { useRankMatchStore } from '@/store/rank-match';

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit(): void {
  for (const cb of listeners) cb();
}

function reloadAllStoresForCurrentNamespace(): void {
  // 清掉可能残留的内存态（来自上一个 namespace）
  useSessionStore.getState().abandonSession();
  useRankMatchStore.getState()._setActiveRankSession(null);

  repository.init();
  useUserStore.getState().loadUser();
  const user = useUserStore.getState().user;
  if (user) {
    useGameProgressStore.getState().loadGameProgress(user.id);
    try {
      useRankMatchStore.getState().loadActiveRankMatch(user.id);
    } catch {
      // 恢复异常不阻塞 namespace 切换；启动路径级别的兜底按 store 自身逻辑
    }
    useUIStore.getState().setPage('home');
  } else {
    // 沙盒空：退回 onboarding，由主 App 的 effect 引导用户创建账号
    useUserStore.setState({ user: null });
    useGameProgressStore.setState({ gameProgress: null });
    useUIStore.getState().setPage('onboarding');
  }
}

export function switchDevNamespace(ns: StorageNamespace): void {
  if (getStorageNamespace() === ns) return;
  setStorageNamespace(ns);
  reloadAllStoresForCurrentNamespace();
  emit();
}

export function useDevNamespace(): StorageNamespace {
  return useSyncExternalStore(subscribe, getStorageNamespace, () => 'main');
}

/**
 * 清空测试沙盒：仅在 namespace='dev' 下生效，等价于在沙盒里触发一次
 * "清存档"。之后 repository.init 会把沙盒重置成全新用户态。
 */
export function clearDevSandbox(): void {
  if (getStorageNamespace() !== 'dev') {
    throw new Error('clearDevSandbox: 只能在测试沙盒 namespace 下调用');
  }
  repository.clearAll();
  reloadAllStoresForCurrentNamespace();
  emit();
}

/** 注入项内部通用 helper：先改 localStorage，再重载 store。 */
export async function applyAndReload(mutate: () => void | Promise<void>): Promise<void> {
  await mutate();
  // 不走 reloadAllStoresForCurrentNamespace：那个会清 session / 路由。
  // 注入项只要数据路径下游 store 能读到新值即可。
  const user = useUserStore.getState().user;
  if (user) {
    useGameProgressStore.getState().loadGameProgress(user.id);
    try {
      useRankMatchStore.getState().loadActiveRankMatch(user.id);
    } catch {
      // 忽略：注入 BO 活跃态场景下 loadActiveRankMatch 可能因一致性异常清掉
    }
  }
}
