import { useState } from 'react';
import { useUserStore, useGameProgressStore, useUIStore } from '@/store';
import { nanoid } from 'nanoid';
import type { User } from '@/types';

export default function Onboarding() {
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState<5 | 6>(5);
  const [step, setStep] = useState(0);
  const setUser = useUserStore(s => s.setUser);
  const loadGameProgress = useGameProgressStore(s => s.loadGameProgress);
  const setPage = useUIStore(s => s.setPage);

  const handleStart = () => {
    if (!nickname.trim()) return;
    const user: User = {
      id: nanoid(10),
      nickname: nickname.trim(),
      avatarSeed: nanoid(6),
      createdAt: Date.now(),
      grade,
      settings: {
        soundEnabled: true,
        hapticsEnabled: true,
      },
    };
    setUser(user);
    loadGameProgress(user.id);
    setPage('home');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-bg">
      {step === 0 && (
        <div className="flex flex-col items-center gap-8 max-w-sm w-full animate-fade-in">
          <div className="text-6xl">🧮</div>
          <h1 className="text-3xl font-bold text-text">数学大冒险</h1>
          <p className="text-text-secondary text-center">
            每天练一练，计算能力天天进步！
          </p>
          <button className="btn-primary w-full text-lg" onClick={() => setStep(1)}>
            开始冒险
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col items-center gap-6 max-w-sm w-full animate-fade-in">
          <div className="text-5xl">👋</div>
          <h2 className="text-2xl font-bold">你叫什么名字？</h2>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="输入你的昵称"
            maxLength={12}
            className="w-full bg-bg-elevated border-2 border-border rounded-2xl px-4 py-3 text-lg text-text
                       focus:border-primary outline-none transition-colors text-center"
            autoFocus
          />
          <button
            className="btn-primary w-full text-lg disabled:opacity-40"
            disabled={!nickname.trim()}
            onClick={() => setStep(2)}
          >
            下一步
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center gap-6 max-w-sm w-full animate-fade-in">
          <div className="text-5xl">📚</div>
          <h2 className="text-2xl font-bold">你几年级了？</h2>
          <div className="flex gap-4 w-full">
            {([5, 6] as const).map(g => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`flex-1 py-4 rounded-2xl text-xl font-bold border-2 transition-all
                  ${grade === g
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-bg-elevated text-text-secondary'
                  }`}
              >
                {g}年级
              </button>
            ))}
          </div>
          <button className="btn-primary w-full text-lg" onClick={handleStart}>
            开始学习！
          </button>
        </div>
      )}
    </div>
  );
}
