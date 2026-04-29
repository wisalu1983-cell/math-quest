import { useState } from 'react';
import { useGameProgressStore, useUIStore } from '@/store';
import { getTopicDisplayName, getTopicMeta } from '@/constants';
import type { TopicId, WrongQuestion } from '@/types';
import BottomNav from '@/components/BottomNav';
import LoadingScreen from '@/components/LoadingScreen';
import { TopicIcon } from '@/components/TopicIcon';
import { getPracticeFailureDisplay } from '@/utils/practiceFailureDisplay';

const COLLAPSED_LIMIT = 5;

export default function WrongBook() {
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const { setPage } = useUIStore();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  if (!gameProgress) return <LoadingScreen />;

  const wrongQuestions = [...gameProgress.wrongQuestions].reverse();

  // Group by topic
  const grouped: Record<string, WrongQuestion[]> = {};
  for (const wq of wrongQuestions) {
    const topicId = wq.question.topicId;
    if (!grouped[topicId]) grouped[topicId] = [];
    grouped[topicId].push(wq);
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-bg pb-[88px] safe-top">
      <div className="sticky top-0 z-10 bg-card border-b-2 border-border-2 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage('home')}
            aria-label="返回首页"
            className="text-2xl text-text-2 hover:text-text transition-colors"
          >
            ←
          </button>
          <h1 className="text-[17px] font-black">错题本</h1>
          <span className="ml-auto text-sm font-bold text-text-2">{wrongQuestions.length} 题</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 stagger-1">
        {wrongQuestions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-text-2">还没有做错的题目，继续保持！</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([topicId, questions]) => {
              const legacyAwareTopicId = topicId as TopicId;
              const topic = getTopicMeta(legacyAwareTopicId);

              const isExpanded = expandedTopics.has(topicId);
              const hasMore = questions.length > COLLAPSED_LIMIT;
              const visible = hasMore && !isExpanded ? questions.slice(0, COLLAPSED_LIMIT) : questions;
              const hiddenCount = questions.length - COLLAPSED_LIMIT;

              return (
                <div key={topicId}>
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ color: topic.color, width: 22, height: 22 }}>
                      <TopicIcon topicId={topic.id} size={22} />
                    </div>
                    <span className="font-black text-sm">{getTopicDisplayName(legacyAwareTopicId)}</span>
                    <span className="text-xs font-bold text-text-2">({questions.length} 题)</span>
                  </div>

                  <div className="space-y-2">
                    {visible.map((wq, i) => (
                      <div key={i} className="bg-card rounded-2xl border-2 border-border-2 p-3"
                           style={{ boxShadow: '0 1px 5px rgba(0,0,0,.07)' }}>
                        <div className="text-sm font-bold mb-1.5">{wq.question.prompt}</div>
                        <div className="flex gap-4 text-xs font-bold">
                          <span className="text-danger">你的答案：{wq.wrongAnswer}</span>
                          <span className="text-success">正确：{String(wq.question.solution.answer)}</span>
                        </div>
                        {wq.failureReason && (
                          <div className="mt-2 rounded-xl border border-warning/40 bg-warning-lt px-3 py-2 text-xs font-black" style={{ color: '#7A5C00' }}>
                            {(() => {
                              const display = getPracticeFailureDisplay({
                                failureReason: wq.failureReason,
                                failureDetail: wq.failureDetail,
                              });
                              return (
                                <>
                                  <p>未通过原因：{display.message}</p>
                                  {display.processCategories.length > 0 && (
                                    <ul className="mt-1 space-y-1 text-text">
                                      {display.processCategories.map(category => (
                                        <li key={category.code} className="rounded-lg bg-card/70 px-2 py-1">
                                          {category.label}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {display.trainingFieldMistakes.length > 0 && (
                                    <ul className="mt-1 space-y-1 text-text">
                                      {display.trainingFieldMistakes.map(mistake => (
                                        <li key={mistake.code} className="rounded-lg bg-card/70 px-2 py-1">
                                          {mistake.text}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        {wq.question.solution.explanation && (
                          <div className="text-xs text-text-2 mt-1.5 leading-relaxed">
                            {wq.question.solution.explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    {hasMore && (
                      <button
                        onClick={() => toggleTopic(topicId)}
                        className="w-full py-2.5 text-[13px] font-bold text-primary bg-primary-lt
                                   rounded-xl transition-colors hover:bg-primary-mid"
                      >
                        {isExpanded ? '收起' : `显示全部 ${questions.length} 题（还有 ${hiddenCount} 题）`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav activeTab="wrong-book" />
    </div>
  );
}
