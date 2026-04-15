// src/App.tsx
import { useEffect } from 'react';
import { useUserStore, useUIStore, useGameProgressStore } from '@/store';
import { repository } from '@/repository/local';
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
import { getDocumentTitle } from '@/utils/ui-accessibility';

export default function App() {
  const { user, loadUser } = useUserStore();
  const { loadGameProgress } = useGameProgressStore();
  const currentPage = useUIStore(s => s.currentPage);
  const setPage = useUIStore(s => s.setPage);

  useEffect(() => {
    repository.init();
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      loadGameProgress(user.id);
      if (currentPage === 'onboarding') {
        setPage('home');
      }
    }
  }, [user, loadGameProgress, setPage, currentPage]);

  useEffect(() => {
    document.title = getDocumentTitle(currentPage);
  }, [currentPage]);

  const pages: Record<typeof currentPage, React.ReactNode> = {
    onboarding: <Onboarding />,
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
  };

  return <main id="main-content">{pages[currentPage]}</main>;
}
