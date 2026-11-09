import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';

const FeedIcon: React.FC<{ active?: boolean }> = () => (
  <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2-.9-2-2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
  </svg>
);

const TennisIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    width="23"
    height="23"
    fill="currentColor"
    className="transition-colors"
  >
    {active ? (
      <path d="M19.43 3.62c-2.34-2.34-6.14-2.34-8.49 0l-.88.88 4.24 4.24.88-.88c1.17-1.17 3.07-1.17 4.24 0 1.18 1.17 1.18 3.07.01 4.24l-3.54 3.54 1.41 1.41 3.54-3.54c2.34-2.34 2.34-6.14-.01-8.49zM5.28 17.77l-1.41-1.41 4.24-4.24 1.41 1.41-4.24 4.24zm8.49-8.49l-1.41-1.41 1.41-1.41 1.41 1.41-1.41 1.41zM2.81 20.24l.94.95 2.12-2.12-1.41-1.41-1.65 2.58zm10.37-7.55l-4.24-4.24 1.41-1.41 4.24 4.24-1.41 1.41z" />
    ) : (
      <path d="M19.43 3.62c-2.34-2.34-6.14-2.34-8.49 0l-.88.88 4.24 4.24.88-.88c1.17-1.17 3.07-1.17 4.24 0 1.18 1.17 1.18 3.07.01 4.24l-3.54 3.54 1.41 1.41 3.54-3.54c2.34-2.34 2.34-6.14-.01-8.49zM5.28 17.77l-1.41-1.41 4.24-4.24 1.41 1.41-4.24 4.24zm8.49-8.49l-1.41-1.41 1.41-1.41 1.41 1.41-1.41 1.41zM2.81 20.24l.94.95 2.12-2.12-1.41-1.41-1.65 2.58zm10.37-7.55l-4.24-4.24 1.41-1.41 4.24 4.24-1.41 1.41z" fillOpacity="0.85" />
    )}
  </svg>
);

const LeaderboardIcon: React.FC<{ active?: boolean }> = () => (
  <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
    <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z" />
  </svg>
);

const PersonIcon: React.FC<{ active?: boolean }> = () => (
  <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export const BottomNav: React.FC = () => {
  const leftTabs = [
    { to: '/rooms', label: 'Tìm kèo', icon: TennisIcon },
    { to: '/feed', label: 'Bản tin', icon: FeedIcon },
  ];

  const rightTabs = [
    { to: '/rankings', label: 'Xếp hạng', icon: LeaderboardIcon },
    { to: '/profile', label: 'Hồ sơ', icon: PersonIcon },
  ];

  const renderNavTab = (tab: { to: string; label: string; icon: React.FC<{ active?: boolean }> }) => {
    const Icon = tab.icon;
    return (
      <NavLink
        key={tab.to}
        to={tab.to}
        end={false}
        className={({ isActive }) =>
          `flex-1 h-full flex flex-col items-center justify-center py-1 transition-all select-none ${
            isActive ? 'text-app-primary' : 'text-app-muted hover:text-app-text'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={`w-14 sm:w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-app-mint text-app-primary shadow-xs'
                  : 'bg-transparent text-app-muted'
              }`}
            >
              <Icon active={isActive} />
            </div>
            <span
              className={`text-[11px] sm:text-xs leading-tight mt-1 transition-all ${
                isActive ? 'font-bold text-app-primary' : 'font-medium text-app-muted'
              }`}
            >
              {tab.label}
            </span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-app-surface/98 backdrop-blur-md border-t border-app-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-colors md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[480px] md:max-w-lg md:rounded-full md:border md:border-app-border md:shadow-2xl md:bg-app-surface/95 md:px-3 md:h-18 md:py-0">
      <div className="w-full max-w-content mx-auto h-20 sm:h-[84px] md:h-18 flex items-center justify-around px-2 md:px-3 pt-1.5 pb-2 md:py-0">
        {/* Left tabs: Tìm kèo, Bản tin */}
        {leftTabs.map(renderNavTab)}

        {/* Center CTA Tab: Tạo kèo mới */}
        <div className="flex-1 h-full flex flex-col items-center justify-center select-none pt-1">
          <NavLink
            to="/rooms/new"
            className="flex flex-col items-center -mt-6 sm:-mt-7 transition-transform active:scale-95 group"
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 border-4 border-app-surface ${
                    isActive
                      ? 'bg-emerald-700 ring-2 ring-emerald-500 shadow-emerald-500/30'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-600/30 group-hover:shadow-emerald-600/40'
                  }`}
                >
                  <Plus size={24} strokeWidth={2.8} />
                </div>
                <span
                  className={`text-[11px] sm:text-xs leading-tight mt-1 transition-all ${
                    isActive
                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                      : 'font-bold text-app-text group-hover:text-emerald-600'
                  }`}
                >
                  Tạo kèo
                </span>
              </>
            )}
          </NavLink>
        </div>

        {/* Right tabs: Xếp hạng, Hồ sơ */}
        {rightTabs.map(renderNavTab)}
      </div>
    </nav>
  );
};
