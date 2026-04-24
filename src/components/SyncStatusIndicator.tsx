import { useEffect, useRef } from 'react';
import { AlertTriangle, Check, Clock3, RefreshCw, XCircle, Zap } from 'lucide-react';
import { useUIStore } from '@/store';
import { useAuthStore } from '@/store/auth';
import { MAX_RETRY, useSyncEngine } from '@/sync/engine';
import { getHomeSyncAriaLabel } from '@/sync/status-labels';

export default function SyncStatusIndicator() {
  const supabaseUser = useAuthStore(s => s.supabaseUser);
  const status = useSyncEngine(s => s.status);
  const retryCount = useSyncEngine(s => s.retryCount);
  const syncState = useSyncEngine(s => s.syncState);
  const setPage = useUIStore(s => s.setPage);
  const hasPlayedOfflineHint = useRef(false);

  const ariaLabel = getHomeSyncAriaLabel(status, retryCount, syncState);
  const shouldAnimateOffline = status === 'offline' && !hasPlayedOfflineHint.current;

  useEffect(() => {
    if (status === 'offline') {
      hasPlayedOfflineHint.current = true;
    }
  }, [status]);

  if (!supabaseUser || !ariaLabel) return null;

  const baseIconClass = 'h-5 w-5';
  const icon = (() => {
    if (status === 'armed') return <Clock3 className={baseIconClass} aria-hidden="true" />;
    if (status === 'syncing') return <RefreshCw className={`${baseIconClass} animate-spin`} aria-hidden="true" />;
    if (status === 'synced') return <Check className={baseIconClass} aria-hidden="true" />;
    if (status === 'offline') return <Zap className={baseIconClass} aria-hidden="true" />;
    if (status === 'error' && retryCount >= MAX_RETRY) return <XCircle className={baseIconClass} aria-hidden="true" />;
    return <AlertTriangle className={baseIconClass} aria-hidden="true" />;
  })();

  const colorClass = (() => {
    if (status === 'synced') return 'text-success bg-success/10';
    if (status === 'offline') return 'text-text-2 bg-border/40';
    if (status === 'error' && retryCount >= MAX_RETRY) return 'text-danger bg-danger/10';
    if (status === 'error') return 'text-warning bg-warning/10';
    return 'text-primary bg-primary/10';
  })();

  return (
    <button
      type="button"
      onClick={() => setPage('profile')}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${colorClass} ${
        shouldAnimateOffline ? 'animate-fade-in' : ''
      }`}
    >
      {icon}
    </button>
  );
}
