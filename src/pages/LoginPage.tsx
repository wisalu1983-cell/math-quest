import { useState } from 'react';
import { useUIStore } from '@/store';
import { useAuthStore } from '@/store/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const { signInWithMagicLink, magicLinkSent, authError, isLoading, clearError } = useAuthStore();
  const setPage = useUIStore(s => s.setPage);

  const trimmedEmail = email.trim();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedEmail) {
      return;
    }

    await signInWithMagicLink(trimmedEmail);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-6 py-10">
      <div className="card w-full max-w-sm space-y-5 animate-fade-in">
        <div className="space-y-2 text-center">
          <div className="text-5xl">📧</div>
          <h1 className="text-2xl font-black text-text">登录账号</h1>
          <p className="text-sm text-text-2">输入邮箱，我们会发送一个登录链接</p>
        </div>

        {magicLinkSent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm font-bold text-success">登录链接已发送</p>
            <p className="text-sm text-text-2">
              请查看 <span className="font-bold text-text">{trimmedEmail}</span> 的收件箱，点击邮件中的链接完成登录。
            </p>
            <button
              type="button"
              onClick={() => setPage('onboarding')}
              className="btn-secondary w-full"
            >
              返回
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={event => {
                setEmail(event.target.value);
                clearError();
              }}
              placeholder="你的邮箱地址"
              autoComplete="email"
              autoFocus
              required
              className="w-full rounded-2xl border-2 border-border bg-card-2 px-4 py-3 text-base text-text outline-none transition-colors focus:border-primary"
            />

            {authError ? (
              <p className="text-sm font-medium text-danger">{authError}</p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading || !trimmedEmail}
              className="btn-primary w-full disabled:opacity-40"
            >
              {isLoading ? '发送中...' : '发送登录链接'}
            </button>

            <button
              type="button"
              onClick={() => setPage('onboarding')}
              className="btn-secondary w-full"
            >
              返回
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
