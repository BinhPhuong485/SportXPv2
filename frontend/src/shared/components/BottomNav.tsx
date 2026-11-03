import React from 'react';
import { NavLink } from 'react-router-dom';

const TennisIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
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
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z" />
  </svg>
);

const TournamentIcon: React.FC<{ active?: boolean }> = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c1.99-.44 3.51-2.07 3.61-4.06 2.47-.31 4.39-2.39 4.39-4.94V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

const PersonIcon: React.FC<{ active?: boolean }> = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export const BottomNav: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Tìm kèo', icon: TennisIcon },
    { to: '/rankings', label: 'Xếp hạng', icon: LeaderboardIcon },
    { to: '/tournaments', label: 'Giải đấu', icon: TournamentIcon },
    { to: '/profile', label: 'Hồ sơ', icon: PersonIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-app-surface border-t border-app-border transition-colors">
      <div className="w-full max-w-content mx-auto h-20 flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex-1 h-full flex flex-col items-center justify-center transition-all select-none ${
                  isActive ? 'text-app-primary' : 'text-app-muted hover:text-app-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-app-mint text-app-primary shadow-xs'
                        : 'bg-transparent text-app-muted'
                    }`}
                  >
                    <Icon active={isActive} />
                  </div>
                  <span
                    className={`text-[12px] leading-tight mt-1 transition-all ${
                      isActive ? 'font-bold text-app-primary' : 'font-medium text-app-muted'
                    }`}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
