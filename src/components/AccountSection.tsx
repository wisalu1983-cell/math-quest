import { Mail } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { MAX_RETRY, useSyncEngine } from '@/sync/engine';
import { getProfileSyncText } from '@/sync/status-labels';

interface AccountSectionProps {
  onLogin: () => void;
  onLogoutConfirm: () => void;
}

export default function AccountSection({ onLogin, onLogoutConfirm }: AccountSectionProps) {
  const supabaseUser = useAuthStore(s => s.supabaseUser);
  const isLoading = useAuthStore(s => s.isLoading);
  const status = useSyncEngine(s => s.status);
  const retryCount = useSyncEngine(s => s.retryCount);
  const syncState = useSyncEngine(s => s.syncState);

  if (!isSupabaseConfigured()) {
    return (
      <section className="card">
        <h3 className="text-sm font-bold mb-2">账号</h3>
        <p className="text-xs text-text-2">当前版本未接入账号系统。</p>
      </section>
    );
  }

  if (!supabaseUser) {
    return (
      <section className="card space-y-3">
        <h3 className="text-sm font-bold">账号</h3>
        <p className="text-xs text-text-2">登录以在多设备间同步进度和段位赛记录。</p>
        <button type="button" className="btn-primary w-full" onClick={onLogin} disabled={isLoading}>
          登录账号
        </button>
      </section>
    );
  }

  const statusText = getProfileSyncText(status, retryCount, syncState);
  const email = supabaseUser.email ?? supabaseUser.id;
  const retryExhausted = status === 'error' && retryCount >= MAX_RETRY;

  return (
    <section className="card space-y-3">
      <h3 className="text-sm font-bold">账号</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{email}</div>
          <div className="text-xs text-text-2">{statusText}</div>
        </div>
      </div>

      {retryExhausted ? (
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => void useSyncEngine.getState().fullSync()}
        >
          手动重试
        </button>
      ) : null}

      <button type="button" className="btn-secondary w-full" onClick={onLogoutConfirm}>
        登出
      </button>
    </section>
  );
}
