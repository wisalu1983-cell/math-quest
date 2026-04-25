// src/pages/Home.tsx
import { useUserStore, useUIStore, useGameProgressStore } from '@/store';
import { useRankMatchStore } from '@/store/rank-match';
import { TOPICS, getTopicDisplayName } from '@/constants';
import { CAMPAIGN_MAPS } from '@/constants/campaign';
import { getStars } from '@/engine/advance';
import { TOPIC_STAR_CAP } from '@/constants/advance';
import { isTierUnlocked, getTierGaps } from '@/engine/rank-match/entry-gate';
import { RANK_BEST_OF } from '@/constants/rank-match';
import type { TopicId } from '@/types';
import type { RankTier } from '@/types/gamification';
import BottomNav from '@/components/BottomNav';
import LoadingScreen from '@/components/LoadingScreen';
import ProgressBar from '@/components/ProgressBar';
import RankBadge from '@/components/RankBadge';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import { TopicIcon } from '@/components/TopicIcon';
import { useAuthStore } from '@/store/auth';

function getGreeting(name: string): string {
  const h = new Date().getHours();
  const greeting = h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好';
  return `${greeting}，${name}！`;
}

function computeTopicStats(topicId: TopicId, gameProgress: ReturnType<typeof useGameProgressStore.getState>['gameProgress']) {
  const map = CAMPAIGN_MAPS[topicId];
  let totalLevels = 0;
  if (map) {
    for (const stage of map.stages) {
      for (const lane of stage.lanes) {
        totalLevels += lane.levels.length;
      }
    }
  }
  const prog = gameProgress?.campaignProgress[topicId];
  const completedLevels = prog?.completedLevels.length ?? 0;
  const allDone = prog?.campaignCompleted ?? false;
  return { totalLevels, completedLevels, allDone };
}

const TIER_LABEL: Record<RankTier, string> = {
  apprentice: '学徒',
  rookie: '新秀',
  pro: '高手',
  expert: '专家',
  master: '大师',
};

