import { useUserStore, useGameProgressStore, useUIStore } from '@/store';
import { TOPICS } from '@/constants';
import BottomNav from '@/components/BottomNav';
import LoadingScreen from '@/components/LoadingScreen';
import { TopicIcon } from '@/components/TopicIcon';

export default function Profile() {
  const user = useUserStore(s => s.user);
  const gameProgress = useGameProgressStore(s => s.gameProgress);
  const { setPage, soundEnabled, toggleSound } = useUIStore();

  if (!user) return <LoadingScreen />;

  // 统计数据
  const totalQuestions = gameProgress?.totalQuestionsAttempted ?? 0;
  const totalCorrect = gameProgress?.totalQuestionsCorrect ?? 0;
  const accuracy = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;

  // 闯关进度
  const campaignProgress = gameProgress?.campaignProgress ?? {};
  const completedTopics = Object.values(campaignProgress).filter(t => t?.campaignCompleted).length;
  const totalTopics = TOPICS.length;

  // 错题数
  const wrongCount = gameProgress?.wrongQuestions.length ?? 0;

  return (
    <div className="min-h-dvh bg-bg pb-[88px] safe-top">
      <div className="sticky top-0 z-10 bg-card border-b-2 border-border-2 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage('home')}
            aria-label="返回首页"
            className="text-2xl text-text-2 hover:text-text transition-colors"
          >←</button>
          <h1 className="text-[17px] font-black">个人中心</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6 stagger-1">
        {/* Profile card */}
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
            {user.nickname[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.nickname}</h2>
            <p className="text-sm text-text-2 mt-1">数学大冒险</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-primary">{totalQuestions}</div>
            <div className="text-[12px] text-text-2">总题数</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-success">{accuracy}%</div>
            <div className="text-[12px] text-text-2">准确率</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-warning">{completedTopics}/{totalTopics}</div>
            <div className="text-[12px] text-text-2">关卡通关</div>
          </div>
        </div>

        {/* Topic progress */}
        <div className="card">
          <h3 className="text-sm font-bold mb-3">各题型进度</h3>
          <div className="space-y-2">
            {TOPICS.map(topic => {
              const tp = campaignProgress[topic.id];
              const done = tp?.campaignCompleted ?? false;
              const count = tp?.completedLevels.length ?? 0;
              return (
                <div key={topic.id} className="flex items-center gap-3">
                  <div style={{ color: topic.color, width: 22, height: 22, flexShrink: 0 }}>
                    <TopicIcon topicId={topic.id} size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{topic.name}</div>
                    <div className="text-xs text-text-2">已通关 {count} 关</div>
                  </div>
                  {done && <span className="text-xs text-success font-bold">✓ 全通</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <h3 className="text-sm font-bold mb-3">设置</h3>
          <div className="space-y-4">
            {/* Sound toggle */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm">音效</div>
                <div className="text-xs text-text-2">练习时的音效反馈</div>
              </div>
              <button
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full transition-all ${soundEnabled ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-all mx-0.5 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Wrong book shortcut */}
            {wrongCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm">错题本</span>
                <button
                  onClick={() => setPage('wrong-book')}
                  className="text-sm text-primary font-bold"
                >
                  {wrongCount} 题 →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <BottomNav activeTab="profile" />
    </div>
  );
}
