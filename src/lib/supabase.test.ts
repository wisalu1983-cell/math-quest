import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadSupabaseModule() {
  return import('./supabase');
}

describe('supabase client config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('未配置环境变量时返回未配置状态，且不创建客户端', async () => {
    const { getSupabaseClient, isSupabaseConfigured } = await loadSupabaseModule();

    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseClient()).toBeNull();
  });

  it('配置完整环境变量时返回稳定单例客户端', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'demo-anon-key');

    const { getSupabaseClient, isSupabaseConfigured } = await loadSupabaseModule();

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseClient()).not.toBeNull();
    expect(getSupabaseClient()).toBe(getSupabaseClient());
  });
});
