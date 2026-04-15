// src/components/BottomNav.tsx
import { useUIStore } from '@/store';
import { NavIcon, type NavIconKey } from '@/components/TopicIcon';

export type NavTab = 'home' | 'progress' | 'wrong-book' | 'profile';

const NAV_ITEMS: { tab: NavTab; iconKey: NavIconKey; label: string }[] = [
  { tab: 'home',       iconKey: 'home',      label: '学习' },
  { tab: 'progress',   iconKey: 'progress',  label: '进度' },
  { tab: 'wrong-book', iconKey: 'wrongbook', label: '错题' },
  { tab: 'profile',    iconKey: 'profile',   label: '我的' },
];

interface BottomNavProps {
  /** 当前高亮的 tab。History 页传 'progress'。*/
  activeTab: NavTab;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const setPage = useUIStore(s => s.setPage);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border-2 safe-bottom"
      aria-label="底部导航"
    >
      <div className="max-w-lg mx-auto flex" style={{ height: 68 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.tab === activeTab;
          return (
            <button
              key={item.tab}
              onClick={() => setPage(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5
                          text-[11px] font-extrabold transition-colors
                          ${isActive ? 'text-primary' : 'text-text-3 hover:text-text-2'}`}
            >
              {isActive && (
                <span
                  className="absolute top-2 rounded-xl bg-primary-lt"
                  style={{ width: 38, height: 34 }}
                  aria-hidden="true"
                />
              )}
              <span className="relative">
                <NavIcon name={item.iconKey} size={24} />
              </span>
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
