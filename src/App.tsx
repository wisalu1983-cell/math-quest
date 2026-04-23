// src/App.tsx
import { useEffect } from 'react';
import { useUserStore, useUIStore, useGameProgressStore, useSessionStore } from '@/store';
import { useRankMatchStore } from '@/store/rank-match';
import { RankMatchRecoveryError } from '@/store/rank-match';
import { repository } from '@/repository/local';
import { getCurrentGameIndex } from '@/engine/rank-match/match-state';
import { decideRankMatchRecovery } from '@/engine/rank-match/recovery-policy';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import CampaignMap from '@/pages/CampaignMap';
import AdvanceSelect from '@/pages/AdvanceSelect';
import Practice from '@/pages/Practice';
import SessionSummary from '@/pages/SessionSummary';
import Progress from '@/pages/Progress';
import WrongBook from '@/pages/WrongBook';
import Profile from '@/pages/Profile';
import History from '@/pages/History';
import SessionDetail from '@/pages/SessionDetail';
import RankMatchHub from '@/pages/RankMatchHub';
import RankMatchGameResult from '@/pages/RankMatchGameResult';
import RankMatchResult from '@/pages/RankMatchResult';
import { LoginPage } from '@/pages/LoginPage';
import { useAuthStore } from '@/store/auth';
import { getDocumentTitle } from '@/utils/ui-accessibility';

export default function App() {
  const { user, loadUser } = useUserStore();
  const { loadGameProgress } = useGameProgressStore();
  const currentPage = useUIStore(s => s.currentPage);
  const setPage = useUIStore(s => s.setPage);

  useEffect(() => {
    repository.init();
    loadUser();
    void useAuthStore.getState().initialize();
  }, [loadUser]);

  useEffect(() => {
    if (!user) return;
    if (currentPage === 'onboarding') {
      setPage('home');
    }
  }, [user, currentPage, setPage]);

  useEffect(() => {
    if (!user) return;

    loadGameProgress(user.id);
    // M3-C: 用户加载完成后恢复活跃 BO 赛事（Spec §5.8：安静收尾，不中断加载）
    try {
      const restored = useRankMatchStore.getState().loadActiveRankMatch(user.id);
      if (!restored) return;

      const currentGameIndex = getCurrentGameIndex(restored);
      const decision = decideRankMatchRecovery({
        status: restored.status,
        hasUnfinishedGame: currentGameIndex !== undefined,
      });

      if (decision === 'auto-resume-practice' && currentGameIndex !== undefined) {
        const currentGame = restored.games.find(g => g.gameIndex === currentGameIndex);
        if (currentGame) {
          useSessionStore.getState().resumeRankMatchGame(currentGame.practiceSessionId);
          setPage('practice');
        }
      }
    } catch (e) {
      if (e instanceof RankMatchRecoveryError) {
        console.warn('[RankMatch] 启动恢复失败，已清 activeSessionId', e.message);
        setPage('rank-match-hub');
      }
    }
  }, [user, loadGameProgress, setPage]);

  useEffect(() => {
    document.title = getDocumentTitle(currentPage);
  }, [currentPage]);

  const pages: Record<typeof currentPage, React.ReactNode> = {
    onboarding: <Onboarding />,
    login: <LoginPage />,
    home: <Home />,
    'campaign-map': <CampaignMap />,
    'advance-select': <AdvanceSelect />,
    practice: <Practice />,
    summary: <SessionSummary />,
    progress: <Progress />,
    'wrong-book': <WrongBook />,
    history: <History />,
    'session-detail': <SessionDetail />,
    profile: <Profile />,
    'rank-match-hub': <RankMatchHub />,
    'rank-match-game-result': <RankMatchGameResult />,
    'rank-match-result': <RankMatchResult />,
  };

  return <main id="main-content">{pages[currentPage]}</main>;
}
