import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TopAppBar } from '../../shared/components/TopAppBar';
import { BottomNav } from '../../shared/components/BottomNav';

export const SportXpShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isRoomsTab = location.pathname === '/' || location.pathname === '/rooms';

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col antialiased">
      {/* Top Application Bar */}
      <TopAppBar />

      {/* Main Outlet Container */}
      <main className="flex-1 w-full pb-24">
        <Outlet />
      </main>

      {/* Floating Action Button for Rooms Tab */}
      {isRoomsTab && (
        <div className="fixed bottom-24 right-4 sm:right-[max(1rem,calc((100vw-720px)/2+1rem))] z-30 animate-fade-in">
          <button
            type="button"
            onClick={() => navigate('/rooms/new')}
            className="flex items-center gap-2 h-14 px-5 rounded-2xl bg-app-primary text-app-on-primary font-bold text-sm tracking-wider shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>TẠO KÈO MỚI</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};
