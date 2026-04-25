// src/pages/RankMatchResult.tsx
// BO 总结算页：晋级动画 / 未晋级复盘（薄弱题型前 3）/ 返回 Hub
// 路由：useUIStore.currentPage === 'rank-match-result'

import { useUIStore } from '@/store';
import { useRankMatchStore } from '@/store/rank-match';
import { repository } from '@/repository/local';
import { TIER_LABEL, TIER_ORDER } from '@/constants/rank-match';
import { getTopicDisplayName } from '@/constants';
import RankBadge from '@/components/RankBadge';
import type { TopicId } from '@/types';

function getWeakTopics(practiceSessionIds: string[], topN = 3): Array<{ topicId: TopicId; wrongCount: number }> {
  const allSessions = repository.getSessions();
  const sessionMap = new Map(allSessions.map(s => [s.id, s]));
  const wrongByTopic = new Map<TopicId, number>();

  for (const id of practiceSessionIds) {
    const s = sessionMap.get(id);
    if (!s) continue;
    for (const attempt of s.questions) {
      if (!attempt.correct) {
        const tid = attempt.question.topicId;
        wrongByTopic.set(tid, (wrongByTopic.get(tid) ?? 0) + 1);
      }
    }
  }

  return Array.from(wrongByTopic.entries())
    .map(([topicId, wrongCount]) => ({ topicId, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, topN);
}

export default function RankMatchResult() {
  const { setPage } = useUIStore();
  const rankSession = useRankMatchStore(s => s.activeRankSession);

  if (!rankSession) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
        <p className="text-text-2 text-[14px] font-bold mb-4">赛事数据不可用</p>
        <button onClick={() => setPage('rank-match-hub')} className="btn-flat rounded-2xl px-6 py-2">
          返回大厅
        </button>
      </div>
    );
  }

  const outcome = rankSession.outcome;

  if (!outcome) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
        <p className="text-text-2 text-[14px] font-bold mb-4">赛事尚未结束</p>
        <button onClick={() => setPage('rank-match-hub')} className="btn-flat rounded-2xl px-6 py-2">
          返回大厅
        </button>
      </div>
    );
  }

  const promoted = outcome === 'promoted';

  const wins = rankSession.games.filter(g => g.finished && g.won).length;
  const losses = rankSession.games.filter(g => g.finished && !g.won).length;

  // 薄弱题型：从最近 2 局的 practice session 统计错题（Spec §10.1 兜底策略）
  const recentIds = rankSession.games
    .filter(g => g.finished)
    .slice(-2)
    .map(g => g.practiceSessionId);
  const weakTopics = !promoted ? getWeakTopics(recentIds) : [];

  // 晋级后新段位
  const currentTierIdx = TIER_ORDER.indexOf(rankSession.targetTier);
  const prevTier = TIER_ORDER[currentTierIdx - 1] ?? 'apprentice';

  return (
    <div className="min-h-dvh bg-bg safe-top">
      <div className="max-w-sm mx-auto px-5 pt-8 pb-10 safe-bottom">

        {/* 结果横幅 */}
        <div
          className="w-full rounded-[24px] border-2 p-6 text-center mb-6"
          style={{
            background: promoted ? 'var(--color-success-lt)' : 'var(--color-danger-lt)',
            borderColor: promoted ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          <div className="text-5xl mb-3">{promoted ? '🏆' : '😤'}</div>
          <div className="text-[22px] font-black mb-1"
               style={{ color: promoted ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {promoted ? '晋级成功！' : '未能晋级'}
          </div>
          <div className="text-[14px] font-bold text-text-2">
            {TIER_LABEL[rankSession.targetTier]} BO{rankSession.bestOf}
          </div>

          {/* 提前结束标注（Spec §5.8 / §7.4） */}
          {rankSession.games.length < rankSession.bestOf && (
            <div className="mt-2 text-[12px] font-bold text-text-2">
              BO{rankSession.bestOf} 第 {rankSession.games.length} 局定胜负
            </div>
          )}
        </div>

        {/* 段位变化 */}
        {promoted && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <RankBadge tier={prevTier} size="md" showLabel dimmed />
            <span className="text-text-2 text-2xl">→</span>
            <RankBadge tier={rankSession.targetTier} size="lg" showLabel />
          </div>
        )}
        {!promoted && (
          <div className="flex justify-center mb-6">
            <RankBadge tier={rankSession.targetTier} size="lg" showLabel dimmed />
          </div>
        )}

        {/* 胜负矩阵 */}
        <div className="bg-card rounded-[18px] border-2 border-border-2 p-4 mb-4">
          <div className="text-[13px] font-black text-text mb-3">对局记录</div>
          <div className="flex gap-2 mb-3">
            {rankSession.games.map(g => (
              <span key={g.gameIndex}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{
                      background: g.won ? 'var(--color-success-lt)' : 'var(--color-danger-lt)',
                      border: '2px solid',
                      borderColor: g.won ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                {g.won ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="text-[24px] font-black text-text">
            {wins} <span className="text-text-2 text-[16px]">胜</span>
            {' '}
            {losses} <span className="text-text-2 text-[16px]">负</span>
          </div>
        </div>

        {/* 薄弱题型复盘（仅失败时显示） */}
        {!promoted && weakTopics.length > 0 && (
          <div className="bg-card rounded-[18px] border-2 border-border-2 p-4 mb-6">
            <div className="text-[13px] font-black text-text mb-2">薄弱题型复盘</div>
            <div className="space-y-1.5">
              {weakTopics.map(({ topicId, wrongCount }) => {
                const topicName = getTopicDisplayName(topicId);
                return (
                  <div key={topicId} className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-text">{topicName}</span>
                    <span className="text-[12px] font-bold text-danger">{wrongCount} 题错误</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-text-2 mt-2">
              建议先在进阶训练中加强以上题型
            </p>
          </div>
        )}

        <button
          onClick={() => setPage('rank-match-hub')}
          className="w-full btn-flat rounded-2xl text-center"
        >
          返回大厅
        </button>
      </div>
    </div>
  );
}