export default function Home() {
  const user = useUserStore(s => s.user);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const { setPage, setSelectedTopicId } = useUIStore();
  const activeRankSession = useRankMatchStore(s => s.activeRankSession);
  const supabaseUser = useAuthStore(s => s.supabaseUser);

  if (!user || !gameProgress) return <LoadingScreen />;

  const rankProgress = gameProgress.rankProgress;
  const currentTier = rankProgress?.currentTier ?? 'apprentice';
  const advanceProgress = gameProgress.advanceProgress;

  // 下一个可挑战段位（当前段位的下一级）
  const TIER_ORDER: RankTier[] = ['apprentice', 'rookie', 'pro', 'expert', 'master'];
  const currentIdx = TIER_ORDER.indexOf(currentTier);
  const nextTier = TIER_ORDER[currentIdx + 1] as RankTier | undefined;
  const nextChallengeableTier = nextTier && nextTier !== 'apprentice' ? nextTier : undefined;

  // 是否能入场挑战下一级
  const canChallenge = nextChallengeableTier ? isTierUnlocked(nextChallengeableTier, advanceProgress) : false;
  const challengeGaps = nextChallengeableTier && !canChallenge
    ? getTierGaps(nextChallengeableTier, advanceProgress).slice(0, 3)
    : [];

  // 活跃赛事的继续挑战文案
  const activeSession = activeRankSession && !activeRankSession.outcome ? activeRankSession : null;
  let rankCardTitle = '段位赛';
  let rankCardSub = '';
  if (activeSession) {
    rankCardTitle = `继续挑战：${TIER_LABEL[activeSession.targetTier]} BO${activeSession.bestOf}`;
    if (activeSession.status === 'suspended') {
      rankCardSub = '你有一场中断中的挑战，进入大厅后可继续或重新开始';
    } else {
      const w = activeSession.games.filter(g => g.finished && g.won).length;
      const l = activeSession.games.filter(g => g.finished && !g.won).length;
      rankCardSub = `当前 ${w}胜${l}负，需${activeSession.winsToAdvance}胜晋级`;
    }
  } else if (nextChallengeableTier && canChallenge) {
    rankCardTitle = `挑战 ${TIER_LABEL[nextChallengeableTier]}`;
    rankCardSub = `BO${RANK_BEST_OF[nextChallengeableTier]} 对决`;
  } else if (nextChallengeableTier && !canChallenge) {
    rankCardTitle = `冲击 ${TIER_LABEL[nextChallengeableTier]}`;
    rankCardSub = challengeGaps.length > 0
      ? `差 ${challengeGaps.map(g => `${getTopicDisplayName(g.topicId)} ${g.currentStars}★/${g.requiredStars}★`).slice(0, 2).join('，')}`
      : '继续进阶训练积累星级';
  } else {
    rankCardSub = `当前段位：${TIER_LABEL[currentTier]}`;
  }

  const handleTopicClick = (topicId: TopicId) => {
    setSelectedTopicId(topicId);
    setPage('campaign-map');
  };

  // 找推荐主题：最近有进度且未完成的主题，否则用第一个
  const heroTopic =
    TOPICS.find(t => {
      const prog = gameProgress.campaignProgress[t.id];
      return prog && prog.completedLevels.length > 0 && !prog.campaignCompleted;
    }) ?? TOPICS[0];
  const { totalLevels: heroTotal, completedLevels: heroDone } = computeTopicStats(heroTopic.id as TopicId, gameProgress);

  return (
    <div className="min-h-dvh bg-bg pb-[88px] safe-top">

      {/* ── Logo 栏 ── */}
      <div className="sticky top-0 z-10 bg-card border-b-2 border-border-2 px-5 py-3.5 flex items-center justify-between">
        <span className="text-[15px] font-black text-primary">数学大冒险</span>
        {supabaseUser ? (
          <SyncStatusIndicator />
        ) : (
          <button
            type="button"
            onClick={() => setPage('profile')}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center
                       text-[15px] font-black text-white select-none"
            style={{ boxShadow: '0 2px 8px rgba(255,107,53,.4)' }}
            aria-label={`用户：${user.nickname}`}
          >
            {user.nickname[0]}
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto px-5">

        {/* ── 问候 ── */}
        <div className="pt-5 pb-4 stagger-1">
          <h1 className="text-[24px] font-black text-text leading-snug">
            {getGreeting(user.nickname)}
          </h1>
          <p className="text-[13px] font-bold text-text-2 mt-1">今天继续挑战吧 💪</p>
        </div>

        {/* ── Hero 卡：推荐主题 ── */}
        <button
          onClick={() => handleTopicClick(heroTopic.id as TopicId)}
          className="w-full text-left bg-card rounded-[20px] border-2 border-border-2
                     border-l-[5px] mb-5 p-4 pl-[18px] transition-all active:scale-[.99] stagger-2"
          style={{
            borderLeftColor: 'var(--color-primary)',
            boxShadow: '0 2px 10px rgba(0,0,0,.09)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 border-2"
              style={{
                width: 52, height: 52,
                color: heroTopic.color,
                background: heroTopic.color + '18',
                borderColor: heroTopic.color + '40',
              }}
            >
              <TopicIcon topicId={heroTopic.id} size={30} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--color-primary)' }}
                  aria-hidden="true"
                />
                <span className="text-[12px] font-extrabold text-primary tracking-widest uppercase">
                  继续学习
                </span>
              </div>
              <div className="text-[17px] font-black text-text">{heroTopic.name}</div>
              <div className="text-[12px] font-semibold text-text-2 mt-0.5">
                {heroDone}/{heroTotal} 关完成
              </div>
            </div>
          </div>
          <ProgressBar
            value={heroDone}
            max={heroTotal}
            height={7}
            label={`${heroTopic.name} 进度 ${heroDone}/${heroTotal}`}
            className="mb-3.5"
          />
          <div className="btn-flat text-center rounded-2xl">继续闯关 ▶</div>
        </button>

        {/* ── 主题网格 ── */}
        <div className="flex items-center justify-between mb-3 stagger-3">
          <span className="text-[15px] font-black text-text">所有主题</span>
          <span className="text-[12px] font-bold text-text-2">{TOPICS.length} 个领域</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4 stagger-4">
          {TOPICS.map((topic) => {
            const { totalLevels, completedLevels, allDone } = computeTopicStats(topic.id as TopicId, gameProgress);
            const pct = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
            const advProg = gameProgress.advanceProgress[topic.id as TopicId];
            const isAdvUnlocked = !!advProg;
            const advStars = isAdvUnlocked
              ? getStars(advProg!.heartsAccumulated, TOPIC_STAR_CAP[topic.id as TopicId])
              : 0;
            const advCap = TOPIC_STAR_CAP[topic.id as TopicId];

            return (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id as TopicId)}
                className="relative text-left bg-card rounded-[18px] border-2 border-border-2
                           overflow-hidden transition-all active:scale-[.98]"
                style={{ padding: '16px 14px 14px', boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}
              >
                {/* 右上角装饰圆 */}
                <span
                  className="absolute -top-4 -right-4 rounded-full pointer-events-none"
                  style={{ width: 52, height: 52, background: topic.color, opacity: 0.1 }}
                  aria-hidden="true"
                />

                {/* 图标行 */}
                <div className="flex items-start justify-between mb-2.5">
                  <div style={{ color: topic.color, width: 42, height: 42 }}>
                    <TopicIcon topicId={topic.id} size={42} />
                  </div>
                  {pct > 0 && (
                    <span
                      className="text-[12px] font-black px-2 py-0.5 rounded-full"
                      style={{ color: topic.color, background: topic.color + '18' }}
                    >
                      {pct}%
                    </span>
                  )}
                </div>

                {/* 主题名 */}
                <div className="text-[15px] font-black text-text mb-2.5">{topic.name}</div>

                {/* 进度条 */}
                <ProgressBar
                  value={completedLevels}
                  max={totalLevels}
                  height={7}
                  color={allDone ? 'var(--color-success)' : topic.color}
                  label={`${topic.name} ${completedLevels}/${totalLevels} 关`}
                />

                {/* 闯关进度 / 进阶星级 */}
                <div className="text-[12px] font-extrabold mt-1.5 flex items-center gap-1.5"
                     style={{ color: pct > 0 ? topic.color : 'var(--color-text-3)' }}>
                  {allDone ? '✓ 全部完成' : `${completedLevels}/${totalLevels} 关`}
                  {isAdvUnlocked ? (
                    <span className="text-warning text-[12px]">
                      {'★'.repeat(advStars)}{'☆'.repeat(advCap - advStars)}
                    </span>
                  ) : allDone ? null : (
                    <span className="text-text-3 text-[11px] opacity-60">
                      {'☆'.repeat(advCap)} 通关解锁
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── 进阶训练入口（始终显示，未解锁时呈锁定态）── */}
        <div className="pb-3 stagger-4">
          {TOPICS.some(t => !!gameProgress.advanceProgress[t.id as TopicId]) ? (
            <button
              onClick={() => setPage('advance-select')}
              className="w-full bg-card rounded-[18px] border-2 border-warning/40 p-4 text-left
                         transition-all active:scale-[.99] flex items-center gap-4"
              style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-warning/15 flex items-center justify-center text-2xl shrink-0">
                ⭐
              </div>
              <div className="flex-1">
                <p className="font-black text-text text-[15px]">进阶训练</p>
                <p className="text-[12px] text-text-2 mt-0.5">刷星升级，积累段位赛入场资格</p>
              </div>
              <span className="text-text-2 text-lg">›</span>
            </button>
          ) : (
            <div
              className="w-full bg-card rounded-[18px] border-2 border-border-2 p-4
                         flex items-center gap-4 opacity-70"
              style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-border-2/50 flex items-center justify-center text-2xl shrink-0">
                🔒
              </div>
              <div className="flex-1">
                <p className="font-black text-text-3 text-[15px]">进阶训练</p>
                <p className="text-[12px] text-text-3 mt-0.5">通关任意主题解锁进阶星级挑战</p>
              </div>
            </div>
          )}
        </div>

        {/* ── 段位赛入口（独立卡片，Phase 3 M3）── */}
        <div className="pb-4 stagger-4">
          <button
            onClick={() => setPage('rank-match-hub')}
            className="w-full bg-card rounded-[18px] border-2 p-4 text-left
                       transition-all active:scale-[.99] flex items-center gap-4"
            style={{
              borderColor: `var(--rank-${currentTier})`,
              boxShadow: '0 1px 5px rgba(0,0,0,.07)',
            }}
          >
            <RankBadge tier={currentTier} size="md" />
            <div className="flex-1">
              <p className="font-black text-text text-[15px]">{rankCardTitle}</p>
              <p className="text-[12px] text-text-2 mt-0.5">{rankCardSub}</p>
            </div>
            <span className="text-text-2 text-lg">›</span>
          </button>
        </div>
      </div>

      <BottomNav activeTab="home" />
    </div>
  );
}
